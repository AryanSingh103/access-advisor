from fastapi.testclient import TestClient

import main
from config import settings

# No `with` block: the lifespan (vector-store init) is intentionally not run.
client = TestClient(main.app)


def test_health_is_open():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_api_routes_reject_missing_key_when_configured(monkeypatch):
    monkeypatch.setattr(settings, "BACKEND_API_KEY", "sekrit")
    res = client.post("/api/analyze", json={"content": "x", "content_type": "code"})
    assert res.status_code == 401


def test_api_routes_reject_wrong_key_when_configured(monkeypatch):
    monkeypatch.setattr(settings, "BACKEND_API_KEY", "sekrit")
    res = client.post(
        "/api/scan-url",
        json={"url": "ftp://x"},
        headers={"X-API-Key": "wrong"},
    )
    assert res.status_code == 401


def test_correct_key_reaches_endpoint_validation(monkeypatch):
    monkeypatch.setattr(settings, "BACKEND_API_KEY", "sekrit")
    res = client.post(
        "/api/scan-url",
        json={"url": "ftp://x"},
        headers={"X-API-Key": "sekrit"},
    )
    # Passed the auth gate; failed the endpoint's own scheme validation.
    assert res.status_code == 400


def test_no_key_configured_allows_requests(monkeypatch):
    monkeypatch.setattr(settings, "BACKEND_API_KEY", "")
    res = client.post("/api/scan-url", json={"url": "ftp://x"})
    assert res.status_code == 400


def test_analyze_streams_tokens(monkeypatch):
    from routers import analyze as analyze_router

    async def fake_analyze(content, content_type):
        for token in ["Hello ", "world"]:
            yield token

    monkeypatch.setattr(settings, "BACKEND_API_KEY", "")
    monkeypatch.setattr(analyze_router, "analyze_content", fake_analyze)
    res = client.post("/api/analyze", json={"content": "<div>x</div>", "content_type": "code"})
    assert res.status_code == 200
    assert res.text == "Hello world"


def test_analyze_rejects_bad_content_type():
    res = client.post("/api/analyze", json={"content": "x", "content_type": "banana"})
    assert res.status_code == 422
