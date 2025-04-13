from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import random
from sqlmodel import select, func, desc
from fastapi_pagination.ext.sqlalchemy import paginate

from app.models import Quote, Counter

DATABASE_URL = "sqlite+aiosqlite:///./app/instance/app.db"

async_engine = create_async_engine(DATABASE_URL, echo=True, future=True)

AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def init_db():
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

async def get_session():
    async with AsyncSessionLocal() as session:
        yield session

async def get_next_quote(session: AsyncSession, current_id: int, max_quote_id: int) -> Quote:
    next_id = (current_id % max_quote_id) + 1
    next_quote = await session.execute(select(Quote).where(Quote.id >= next_id).limit(1))
    return next_quote.scalar()

async def get_quote_record(session: AsyncSession, id: int, max_quote_id: int) -> Quote:
    id = (id - 1) % max_quote_id + 1 #Creates loop of quote ids
    quote = await session.execute(select(Quote).where(Quote.id >= id).limit(1))
    return quote.scalar()

async def get_exact_quote_record(session: AsyncSession, id: int) -> Quote:
    result = await session.execute(select(Quote).where(Quote.id == id))
    return result.scalar()

async def like_quote_if_not_already_liked(session: AsyncSession, quote: Quote, users_liked_quotes: list, max_cookie_likes: int) -> list:
    if quote.id not in users_liked_quotes:
        quote.likes += 1
        if len(users_liked_quotes) >= max_cookie_likes:
            users_liked_quotes.pop(0)
        users_liked_quotes.append(quote.id)
    else:
        quote.likes -= 1
        users_liked_quotes.remove(quote.id)

    session.add(quote)
    await session.commit()
    return users_liked_quotes

async def increment_quote_shares(session: AsyncSession, quote: Quote) -> None:
    quote.shares += 1
    session.add(quote)
    await session.commit()

async def get_random_quote_id(session: AsyncSession) -> int:
    max_id = await get_max_quote_id(session)
    return random.randint(1, max_id)

async def get_max_quote_id(session: AsyncSession) -> int:
    statement = select(func.max(Quote.id))
    result = await session.execute(statement)
    max_id = result.scalar()
    return max_id

async def increment_quotes_served() -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Counter))
        quotes_served = result.scalar()
        quotes_served.served += 1
        session.add(quotes_served)
        await session.commit()

async def get_quotes_served_count(session: AsyncSession) -> int:
    result = await session.execute(select(Counter))
    return result.scalar()

async def get_quotes(session: AsyncSession, order_by: str) -> list[Quote]:
    order_column = getattr(Quote, order_by, None)
    return await paginate(session, select(Quote).order_by(desc(order_column)))

async def get_all_quotes(session: AsyncSession) -> list[Quote]:
    result = await session.execute(select(Quote))
    return result.scalars().all()
