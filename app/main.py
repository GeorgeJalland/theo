import json
import random
import urllib.parse
from fastapi import FastAPI, Depends, HTTPException, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio

from db import get_session, init_db, AsyncSessionLocal
from models import Quote, Counter

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()
    async with AsyncSessionLocal() as session:
        app.state.QUOTE_MAX_ID = await get_max_quote_id(session)


@app.get("/quote")
async def get_quote(response: Response, quote_id: int = Cookie(None), liked_quotes: str = Cookie(None), session: AsyncSession = Depends(get_session)):
    asyncio.create_task(increment_quotes_served())

    if not quote_id:
        quote_id = await get_random_quote_id(session)
    quote = await get_next_quote(session, quote_id)

    has_user_liked_quote = quote.id in read_cookie_list_value(liked_quotes)
    response.set_cookie(key="quote_id", value=quote.id, httponly=True) #add max expiry here
    return {**quote.model_dump() , "has_user_liked_quote": has_user_liked_quote}

@app.get("/quotes-served")
async def get_quotes_served(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Counter))
    quotes_served = result.scalar()
    return {"quotes_served": quotes_served.served}

@app.put("/like-quote/{quote_id}")
async def like_quote(response: Response, quote_id: int, liked_quotes: str= Cookie(None), session: AsyncSession = Depends(get_session)):
    liked_quotes_list = read_cookie_list_value(liked_quotes)

    result = await session.execute(select(Quote).where(Quote.id == quote_id))
    quote = result.scalar()

    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    if quote_id not in liked_quotes_list:
        quote.likes += 1
        liked_quotes_list.append(quote_id)
    else:
        quote.likes -= 1
        liked_quotes_list.remove(quote_id)

    session.add(quote)
    await session.commit()

    encoded_quotes_list = encode_and_jsonify_list(liked_quotes_list)
    response.set_cookie(key="liked_quotes", value=encoded_quotes_list, httponly=True)
    return None

async def get_max_quote_id(session: AsyncSession) -> int:
    statement = select(func.max(Quote.id))
    result = await session.execute(statement)
    max_id = result.scalar()
    return max_id

async def get_quote_record(session: AsyncSession, quote_id: int) -> Quote:
    statement = select(Quote).where(Quote.id == quote_id)
    result = await session.execute(statement)
    return result.scalar()

async def increment_quotes_served() -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Counter))
        quotes_served = result.scalar()
        quotes_served.served += 1
        session.add(quotes_served)
        await session.commit()

def read_cookie_list_value(cookie: str) -> list:
    if not cookie:
        return []
    else:
        return decode_and_parse_cookie(cookie)

def decode_and_parse_cookie(cookie: str):
    return json.loads(urllib.parse.unquote(cookie))

def encode_and_jsonify_list(list_input: str):
    return urllib.parse.quote(json.dumps(list_input))

async def get_next_quote(session: AsyncSession, current_id: int) -> Quote:
    print(app.state.QUOTE_MAX_ID)
    next_id = (current_id % app.state.QUOTE_MAX_ID) + 1
    next_quote = await session.execute(select(Quote).where(Quote.id == next_id))
    return next_quote.scalar()

async def get_random_quote_id(session: AsyncSession) -> int:
    max_id = await get_max_quote_id(session)
    return random.randint(1, max_id)
