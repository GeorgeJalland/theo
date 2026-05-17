import re

import requests
import json
import os
import json
import logging
from functools import lru_cache
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from sqlmodel import Session
from data_sourcing.db.database import create_podcast_episode, episode_exists, get_podcast_episodes_without_youtube_video_id
from data_sourcing.sourcing.youtube import find_video_id_by_episode_number

DATE_FORMAT = "%Y-%m-%d"

class EpisodeSourcer:
    def __init__(self, sp, yt, destination_folder, override_existing = False):
        self.sp = sp
        self.yt = yt
        self.destination_folder = destination_folder
        self.override_existing = override_existing
        self.logger = logging.getLogger(__name__)
        self.headers = {
            "Authorization": f"Bearer {self.token}"
        }
        self.transcript_url_template = "https://spclient.wg.spotify.com/transcript-read-along/v2/episode/{episode_id}?format=json&maxSentenceLength=5000&excludeCC=true"

    @property
    def token(self):
        return self._get_token()

    def _get_token(self):
        return self.sp.auth_manager.get_access_token(as_dict=False)

    def source(self, session: Session, spotify_show_id: str, youtube_playlist_id: str):
        """
        Iterate through all episodes of a Spotify show, fetch their transcripts, and save them to files.
        Then lookup podcast episode on youtube and create a database entry for each episode with metadata and the file path to the transcript.
        """
        self.logger.info(f"Sourcing transcripts for show_id={spotify_show_id}")
        offset = 0
        limit = 50

        episodes = self.sp.show_episodes(spotify_show_id, limit=limit, offset=offset)

        while episodes["items"]:
            for ep in episodes["items"]:
                if not episode_exists(session, ep["id"]):
                    self.process_episode(session, ep, youtube_playlist_id)
            offset += limit
            episodes = self.sp.show_episodes(spotify_show_id, limit=limit, offset=offset)

    def process_episode(self, session: Session, episode_data: Dict[str, Any], youtube_playlist_id: str):
        episode = {
            "title": episode_data["name"],
            "description": episode_data.get("description"),
            "episode_number": self.get_episode_number(episode_data["name"]),
            "guest_name": self.get_guest_name(episode_data["name"]),
            "spotify_podcast_id": episode_data["id"],
            "youtube_video_id": None,  # Will be filled in later if needed
            "publish_date": datetime.strptime(episode_data.get("release_date"), DATE_FORMAT),
            "transcript_file_path": None,  # Will be filled in after saving transcript
            "thumbnails": json.dumps(episode_data["images"])
        }

        episode["transcript_file_path"] = self.save_transcript_to_file(episode_data["id"], episode_data["name"])

        episode["youtube_video_id"] = find_video_id_by_episode_number(self.yt, youtube_playlist_id, episode["episode_number"])

        if episode["transcript_file_path"] is None:
            self.logger.warning(f"Skipping episode '{episode['title']}' due to missing transcript.")
            return

        self.logger.info(f"Creating database entry for episode: {episode['title']}")
        return create_podcast_episode(session, **episode)

    def save_transcript_to_file(self, episode_id: str, episode_name: str):
        clean_name = self.clean_episode_name(episode_name)

        file_path = f"{self.destination_folder}/{clean_name}.json"

        if os.path.exists(file_path):
            print(f"Transcript for episode '{clean_name}' already exists. Skipping.")
            return file_path
        
        response = requests.get(self.transcript_url_template.format(episode_id=episode_id), headers=self.headers)
        
        if response.status_code != 200:
            print(f"Failed to fetch transcript for episode {episode_id}. Status code: {response.status_code}")
            return
        
        res_dict = response.json()

        print(f"Saving transcript for episode: {clean_name}")

        with open(file_path, "w") as f:
            f.write(json.dumps(res_dict, indent=2))

        return file_path

    @staticmethod
    def clean_episode_name(episode_name: str):
        return episode_name.split("|")[-1].split("BEST OF: ")[-1].strip().replace("/", "").replace('"', "").replace(":", "-")
    
    @staticmethod
    def get_episode_number(episode_name: str):
        match = re.search(r"(?:E|#)(\d+)", episode_name, re.IGNORECASE)
        if match:
            return int(match.group(1))
        return None
    
    @staticmethod
    def get_guest_name(episode_name: str):
        match = re.search(r"^(?:E\d+\s*-?\s*)(.+)$", episode_name.strip(), re.IGNORECASE)
        if match:
            return match.group(1).strip()
        if "-" in episode_name:
            return episode_name.split("-", 1)[1].strip()
        return None
    
    def backfill_youtube_video_ids(self, session: Session, youtube_playlist_id: str):
        print("_______backfilling youtube video ids for episodes missing them_______")
        # Should probably pass episodes here instead but oh well
        episodes = get_podcast_episodes_without_youtube_video_id(session)
        for ep in episodes:
            video_id = find_video_id_by_episode_number(self.yt, youtube_playlist_id, ep.episode_number)
            if video_id:
                print(f"Backfilling episode '{ep.title}' with youtube video id: {video_id}")
                ep.youtube_video_id = video_id
        session.commit()

class SentenceExtractor:
    def __init__(self, path_root: str):
        self.path_root = path_root
        self.logger = logging.getLogger(__name__)

    @lru_cache(maxsize=10)
    def _load_data(self, path: str) -> Dict[str, Any]:
        """Load raw transcript data from a JSON file."""
        full_path = f"{self.path_root}/{path}"
        try:
            with open(full_path, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"Transcript file '{full_path}' not found in {self.path_root}")
        except json.JSONDecodeError:
            raise ValueError(f"Invalid JSON in file '{full_path}'")

    def get_sentences(self, transcript_path: str, speaker_filter: str = None, max_lines: int = None) -> List[Dict[str, Any]]:
        """
        Extract sentences from a file, optionally filtered by speaker and limited by lines.
        Returns unfiltered sentences if no speaker_filter is provided.
        """
        self.logger.info(f"Extracting sentences: file={transcript_path}, speaker_filter={speaker_filter}, max_lines={max_lines}")
        raw_data = self._load_data(transcript_path)
        sections = raw_data.get("section", [])
        if max_lines:
            sections = sections[:max_lines]
        
        sentences = []
        speaker = "Speaker 1"  # Default

        def is_title(section: dict) -> bool:
            return "text" not in section and "title" in section
        
        def get_title(section: dict) -> str:
            return section["title"].get("title")
        
        def get_speaker(section: dict) -> str:
            title = get_title(section)
            return title if title and title.startswith("Speaker") else None
        
        def get_sentence(section: dict) -> Dict[str, Any]:
            return section["text"]["sentence"] if "text" in section else None

        for section in sections:
            if is_title(section):
                new_speaker = get_speaker(section)
                if new_speaker:
                    speaker = new_speaker
                continue

            sentence = get_sentence(section)
            if sentence:
                sentence_data = {
                    "speaker": speaker,
                    "startTimeMs": section["startMs"],
                    "text": sentence["text"]
                }
                if not speaker_filter or speaker == speaker_filter:
                    sentences.append(sentence_data)
        
        return sentences

    def filter_sentences(self, sentences: List[Dict[str, Any]], min_words: int = 5) -> List[Dict[str, Any]]:
        """Filter sentences based on criteria (e.g., minimum word count for quote-worthiness)."""
        return [s for s in sentences if len(s["text"].split()) > min_words]

    def get_sentence_windows(
        self,
        sentences: List[Dict[str, Any]],
        window_sizes: List[int] = [2, 3, 4],
    ) -> List[Dict[str, Any]]:
        """Make overlapping sentence windows so humor context can span multiple sentences.

        Each window is a candidate text block that can be embedded and scored.
        """
        windows: List[Dict[str, Any]] = []
        for w in window_sizes:
            if w < 2:
                continue
            for i in range(len(sentences) - w + 1):
                block = sentences[i : i + w]
                text = " ".join(item["text"] for item in block)
                windows.append(
                    {
                        "speaker": block[0]["speaker"],
                        "startTimeMs": block[0]["startTimeMs"],
                        "text": text,
                        "orig_sentence_indices": list(range(i, i + w)),
                        "window_size": w,
                    }
                )
        return windows

    def process(
        self, 
        file: str, 
        speaker_filter: str = "Speaker 1", 
        max_lines: int = 50, 
        apply_filter: bool = True
    ) -> List[Dict[str, Any]]:
        sentences = self.get_sentences(file, speaker_filter, max_lines)
        if apply_filter:
            sentences = self.filter_sentences(sentences)
        return sentences
    
def get_episode_name(transcript_filename):
    episode_name = transcript_filename.rsplit(".", 1)[0]  # Remove file extension
    return episode_name.strip()

def get_guest_name(transcript_filename):
    episode_name = get_episode_name(transcript_filename)
    match = re.search(r"^(?:E\d+\s*-?\s*)(.+)$", episode_name.strip(), re.IGNORECASE)
    if match:
        return match.group(1).strip()
    if "-" in episode_name:
        return episode_name.split("-", 1)[1].strip()
    return None
