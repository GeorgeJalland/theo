def source(config, engine):
    import spotipy
    from spotipy.oauth2 import SpotifyOAuth
    from googleapiclient.discovery import build

    from data_sourcing.sourcing.episodes import EpisodeSourcer
    from data_sourcing.db.database import get_session

    spotipy_client_id = config.SPOTIPY_CLIENT_ID
    spotipy_client_secret = config.SPOTIPY_CLIENT_SECRET
    spotipy_redirect_uri = config.SPOTIPY_REDIRECT_URI
    scope = config.SCOPE
    override_files = config.OVERRIDE_FILES
    destination_folder = config.DESTINATION_FOLDER
    this_past_weekend_show_id = config.THIS_PAST_WEEKEND_SPOTIFY_SHOW_ID
    youtube_playlist_id = config.THIS_PAST_WEEKEND_YT_PLAYLIST_ID
    api_key = config.YOUTUBE_API_KEY

    print("Configuration:")
    print(f"  SPOTIPY_CLIENT_ID: {spotipy_client_id}")
    print(f"  SPOTIPY_CLIENT_SECRET: {spotipy_client_secret}")
    print(f"  SPOTIPY_REDIRECT_URI: {spotipy_redirect_uri}")
    print(f"  SCOPE: {scope}")
    print(f"  OVERRIDE_FILES: {override_files}")
    print(f"  DESTINATION_FOLDER: {destination_folder}")
    print(f"  THIS_PAST_WEEKEND_SPOTIFY_SHOW_ID: {this_past_weekend_show_id}")
    print(f"  THIS_PAST_WEEKEND_YT_PLAYLIST_ID: {youtube_playlist_id}")
    print(f"  YOUTUBE_API_KEY: {api_key}")

    # Set up Spotify authentication
    sp = spotipy.Spotify(auth_manager=SpotifyOAuth(client_id=spotipy_client_id,
                                                   client_secret=spotipy_client_secret,
                                                   redirect_uri=spotipy_redirect_uri,
                                                   scope=scope))
    
    yt = build("youtube", "v3", developerKey=api_key)

    sourcer = EpisodeSourcer(sp, yt, destination_folder=destination_folder, override_existing=override_files)
    with get_session(engine) as session:
        sourcer.source(session, this_past_weekend_show_id, youtube_playlist_id)

def process(config, engine):
    """
    This method finds podcast episodes that have been sourced but not processed,
    and runs the quote matching algorithm on them to extract quotes and save them to the database.
    """
    from data_sourcing.db.database import get_session
    from data_sourcing.processing.main import process_unprocessed_episodes
    from googleapiclient.discovery import build

    api_key = config.YOUTUBE_API_KEY

    yt = build("youtube", "v3", developerKey=api_key)

    with get_session(engine) as session:
        process_unprocessed_episodes(config, session, yt, limit=1000)

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
    import sys
    import logging

    from data_sourcing.config.config import get_config
    from data_sourcing.db.database import create_db_and_tables, get_engine

    logging.basicConfig(level=logging.INFO)

    config = get_config()
    
    run_sourcing = "--source" in sys.argv
    run_processing = "--process" in sys.argv
    run_classifying = "--classify" in sys.argv

    database_url = config.DATABASE_URL

    engine = get_engine(database_url)
    create_db_and_tables(engine)

    if run_sourcing:
        logging.info("Running sourcing...")
        source(config, engine)
    if run_processing:
        logging.info("Running processing...")
        process(config, engine)
    if run_classifying:
        logging.info("Running run_classifying...")
        classify(config, engine)
