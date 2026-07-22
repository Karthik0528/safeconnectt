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
            {"email": {"$in": ["google_traveller@gmail.com", "user_test_ind@safeconnect.in", "guide_test_ind@safeconnect.in"]}},
            {"username": "ananya_sharma"}
        ]
    })
    yield
    await server.db.users.delete_many({
        "$or": [
            {"email": {"$regex": "@example\\.com$", "$options": "i"}},
            {"email": {"$regex": "^test_", "$options": "i"}},
            {"email": {"$in": ["google_traveller@gmail.com", "user_test_ind@safeconnect.in", "guide_test_ind@safeconnect.in"]}},
            {"username": "ananya_sharma"}
        ]
    })

@pytest.mark.anyio
async def test_otp_flow():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=server.app), base_url="http://test") as ac:
        res = await ac.post("/api/auth/send-otp", json={"email": "testuser@safeconnect.in"})
        assert res.status_code == 200
        data = res.json()
        assert data["ok"] is True
        assert "otp" in data
        otp = data["otp"]

        res2 = await ac.post("/api/auth/verify-otp", json={"email": "testuser@safeconnect.in", "otp": otp})
        assert res2.status_code == 200
        assert res2.json()["ok"] is True

@pytest.mark.anyio
async def test_google_auth_and_onboarding():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=server.app), base_url="http://test") as ac:
        # Step 1: Initial Google Auth returns onboarding_required: True
        res = await ac.post("/api/auth/google", json={
            "email": "google_traveller@gmail.com",
            "name": "Ananya Sharma",
            "avatar_url": "https://example.com/avatar.jpg"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["onboarding_required"] is True

        # Step 2: Complete Google Onboarding
        onboard_res = await ac.post("/api/auth/complete-google-onboarding", json={
            "email": "google_traveller@gmail.com",
            "name": "Ananya Sharma",
            "username": "ananya_sharma",
            "password": "GooglePassword123!",
            "phone": "+91-9876543210",
            "country": "India",
            "state": "Maharashtra",
            "district": "Mumbai",
            "city": "Bandra West",
            "government_id": "AADHAAR-9988-7766",
            "terms_accepted": True,
            "safety_policy_accepted": True
        })
        assert onboard_res.status_code == 200
        onboard_data = onboard_res.json()
        assert "token" in onboard_data
        assert onboard_data["user"]["email"] == "google_traveller@gmail.com"

        # Test login via Username!
        login_by_username = await ac.post("/api/auth/login", json={
            "email": "ananya_sharma",
            "password": "GooglePassword123!"
        })
        assert login_by_username.status_code == 200
        assert login_by_username.json()["user"]["username"] == "ananya_sharma"

@pytest.mark.anyio
async def test_user_signup_and_admin_workflow():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=server.app), base_url="http://test") as ac:
        email = "user_test_ind@safeconnect.in"
        signup_res = await ac.post("/api/auth/signup", json={
            "name": "Kavitha Sundaram",
            "email": email,
            "password": "Password123!",
            "phone": "+91-9876543210",
            "gender": "Female",
            "dob": "1997-05-15",
            "state": "Tamil Nadu",
            "city": "Chennai",
            "emergency_contact": {"name": "Lakshmi", "phone": "+91-9876543211", "relation": "Mother"},
            "government_id": "AADHAAR-1234-5678",
            "selfie": "https://example.com/selfie.jpg"
        })
        assert signup_res.status_code == 200
        user_data = signup_res.json()["user"]
        user_id = user_data["id"]
        assert user_data["verified"] is False
        assert user_data["verification_status"] == "pending"

        # Admin Login using server.ADMIN_EMAIL and server.ADMIN_PASSWORD
        admin_login_res = await ac.post("/api/admin/login", json={
            "email": server.ADMIN_EMAIL,
            "password": server.ADMIN_PASSWORD
        })
        assert admin_login_res.status_code == 200
        admin_token = admin_login_res.json()["token"]
        headers = {"Authorization": f"Bearer {admin_token}"}

        # Fetch Admin Accounts
        accounts_res = await ac.get("/api/admin/accounts?tab=pending_users", headers=headers)
        assert accounts_res.status_code == 200
        pending_list = accounts_res.json()
        assert any(u["id"] == user_id for u in pending_list)

        # Approve Account
        approve_res = await ac.post(f"/api/admin/accounts/{user_id}/approve", headers=headers)
        assert approve_res.status_code == 200
        approved_user = approve_res.json()["user"]
        assert approved_user["verified"] is True
        assert approved_user["verification_status"] == "approved"

        # Toggle Badge
        toggle_res = await ac.post(f"/api/admin/accounts/{user_id}/toggle-badge", headers=headers)
        assert toggle_res.status_code == 200
        assert toggle_res.json()["user"]["verified"] is False

        # Delete Account
        delete_res = await ac.delete(f"/api/admin/accounts/{user_id}", headers=headers)
        assert delete_res.status_code == 200
        assert delete_res.json()["ok"] is True

@pytest.mark.anyio
async def test_guide_signup():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=server.app), base_url="http://test") as ac:
        email = "guide_test_ind@safeconnect.in"
        res = await ac.post("/api/auth/guide-signup", json={
            "name": "Meera Nair",
            "email": email,
            "password": "Password123!",
            "phone": "+91-9988776655",
            "state": "Kerala",
            "city": "Kochi",
            "guide_id_num": "KER-GUIDE-101",
            "tourism_id": "KER-TOURISM-88",
            "experience_years": 4,
            "price_per_day": 2000,
            "languages": ["English", "Malayalam", "Hindi"]
        })
        assert res.status_code == 200
        data = res.json()
        assert data["user"]["role"] == "guide"
        assert data["user"]["is_guide"] is True
        assert data["user"]["price_per_day"] == 2000

if __name__ == "__main__":
    pytest.main(["-v", __file__])
