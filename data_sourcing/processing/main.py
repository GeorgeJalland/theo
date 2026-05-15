import json
from datetime import datetime, timezone
import math

from data_sourcing.db.database import get_unprocessed_episodes, create_quote
from data_sourcing.processing.quote_matcher import QuoteMatcher
from data_sourcing.sourcing.episodes import SentenceExtractor
from data_sourcing.sourcing.youtube import QuoteExtractor
from sentence_transformers import SentenceTransformer

def process_unprocessed_episodes(config, session, youtube, limit=10):
    """
    This method finds podcast episodes that have been sourced but not processed,
    and runs the quote matching algorithm on them to extract quotes and save them to the database.
    """
    destination_folder = config.DESTINATION_FOLDER

    counter = 0

    sentence_extractor = SentenceExtractor(path_root=".")
    quote_extractor = QuoteExtractor(youtube=youtube)
    model = SentenceTransformer('all-MiniLM-L6-v2')
    matcher = QuoteMatcher(
        transcript_folder=destination_folder,
        sentence_extractor=sentence_extractor,
        quote_extractor=quote_extractor,
        model=model
        )

    for ep in get_unprocessed_episodes(session):
        if counter >= limit:
            print(f"Processed {counter} episodes, stopping for now...")
            break

        extract_quotes_from_episode(session, ep, matcher)

        counter += 1

def extract_quotes_from_episode(session, episode, matcher):
    print(f"Processing episode: {episode.title}")

    legit_quotes = matcher.extract_matched_quotes(
        episode=episode,
        window_size=2,
        score_threshold=80,
        like_threshold=50,
        min_quote_length=3,
        max_comments=300
    )
    print(f"Found {len(legit_quotes)} matched quotes in episode '{episode.title}'")
    for i, item in enumerate(legit_quotes, 1):
        print(f"#{i} Quote: {item['text']}")
        create_quote(
            session=session,
            text=item["text"],
            text_hash=item["text_hash"],
            text_embedding=json.dumps(item["text_embedding"].tolist()),
            source_type=item["source_type"],
            episode_id=episode.id,
            timestamp=item["timestamp"],
            url=f"https://open.spotify.com/episode/{episode.spotify_podcast_id}?t={math.floor(item['timestamp']/1000)}",
        )
    
    episode.processed = True
    episode.last_processed_at = datetime.now(timezone.utc)

    session.commit()