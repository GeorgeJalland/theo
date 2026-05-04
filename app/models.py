from enum import Enum

from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from sqlalchemy import UniqueConstraint, text, Index

class BaseAuditModel(SQLModel):
   created_at: datetime = Field(
      sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
      nullable=False
   )
   created_by: Optional[str] = Field(default=None)

class QuoteStatus(str, Enum):
   PENDING = "pending"
   APPROVED = "approved"
   REJECTED = "rejected"


class Quote(BaseAuditModel, table=True):
   id: Optional[int] = Field(primary_key=True, index=True)
   text: str
   text_hash: str
   # Use TEXT for storing embedding vectors as JSON string (SQLite compatible)
   text_embedding: Optional[str] = Field(default=None)
   likes: Optional[int] = Field(default=0, sa_column_kwargs={"server_default": "0"})
   shares: Optional[int]  = Field(default=0, sa_column_kwargs={"server_default": "0"})
   source_type: str
   episode_id: Optional[int] = Field(foreign_key="podcast_episode.id")
   timestamp: Optional[str] = Field(default=None)
   url: Optional[str] = Field(default=None)
   status: QuoteStatus = Field(default=QuoteStatus.PENDING, sa_column_kwargs={"server_default": QuoteStatus.PENDING})
   rejection_reason: Optional[str] = Field(default=None)
   status_updated_at: Optional[datetime] = None

   episode: Optional["PodcastEpisode"] = Relationship(back_populates="quotes", sa_relationship_kwargs={"lazy": "joined"})

   __table_args__ = (UniqueConstraint("text_hash", name="uq_text_hash_user"),)

class Like(BaseAuditModel, table=True):
   id: Optional[int] = Field(primary_key=True, index=True)
   quote_id: int = Field(foreign_key="quote.id")
   user_id: int

   __table_args__ = (UniqueConstraint("quote_id", "user_id", name="uq_likes_quote_user"),)

class Share(BaseAuditModel, table=True):
   id: Optional[int] = Field(primary_key=True, index=True)
   quote_id: int = Field(foreign_key="quote.id")
   user_id: int

   __table_args__ = (UniqueConstraint("quote_id", "user_id", name="uq_shares_quote_user"),)

class PodcastEpisode(BaseAuditModel, table=True):
   __tablename__ = "podcast_episode"

   id: Optional[int] = Field(primary_key=True, index=True)
   title: str
   description: Optional[str] = None
   episode_number: Optional[int] = None
   guest_name: Optional[str] = None
   spotify_podcast_id: str
   youtube_video_id: Optional[str] = None
   publish_date: datetime
   transcript_file_path: str
   processed: bool = Field(default=False, sa_column_kwargs={"server_default": "0"})
   last_processed_at: Optional[datetime] = None

   quotes: List[Quote] = Relationship(back_populates="episode")

   __table_args__ = (
        Index(
            "uq_podcast_episode_youtube_video_id",
            "youtube_video_id",
            unique=True,
            sqlite_where=text("youtube_video_id IS NOT NULL"),
        ),
    )

class Counter(BaseAuditModel, table=True):
   id: int = Field(primary_key=True, index=True)
   served: int
