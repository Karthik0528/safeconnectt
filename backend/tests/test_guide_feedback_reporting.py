import pytest
import httpx
import server

@pytest.fixture(autouse=True)
async def init_db():
    await server.on_startup()
    await server.db.users.delete_many({
        "$or": [
            {"email": {"$regex": "@example\\.com$", "$options": "i"}},
            {"email": {"$regex": "^test_", "$options": "i"}},
            {"email": {"$in": ["traveller_test@safeconnect.in", "guide_review_test@safeconnect.in"]}},
        ]
    })
    await server.db.guides.delete_many({"name": "Test Feedback Guide"})
    await server.db.guide_reviews.delete_many({})
    await server.db.guide_reports.delete_many({})
    yield
    await server.db.users.delete_many({
        "$or": [
            {"email": {"$regex": "@example\\.com$", "$options": "i"}},
            {"email": {"$regex": "^test_", "$options": "i"}},
            {"email": {"$in": ["traveller_test@safeconnect.in", "guide_review_test@safeconnect.in"]}},
        ]
    })
    await server.db.guides.delete_many({"name": "Test Feedback Guide"})

@pytest.mark.anyio
async def test_sentiment_analysis_and_guide_ranking():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=server.app), base_url="http://test") as ac:
        # Create user & guide
        signup_res = await ac.post("/api/auth/signup", json={
            "name": "Pooja Traveller",
            "email": "traveller_test@safeconnect.in",
            "password": "Password123!",
            "phone": "+91-9988112233",
            "gender": "Female",
            "dob": "1998-04-12",
            "state": "Delhi",
            "city": "New Delhi",
            "emergency_contact": {"name": "Mom", "phone": "+91-9988112234", "relation": "Mother"},
            "government_id": "AADHAAR-9900-1122",
            "selfie": "https://example.com/selfie.jpg"
        })
        assert signup_res.status_code == 200
        user_token = signup_res.json()["token"]

        guide_res = await ac.post("/api/auth/guide-signup", json={
            "name": "Test Feedback Guide",
            "email": "guide_review_test@safeconnect.in",
            "password": "Password123!",
            "phone": "+91-9988112255",
            "state": "Delhi",
            "city": "New Delhi",
            "guide_id_num": "DEL-GUIDE-88",
            "tourism_id": "DEL-TOURISM-99",
            "experience_years": 4,
            "price_per_day": 2000,
            "languages": ["English", "Hindi"]
        })
        assert guide_res.status_code == 200
        guide_data = guide_res.json()["user"]
        guide_id = guide_data["guide_id"]

        # Submit positive review with emoji
        headers = {"Authorization": f"Bearer {user_token}"}
        rev_res = await ac.post(f"/api/guides/{guide_id}/reviews", headers=headers, json={
            "rating": 5,
            "emoji": "😁 Very Good",
            "comment": "She was an amazing, safe, helpful, and friendly local guide!"
        })
        assert rev_res.status_code == 200
        rev_data = rev_res.json()
        assert rev_data["ok"] is True
        assert rev_data["review"]["sentiment_score"] > 2.0

        # Verify guide is returned at top in GET /api/guides
        guides_res = await ac.get("/api/guides")
        assert guides_res.status_code == 200
        guides_list = guides_res.json()
        guide_ids = [g["id"] for g in guides_list]
        assert guide_id in guide_ids

@pytest.mark.anyio
async def test_guide_in_trip_report_and_autoban():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=server.app), base_url="http://test") as ac:
        # Create user & guide
        user_res = await ac.post("/api/auth/signup", json={
            "name": "Deepa Traveller",
            "email": "traveller_test@safeconnect.in",
            "password": "Password123!",
            "phone": "+91-9988112233",
            "gender": "Female",
            "dob": "1998-04-12",
            "state": "Delhi",
            "city": "New Delhi",
            "emergency_contact": {"name": "Mom", "phone": "+91-9988112234", "relation": "Mother"},
            "government_id": "AADHAAR-9900-1122",
            "selfie": "https://example.com/selfie.jpg"
        })
        user_token = user_res.json()["token"]

        guide_res = await ac.post("/api/auth/guide-signup", json={
            "name": "Test Feedback Guide",
            "email": "guide_review_test@safeconnect.in",
            "password": "Password123!",
            "phone": "+91-9988112255",
            "state": "Delhi",
            "city": "New Delhi",
            "guide_id_num": "DEL-GUIDE-88",
            "tourism_id": "DEL-TOURISM-99",
            "experience_years": 4,
            "price_per_day": 2000,
            "languages": ["English", "Hindi"]
        })
        guide_id = guide_res.json()["user"]["guide_id"]

        headers = {"Authorization": f"Bearer {user_token}"}

        # Report 1
        rep1 = await ac.post(f"/api/guides/{guide_id}/report", headers=headers, json={
            "reason": "Harassment / Misbehavior",
            "details": "Guide demanded extra money unexpectedly during the trip."
        })
        assert rep1.status_code == 200
        assert rep1.json()["guide_safety_score"] == 75

        # Report 2 -> Triggers Auto-Ban (safety_score drops or reports >= 2)
        rep2 = await ac.post(f"/api/guides/{guide_id}/report", headers=headers, json={
            "reason": "Safety Threat / Unsafe Location",
            "details": "Guide took me to an unlit unsafe area."
        })
        assert rep2.status_code == 200
        assert rep2.json()["banned"] is True

        # Verify banned guide is excluded from GET /api/guides
        guides_res = await ac.get("/api/guides")
        active_ids = [g["id"] for g in guides_res.json()]
        assert guide_id not in active_ids
