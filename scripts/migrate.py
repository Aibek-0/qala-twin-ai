"""Idempotent initial schema migration; future versions require explicit migrations."""

from backend.app.db import Base, engine

Base.metadata.create_all(engine)
print("Schema v1 ready.")
