import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATABASE_URL = f"sqlite:///{BASE_DIR}/backend/instance/app.db"

@dataclass
class Config:
    SPOTIPY_CLIENT_ID: str = os.getenv("SPOTIPY_CLIENT_ID")
    SPOTIPY_CLIENT_SECRET: str = os.getenv("SPOTIPY_CLIENT_SECRET")
    SPOTIPY_REDIRECT_URI: str = "http://127.0.0.1:8000/callback"
    SCOPE: str = "playlist-modify-private"
    THIS_PAST_WEEKEND_SPOTIFY_SHOW_ID: str = "6PwE1CIZsgfrhX6Bw96PUN"
    THIS_PAST_WEEKEND_YT_PLAYLIST_ID: str = "PLY155lJX6_wcTzyjW2sGB4sTT5ZkivwnN"
    OVERRIDE_FILES: bool = False
    DESTINATION_FOLDER: str = "data_sourcing/episodes"
    DATABASE_URL: str = DATABASE_URL
    YOUTUBE_API_KEY: str = os.getenv("YOUTUBE_API_KEY")
    YOUTUBE_CLIENT_ID: str = os.getenv("YOUTUBE_CLIENT_ID")
    YOUTUBE_CLIENT_SECRET: str = os.getenv("YOUTUBE_CLIENT_SECRET")
    YOUTUBE_REDIRECT_URI: str = "http://localhost:8080/"
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")

def get_config():
    return Config()