"""Run from repository root: python -m scripts.seed."""

from backend.app.db import Base, engine, Session
from backend.app.seed import seed_demo

Base.metadata.create_all(engine)
with Session() as db:
    seed_demo(db)
print("QALA MART seed ready: 48 products, 30 days, 1440 sale lines.")
