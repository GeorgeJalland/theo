from typing import Optional
from datetime import datetime

from pydantic import BaseModel

from app.models import Quote

class QuoteRead(BaseModel):
    id: int
    text: str
    text_hash: str
    likes: int
    shares: int
    url: Optional[str] = None
    created_at: datetime
    has_user_liked_quote: Optional[bool] = None
    episode_title: Optional[str] = None
    episode_publish_date: Optional[datetime] = None

def to_quote_read(quote: Quote, has_user_liked_quote: bool | None = None) -> QuoteRead:
    return QuoteRead(
        id=quote.id,
        text=quote.text,
        text_hash=quote.text_hash,
        likes=quote.likes,
        shares=quote.shares,
        url=quote.url,
        created_at=quote.created_at,
        has_user_liked_quote=has_user_liked_quote, #TOOD: update this using Like table
        episode_title=quote.episode.title if quote.episode else None,
        episode_publish_date=quote.episode.publish_date if quote.episode else None,
    )