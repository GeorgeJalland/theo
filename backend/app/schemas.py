from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel, computed_field

from app.models import Quote, PodcastEpisode

class QuoteRead(BaseModel):
    id: int
    text: str
    text_hash: str
    likes: int
    shares: int
    url: Optional[str] = None
    created_at: datetime
    episode_id: Optional[int]
    episode_title: Optional[str] = None
    episode_publish_date: Optional[datetime] = None
    liked_by_user: bool
    daily_likes: int
    weekly_likes: int
    trending_score: float

def to_quote_read(quote: Quote) -> QuoteRead:
    return QuoteRead(
        id=quote.id,
        text=quote.text,
        text_hash=quote.text_hash,
        likes=quote.likes,
        shares=quote.shares,
        url=quote.url,
        created_at=quote.created_at,
        episode_id=quote.episode_id,
        episode_title=quote.episode.title if quote.episode else None,
        episode_publish_date=quote.episode.publish_date if quote.episode else None,
        liked_by_user=quote.liked_by_user,
        daily_likes=quote.daily_likes,
        weekly_likes=quote.weekly_likes,
        trending_score=quote.trending_score
    )

spotify_url_template = "https://open.spotify.com/episode/{episode_id}"
youtube_url_template = "https://youtube.com/watch?v={video_id}"

class EpisodeBaseRead(BaseModel):
    id: int
    title: str
    episode_number: Optional[int] = None
    guest_name: Optional[str] = None
    publish_date: datetime
    thumbnails: Optional[str]
    spotify_url: str

def to_episode_base(episode: PodcastEpisode) -> EpisodeBaseRead:
    return EpisodeBaseRead(
        id=episode.id,
        title=episode.title,
        episode_number=episode.episode_number,
        guest_name=episode.guest_name,
        publish_date=episode.publish_date,
        thumbnails=episode.thumbnails,
        spotify_url=spotify_url_template.format(episode_id=episode.spotify_podcast_id)
    )

class EpisodeListItemRead(EpisodeBaseRead):
    pass

class EpisodeDetailRead(EpisodeBaseRead):
    description: str
    youtube_url: str

def to_episode_detail(episode: PodcastEpisode) -> EpisodeDetailRead:
    base = to_episode_base(episode)

    return EpisodeDetailRead(
        **base.model_dump(),
        description=episode.description,
        youtube_url=youtube_url_template.format(video_id=episode.youtube_video_id)
    )
