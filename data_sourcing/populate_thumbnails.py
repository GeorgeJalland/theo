if __name__ == "__main__":
    import sys
    import logging
    import json

    from data_sourcing.config.config import get_config
    from data_sourcing.db.database import create_db_and_tables, get_engine, get_episode

    logging.basicConfig(level=logging.INFO)

    config = get_config()

    database_url = config.DATABASE_URL

    engine = get_engine(database_url)
    create_db_and_tables(engine)

    import spotipy
    from spotipy.oauth2 import SpotifyClientCredentials
    from googleapiclient.discovery import build

    from data_sourcing.db.database import get_session

    spotify_client_id = config.SPOTIFY_CLIENT_ID
    spotify_client_secret = config.SPOTIFY_CLIENT_SECRET
    scope = config.SCOPE
    override_files = config.OVERRIDE_FILES
    destination_folder = config.DESTINATION_FOLDER
    this_past_weekend_show_id = config.THIS_PAST_WEEKEND_SPOTIFY_SHOW_ID
    youtube_playlist_id = config.THIS_PAST_WEEKEND_YT_PLAYLIST_ID
    api_key = config.YOUTUBE_API_KEY

    # # Set up Spotify authentication
    sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(client_id=spotify_client_id,
                                                              client_secret=spotify_client_secret))
    
    yt = build("youtube", "v3", developerKey=api_key)

    offset = 0
    limit = 50

    session = get_session(engine)

    episodes = sp.show_episodes(this_past_weekend_show_id, limit=limit, offset=offset)

    while episodes["items"]:
        for ep in episodes["items"]:
            db_ep = get_episode(session, ep["name"])
            if db_ep is not None:
                db_ep.thumbnails = json.dumps(ep["images"])
                session.commit()

        offset += limit
        episodes = sp.show_episodes(this_past_weekend_show_id, limit=limit, offset=offset)

