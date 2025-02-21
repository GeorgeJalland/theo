import json
import urllib.parse
from fastapi import FastAPI, Depends, HTTPException, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi_pagination import Page, add_pagination
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
from typing import Optional, Dict, Any

from app import db
from app.models import Quote

app = FastAPI(root_path="/api")
add_pagination(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await db.init_db()
    async with db.AsyncSessionLocal() as session:
        app.state.QUOTE_MAX_ID = await db.get_max_quote_id(session)
        app.state.MAX_COOKIE_LIKES = app.state.QUOTE_MAX_ID
        app.state.cookie_expiry = 5 * 365 * 24 * 60 * 60


@app.get("/quote")
async def get_quote(response: Response, id: Optional[int] = None, quote_id: int = Cookie(None), liked_quotes: str = Cookie(None), session: AsyncSession = Depends(db.get_session)) -> Dict[str, Any]:
    asyncio.create_task(db.increment_quotes_served())

    if not id:
        if quote_id:
            id = quote_id + 1
        else:
            id = await db.get_random_quote_id(session)
    quote = await db.get_quote_record(session, id, app.state.QUOTE_MAX_ID)

    has_user_liked_quote = quote.id in read_cookie_list_value(liked_quotes)
    response.set_cookie(key="quote_id", value=quote.id, httponly=True, max_age=app.state.cookie_expiry)
    return {**quote.model_dump() , "has_user_liked_quote": has_user_liked_quote}

@app.get("/quotes")
async def get_quotes(order_by: str, session: AsyncSession = Depends(db.get_session)) -> Page[Quote]:
    return await db.get_quotes(session, order_by)

@app.get("/quotes-served")
async def get_quotes_served(session: AsyncSession = Depends(db.get_session)) -> Dict[str, int]:
    quotes_served = await db.get_quotes_served_count(session)
    return {"quotes_served": quotes_served.served}

@app.put("/like-quote/{quote_id}")
async def like_quote(response: Response, quote_id: int, liked_quotes: str= Cookie(None), session: AsyncSession = Depends(db.get_session)) -> None:
    liked_quotes_list = read_cookie_list_value(liked_quotes)

    quote = await db.get_exact_quote_record(session, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    liked_quotes_list = await db.like_quote_if_not_already_liked(session, quote, liked_quotes_list, app.state.MAX_COOKIE_LIKES)
    encoded_quotes_list = encode_and_jsonify_list(liked_quotes_list)

    response.set_cookie(key="liked_quotes", value=encoded_quotes_list, httponly=True, max_age=app.state.cookie_expiry)
    return None

@app.put("/share-quote/{quote_id}")
async def like_quote(quote_id: int, session: AsyncSession = Depends(db.get_session)) -> None:

    quote = await db.get_exact_quote_record(session, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    return await db.increment_quote_shares(session, quote)

def read_cookie_list_value(cookie: str) -> list:
    if not cookie:
        return []
    else:
        return decode_and_parse_cookie(cookie)

def decode_and_parse_cookie(cookie: str):
    return json.loads(urllib.parse.unquote(cookie))

def encode_and_jsonify_list(list_input: str):
    return urllib.parse.quote(json.dumps(list_input))
