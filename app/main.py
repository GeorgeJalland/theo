import json
from fastapi import FastAPI, Depends, HTTPException, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import create_engine, Session, select, SQLModel, func
from models import Quote

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
async def get_quote(response: Response, quote_id: int = Cookie(1), session: Session = Depends(get_session)):
    next_quote_id = get_next_quote_id(session, quote_id)

    statement = select(Quote).where(Quote.id == next_quote_id)
    quote = session.exec(statement).first()

    print(next_quote_id)
    response.set_cookie(key="quote_id", value=quote.id)
    return quote

@app.put("/like-quote")
async def like_quote(response: Response, quote_id: int = Cookie(None), liked_quotes: str= Cookie(None), session: Session = Depends(get_session)):
    if not liked_quotes:
        liked_quotes_list = []
    else:
        liked_quotes_list = json.loads(liked_quotes)

    if quote_id in liked_quotes_list:
        raise HTTPException(status_code=304, detail="Quote Already Liked")

    quote = session.exec(select(Quote).where(Quote.id == quote_id)).first()

    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    quote.likes += 1
    session.add(quote)
    session.commit()
    session.refresh(quote)

    liked_quotes_list.append(quote_id)
    response.set_cookie(key="liked_quotes", value=json.dumps(liked_quotes_list))
    return {"id": quote.id, "likes": quote.likes}

def get_next_quote_id(session: Session, current_id: int) -> int:
    max_id = get_max_id(session)
    return (current_id % max_id) + 1


def get_max_id(session: Session) -> int:
    statement = select(func.max(Quote.id))
    max_id = session.exec(statement).first()
    return max_id