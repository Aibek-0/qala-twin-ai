import os

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SESSION_SECRET"] = "test-only-session-secret-at-least-32-characters-long"
import pytest
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from backend.app.db import Base, get_db
from backend.app.main import app
from backend.app.seed import seed_demo


@pytest.fixture
def db():
    e = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(e)
    Factory = sessionmaker(e, expire_on_commit=False)
    with Factory() as session:
        seed_demo(session)
        yield session
    e.dispose()


@pytest.fixture
def client(db):
    def override():
        yield db

    app.dependency_overrides[get_db] = override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def demo(client):
    assert client.post("/api/v1/auth/demo").status_code == 200
    return client
