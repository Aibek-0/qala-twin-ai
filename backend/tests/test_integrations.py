import io, os
from unittest.mock import AsyncMock, patch
import httpx, pytest


def test_local_login_rejects_unknown_user(client, monkeypatch):
    monkeypatch.setattr("backend.app.auth.SUPABASE_URL", "")
    assert (
        client.post(
            "/api/v1/auth/login", json={"email": "a@b.kz", "password": "abcdefgh"}
        ).status_code
        == 400
    )


def test_provider_verified_identity_and_empty_business(client, monkeypatch):
    monkeypatch.setattr("backend.app.auth.SUPABASE_URL", "https://auth.example")
    monkeypatch.setattr("backend.app.auth.SUPABASE_KEY", "test")
    provider = AsyncMock()
    provider.__aenter__.return_value = provider
    provider.post.return_value = httpx.Response(
        200, json={"access_token": "provider-token"}
    )
    provider.get.return_value = httpx.Response(200, json={"id": "provider-user-id"})
    with patch("backend.app.auth.httpx.AsyncClient", return_value=provider):
        r = client.post(
            "/api/v1/auth/login", json={"email": "a@b.kz", "password": "abcdefgh"}
        )
    assert r.status_code == 200
    assert r.json()["is_demo"] is False
    assert client.get("/api/v1/dashboard/overview").json()["revenue"] == "0.00"
    assert client.get("/api/v1/dashboard/overview").json()["net_profit"] is None


def test_registration_email_confirmation(client, monkeypatch):
    monkeypatch.setattr("backend.app.auth.SUPABASE_URL", "https://auth.example")
    monkeypatch.setattr("backend.app.auth.SUPABASE_KEY", "test")
    provider = AsyncMock()
    provider.__aenter__.return_value = provider
    provider.post.return_value = httpx.Response(200, json={"user": {"id": "test"}})
    with patch("backend.app.auth.httpx.AsyncClient", return_value=provider):
        r = client.post(
            "/api/v1/auth/register", json={"email": "a@b.kz", "password": "abcdefgh"}
        )
    assert r.json()["confirmation_required"] is True


def test_openai_failure_has_deterministic_fallback(demo, monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "configured-model")
    provider = AsyncMock()
    provider.__aenter__.return_value = provider
    provider.post.side_effect = httpx.ConnectError("unavailable")
    with patch("backend.app.ai.httpx.AsyncClient", return_value=provider):
        r = demo.post("/api/v1/ai/chat", json={"question": "Прогноз", "locale": "ru"})
    assert r.status_code == 200
    assert r.json()["mode"] == "deterministic"
    assert r.json()["explanation"] is None


def test_numeric_model_explanation_rejected(demo, monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "configured-model")
    provider = AsyncMock()
    provider.__aenter__.return_value = provider
    provider.post.return_value = httpx.Response(
        200,
        request=httpx.Request("POST", "https://api.openai.com/v1/responses"),
        json={
            "output": [
                {
                    "type": "message",
                    "content": [
                        {"type": "output_text", "text": "Revenue is 999999999"}
                    ],
                }
            ]
        },
    )
    with patch("backend.app.ai.httpx.AsyncClient", return_value=provider):
        r = demo.post("/api/v1/ai/chat", json={"question": "Прогноз", "locale": "ru"})
    assert r.json()["mode"] == "deterministic"
    assert "999999999" not in r.json()["answer"]


def test_frame_count_syncs_to_twin(demo, monkeypatch):
    monkeypatch.setenv("VISION_ENABLED", "true")
    result = {
        "person_count": 3,
        "boxes": [],
        "inference_ms": 25,
        "measurement": "live",
        "entry_exit_available": False,
        "queue_available": False,
    }
    with patch("backend.app.vision.analyze_image", return_value=result):
        r = demo.post(
            "/api/v1/vision/analyze-frame", files={"file": ("frame.jpg", b"fixture")}
        )
    assert r.status_code == 200
    state = demo.get("/api/v1/twin/state").json()
    assert state["occupancy"] == 3
    assert state["measurement"] == "live"
    assert state["coordinates_available"] is False


def test_logout_clears_session(demo):
    assert demo.post("/api/v1/auth/logout").status_code == 200
    assert demo.get("/api/v1/auth/me").status_code == 401
