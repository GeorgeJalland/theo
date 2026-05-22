def source(config, engine, backfill_youtube_video_ids=False, spotify_ep_id=None, youtube_video_id=None, transcript_file_path=None):
    import spotipy
    from spotipy.oauth2 import SpotifyClientCredentials
    from googleapiclient.discovery import build

    from data_sourcing.sourcing.episodes import EpisodeSourcer
    from data_sourcing.db.database import get_session

    spotify_client_id = config.SPOTIFY_CLIENT_ID
    spotify_client_secret = config.SPOTIFY_CLIENT_SECRET
    override_files = config.OVERRIDE_FILES
    destination_folder = config.DESTINATION_FOLDER
    this_past_weekend_show_id = config.THIS_PAST_WEEKEND_SPOTIFY_SHOW_ID
    youtube_playlist_id = config.THIS_PAST_WEEKEND_YT_PLAYLIST_ID
    api_key = config.YOUTUBE_API_KEY

    print("Configuration:")
    print(f"  SPOTIFY_CLIENT_ID: {spotify_client_id}")
    print(f"  SPOTIFY_CLIENT_SECRET: {spotify_client_secret}")
    print(f"  OVERRIDE_FILES: {override_files}")
    print(f"  DESTINATION_FOLDER: {destination_folder}")
    print(f"  THIS_PAST_WEEKEND_SPOTIFY_SHOW_ID: {this_past_weekend_show_id}")
    print(f"  THIS_PAST_WEEKEND_YT_PLAYLIST_ID: {youtube_playlist_id}")
    print(f"  YOUTUBE_API_KEY: {api_key}")

    # Set up Spotify authentication
    sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(client_id=spotify_client_id,
                                                              client_secret=spotify_client_secret))
    
    yt = build("youtube", "v3", developerKey=api_key)

    sourcer = EpisodeSourcer(sp, yt, destination_folder=destination_folder, override_existing=override_files)
    with get_session(engine) as session:
        if spotify_ep_id and youtube_video_id:
            sourcer.source_single_episode(session, spotify_ep_id, youtube_video_id, transcript_file_path=transcript_file_path)
        else:
            sourcer.source(session, this_past_weekend_show_id, youtube_playlist_id)
        if backfill_youtube_video_ids:
            sourcer.backfill_youtube_video_ids(session, youtube_playlist_id)

def process(config, engine):
    """
    This method finds podcast episodes that have been sourced but not processed,
    and runs the quote matching algorithm on them to extract quotes and save them to the database.
    """
    from pathlib import Path
    from data_sourcing.db.database import get_session
    from data_sourcing.processing.main import process_unprocessed_episodes
    from googleapiclient.discovery import build

    PROJECT_ROOT = Path(__file__).resolve().parent.parent

    api_key = config.YOUTUBE_API_KEY

    yt = build("youtube", "v3", developerKey=api_key)

    with get_session(engine) as session:
        process_unprocessed_episodes(config, session, PROJECT_ROOT, yt, limit=1000)

def classify(config, engine):
    from groq import Groq

    from data_sourcing.db.database import get_session
    from data_sourcing.processing.classify_quotes_groq import classify_pending_quotes

    client = Groq(
        api_key=config.GROQ_API_KEY
    )

    with get_session(engine) as session:
        classify_pending_quotes(session, client)


if __name__ == "__main__":
    import argparse
    import logging

    from data_sourcing.config.config import get_config
    from data_sourcing.db.database import create_db_and_tables, get_engine

    logging.basicConfig(level=logging.INFO)

    parser = argparse.ArgumentParser(
        description="Data sourcing pipeline"
    )

    parser.add_argument(
        "--source",
        action="store_true",
        help="Run sourcing pipeline"
    )

    parser.add_argument(
        "--process",
        action="store_true",
        help="Run processing pipeline"
    )

    parser.add_argument(
        "--classify",
        action="store_true",
        help="Run classification pipeline"
    )

    parser.add_argument(
        "--backfill-youtube-video-ids",
        action="store_true",
        help="Backfill missing YouTube video IDs"
    )

    parser.add_argument(
        "--spotify-ep-id",
        type=str,
        help="Spotify episode ID"
    )

    parser.add_argument(
        "--youtube-video-id",
        type=str,
        help="YouTube video ID"
    )

    parser.add_argument(
        "--transcript-file-path",
        type=str,
        help="Path to transcript file"
    )

    args = parser.parse_args()

    config = get_config()

    engine = get_engine(config.DATABASE_URL)
    create_db_and_tables(engine)

    if args.source:
        logging.info("Running sourcing...")

        source(
            config=config,
            engine=engine,
            backfill_youtube_video_ids=args.backfill_youtube_video_ids,
            spotify_ep_id=args.spotify_ep_id,
            youtube_video_id=args.youtube_video_id,
            transcript_file_path=args.transcript_file_path
        )

    if args.process:
        logging.info("Running processing...")
        process(config, engine)

    if args.classify:
        logging.info("Running classifying...")
        classify(config, engine)
