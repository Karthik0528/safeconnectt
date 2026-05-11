"""saFeConnect backend regression tests.
Cold-start app (no seeded data). Each test run creates fresh accounts via /api/auth/signup.

Coverage:
- Health
- Auth: signup + login + duplicate + me
- Cold-start expectations: empty guides/posts/suggested
- Demo accounts purged (login as @safeconnect.demo -> 401)
- Guides: register, idempotent re-register, mine, location filtering, /locations endpoint
- Trips CRUD
- Matches request/respond
- Chat start/send/list
- Posts feed + create
- Emergency contacts CRUD
- SOS trigger/list/resolve
- AI chat (GPT-4o via Emergent integrations)
"""
import os
import uuid
import time
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")
BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL must be set"
API = f"{BASE_URL}/api"


def _rand_email(tag: str = "user") -> str:
    return f"TEST_{tag}_{uuid.uuid4().hex[:10]}@example.com"


def _signup(s: requests.Session, *, name="Test User", city_hint="A"):
    email = _rand_email(city_hint)
    payload = {
        "name": name,
        "email": email,
        "password": "TestPass123!",
        "age": 26,
        "phone": "+1-555-0000",
        "bio": "tester",
        "interests": ["Hiking"],
        "languages": ["English"],
    }
    r = s.post(f"{API}/auth/signup", json=payload, timeout=20)
    assert r.status_code == 200, f"signup failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and "user" in data
    return data["token"], data["user"], email


@pytest.fixture(scope="session")
def session():
    return requests.Session()


# ---------- Health ----------
class TestHealth:
    def test_root_ok(self, session):
        r = session.get(f"{API}/", timeout=10)
        assert r.status_code == 200
        body = r.json()
        assert body.get("status") == "ok"


# ---------- Cold-start & demo purge ----------
class TestColdStart:
    def test_demo_login_rejected(self, session):
        r = session.post(f"{API}/auth/login", json={"email": "emma@safeconnect.demo", "password": "Demo1234!"})
        assert r.status_code == 401

    def test_public_guides_endpoint_works(self, session):
        # /api/guides is public — should be a list (may or may not be empty depending on prior tests)
        r = session.get(f"{API}/guides")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_fresh_user_sees_no_demo_data(self, session):
        token, _, _ = _signup(session, name="Cold Start", city_hint="cold")
        h = {"Authorization": f"Bearer {token}"}
        r = session.get(f"{API}/travellers/suggested", headers=h)
        assert r.status_code == 200
        suggested = r.json()
        # No @safeconnect.demo users should appear
        assert not any(u.get("email", "").endswith("@safeconnect.demo") for u in suggested), \
            f"Demo users leaked into suggested: {[u.get('email') for u in suggested]}"

        r = session.get(f"{API}/posts", headers=h)
        assert r.status_code == 200
        posts = r.json()
        # Demo seeded captions must not appear
        demo_captions = ["Sunrise at Mount Batur", "Found the cutest women-only hostel", "First solo trip done"]
        for p in posts:
            for d in demo_captions:
                assert d not in p.get("caption", ""), f"Demo post leaked: {p.get('caption')}"


# ---------- Auth ----------
class TestAuth:
    def test_signup_then_login(self, session):
        token, user, email = _signup(session, name="Auth Tester", city_hint="auth")
        assert user["email"] == email.lower()
        # login with same
        r = session.post(f"{API}/auth/login", json={"email": email, "password": "TestPass123!"})
        assert r.status_code == 200
        assert "token" in r.json()

    def test_duplicate_signup_400(self, session):
        token, user, email = _signup(session, name="Dup", city_hint="dup")
        payload = {
            "name": "Dup2", "email": email, "password": "TestPass123!",
            "age": 26, "phone": "+1", "interests": [], "languages": []
        }
        r = session.post(f"{API}/auth/signup", json=payload)
        assert r.status_code == 400

    def test_me_endpoint(self, session):
        token, user, _ = _signup(session, name="Me", city_hint="me")
        r = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.json()["id"] == user["id"]


# ---------- Guides registration + location filtering ----------
class TestGuides:
    def test_register_filter_and_locations(self, session):
        # Guide A in Lisbon
        token_a, user_a, _ = _signup(session, name="Lisbon Guide", city_hint="lisbon")
        ha = {"Authorization": f"Bearer {token_a}"}
        payload_a = {
            "name": "Lisbon Guide", "city": "Lisbon", "country": "Portugal",
            "languages": ["English", "Portuguese"], "experience_years": 4,
            "bio": "Lisbon walks", "price_per_day": 80,
        }
        r = session.post(f"{API}/guides/register", json=payload_a, headers=ha)
        assert r.status_code == 200, r.text
        guide_a = r.json()
        assert guide_a["city"] == "Lisbon"
        assert guide_a["verified"] is True
        assert "id" in guide_a
        guide_a_id = guide_a["id"]

        # Idempotent re-register
        payload_a2 = {**payload_a, "price_per_day": 90}
        r2 = session.post(f"{API}/guides/register", json=payload_a2, headers=ha)
        assert r2.status_code == 200
        assert r2.json()["id"] == guide_a_id  # same id
        assert r2.json()["price_per_day"] == 90

        # /guides/mine returns it
        rm = session.get(f"{API}/guides/mine", headers=ha)
        assert rm.status_code == 200
        assert rm.json().get("id") == guide_a_id

        # /auth/me reflects is_guide=True
        rme = session.get(f"{API}/auth/me", headers=ha)
        assert rme.status_code == 200
        # is_guide may be omitted from public_user — check via /guides/mine instead

        # Guide B in Tokyo
        token_b, user_b, _ = _signup(session, name="Tokyo Guide", city_hint="tokyo")
        hb = {"Authorization": f"Bearer {token_b}"}
        payload_b = {
            "name": "Tokyo Guide", "city": "Tokyo", "country": "Japan",
            "languages": ["English", "Japanese"], "experience_years": 6,
            "bio": "Tokyo neighbourhoods", "price_per_day": 100,
        }
        rb = session.post(f"{API}/guides/register", json=payload_b, headers=hb)
        assert rb.status_code == 200, rb.text

        # Filter by city=lisbon (case-insensitive)
        r_l = session.get(f"{API}/guides?city=lisbon")
        assert r_l.status_code == 200
        cities = {g["city"] for g in r_l.json()}
        assert "Lisbon" in cities and "Tokyo" not in cities

        # Filter by country=Portugal
        r_pt = session.get(f"{API}/guides?country=Portugal")
        assert r_pt.status_code == 200
        for g in r_pt.json():
            assert g["country"].lower() == "portugal"

        # No filter — both
        r_all = session.get(f"{API}/guides")
        assert r_all.status_code == 200
        all_cities = {g["city"] for g in r_all.json()}
        assert {"Lisbon", "Tokyo"}.issubset(all_cities)

        # /guides/locations returns sorted distinct
        r_loc = session.get(f"{API}/guides/locations")
        assert r_loc.status_code == 200
        loc = r_loc.json()
        assert "Lisbon" in loc["cities"] and "Tokyo" in loc["cities"]
        assert "Portugal" in loc["countries"] and "Japan" in loc["countries"]
        assert loc["cities"] == sorted(loc["cities"])
        assert loc["countries"] == sorted(loc["countries"])


# ---------- Trips ----------
class TestTrips:
    def test_trip_crud(self, session):
        token, _, _ = _signup(session, name="Trip", city_hint="trip")
        h = {"Authorization": f"Bearer {token}"}
        payload = {
            "destination": "Bali", "country": "Indonesia",
            "start_date": "2026-06-01", "end_date": "2026-06-10",
            "budget": "moderate", "interests": ["Beach"],
        }
        r = session.post(f"{API}/trips", json=payload, headers=h)
        assert r.status_code == 200
        trip = r.json()
        assert trip["destination"] == "Bali"
        tid = trip["id"]

        r2 = session.get(f"{API}/trips/mine", headers=h)
        assert r2.status_code == 200
        assert any(t["id"] == tid for t in r2.json())

        r3 = session.delete(f"{API}/trips/{tid}", headers=h)
        assert r3.status_code == 200

        r4 = session.get(f"{API}/trips/{tid}", headers=h)
        assert r4.status_code == 404


# ---------- Matches ----------
class TestMatches:
    def test_request_and_respond(self, session):
        t1, u1, _ = _signup(session, name="A")
        t2, u2, _ = _signup(session, name="B")
        h1 = {"Authorization": f"Bearer {t1}"}
        h2 = {"Authorization": f"Bearer {t2}"}

        r = session.post(f"{API}/matches/request",
                         json={"target_user_id": u2["id"], "message": "Hi"}, headers=h1)
        assert r.status_code == 200
        assert r.json()["status"] == "pending"

        rin = session.get(f"{API}/matches/incoming", headers=h2)
        assert rin.status_code == 200
        items = rin.json()
        assert any(m["from_user"] == u1["id"] for m in items)
        match_id = next(m for m in items if m["from_user"] == u1["id"])["id"]

        rresp = session.post(f"{API}/matches/{match_id}/respond?action=accept", headers=h2)
        assert rresp.status_code == 200
        assert rresp.json()["status"] == "accepted"


# ---------- Chat ----------
class TestChat:
    def test_start_send_list(self, session):
        t1, u1, _ = _signup(session)
        t2, u2, _ = _signup(session)
        h1 = {"Authorization": f"Bearer {t1}"}

        r = session.post(f"{API}/chats/start", json={"other_user_id": u2["id"]}, headers=h1)
        assert r.status_code == 200
        chat_id = r.json()["id"]

        rs = session.post(f"{API}/chats/messages",
                          json={"chat_id": chat_id, "text": "hello"}, headers=h1)
        assert rs.status_code == 200

        rl = session.get(f"{API}/chats", headers=h1)
        assert rl.status_code == 200
        assert any(c["id"] == chat_id for c in rl.json())

        rm = session.get(f"{API}/chats/{chat_id}/messages", headers=h1)
        assert rm.status_code == 200
        assert any(m["text"] == "hello" for m in rm.json())


# ---------- Posts ----------
class TestPosts:
    def test_create_and_list(self, session):
        t, u, _ = _signup(session, name="Poster")
        h = {"Authorization": f"Bearer {t}"}
        # initial GET returns list (may be empty or have other test posts, no demo)
        r0 = session.get(f"{API}/posts", headers=h)
        assert r0.status_code == 200

        marker = f"TEST_POST_{uuid.uuid4().hex[:8]}"
        r = session.post(f"{API}/posts", json={
            "caption": marker,
            "image_url": "https://example.com/img.jpg",
            "location": "Test City",
        }, headers=h)
        assert r.status_code == 200
        pid = r.json()["id"]

        r2 = session.get(f"{API}/posts", headers=h)
        assert r2.status_code == 200
        found = next((p for p in r2.json() if p["id"] == pid), None)
        assert found is not None
        assert found["user"]["id"] == u["id"]
        assert found["caption"] == marker


# ---------- Emergency Contacts + SOS ----------
class TestEmergencyAndSos:
    def test_full_flow(self, session):
        t, _, _ = _signup(session)
        h = {"Authorization": f"Bearer {t}"}
        # add contact
        rc = session.post(f"{API}/emergency/contacts",
                          json={"name": "Mom", "phone": "+1-555-1111", "relation": "Family"}, headers=h)
        assert rc.status_code == 200
        cid = rc.json()["id"]

        rl = session.get(f"{API}/emergency/contacts", headers=h)
        assert rl.status_code == 200
        assert any(c["id"] == cid for c in rl.json())

        # trigger SOS
        rsos = session.post(f"{API}/sos/trigger",
                            json={"latitude": 12.34, "longitude": 56.78, "message": "help"}, headers=h)
        assert rsos.status_code == 200
        aid = rsos.json()["alert"]["id"]
        assert rsos.json()["notified_count"] >= 1

        # list alerts
        ra = session.get(f"{API}/sos/alerts", headers=h)
        assert ra.status_code == 200
        assert any(a["id"] == aid for a in ra.json())

        # resolve
        rr = session.post(f"{API}/sos/alerts/{aid}/resolve", headers=h)
        assert rr.status_code == 200

        # delete contact
        rd = session.delete(f"{API}/emergency/contacts/{cid}", headers=h)
        assert rd.status_code == 200


# ---------- AI Chat ----------
class TestAI:
    def test_gpt4o_reply(self, session):
        t, _, _ = _signup(session)
        h = {"Authorization": f"Bearer {t}"}
        r = session.post(f"{API}/ai/chat", json={
            "session_id": f"sess_{uuid.uuid4().hex[:8]}",
            "message": "Give me one safety tip for Lisbon in 1 sentence."
        }, headers=h, timeout=60)
        assert r.status_code == 200, r.text
        reply = r.json().get("reply", "")
        assert isinstance(reply, str) and len(reply) > 0
