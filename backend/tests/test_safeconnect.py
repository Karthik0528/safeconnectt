"""SafeConnect backend regression tests.
Covers: health, auth, trips, travellers/matches, chat, guides/bookings,
posts/comments, emergency contacts/SOS, AI assistant.
"""
import os
import time
import uuid
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load EXPO_PUBLIC_BACKEND_URL from frontend/.env to mirror real client.
load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")
BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL must be set"
API = f"{BASE_URL}/api"

DEMO_EMAIL = "emma@safeconnect.demo"
DEMO_PW = "Demo1234!"
SECOND_DEMO = "sara@safeconnect.demo"


@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def auth(s):
    r = s.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PW}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    return {
        "token": data["token"],
        "user": data["user"],
        "headers": {"Authorization": f"Bearer {data['token']}"},
    }


@pytest.fixture(scope="session")
def auth_sara(s):
    r = s.post(f"{API}/auth/login", json={"email": SECOND_DEMO, "password": DEMO_PW}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    return {
        "token": data["token"],
        "user": data["user"],
        "headers": {"Authorization": f"Bearer {data['token']}"},
    }


# -------- Health --------
def test_health(s):
    r = s.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    j = r.json()
    assert j["app"] == "SafeConnect"
    assert j["status"] == "ok"


# -------- Auth --------
def test_login_demo_user(auth):
    assert auth["user"]["email"] == DEMO_EMAIL
    assert auth["user"]["verified"] is True
    assert "id" in auth["user"]


def test_signup_and_duplicate(s):
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "name": "TEST User",
        "email": email,
        "password": "Pass1234!",
        "age": 25,
        "phone": "+1-555-0000",
        "bio": "TEST bio",
        "interests": ["Hiking"],
        "languages": ["English"],
    }
    r = s.post(f"{API}/auth/signup", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "token" in j and j["user"]["email"] == email
    # duplicate
    r2 = s.post(f"{API}/auth/signup", json=payload, timeout=15)
    assert r2.status_code == 400


def test_me_requires_token(s):
    r = s.get(f"{API}/auth/me", timeout=10)
    assert r.status_code == 401


def test_me_with_token(s, auth):
    r = s.get(f"{API}/auth/me", headers=auth["headers"], timeout=10)
    assert r.status_code == 200
    assert r.json()["email"] == DEMO_EMAIL


def test_patch_me(s, auth):
    new_bio = f"TEST bio {uuid.uuid4().hex[:6]}"
    r = s.patch(
        f"{API}/auth/me",
        headers=auth["headers"],
        json={"bio": new_bio, "interests": ["Hiking", "Food"], "languages": ["English"]},
        timeout=10,
    )
    assert r.status_code == 200
    assert r.json()["bio"] == new_bio


# -------- Trips --------
def test_trip_crud(s, auth):
    payload = {
        "destination": "Lisbon",
        "country": "Portugal",
        "start_date": "2026-06-01",
        "end_date": "2026-06-10",
        "budget": "moderate",
        "interests": ["Food", "Architecture"],
        "accommodation": "hostel",
        "notes": "TEST trip",
    }
    r = s.post(f"{API}/trips", headers=auth["headers"], json=payload, timeout=10)
    assert r.status_code == 200, r.text
    trip = r.json()
    tid = trip["id"]
    # mine list
    r = s.get(f"{API}/trips/mine", headers=auth["headers"], timeout=10)
    assert r.status_code == 200
    assert any(t["id"] == tid for t in r.json())
    # get one
    r = s.get(f"{API}/trips/{tid}", headers=auth["headers"], timeout=10)
    assert r.status_code == 200
    assert r.json()["destination"] == "Lisbon"
    # delete
    r = s.delete(f"{API}/trips/{tid}", headers=auth["headers"], timeout=10)
    assert r.status_code == 200
    r = s.get(f"{API}/trips/{tid}", headers=auth["headers"], timeout=10)
    assert r.status_code == 404


# -------- Travellers + matching --------
def test_suggested_travellers(s, auth):
    r = s.get(f"{API}/travellers/suggested", headers=auth["headers"], timeout=15)
    assert r.status_code == 200
    users = r.json()
    assert len(users) >= 5
    assert all(u["id"] != auth["user"]["id"] for u in users)
    assert any(u["verified"] for u in users)


def test_match_flow(s, auth, auth_sara):
    # Emma -> Sara request
    r = s.post(
        f"{API}/matches/request",
        headers=auth["headers"],
        json={"target_user_id": auth_sara["user"]["id"], "message": "TEST hi"},
        timeout=10,
    )
    assert r.status_code == 200
    # Sara sees incoming
    r = s.get(f"{API}/matches/incoming", headers=auth_sara["headers"], timeout=10)
    assert r.status_code == 200
    items = r.json()
    found = [m for m in items if m["from_user"] == auth["user"]["id"]]
    if not found:
        pytest.skip("No pending incoming match (may have been accepted previously)")
    match_id = found[0]["id"]
    # Sara accepts
    r = s.post(
        f"{API}/matches/{match_id}/respond?action=accept",
        headers=auth_sara["headers"],
        timeout=10,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "accepted"


# -------- Chat --------
def test_chat_send_and_list(s, auth, auth_sara):
    r = s.post(
        f"{API}/chats/start",
        headers=auth["headers"],
        json={"other_user_id": auth_sara["user"]["id"]},
        timeout=10,
    )
    assert r.status_code == 200
    chat_id = r.json()["id"]
    txt = f"TEST hello {uuid.uuid4().hex[:5]}"
    r = s.post(
        f"{API}/chats/messages",
        headers=auth["headers"],
        json={"chat_id": chat_id, "text": txt},
        timeout=10,
    )
    assert r.status_code == 200
    r = s.get(f"{API}/chats/{chat_id}/messages", headers=auth_sara["headers"], timeout=10)
    assert r.status_code == 200
    msgs = r.json()
    assert any(m["text"] == txt for m in msgs)


# -------- Guides + bookings --------
def test_guides_list_and_book(s, auth):
    r = s.get(f"{API}/guides", timeout=10)
    assert r.status_code == 200
    guides = r.json()
    assert len(guides) >= 8
    gid = guides[0]["id"]
    r = s.get(f"{API}/guides/{gid}", timeout=10)
    assert r.status_code == 200
    r = s.post(
        f"{API}/guides/{gid}/book",
        headers=auth["headers"],
        json={"guide_id": gid, "date": "2026-07-01", "notes": "TEST booking"},
        timeout=10,
    )
    assert r.status_code == 200
    r = s.get(f"{API}/bookings/mine", headers=auth["headers"], timeout=10)
    assert r.status_code == 200
    items = r.json()
    assert any(b["guide_id"] == gid for b in items)
    assert items[0].get("guide") is not None


# -------- Posts --------
def test_posts_flow(s, auth):
    r = s.get(f"{API}/posts", headers=auth["headers"], timeout=15)
    assert r.status_code == 200
    posts = r.json()
    assert len(posts) >= 4
    assert all("liked" in p and "likes_count" in p and p.get("user") for p in posts)
    # create
    cap = f"TEST post {uuid.uuid4().hex[:5]}"
    r = s.post(
        f"{API}/posts",
        headers=auth["headers"],
        json={
            "caption": cap,
            "image_url": "https://images.unsplash.com/photo-1476900543704-4312b78632f8",
            "location": "TEST loc",
        },
        timeout=10,
    )
    assert r.status_code == 200
    pid = r.json()["id"]
    # like toggle
    r = s.post(f"{API}/posts/{pid}/like", headers=auth["headers"], timeout=10)
    assert r.status_code == 200
    assert r.json()["liked"] is True
    # comment
    r = s.post(
        f"{API}/posts/{pid}/comments",
        headers=auth["headers"],
        json={"text": "TEST nice"},
        timeout=10,
    )
    assert r.status_code == 200


# -------- Emergency + SOS --------
def test_emergency_and_sos(s, auth):
    r = s.post(
        f"{API}/emergency/contacts",
        headers=auth["headers"],
        json={"name": "TEST Mom", "phone": "+1-555-1234", "relation": "Family"},
        timeout=10,
    )
    assert r.status_code == 200
    cid = r.json()["id"]
    r = s.get(f"{API}/emergency/contacts", headers=auth["headers"], timeout=10)
    assert r.status_code == 200
    assert any(c["id"] == cid for c in r.json())
    # SOS trigger
    r = s.post(
        f"{API}/sos/trigger",
        headers=auth["headers"],
        json={"latitude": 12.97, "longitude": 77.59, "message": "TEST help"},
        timeout=10,
    )
    assert r.status_code == 200
    j = r.json()
    assert "alert" in j and "notified_count" in j
    aid = j["alert"]["id"]
    # list alerts
    r = s.get(f"{API}/sos/alerts", headers=auth["headers"], timeout=10)
    assert r.status_code == 200
    assert any(a["id"] == aid for a in r.json())
    # resolve
    r = s.post(f"{API}/sos/alerts/{aid}/resolve", headers=auth["headers"], timeout=10)
    assert r.status_code == 200
    # delete contact
    r = s.delete(f"{API}/emergency/contacts/{cid}", headers=auth["headers"], timeout=10)
    assert r.status_code == 200


# -------- AI Assistant --------
def test_ai_chat_and_history(s, auth):
    session_id = f"test-{uuid.uuid4().hex[:8]}"
    r = s.post(
        f"{API}/ai/chat",
        headers=auth["headers"],
        json={"session_id": session_id, "message": "Give me one safety tip for solo women travel to Tokyo."},
        timeout=60,
    )
    assert r.status_code == 200, r.text
    reply = r.json().get("reply")
    assert reply and len(reply) > 5
    time.sleep(0.5)
    r = s.get(f"{API}/ai/history/{session_id}", headers=auth["headers"], timeout=10)
    assert r.status_code == 200
    msgs = r.json()
    assert len(msgs) >= 2
    assert any(m["role"] == "assistant" for m in msgs)
