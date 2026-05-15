import json

from sqlmodel import SQLModel, Field
from sqlalchemy import MetaData
from typing import Optional
from enum import Enum
from datetime import datetime
from sqlalchemy import UniqueConstraint, text, Index

old_metadata = MetaData()
new_metadata = MetaData()

class OldQuote(SQLModel, table=True):
   __tablename__ = "quote"
   metadata = old_metadata

   id: Optional[int] = Field(primary_key=True, index=True)
   text: str
   likes: Optional[int] = Field(default=0, sa_column_kwargs={"server_default": "0"})
   shares: Optional[int]  = Field(default=0, sa_column_kwargs={"server_default": "0"})
   reference: str

class OldCounter(SQLModel, table=True):
   __tablename__ = "counter"
   metadata = old_metadata

   id: int = Field(primary_key=True, index=True)
   served: int

class BaseAuditModel(SQLModel):
   metadata = new_metadata

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
   metadata = new_metadata

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

   __table_args__ = (UniqueConstraint("text_hash", name="uq_text_hash_user"),)

class Like(BaseAuditModel, table=True):
   metadata = new_metadata
   id: Optional[int] = Field(primary_key=True, index=True)
   quote_id: int = Field(foreign_key="quote.id")
   user_id: int

   __table_args__ = (UniqueConstraint("quote_id", "user_id", name="uq_likes_quote_user"),)

class Share(BaseAuditModel, table=True):
   metadata = new_metadata
   id: Optional[int] = Field(primary_key=True, index=True)
   quote_id: int = Field(foreign_key="quote.id")
   user_id: int

class PodcastEpisode(BaseAuditModel, table=True):
   __tablename__ = "podcast_episode"
   metadata = new_metadata

   id: Optional[int] = Field(primary_key=True, index=True)
   title: str
   description: Optional[str] = None
   episode_number: Optional[int] = None
   guest_name: Optional[str] = None
   spotify_podcast_id: str
   youtube_video_id: Optional[str] = None
   publish_date: str
   transcript_file_path: str
   thumbnails: Optional[str]
   processed: bool = Field(default=False, sa_column_kwargs={"server_default": "0"})
   last_processed_at: Optional[datetime] = None

   __table_args__ = (
        Index(
            "uq_podcast_episode_youtube_video_id",
            "youtube_video_id",
            unique=True,
            sqlite_where=text("youtube_video_id IS NOT NULL"),
        ),
    )

class Counter(BaseAuditModel, table=True):
   metadata = new_metadata

   id: int = Field(primary_key=True, index=True)
   served: int

def backup(live_name, backup_name):
    if os.path.exists(backup_name):
        print(f"Backup file {backup_name} already exists. Please move or delete it before running this script.")
        exit(1)

    # Backup the existing database
    if os.path.exists(live_name):
        shutil.copy2(live_name, backup_name)
        print(f"Backup created at {backup_name}")
    else:
        print("No existing database found.")
        exit(1)

def get_old_aggregated_quotes(session):
    aggregated = {}

    old_quotes = session.exec(select(OldQuote)).all()

    for q in old_quotes:
        h = hashlib.sha256(q.text.encode()).hexdigest()

        if h not in aggregated:
            aggregated[h] = {
                "text": q.text,
                "likes": 0,
                "shares": 0,
                "reference": q.reference
            }

        aggregated[h]["likes"] += q.likes or 0
        aggregated[h]["shares"] += q.shares or 0

    return aggregated

def migrate_old_quotes(old_session, new_session, aggregated_quotes, transformer_model):
    print(f"Migrating old quotes..., count: {len(aggregated_quotes)}")

    def clean_text(text):
        text = text.replace("’", "'").strip()
        return text.lower()

    for text_hash, data in aggregated_quotes.items():
        embedding = transformer_model.encode(clean_text(data["text"]))
        new_quote = Quote(
            text=data["text"],
            text_hash=text_hash,
            text_embedding=json.dumps(embedding.tolist()),
            likes=data["likes"],
            shares=data["shares"],
            source_type="legacy",
            url=data["reference"],
            status=QuoteStatus.APPROVED,
            status_updated_at=datetime(2026, 5, 13),
            created_at=datetime(2024, 1, 1)
            # TODO: add sentence embedding
        )
        new_session.add(new_quote)
    new_session.commit()

    # Migrate counter
    old_counter = old_session.exec(select(OldCounter)).first()
    if old_counter:
        new_counter = Counter(served=old_counter.served)
        new_session.add(new_counter)

    new_session.commit()

def migration_quote_extractor_data(extractor_session, new_session):
    print("Migrating new data from quote extractor...")

    new_objects = [PodcastEpisode, Quote, Counter, Like, Share]
    for obj in new_objects:
        records = extractor_session.exec(select(obj)).all()
        for rec in records:
            new_session.add(obj(**rec.model_dump()))
    new_session.commit()

if __name__ == "__main__":
    from sqlmodel import create_engine, Session, select
    from sentence_transformers import SentenceTransformer
    import os
    import shutil
    import hashlib
    from datetime import datetime

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    db_root = "./backend/instance/"
    live_name = db_root + "app.db"
    new_temp_name = db_root + "app_v2.db"
    backup_name = db_root + "/backups/" + f"app_pre_v2_migration_{now}.db"
    quote_extractor_db = db_root + "quote_extractor.db"

    backup(live_name, backup_name)

    transformer_model = SentenceTransformer('all-MiniLM-L6-v2')

    engine = create_engine(f"sqlite:///{new_temp_name}")
    new_metadata.create_all(engine)

    old_engine = create_engine(f"sqlite:///{live_name}")

    quote_exactor_engine = create_engine(f"sqlite:///{quote_extractor_db}")

    with Session(quote_exactor_engine) as extractor_session, Session(engine) as new_session:
        migration_quote_extractor_data(extractor_session, new_session)

    with Session(old_engine) as old_session:
        aggregated = get_old_aggregated_quotes(old_session)

    with Session(old_engine) as old_session, Session(engine) as new_session:
        migrate_old_quotes(old_session, new_session, aggregated, transformer_model)

    os.remove(live_name)
    os.rename(new_temp_name, live_name)

    print(f"Migration completed successfully. New database is now {live_name}. Backup of old database is {backup_name}.")
