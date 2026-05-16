import json
import urllib.parse
from fastapi import FastAPI, Depends, HTTPException, Response, Cookie, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi_pagination import Page, add_pagination, paginate
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
from typing import Optional, Dict, Any
import uuid

from app import db
from app.schemas import QuoteRead, EpisodeListItemRead, EpisodeDetailRead

app = FastAPI()

add_pagination(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","https://theo-von.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await db.init_db()

COOKIE_NAME = "qid"

@app.get("/api/bootstrap")
async def bootstrap(response: Response, qid: str | None = Cookie(default=None)):
    if not qid:
        response.set_cookie(
            key="qid",
            value=str(uuid.uuid4()),
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=60 * 60 * 24 * 365,
        )

    return {"ok": True}

async def require_qid(
    qid: str | None = Cookie(default=None)
) -> str:
    if not qid:
        raise HTTPException(
            status_code=401,
            detail="Missing user cookie"
        )

    return qid

@app.get("/api/quote", response_model=QuoteRead)
async def get_quote(id: int, qid: str | None = Cookie(default=None), session: AsyncSession = Depends(db.get_session)):    
    asyncio.create_task(db.increment_quotes_served(by=1))

    quote = await db.get_quote(session, qid, id)

    print("quote from db:", quote)

    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    return QuoteRead(**quote)

@app.get("/api/quotes", response_model=Page[QuoteRead])
async def get_quotes(
    order_by: str,
    sort_order: str = "desc",
    episode_id: int | None = None,
    qid: str | None = Cookie(default=None),
    session: AsyncSession = Depends(db.get_session)
    ):
    page = await db.get_quotes(session, qid, order_by, sort_order, episode_id)
    asyncio.create_task(db.increment_quotes_served(by=page.size))
    return page

@app.get("/api/search_quotes", response_model=Page[QuoteRead])
async def search_quotes(search_term: str, qid: str | None = Cookie(default=None), session: AsyncSession = Depends(db.get_session)):
    items = await db.fuzzy_search_quotes(session, qid, search_term)
    page = paginate(items)
    asyncio.create_task(db.increment_quotes_served(by=page.size))
    return page

@app.get("/api/quotes-served", response_model=int)
async def get_quotes_served(session: AsyncSession = Depends(db.get_session)):
    quotes_served = await db.get_quotes_served_count(session)
    return quotes_served.served

@app.get("/api/quote-count", response_model=int)
async def get_quote_count(session: AsyncSession = Depends(db.get_session)):
    quote_count = await db.get_quote_count(session)
    return quote_count

@app.get("/api/episode-count", response_model=int)
async def get_episode_count(session: AsyncSession = Depends(db.get_session)):
    episode_count = await db.get_episode_count(session)
    return episode_count

@app.get("/api/like-count", response_model=int)
async def get_like_count(session: AsyncSession = Depends(db.get_session)):
    like_count = await db.get_like_count(session)
    return like_count

@app.put("/api/like-quote/{quote_id}")
async def like_quote(quote_id: int, qid: str = Depends(require_qid), session: AsyncSession = Depends(db.get_session)):
    if not await db.quote_exists(session, quote_id):
        raise HTTPException(status_code=404, detail="Quote not found")
    
    return await db.toggle_like_quote(session, qid, quote_id)

@app.put("/api/share-quote/{quote_id}", response_model=None)
async def share_quote(quote_id: int, qid: str = Depends(require_qid), session: AsyncSession = Depends(db.get_session)):
    if not await db.quote_exists(session, quote_id):
        raise HTTPException(status_code=404, detail="Quote not found")

    return await db.share_quote(session, qid, quote_id)

@app.get("/api/episodes", response_model=Page[EpisodeListItemRead])
async def get_episodes(
    response: Response,
    order_by: str,
    sort_order: str = "desc",
    session: AsyncSession = Depends(db.get_session)
    ):
    episodes = await db.get_episodes(session, order_by, sort_order)
    response.headers["Cache-Control"] = "public, max-age=3600"
    return episodes

@app.get("/api/episode", response_model=EpisodeDetailRead)
async def get_episode(
    response: Response,
    id: int,
    session: AsyncSession = Depends(db.get_session)
    ):
    episode = await db.get_episode(session, id)
    response.headers["Cache-Control"] = "public, max-age=3600"
    return episode

@app.get("/api/sitemap.xml", response_class=Response)
async def sitemap(session: AsyncSession = Depends(db.get_session)):

    base_url = "https://theo-von.com"
    lastmod = "2026-05-15"
    dt_format = "%Y-%m-%d"

    sitemap_items = []

    def add_sitemap_item(uri: str, lastmod: str):
        loc = f"{base_url}/{uri}"
        sitemap_items.append(f"""
        <url>
            <loc>{loc}</loc>
            <lastmod>{lastmod}</lastmod>
        </url>""")

    add_sitemap_item(uri="quotes", lastmod=lastmod)
    add_sitemap_item(uri="episodes", lastmod=lastmod)
    add_sitemap_item(uri="clips", lastmod=lastmod)
    add_sitemap_item(uri="about", lastmod="2026-05-16")

    quotes = await db.get_all_quotes_id_and_time(session)

    for q in quotes:
        add_sitemap_item(uri=f"quote/{q['id']}", lastmod=q["status_updated_at"].strftime(dt_format))

    episodes = await db.get_all_episode_id_and_time(session)

    for ep in episodes:
        add_sitemap_item(uri=f"episode/{ep['id']}", lastmod=ep["created_at"].strftime(dt_format))

    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        {"".join(sitemap_items)}
    </urlset>"""

    return Response(content=xml_content, media_type="application/xml")


def read_cookie_list_value(cookie: str) -> list:
    if not cookie:
        return []
    else:
        return decode_and_parse_cookie(cookie)

def decode_and_parse_cookie(cookie: str):
    return json.loads(urllib.parse.unquote(cookie))

def encode_and_jsonify_list(list_input: str):
    return urllib.parse.quote(json.dumps(list_input))
