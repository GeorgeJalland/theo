from sqlmodel import SQLModel, create_engine, Session, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, or_
from collections.abc import Iterator

from backend.app.models import PodcastEpisode, Quote

def get_engine(database_url: str):
    return create_engine(database_url, echo=True)

def create_db_and_tables(engine):
    print(f"Creating database tables with engine: {engine}")
    SQLModel.metadata.create_all(engine)

def get_session(engine) -> Session:
    return Session(engine)

def create_podcast_episode(
    session: Session,
    title: str,
    description: str,
    episode_number: int,
    guest_name: str | None,
    youtube_video_id: str,
    spotify_podcast_id: int,
    publish_date: str,
    transcript_file_path: str,
    thumbnails: str
) -> PodcastEpisode:
    episode = PodcastEpisode(
        title=title,
        description=description,
        episode_number=episode_number,
        guest_name=guest_name,
        spotify_podcast_id=spotify_podcast_id,
        youtube_video_id=youtube_video_id,
        publish_date=publish_date,
        transcript_file_path=transcript_file_path,
        thumbnails=thumbnails,
        created_by="data_sourcing_process"
    )

    session.add(episode)
    session.commit()
    session.refresh(episode)

    return episode

def episode_exists(session: Session, spotify_podcast_id: int) -> bool:
    statement = select(PodcastEpisode.id).where(
        PodcastEpisode.spotify_podcast_id == spotify_podcast_id
    )

    return session.exec(statement).first() is not None

def get_unprocessed_episodes(session: Session) -> list[PodcastEpisode]:
    statement = (
        select(PodcastEpisode)
        .where(
            PodcastEpisode.youtube_video_id.is_not(None),
            or_(
                PodcastEpisode.last_processed_at.is_(None),
                PodcastEpisode.last_processed_at
                < func.datetime(PodcastEpisode.publish_date, "+7 days"),
            ),
        )
        .order_by(PodcastEpisode.publish_date.desc())
    )

    return session.exec(statement).all()

def get_podcast_episodes_without_youtube_video_id(session: Session) -> list[PodcastEpisode]:
    statement = (
        select(PodcastEpisode)
        .where(PodcastEpisode.youtube_video_id.is_(None))
        .order_by(PodcastEpisode.publish_date.desc())
    )

    return session.exec(statement).all()

def create_quote(
    session: Session,
    text: str,
    text_hash: str,
    text_embedding: str | None,
    source_type: str,
    episode_id: int,
    timestamp: str | None,
    url: str | None,
) -> Quote:
    quote = Quote(
        text=text,
        text_hash=text_hash,
        text_embedding=text_embedding,
        source_type=source_type,
        episode_id=episode_id,
        timestamp=timestamp,
        url=url,
        created_by="data_sourcing_process"
    )

    session.add(quote)
    try:
        session.commit()
        session.refresh(quote)
    except IntegrityError as e:
        print(f"IntegrityError while creating quote: {e}, rolling back session and skipping...")
        session.rollback()

    return quote

def get_quotes(session: Session, limit: int | None = None, offset: int = 0) -> list[Quote]: #TODO: pagination, is this idomatic?
    statement = select(Quote)
    if limit is not None:
        statement = statement.limit(limit)
    statement = statement.offset(offset)
    return session.exec(statement).all()

def get_quotes_for_classification(session: Session, limit: int | None = None, offset: int = 0) -> list[Quote]:
    statement = select(Quote)
    if limit is not None:
        statement = statement.limit(limit)
    statement = statement.offset(offset)
    result = session.exec(statement).all()
    return [{"id": quote.id, "quote": quote.text} for quote in result]

def get_episode(session: Session, title: str) -> PodcastEpisode:
    return session.exec(select(PodcastEpisode).where(PodcastEpisode.title == title)).first()

def iter_quote_batches(
    session: Session,
    batch_size: int = 50,
) -> Iterator[list[Quote]]:
    last_id = 0

    while True:
        batch = session.exec(
            select(Quote)
            .where(Quote.id > last_id,
                    Quote.status == "PENDING")
            .order_by(Quote.id)
            .limit(batch_size)
        ).all()

        if not batch:
            break

        yield batch

        last_id = batch[-1].id

if __name__ == "__main__":
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    from data_sourcing.config.config import get_config
    import data_sourcing.db.models # Ensure models are imported so SQLModel can create tables

    config = get_config()
    engine = get_engine(config.DATABASE_URL)
    create_db_and_tables(engine)
    print("Database initialized.")