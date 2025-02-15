from sqlmodel import SQLModel, Field

class Quote(SQLModel, table=True):
   id: int = Field(primary_key=True, index=True)
   text: str
   likes: int
   reference: str

class Counter(SQLModel, table=True):
   id: int = Field(primary_key=True, index=True)
   served: int
