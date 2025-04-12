import json
import urllib.parse
from fastapi import FastAPI, Depends, HTTPException, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi_pagination import Page, add_pagination
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
from typing import Optional, Dict, Any
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

from app import db
from app.models import Quote, QuoteOut

app = FastAPI()
app.mount("/static", StaticFiles(directory="app/static"), name="static")
add_pagination(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
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


@app.get("/api/quote")
async def get_quote(response: Response, id: Optional[int] = None, quote_id: int = Cookie(None), liked_quotes: str = Cookie(None), session: AsyncSession = Depends(db.get_session)) -> QuoteOut:
    asyncio.create_task(db.increment_quotes_served())

    if not id:
        if quote_id:
            id = quote_id + 1
        else:
            id = await db.get_random_quote_id(session)
    quote = await db.get_quote_record(session, id, app.state.QUOTE_MAX_ID)

    response.set_cookie(key="quote_id", value=quote.id, httponly=True, max_age=app.state.cookie_expiry)
    return {**quote.model_dump() , "has_user_liked_quote": has_user_liked_quote(id=quote.id, liked_quotes=liked_quotes)}

@app.get("/api/quotes")
async def get_quotes(order_by: str, session: AsyncSession = Depends(db.get_session)) -> Page[Quote]:
    return await db.get_quotes(session, order_by)

@app.get("/api/user-liked-quote/{quote_id}")
async def user_liked_quote(quote_id: int, liked_quotes: str = Cookie(None)) -> bool:
    return has_user_liked_quote(quote_id, liked_quotes)

@app.get("/api/quotes-served")
async def get_quotes_served(session: AsyncSession = Depends(db.get_session)) -> Dict[str, int]:
    quotes_served = await db.get_quotes_served_count(session)
    return {"quotes_served": quotes_served.served}

@app.put("/api/like-quote/{quote_id}")
async def like_quote(response: Response, quote_id: int, liked_quotes: str= Cookie(None), session: AsyncSession = Depends(db.get_session)) -> None:
    liked_quotes_list = read_cookie_list_value(liked_quotes)

    quote = await db.get_exact_quote_record(session, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    liked_quotes_list = await db.like_quote_if_not_already_liked(session, quote, liked_quotes_list, app.state.MAX_COOKIE_LIKES)
    encoded_quotes_list = encode_and_jsonify_list(liked_quotes_list)

    response.set_cookie(key="liked_quotes", value=encoded_quotes_list, httponly=True, max_age=app.state.cookie_expiry)
    return None

@app.put("/api/share-quote/{quote_id}")
async def like_quote(quote_id: int, session: AsyncSession = Depends(db.get_session)) -> None:

    quote = await db.get_exact_quote_record(session, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    return await db.increment_quote_shares(session, quote)

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    file_path = os.path.join("app/static", full_path)
    if os.path.exists(file_path) and not os.path.isdir(file_path):
        return FileResponse(file_path)
    print("file doesnt exist")
    return FileResponse("app/static/index.html")

def read_cookie_list_value(cookie: str) -> list:
    if not cookie:
        return []
    else:
        return decode_and_parse_cookie(cookie)

def decode_and_parse_cookie(cookie: str):
    return json.loads(urllib.parse.unquote(cookie))

def encode_and_jsonify_list(list_input: str):
    return urllib.parse.quote(json.dumps(list_input))

def has_user_liked_quote(id: int, liked_quotes: str) -> str:
    return id in read_cookie_list_value(liked_quotes)
