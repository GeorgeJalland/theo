from sqlmodel import SQLModel, Field
from typing import Optional

class Quote(SQLModel, table=True):
   id: int = Field(primary_key=True, index=True)
   text: str
   likes: Optional[int] = Field(default=0, sa_column_kwargs={"server_default": "0"})
   shares: Optional[int]  = Field(default=0, sa_column_kwargs={"server_default": "0"})
   reference: str

class Counter(SQLModel, table=True):
   id: int = Field(primary_key=True, index=True)
   served: int
