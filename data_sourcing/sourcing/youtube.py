import sys
import os

# Add project root to Python path so imports work when running from top level
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from functools import lru_cache

from googleapiclient.discovery import build
from data_sourcing.config.config import get_config
import re
import logging
from google_auth_oauthlib.flow import InstalledAppFlow


class QuoteExtractor:
    def __init__(self, youtube):
        self.youtube = youtube
        self.logger = logging.getLogger(__name__)

    def get_comment_threads(self, video_id: str, max_results: int = 100):
        # YouTube API limits maxResults <= 100
        request = self.youtube.commentThreads().list(
            part="snippet,replies",
            videoId=video_id,
            maxResults=min(max_results, 100),
            textFormat="plainText",
            order="relevance",  # or "time"
        )

        all_comments = []
        # while request:
        response = request.execute()
        items = response.get("items", [])
        all_comments.extend(items)

        # Paginate if there are more comments
        # request = self.youtube.commentThreads().list_next(request, response)

        return all_comments

    def parse_quote_from_comment(self, comment_text: str):
        # Prefer explicit speech marks content (straight and curly quotes)
        match = re.search(r'["“]([^"”]+)["”]', comment_text)
        if match:
            return match.group(1).strip()

        # Fallback to Theo Von quote style
        match_theo = re.search(
            r"(.+?)\s*-\s*Theo Von\b",
            comment_text,
            re.IGNORECASE,
        )
        if match_theo:
            return match_theo.group(1).strip()

        # Fallback to text ending with laughing emojis
        match_emoji = re.search(
            r"(.+?)\s*(?:😂|🤣)+\s*$",
            comment_text,
        )
        if match_emoji:
            return match_emoji.group(1).strip()

        return None

    def find_timestamp(self, comment_text: str):
        # matches timestamps like 12:34, 1:23, 00:12:34
        ts_match = re.search(r"\b((?:[0-5]?\d:)?[0-5]?\d:[0-5]\d)\b", comment_text)
        if ts_match:
            return ts_match.group(1)
        # also catch H:MM and MM:SS
        ts_match = re.search(r"\b([0-5]?\d:[0-5]\d)\b", comment_text)
        if ts_match:
            return ts_match.group(1)
        return None

    def iter_candidates(
        self,
        video_id: str,
        like_threshold: int,
        min_quote_length: int,
        ignore_keywords: list | None,
        max_comments: int,
    ):
        """
        Generator that yields candidate quote objects one at a time.
        """
        self.logger.info(f"Iterating candidate quotes: video_id={video_id}")

        seen_comment_ids = set()
        processed_comments = 0

        request = self.youtube.commentThreads().list(
            part="snippet",
            videoId=video_id,
            maxResults=100,
            textFormat="plainText",
            order="relevance",
        )

        while request and processed_comments < max_comments:
            response = request.execute()
            items = response.get("items", [])

            print(f"Fetched response with {len(items)} comment threads")

            for thread in items:
                comment_id = thread["snippet"]["topLevelComment"]["id"]

                if comment_id in seen_comment_ids:
                    continue

                seen_comment_ids.add(comment_id)
                processed_comments += 1

                if processed_comments > max_comments:
                    return

                quote_obj = self.process_comment_thread(
                    thread,
                    like_threshold,
                    min_quote_length,
                    ignore_keywords,
                )

                if quote_obj is not None:
                    yield quote_obj

            request = self.youtube.commentThreads().list_next(request, response)

    def process_comment_thread(self, thread: dict, like_threshold: int, min_quote_length: int, ignore_keywords: list | None = None) -> dict | None:
        snippet = thread["snippet"]["topLevelComment"]["snippet"]
        text = snippet.get("textDisplay", "")

        if ignore_keywords and any(
            kw.lower() in text.lower() for kw in ignore_keywords
        ):
            return None
        
        if snippet.get("likeCount", 0) < like_threshold:
            return None

        quote_text = self.parse_quote_from_comment(text)

        if not quote_text:
            return None

        if len(quote_text.split()) < min_quote_length:
            return None

        timestamp = self.find_timestamp(text)

        return {
            "commentId": thread["snippet"]["topLevelComment"]["id"],
            "quote": quote_text,
            "timestamp": timestamp,
            "author": snippet.get("authorDisplayName"),
            "likes": snippet.get("likeCount", 0),
            "publishedAt": snippet.get("publishedAt"),
            "text": text,
        }

    @staticmethod
    def get_youtube_credentials(config):
        client_config = {
            "installed": {
                "client_id": config.YOUTUBE_CLIENT_ID,
                "client_secret": config.YOUTUBE_CLIENT_SECRET,
                "redirect_uris": [config.YOUTUBE_REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        }

        flow = InstalledAppFlow.from_client_config(
            client_config,
            scopes=["https://www.googleapis.com/auth/youtube"]
        )
        creds = flow.run_local_server(port=8080, open_browser=False)
        return creds

    def extract_top_comments(self, comment_threads, limit=10):
        out = []
        for thread in comment_threads[:limit]:
            snippet = thread["snippet"]["topLevelComment"]["snippet"]
            out.append({
                "author": snippet.get("authorDisplayName"),
                "text": snippet.get("textDisplay"),
                "likeCount": snippet.get("likeCount"),
                "publishedAt": snippet.get("publishedAt"),
            })
        return out
    
@lru_cache(maxsize=10)
def get_all_videos(youtube, playlist_id):
    videos = []
    request = youtube.playlistItems().list(
        part="snippet",
        playlistId=playlist_id,
        maxResults=50
    )

    while request:
        response = request.execute()
        items = response.get("items", [])
        videos.extend(items)
        request = youtube.playlistItems().list_next(request, response)

    return videos
    
def find_video_id_by_episode_number(youtube, playlist_id: str, episode_number: int):
    videos = get_all_videos(youtube, playlist_id)

    pattern = re.compile(rf"#{episode_number}(?!\d)")

    for video in videos:
        title = video["snippet"]["title"]
        if pattern.search(title):
            return video["snippet"]["resourceId"]["videoId"]

    return None

if __name__ == "__main__":
    def main():
        from data_sourcing.config.config import get_config

        config = get_config()

        video_id = "XDlj_6Ik7tQ"  # from v=XDlj_6Ik7tQ&t=1s
        api_key = config.YOUTUBE_API_KEY

        extractor = QuoteExtractor(api_key)

        quote_comments = extractor.gather_candidates(video_id=video_id, quote_limit=20)
        print(f"Found {len(quote_comments)} quote/timestamp comments for video {video_id}\n")

        for i, q in enumerate(quote_comments, start=1):
            print(f"#{i} commentId={q['commentId']} author={q['author']} likes={q['likes']} publishedAt={q['publishedAt']}")
            print(f"  quote: {q['quote']}")
            if q['timestamp']:
                print(f"  timestamp: {q['timestamp']}")
            print(f"  full text: {q['text']}\n")

    def test(): 
        from data_sourcing.config.config import get_config
        from data_sourcing.sourcing.episodes import EpisodeSourcer

        config = get_config()

        api_key = config.YOUTUBE_API_KEY
        playlist_id = config.THIS_PAST_WEEKEND_YT_PLAYLIST_ID

        extractor = QuoteExtractor(api_key)
        title = "E390 David Spade"
        episode_number = EpisodeSourcer.get_episode_number(title)
        print(extractor.find_video_id_by_episode_number(playlist_id, episode_number))

    test()
