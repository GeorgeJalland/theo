import json
import math
from cachetools import cached, TTLCache
from collections import deque
import urllib.parse
from fastapi import FastAPI, Depends, HTTPException, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import create_engine, Session, select, SQLModel, func

from models import Quote, Counter
import random_helper

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = "sqlite:///./app/instance/app.db"
db = create_engine(DATABASE_URL)
SQLModel.metadata.create_all(db)

def get_session():
    with Session(db) as session:
        yield session

@app.get("/quote")
async def get_quote(response: Response, liked_quotes: str = Cookie(None), prev_quote_ids: str = Cookie(None), session: Session = Depends(get_session)):
    # Organise this function
    liked_quotes_list = read_cookie_list_value(liked_quotes)
    prev_quote_ids_list = read_cookie_list_value(prev_quote_ids)
    prev_quote_ids_deque = deque(prev_quote_ids_list, maxlen=get_deque_max_length())

    # put this in function
    quotes_served = session.exec(select(Counter)).first()
    quotes_served.served += 1
    session.add(quotes_served)
    session.commit()

    next_quote_id = get_next_quote_id(session, prev_quote_ids_list)
    prev_quote_ids_deque.append(next_quote_id)
    has_user_liked_quote = next_quote_id in liked_quotes_list

    statement = select(Quote).where(Quote.id == next_quote_id)
    quote = session.exec(statement).first()

    encoded_prev_quote_ids = encode_and_jsonify_list(list(prev_quote_ids_deque))

    response.set_cookie(key="quote_id", value=quote.id, httponly=True)
    response.set_cookie(key="prev_quote_ids", value=encoded_prev_quote_ids, httponly=True)
    return {**quote.model_dump() , "has_user_liked_quote": has_user_liked_quote}

@app.get("/quotes-served")
async def get_quotes_served(session: Session = Depends(get_session)):
    quotes_served = session.exec(select(Counter)).first()
    return {"quotes_served": quotes_served.served}

@app.put("/like-quote")
async def like_quote(response: Response, quote_id: int = Cookie(), liked_quotes: str= Cookie(None), session: Session = Depends(get_session)):
    liked_quotes_list = read_cookie_list_value(liked_quotes)

    quote = session.exec(select(Quote).where(Quote.id == quote_id)).first()

    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    if quote_id not in liked_quotes_list:
        quote.likes += 1
        liked_quotes_list.append(quote_id)
    else:
        quote.likes -= 1
        liked_quotes_list.remove(quote_id)

    session.add(quote)
    session.commit()
    session.refresh(quote)

    encoded_quotes_list = encode_and_jsonify_list(liked_quotes_list)
    response.set_cookie(key="liked_quotes", value=encoded_quotes_list, httponly=True)
    return {"id": quote.id, "likes": quote.likes}

def read_cookie_list_value(cookie: str) -> list:
    if not cookie:
        return []
    else:
        return decode_and_parse_cookie(cookie)

def decode_and_parse_cookie(cookie: str):
    return json.loads(urllib.parse.unquote(cookie))

def encode_and_jsonify_list(list_input: str):
    return urllib.parse.quote(json.dumps(list_input))

def get_next_quote_id(session: Session, prev_ids: list):
    return get_random_quote_id_excluding_prev_ids(session, prev_ids)

def get_random_quote_id_excluding_prev_ids(session: Session, prev_ids) -> int:
    max_id = get_max_id(session)
    random_generator = random_helper.Random(max=max_id, exclude=prev_ids)
    return random_generator.get_random_number()

def get_max_id(session: Session) -> int:
    statement = select(func.max(Quote.id))
    max_id = session.exec(statement).first()
    return max_id

@cached(TTLCache(maxsize=1, ttl=21600))
def get_deque_max_length() -> int:
    max_id = get_max_id(next(get_session()))
    if max_id < 20:
        return math.ceil(max_id / 2)
    return 10