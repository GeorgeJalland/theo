from functools import lru_cache
from datetime import datetime, timedelta, timezone
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from sqlalchemy import exists, and_, case
from sqlalchemy.engine import RowMapping
import random
from sqlmodel import select, func, asc, desc, delete, update
from fastapi_pagination.ext.sqlalchemy import paginate
from fastapi_pagination import Page
from rapidfuzz import fuzz
from pathlib import Path

from app.models import Quote, Counter, QuoteStatus, PodcastEpisode, Like, Share
from app.schemas import to_quote_read, QuoteRead, to_episode_base, EpisodeBaseRead, EpisodeDetailRead, to_episode_detail 

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_URL = f"sqlite+aiosqlite:///{BASE_DIR}/instance/app.db"

async_engine = create_async_engine(DATABASE_URL, echo=True, future=True)

AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

@lru_cache
def get_trending_stmt(base_stmt):

    one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)

    trending_subquery = (
        select(
            Like.quote_id,
            func.count(Like.id).label("weekly_likes")
        )
        .where(Like.created_at >= one_week_ago)
        .group_by(Like.quote_id)
        .subquery()
    )

    return (
        base_stmt
        .outerjoin(
            trending_subquery,
            trending_subquery.c.quote_id == Quote.id
        )
        .order_by(
            trending_subquery.c.weekly_likes.desc().nullslast()
        )
    )

@lru_cache
def get_base_stmt(user_id: str):

    liked_by_user = (
        select(Like.id)
        .where(
            Like.quote_id == Quote.id,
            Like.user_id == user_id
        )
        .exists()
    )

    return (
        select(
            Quote.id,
            Quote.text,
            Quote.text_hash,
            Quote.likes,
            Quote.shares,
            Quote.url,
            Quote.created_at,

            PodcastEpisode.id.label("episode_id"),
            PodcastEpisode.title.label("episode_title"),
            PodcastEpisode.publish_date.label("episode_publish_date"),

            liked_by_user.label("liked_by_user"),
        )
        .select_from(Quote)
        .outerjoin(Quote.episode)
        .where(Quote.status == QuoteStatus.APPROVED)
    )

async def init_db():
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

async def get_session():
    async with AsyncSessionLocal() as session:
        yield session

async def get_quote(session: AsyncSession, user_id: str, id: int) -> Quote:
    stmt = get_base_stmt(user_id)
    result = await session.execute(stmt.where(Quote.id == id))
    return result.mappings().first()

async def quote_exists(session: AsyncSession, id: int) -> bool:
    stmt = select(
        exists().where(
            Quote.id == id,
            Quote.status == QuoteStatus.APPROVED
        )
    )

    result = await session.execute(stmt)
    return result.scalar()

async def toggle_like_quote(session: AsyncSession, user_id: str, quote_id: int):
    if user_id is None:
        raise ValueError("User ID is required to like a quote")
    
    like = Like(quote_id=quote_id, user_id=user_id)
    print(f"Toggling like for quote_id={quote_id} by user_id={user_id}")
    session.add(like)

    try:
        await session.commit()

        stmt = update(Quote).where(
            Quote.id == quote_id
        ).values(
            likes=Quote.likes + 1
        )

        await session.execute(stmt)
        await session.commit()

        return {"liked": True, "quote_id": quote_id}

    except IntegrityError:
        await session.rollback()

        stmt = delete(Like).where(
            Like.quote_id == quote_id,
            Like.user_id == user_id
        )

        await session.execute(stmt)

        stmt2 = update(Quote).where(
            Quote.id == quote_id
        ).values(
            likes=Quote.likes - 1
        )

        await session.execute(stmt2)
        await session.commit()

        return {"liked": False, "quote_id": quote_id}

async def share_quote(session: AsyncSession, user_id: str, quote_id: Quote) -> None:
    if user_id is None:
        raise ValueError("User ID is required to share a quote")
    
    share = Share(quote_id=quote_id, user_id=user_id)
    session.add(share)

    stmt = update(Quote).where(
        Quote.id == quote_id
    ).values(
        shares=Quote.shares + 1
    )

    await session.execute(stmt)
    await session.commit()
    
    return {
        "quote_id": quote_id,
        "shared": True
    }

async def get_random_quote_id(session: AsyncSession) -> int:
    max_id = await get_max_quote_id(session)
    return random.randint(1, max_id)

async def get_max_quote_id(session: AsyncSession) -> int:
    statement = select(func.max(Quote.id))
    result = await session.execute(statement)
    max_id = result.scalar()
    return max_id

async def increment_quotes_served(by: int) -> None:
    async with AsyncSessionLocal() as session:
        await session.execute(
            update(Counter).values(
                served=Counter.served + by
            )
        )
        await session.commit()

async def get_quotes_served_count(session: AsyncSession) -> int:
    result = await session.execute(select(Counter))
    return result.scalar()

async def get_quote_count(session: AsyncSession) -> int:
    result = await session.execute(select(func.count(Quote.id)).where(Quote.status == QuoteStatus.APPROVED))
    return result.scalar()

async def get_episode_count(session: AsyncSession) -> int:
    result = await session.execute(select(func.count(PodcastEpisode.id)))
    return result.scalar()

async def get_like_count(session: AsyncSession) -> int:
    result = await session.execute(select(func.count(Like.id)))
    return result.scalar()

async def get_quotes(session: AsyncSession, user_id: str, order_by: str, sort_order: str, episode_id: int | None) -> Page[QuoteRead]:
    direction = asc if sort_order == "asc" else desc
    stmt = get_base_stmt(user_id)

    if episode_id is not None:
        stmt = stmt.where(Quote.episode_id == episode_id)

    if order_by == "trending":
        stmt = get_trending_stmt(stmt)
    elif order_by == "new":
        stmt = stmt.order_by(direction("episode_publish_date"))
    else:
        order_column = getattr(Quote, order_by, None)
        stmt = stmt.order_by(direction(order_column))

    return await paginate(session, stmt)

async def get_all_quotes_id_and_time(session: AsyncSession) -> list[RowMapping]:
    result = await session.execute(select(Quote.id, Quote.status_updated_at).where(Quote.status == QuoteStatus.APPROVED))
    return result.mappings().all()

async def get_all_episode_id_and_time(session: AsyncSession) -> list[RowMapping]:
    result = await session.execute(select(PodcastEpisode.id, PodcastEpisode.created_at))
    return result.mappings().all()

async def keyword_search_quotes(session: AsyncSession, search_term: str) -> Page[QuoteRead]:
    result = await paginate(
        session,
        select(Quote).where(Quote.status == QuoteStatus.APPROVED, Quote.text.like(f"%{search_term}%")).limit(10),
        transformer=lambda quotes: [to_quote_read(quote) for quote in quotes])
    return result

MIN_SCORE = 80

@lru_cache()
def calc_fuzzy_scores(quote_texts: tuple, search_term: str):
    search_term = search_term.lower()
    return {
        qid: fuzz.partial_ratio(search_term, text.lower())
        for qid, text in quote_texts
    }

async def fuzzy_search_quotes(session: AsyncSession, user_id: str, search_term: str) -> list[QuoteRead]:
    rows = (await session.execute(get_base_stmt(user_id))).mappings().all()

    quotes = [
        QuoteRead(**row)
        for row in rows
    ]

    quote_texts = tuple((q.id, q.text) for q in quotes)
    scores = calc_fuzzy_scores(quote_texts, search_term)

    return sorted(
        (q for q in quotes if scores[q.id] >= MIN_SCORE),
        key=lambda q: scores[q.id],
        reverse=True
    )

@lru_cache
def get_episode_base_stmt():
    return (
        select(
            PodcastEpisode.id,
            PodcastEpisode.title,
            PodcastEpisode.episode_number,
            PodcastEpisode.guest_name,
            PodcastEpisode.publish_date,
            PodcastEpisode.thumbnails,
            PodcastEpisode.spotify_podcast_id
        )
        .select_from(PodcastEpisode)
        .where(PodcastEpisode.processed == True)
    )

async def get_episodes(session: AsyncSession, order_by: str, sort_order: str) -> Page[EpisodeBaseRead]:
    direction = asc if sort_order == "asc" else desc
    stmt = get_episode_base_stmt()

    order_column = getattr(PodcastEpisode, order_by, None)
    stmt = stmt.order_by(direction(order_column))

    return await paginate(
        session,
        stmt,
        transformer=lambda episodes: [to_episode_base(ep) for ep in episodes]
        )

async def get_episode(session: AsyncSession, episode_id: int) -> EpisodeDetailRead:
    episode = await session.execute(select(PodcastEpisode).where(PodcastEpisode.id == episode_id))

    return to_episode_detail(episode.scalar_one())
