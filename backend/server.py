"""SafeConnect Backend - FastAPI + MongoDB
Women-only solo travel safety & networking platform.
"""
import os
import uuid
import logging
import asyncio
import random
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, status, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
EMERGENT_LLM_KEY = "demo_key"
JWT_ALG = "HS256"
JWT_EXP_DAYS = 30

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="SafeConnect API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("safeconnect")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


# ------------------------- Realtime WebSockets Manager -------------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, event_type: str, payload: dict):
        message = {"event": event_type, "data": payload, "time": now_iso()}
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

ws_manager = ConnectionManager()


@app.websocket("/api/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({"event": "pong", "client_id": client_id})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


# ------------------------- Models -------------------------
class SendOtpReq(BaseModel):
    email: EmailStr


class VerifyOtpReq(BaseModel):
    email: EmailStr
    otp: str


class GoogleAuthReq(BaseModel):
    email: EmailStr
    name: str
    avatar_url: Optional[str] = None
    google_id: Optional[str] = None
    role: Optional[str] = "user"


class UserSignupReq(BaseModel):
    name: str
    username: Optional[str] = None
    email: EmailStr
    password: str
    phone: str
    gender: Optional[str] = "Female"
    dob: Optional[str] = ""
    age: Optional[int] = 25
    state: Optional[str] = ""
    district: Optional[str] = ""
    city: Optional[str] = ""
    emergency_contact: Optional[dict] = None
    avatar_url: Optional[str] = None
    government_id: Optional[str] = None
    selfie: Optional[str] = None
    bio: Optional[str] = ""
    interests: List[str] = []
    languages: List[str] = []


class GuideSignupReq(UserSignupReq):
    guide_id_num: Optional[str] = ""
    tourism_id: Optional[str] = ""
    guide_govt_id: Optional[str] = None
    address_proof: Optional[str] = None
    experience_years: Optional[int] = 1
    certifications: List[str] = []
    bio: Optional[str] = ""
    services: List[str] = []
    availability: Optional[str] = "Available"
    price_per_day: Optional[int] = 1500


class SignupReq(BaseModel):
    name: str
    email: EmailStr
    password: str
    age: int = Field(ge=18, le=99)
    phone: str
    bio: Optional[str] = ""
    interests: List[str] = []
    languages: List[str] = []
    id_image_b64: Optional[str] = None
    selfie_b64: Optional[str] = None
    avatar_url: Optional[str] = None


class LoginReq(BaseModel):
    email: str
    password: str


class AdminLoginReq(BaseModel):
    email: str
    password: str


class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    age: int
    phone: str
    bio: str = ""
    interests: List[str] = []
    languages: List[str] = []
    avatar_url: Optional[str] = None
    verified: bool = False
    safety_score: int = 85
    countries_visited: int = 0
    trips_count: int = 0
    rating: float = 5.0
    created_at: str


class TripCreate(BaseModel):
    destination: str
    country: str
    start_date: str
    end_date: str
    budget: str = "moderate"
    interests: List[str] = []
    accommodation: str = "hotel"
    notes: str = ""
    cover_image: Optional[str] = None


class Trip(TripCreate):
    id: str
    user_id: str


class MatchRequest(BaseModel):
    target_user_id: str
    trip_id: Optional[str] = None
    message: str = ""


class MessageCreate(BaseModel):
    chat_id: str
    text: str


class ChatStart(BaseModel):
    other_user_id: str


class GuideCreate(BaseModel):
    name: str
    city: str
    country: str
    languages: List[str]
    experience_years: int
    bio: str
    price_per_day: int
    avatar_url: Optional[str] = None
    certifications: List[str] = []


class BookingCreate(BaseModel):
    guide_id: str
    date: str
    notes: str = ""


class GuideReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    emoji: Optional[str] = "🙂 Good"
    comment: str = ""
    booking_id: Optional[str] = None


class GuideReportCreate(BaseModel):
    reason: str
    details: Optional[str] = ""


class PostCreate(BaseModel):
    caption: str
    image_url: str
    location: str = ""


class CommentCreate(BaseModel):
    text: str


class EmergencyContactCreate(BaseModel):
    name: str
    phone: str
    relation: str = "Family"


class SosTrigger(BaseModel):
    latitude: float
    longitude: float
    message: str = "I need help! This is an emergency."


class AiChatReq(BaseModel):
    session_id: str
    message: str


# ------------------------- Auth helpers -------------------------
def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def make_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXP_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    token = authorization.replace("Bearer ", "").strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(401, "User not found")
    if user.get("status") == "suspended":
        raise HTTPException(403, "Account suspended. Please contact admin support.")
    return user


async def get_admin_user(current=Depends(get_current_user)) -> dict:
    if current.get("role") != "admin":
        raise HTTPException(403, "Admin privileges required")
    return current


def public_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "name": u.get("name", ""),
        "username": u.get("username", ""),
        "email": u.get("email", ""),
        "role": u.get("role", "user"),
        "gender": u.get("gender", "Female"),
        "dob": u.get("dob", ""),
        "age": u.get("age", 25),
        "phone": u.get("phone", ""),
        "state": u.get("state", ""),
        "district": u.get("district", ""),
        "city": u.get("city", ""),
        "emergency_contact": u.get("emergency_contact") or {},
        "avatar_url": u.get("avatar_url") or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        "government_id": u.get("government_id") or u.get("id_image_b64"),
        "selfie": u.get("selfie") or u.get("selfie_b64"),
        "verified": bool(u.get("verified", False)),
        "verification_status": u.get("verification_status", "approved" if u.get("verified") else "pending"),
        "status": u.get("status", "active"),
        "bio": u.get("bio", ""),
        "interests": u.get("interests", []),
        "languages": u.get("languages", ["English", "Hindi"]),
        "safety_score": u.get("safety_score", 100),
        "countries_visited": u.get("countries_visited", 0),
        "trips_count": u.get("trips_count", 0),
        "rating": u.get("rating", 5.0),
        "is_guide": bool(u.get("is_guide") or u.get("role") == "guide"),
        "guide_id": u.get("guide_id"),
        "guide_id_num": u.get("guide_id_num", ""),
        "tourism_id": u.get("tourism_id", ""),
        "guide_govt_id": u.get("guide_govt_id"),
        "address_proof": u.get("address_proof"),
        "experience_years": u.get("experience_years", 0),
        "certifications": u.get("certifications", []),
        "services": u.get("services", []),
        "availability": u.get("availability", "Available"),
        "price_per_day": u.get("price_per_day", 1500),
        "created_at": u.get("created_at", now_iso()),
    }


# ------------------------- Routes: Health -------------------------
@api.get("/")
async def root():
    return {"app": "SafeConnect", "status": "ok", "time": now_iso()}


# ------------------------- Routes: Auth & OTP -------------------------
@api.post("/auth/send-otp")
async def send_otp(req: SendOtpReq):
    otp = str(random.randint(100000, 999999))
    expires = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    await db.otps.update_one(
        {"email": req.email.lower()},
        {"$set": {"otp": otp, "expires_at": expires, "verified": False}},
        upsert=True,
    )
    logger.info("Generated OTP %s for email %s", otp, req.email)
    return {"ok": True, "message": f"Verification OTP sent to {req.email}", "otp": otp}


@api.post("/auth/verify-otp")
async def verify_otp(req: VerifyOtpReq):
    rec = await db.otps.find_one({"email": req.email.lower()})
    if not rec or rec.get("otp") != req.otp.strip():
        raise HTTPException(400, "Invalid verification OTP code")
    await db.otps.update_one({"email": req.email.lower()}, {"$set": {"verified": True}})
    return {"ok": True, "message": "Email verified successfully!"}


class GoogleOnboardingReq(BaseModel):
    email: str
    name: Optional[str] = "Google User"
    username: str
    password: str
    phone: str
    age: Optional[int] = 25
    gender: Optional[str] = "Female"
    dob: Optional[str] = ""
    country: Optional[str] = "India"
    state: str
    district: str
    city: str
    government_id: str
    selfie: Optional[str] = None
    role: Optional[str] = "user"
    terms_accepted: bool
    safety_policy_accepted: bool


@api.get("/auth/check-username")
async def check_username_available(username: str):
    if not username or not username.strip():
        return {"available": False, "message": "Username is required."}
    clean_uname = username.strip().lower()
    existing = await db.users.find_one({"username": clean_uname})
    if existing:
        return {"available": False, "message": f"Username '{username}' already exists. Please choose a different username."}
    return {"available": True, "message": "Username is available!"}


@api.post("/auth/google")
async def google_auth(req: GoogleAuthReq):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing and existing.get("onboarding_completed"):
        token = make_token(existing["id"])
        return {"token": token, "user": public_user(existing), "onboarding_required": False}
    
    # Needs onboarding details (username, password, location, ID proof, checkboxes)
    return {
        "onboarding_required": True,
        "email": req.email.lower(),
        "name": req.name,
        "avatar_url": req.avatar_url,
        "role": req.role or "user",
    }


@api.post("/auth/complete-google-onboarding")
async def complete_google_onboarding(req: GoogleOnboardingReq):
    if not req.terms_accepted or not req.safety_policy_accepted:
        raise HTTPException(400, "You must accept the Women's Safety Policies and Terms of Service to register.")
    
    if not req.username or not req.username.strip() or not req.password or not req.phone or not req.state or not req.district or not req.city or not req.government_id:
        raise HTTPException(400, "Please fill in all required fields including Government ID proof.")
    
    # Check username availability
    clean_uname = req.username.strip().lower()
    username_taken = await db.users.find_one({"username": clean_uname, "email": {"$ne": req.email.lower()}})
    if username_taken:
        raise HTTPException(400, f"Username '{req.username}' already exists. Please choose a different username.")
        
    # Check age restriction (< 18 rejection)
    req_age = req.age or 25
    if req_age < 18:
        raise HTTPException(400, "Registration rejected: You must be at least 18 years old to join saFeConnect.")
    
    email = req.email.lower()
    existing = await db.users.find_one({"email": email})
    
    user_id = existing["id"] if existing else new_id()
    user_data = {
        "id": user_id,
        "role": req.role or "user",
        "name": req.name or req.username,
        "username": clean_uname,
        "email": email,
        "password": hash_pw(req.password),
        "phone": req.phone,
        "gender": req.gender or "Female",
        "age": req_age,
        "dob": req.dob or "",
        "country": req.country or "India",
        "state": req.state,
        "district": req.district,
        "city": req.city,
        "area": req.city,
        "government_id": req.government_id,
        "selfie": req.selfie or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        "verified": False,
        "verification_status": "pending",
        "onboarding_completed": True,
        "terms_accepted": True,
        "safety_policy_accepted": True,
        "status": "active",
        "bio": "Verified Solo Female Traveller",
        "interests": ["Solo Travel", "Culture"],
        "languages": ["English", "Hindi"],
        "safety_score": 100,
        "created_at": now_iso(),
    }
    
    if existing:
        await db.users.update_one({"id": user_id}, {"$set": user_data})
    else:
        await db.users.insert_one(user_data)
        
    await ws_manager.broadcast("user_registered", {"user_id": user_id, "name": req.name, "email": email})
    token = make_token(user_id)
    return {"token": token, "user": public_user(user_data)}


@api.post("/auth/signup")
async def signup(req: UserSignupReq):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered.")
        
    if req.username:
        clean_uname = req.username.strip().lower()
        uname_taken = await db.users.find_one({"username": clean_uname})
        if uname_taken:
            raise HTTPException(400, f"Username '{req.username}' already exists. Please choose a different username.")
    
    user_age = req.age or 25
    if user_age < 18:
        raise HTTPException(400, "Registration rejected: You must be at least 18 years old to join saFeConnect.")
    
    user_id = new_id()
    user = {
        "id": user_id,
        "role": "user",
        "name": req.name,
        "username": req.username.strip().lower() if req.username else req.name.lower().replace(" ", "_"),
        "email": req.email.lower(),
        "password": hash_pw(req.password),
        "phone": req.phone,
        "gender": req.gender or "Female",
        "dob": req.dob or "",
        "age": user_age,
        "state": req.state or "",
        "district": req.district or "",
        "city": req.city or "",
        "emergency_contact": req.emergency_contact or {},
        "avatar_url": req.avatar_url or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        "government_id": req.government_id,
        "selfie": req.selfie,
        "verified": False,
        "verification_status": "pending",
        "status": "active",
        "bio": req.bio or "",
        "interests": req.interests or ["Travel", "Culture"],
        "languages": req.languages or ["English", "Hindi"],
        "safety_score": 100,
        "countries_visited": 0,
        "trips_count": 0,
        "rating": 5.0,
        "is_guide": False,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    await ws_manager.broadcast("user_registered", {"user_id": user_id, "name": req.name, "role": "user"})
    token = make_token(user_id)
    return {"token": token, "user": public_user(user)}




@api.post("/auth/guide-signup")
async def guide_signup(req: GuideSignupReq):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered.")
        
    guide_age = req.age or 25
    if guide_age < 18:
        raise HTTPException(400, "Guide registration rejected: Guides must be at least 18 years old.")
        
    if req.username:
        clean_uname = req.username.strip().lower()
        uname_taken = await db.users.find_one({"username": clean_uname})
        if uname_taken:
            raise HTTPException(400, f"Username '{req.username}' already exists. Please choose a different username.")
    
    user_id = new_id()
    guide_id = new_id()
    user = {
        "id": user_id,
        "role": "guide",
        "is_guide": True,
        "guide_id": guide_id,
        "name": req.name,
        "username": req.username.strip().lower() if req.username else req.name.lower().replace(" ", "_"),
        "email": req.email.lower(),
        "password": hash_pw(req.password),
        "phone": req.phone,
        "gender": req.gender or "Female",
        "dob": req.dob or "",
        "age": guide_age,
        "state": req.state or "",
        "district": req.district or "",
        "city": req.city or "",
        "emergency_contact": req.emergency_contact or {},
        "avatar_url": req.avatar_url or "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
        "government_id": req.government_id,
        "selfie": req.selfie,
        "guide_id_num": req.guide_id_num or "",
        "tourism_id": req.tourism_id or "",
        "guide_govt_id": req.guide_govt_id or req.government_id,
        "address_proof": req.address_proof or req.government_id,
        "experience_years": req.experience_years if req.experience_years is not None else 1,
        "certifications": req.certifications or ["Certified Tour Guide"],
        "services": req.services or ["Heritage Walks", "City Orientation"],
        "availability": req.availability or "Available",
        "price_per_day": req.price_per_day if req.price_per_day is not None else 1500,
        "verified": False,
        "verification_status": "pending",
        "status": "active",
        "bio": req.bio or "",
        "interests": req.interests or ["Guiding", "Local Heritage"],
        "languages": req.languages or ["English", "Hindi"],
        "safety_score": 100,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)

    guide_doc = {
        "id": guide_id,
        "user_id": user_id,
        "name": req.name,
        "email": req.email.lower(),
        "phone": req.phone,
        "city": req.city or "Jaipur",
        "country": "India",
        "languages": req.languages or ["English", "Hindi"],
        "experience_years": req.experience_years or 1,
        "bio": req.bio or "",
        "price_per_day": req.price_per_day or 1500,
        "avatar_url": user["avatar_url"],
        "certifications": req.certifications or ["Certified Tour Guide"],
        "services": req.services or ["Heritage Walks"],
        "availability": req.availability or "Available",
        "verified": False,
        "verification_status": "pending",
        "rating": 5.0,
        "reviews_count": 0,
        "created_at": now_iso(),
    }
    await db.guides.insert_one(guide_doc)
    await ws_manager.broadcast("guide_registered", {"user_id": user_id, "guide_id": guide_id, "name": req.name})

    token = make_token(user_id)
    if "_id" in guide_doc:
        del guide_doc["_id"]
    return {"token": token, "user": public_user(user), "guide": guide_doc}


class GuideProfileReq(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    experience_years: Optional[int] = None
    languages: Optional[List[str]] = None
    price_per_hour: Optional[int] = None
    price_per_day: Optional[int] = None
    bio: Optional[str] = None
    services: Optional[List[str]] = None
    cities_covered: Optional[List[str]] = None


@api.post("/guide/profile")
async def create_or_update_guide_profile(req: GuideProfileReq, current=Depends(get_current_user)):
    user_id = current["id"]
    
    req_age = req.age or current.get("age", 25)
    if req_age < 18:
        raise HTTPException(400, "Guide profile update rejected: Guides must be at least 18 years old.")
        
    guide_id = current.get("guide_id") or new_id()
    
    user_patch = {
        "is_guide": True,
        "role": "guide",
        "guide_id": guide_id,
        "age": req_age,
    }
    if req.name: user_patch["name"] = req.name
    if req.gender: user_patch["gender"] = req.gender
    if req.bio: user_patch["bio"] = req.bio
    if req.languages: user_patch["languages"] = req.languages
    if req.price_per_day: user_patch["price_per_day"] = req.price_per_day
    if req.price_per_hour: user_patch["price_per_hour"] = req.price_per_hour
    if req.experience_years: user_patch["experience_years"] = req.experience_years
    
    await db.users.update_one({"id": user_id}, {"$set": user_patch})
    
    guide_doc = {
        "id": guide_id,
        "user_id": user_id,
        "name": req.name or current.get("name"),
        "email": current.get("email"),
        "phone": current.get("phone"),
        "age": req_age,
        "gender": req.gender or current.get("gender", "Female"),
        "experience_years": req.experience_years or current.get("experience_years", 1),
        "languages": req.languages or current.get("languages", ["English", "Hindi"]),
        "price_per_hour": req.price_per_hour or 250,
        "price_per_day": req.price_per_day or current.get("price_per_day", 1500),
        "services": req.services or current.get("services", ["Heritage Walks", "City Orientation"]),
        "bio": req.bio or current.get("bio", ""),
        "cities_covered": req.cities_covered or [current.get("city", "Local City")],
        "avatar_url": current.get("avatar_url"),
        "verified": current.get("verified", False),
        "verification_status": current.get("verification_status", "pending"),
        "created_at": now_iso(),
    }
    
    existing_g = await db.guides.find_one({"user_id": user_id})
    if existing_g:
        await db.guides.update_one({"user_id": user_id}, {"$set": guide_doc})
    else:
        await db.guides.insert_one(guide_doc)
        
    await ws_manager.broadcast("profile_updated", {"user_id": user_id})
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if "_id" in guide_doc:
        del guide_doc["_id"]
    return {"ok": True, "message": "Guide details updated successfully!", "user": public_user(updated_user), "guide": guide_doc}


@api.post("/auth/login")
async def login(req: LoginReq):
    identifier = req.email.strip().lower()
    user = await db.users.find_one({
        "$or": [
            {"email": identifier},
            {"username": identifier}
        ]
    })
    if not user or not verify_pw(req.password, user["password"]):
        raise HTTPException(401, "Invalid email/username or password")
    if user.get("status") == "suspended":
        raise HTTPException(403, "Your account has been suspended by the Admin.")
    token = make_token(user["id"])
    return {"token": token, "user": public_user(user)}


@api.get("/auth/me")
async def me(current=Depends(get_current_user)):
    return public_user(current)


@api.patch("/auth/me")
async def update_me(updates: dict, current=Depends(get_current_user)):
    allowed = {
        "name", "bio", "interests", "languages", "avatar_url", "phone",
        "state", "district", "city", "emergency_contact", "availability", "price_per_day", "services"
    }
    upd = {k: v for k, v in updates.items() if k in allowed}
    if upd:
        await db.users.update_one({"id": current["id"]}, {"$set": upd})
        if current.get("is_guide") and current.get("guide_id"):
            guide_upd = {k: v for k, v in upd.items() if k in {"name", "bio", "languages", "avatar_url", "city", "availability", "price_per_day", "services"}}
            if guide_upd:
                await db.guides.update_one({"id": current["guide_id"]}, {"$set": guide_upd})
        await ws_manager.broadcast("profile_updated", {"user_id": current["id"]})
    user = await db.users.find_one({"id": current["id"]}, {"_id": 0, "password": 0})
    return public_user(user)


# ------------------------- Routes: Admin Portal & Dashboard -------------------------
@api.post("/admin/login")
async def admin_login(req: AdminLoginReq):
    identifier = req.email.strip().lower()
    user = await db.users.find_one({
        "$or": [
            {"email": identifier},
            {"username": identifier}
        ]
    })
    if not user or not verify_pw(req.password, user["password"]):
        raise HTTPException(401, "Invalid admin email/username or password")
    if user.get("role") != "admin":
        raise HTTPException(403, "Access denied. User does not have Admin privileges.")
    token = make_token(user["id"])
    return {"token": token, "user": public_user(user)}


@api.get("/admin/accounts")
async def list_admin_accounts(
    tab: Optional[str] = "pending_users",
    q: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    admin=Depends(get_admin_user),
):
    all_docs = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    non_admins = [u for u in all_docs if u.get("role") != "admin"]

    filtered = []
    for u in non_admins:
        is_g = bool(u.get("role") == "guide" or u.get("is_guide"))
        v_status = u.get("verification_status", "pending")
        is_verified = bool(u.get("verified", False))

        if tab == "pending_users":
            if not is_g and (v_status == "pending" or not is_verified) and v_status != "rejected":
                filtered.append(u)
        elif tab == "pending_guides":
            if is_g and (v_status == "pending" or not is_verified) and v_status != "rejected":
                filtered.append(u)
        elif tab == "approved_users":
            if not is_g and (is_verified or v_status == "approved"):
                filtered.append(u)
        elif tab == "approved_guides":
            if is_g and (is_verified or v_status == "approved"):
                filtered.append(u)
        elif tab == "rejected":
            if v_status == "rejected":
                filtered.append(u)
        elif tab in ("all_users", "all", "all_accounts"):
            filtered.append(u)
        else:
            filtered.append(u)

    if state:
        st_low = state.lower()
        filtered = [u for u in filtered if st_low in u.get("state", "").lower()]
    if city:
        ct_low = city.lower()
        filtered = [u for u in filtered if ct_low in u.get("city", "").lower()]
    if q:
        q_low = q.lower()
        filtered = [
            u for u in filtered
            if q_low in u.get("name", "").lower()
            or q_low in u.get("email", "").lower()
            or q_low in u.get("username", "").lower()
            or q_low in u.get("phone", "").lower()
            or q_low in u.get("city", "").lower()
            or q_low in u.get("state", "").lower()
        ]

    # Sort newest first
    filtered.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    out = []
    for u in filtered:
        pub = public_user(u)
        if u.get("is_guide") or u.get("role") == "guide":
            g = await db.guides.find_one({"user_id": u["id"]}, {"_id": 0})
            if g:
                pub["guide_details"] = g
        out.append(pub)

    return out


@api.post("/admin/accounts/{user_id}/approve")
async def approve_account(user_id: str, admin=Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(404, "User account not found")
    
    upd = {"verified": True, "verification_status": "approved"}
    await db.users.update_one({"id": user_id}, {"$set": upd})
    if user.get("guide_id"):
        await db.guides.update_one({"id": user["guide_id"]}, {"$set": upd})
    elif user.get("is_guide") or user.get("role") == "guide":
        await db.guides.update_one({"user_id": user_id}, {"$set": upd})

    await ws_manager.broadcast("account_verified", {"user_id": user_id, "verified": True, "status": "approved"})
    updated = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return {"ok": True, "message": "Account approved and Verified Badge granted!", "user": public_user(updated)}


@api.post("/admin/accounts/{user_id}/reject")
async def reject_account(user_id: str, admin=Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(404, "User account not found")
    
    upd = {"verified": False, "verification_status": "rejected"}
    await db.users.update_one({"id": user_id}, {"$set": upd})
    if user.get("guide_id"):
        await db.guides.update_one({"id": user["guide_id"]}, {"$set": upd})
    elif user.get("is_guide") or user.get("role") == "guide":
        await db.guides.update_one({"user_id": user_id}, {"$set": upd})

    await ws_manager.broadcast("account_rejected", {"user_id": user_id, "verified": False, "status": "rejected"})
    updated = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return {"ok": True, "message": "Account registration rejected.", "user": public_user(updated)}


@api.post("/admin/accounts/{user_id}/suspend")
async def suspend_account(user_id: str, admin=Depends(get_admin_user)):
    await db.users.update_one({"id": user_id}, {"$set": {"status": "suspended"}})
    await ws_manager.broadcast("account_suspended", {"user_id": user_id})
    return {"ok": True, "message": "Account suspended successfully."}


@api.post("/admin/accounts/{user_id}/restore")
async def restore_account(user_id: str, admin=Depends(get_admin_user)):
    await db.users.update_one({"id": user_id}, {"$set": {"status": "active"}})
    await ws_manager.broadcast("account_restored", {"user_id": user_id})
    return {"ok": True, "message": "Account restored successfully."}


@api.post("/admin/accounts/{user_id}/toggle-badge")
async def toggle_verification_badge(user_id: str, admin=Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(404, "Account not found")
    
    new_verified = not user.get("verified", False)
    new_status = "approved" if new_verified else "pending"
    upd = {"verified": new_verified, "verification_status": new_status}
    
    await db.users.update_one({"id": user_id}, {"$set": upd})
    if user.get("guide_id"):
        await db.guides.update_one({"id": user["guide_id"]}, {"$set": upd})
    elif user.get("is_guide") or user.get("role") == "guide":
        await db.guides.update_one({"user_id": user_id}, {"$set": upd})

    await ws_manager.broadcast("badge_toggled", {"user_id": user_id, "verified": new_verified, "status": new_status})
    updated = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return {"ok": True, "user": public_user(updated)}


@api.delete("/admin/accounts/{user_id}")
async def delete_account(user_id: str, admin=Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(404, "Account not found")

    await db.users.delete_one({"id": user_id})
    await db.guides.delete_many({"user_id": user_id})
    await db.trips.delete_many({"user_id": user_id})
    await db.posts.delete_many({"user_id": user_id})
    await db.comments.delete_many({"user_id": user_id})
    await db.bookings.delete_many({"$or": [{"user_id": user_id}, {"guide_id": user.get("guide_id")}]})
    await db.chats.delete_many({"members": user_id})
    await db.messages.delete_many({"sender_id": user_id})
    await db.emergency_contacts.delete_many({"user_id": user_id})
    await db.sos_alerts.delete_many({"user_id": user_id})

    await ws_manager.broadcast("account_deleted", {"user_id": user_id})
    return {"ok": True, "message": "Account and all associated records permanently removed."}


@api.get("/admin/export")
async def export_admin_data(admin=Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    guides = await db.guides.find({}, {"_id": 0}).to_list(1000)
    return {
        "export_date": now_iso(),
        "total_users": len(users),
        "total_guides": len(guides),
        "users": users,
        "guides": guides,
    }



# ------------------------- Routes: Trips -------------------------
@api.post("/trips")
async def create_trip(req: TripCreate, current=Depends(get_current_user)):
    trip = {**req.dict(), "id": new_id(), "user_id": current["id"], "created_at": now_iso()}
    if not trip.get("cover_image"):
        trip["cover_image"] = "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80"
    await db.trips.insert_one(trip)
    await db.users.update_one({"id": current["id"]}, {"$inc": {"trips_count": 1}})
    trip.pop("_id", None)
    return trip


@api.get("/trips/mine")
async def my_trips(current=Depends(get_current_user)):
    trips = await db.trips.find({"user_id": current["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return trips


@api.get("/trips/{trip_id}")
async def get_trip(trip_id: str, current=Depends(get_current_user)):
    trip = await db.trips.find_one({"id": trip_id}, {"_id": 0})
    if not trip:
        raise HTTPException(404, "Trip not found")
    return trip


@api.delete("/trips/{trip_id}")
async def delete_trip(trip_id: str, current=Depends(get_current_user)):
    res = await db.trips.delete_one({"id": trip_id, "user_id": current["id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Trip not found")
    await db.users.update_one({"id": current["id"]}, {"$inc": {"trips_count": -1}})
    return {"ok": True}


# ------------------------- Routes: Matching -------------------------
@api.get("/travellers/suggested")
async def suggested(current=Depends(get_current_user), destination: Optional[str] = None):
    q = {"id": {"$ne": current["id"]}}
    cursor = db.users.find(q, {"_id": 0, "password": 0}).limit(40)
    users = await cursor.to_list(40)
    # Augment with current trip
    out = []
    for u in users:
        last_trip = await db.trips.find_one(
            {"user_id": u["id"]}, {"_id": 0}, sort=[("created_at", -1)]
        )
        item = public_user(u)
        item["latest_trip"] = last_trip
        if destination and last_trip:
            if destination.lower() not in (last_trip.get("destination", "") + " " + last_trip.get("country", "")).lower():
                continue
        out.append(item)
    return out


@api.post("/matches/request")
async def request_match(req: MatchRequest, current=Depends(get_current_user)):
    if req.target_user_id == current["id"]:
        raise HTTPException(400, "Cannot match yourself")
    existing = await db.matches.find_one(
        {"from_user": current["id"], "to_user": req.target_user_id}
    )
    if existing:
        return {"ok": True, "status": existing.get("status", "pending")}
    match = {
        "id": new_id(),
        "from_user": current["id"],
        "to_user": req.target_user_id,
        "trip_id": req.trip_id,
        "message": req.message,
        "status": "pending",
        "created_at": now_iso(),
    }
    await db.matches.insert_one(match)
    return {"ok": True, "status": "pending"}


@api.get("/matches/incoming")
async def incoming_matches(current=Depends(get_current_user)):
    items = await db.matches.find(
        {"to_user": current["id"], "status": "pending"}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    out = []
    for m in items:
        u = await db.users.find_one({"id": m["from_user"]}, {"_id": 0, "password": 0})
        if u:
            out.append({**m, "from_user_profile": public_user(u)})
    return out


@api.post("/matches/{match_id}/respond")
async def respond_match(match_id: str, action: str, current=Depends(get_current_user)):
    if action not in {"accept", "decline"}:
        raise HTTPException(400, "Invalid action")
    m = await db.matches.find_one({"id": match_id, "to_user": current["id"]})
    if not m:
        raise HTTPException(404, "Match not found")
    new_status = "accepted" if action == "accept" else "declined"
    await db.matches.update_one({"id": match_id}, {"$set": {"status": new_status}})
    return {"ok": True, "status": new_status}


# ------------------------- Routes: Chat -------------------------
@api.post("/chats/start")
async def start_chat(req: ChatStart, current=Depends(get_current_user)):
    members = sorted([current["id"], req.other_user_id])
    chat = await db.chats.find_one({"members": members}, {"_id": 0})
    if not chat:
        chat = {
            "id": new_id(),
            "members": members,
            "created_at": now_iso(),
            "last_message": "",
            "last_at": now_iso(),
        }
        await db.chats.insert_one(chat)
        chat.pop("_id", None)
    return chat


@api.get("/chats")
async def list_chats(current=Depends(get_current_user)):
    chats = await db.chats.find({"members": current["id"]}, {"_id": 0}).sort("last_at", -1).to_list(100)
    out = []
    for c in chats:
        other_id = next((m for m in c["members"] if m != current["id"]), None)
        other = await db.users.find_one({"id": other_id}, {"_id": 0, "password": 0}) if other_id else None
        out.append({**c, "other": public_user(other) if other else None})
    return out


@api.get("/chats/{chat_id}/messages")
async def get_messages(chat_id: str, current=Depends(get_current_user), after: Optional[str] = None):
    chat = await db.chats.find_one({"id": chat_id})
    if not chat or current["id"] not in chat["members"]:
        raise HTTPException(404, "Chat not found")
    q = {"chat_id": chat_id}
    if after:
        q["created_at"] = {"$gt": after}
    msgs = await db.messages.find(q, {"_id": 0}).sort("created_at", 1).to_list(500)
    return msgs


@api.post("/chats/messages")
async def send_message(req: MessageCreate, current=Depends(get_current_user)):
    chat = await db.chats.find_one({"id": req.chat_id})
    if not chat or current["id"] not in chat["members"]:
        raise HTTPException(404, "Chat not found")
    msg = {
        "id": new_id(),
        "chat_id": req.chat_id,
        "sender_id": current["id"],
        "text": req.text,
        "created_at": now_iso(),
    }
    await db.messages.insert_one(msg)
    await db.chats.update_one(
        {"id": req.chat_id},
        {"$set": {"last_message": req.text, "last_at": msg["created_at"]}},
    )
    msg.pop("_id", None)
    return msg


# ------------------------- Routes: Guides -------------------------
import time

# Simple in-memory cache for guides list
# Format: key -> (timestamp, data)
GUIDES_CACHE = {}
GUIDES_CACHE_TTL_SEC = 30

def get_cached_guides(key: str):
    if key in GUIDES_CACHE:
        timestamp, data = GUIDES_CACHE[key]
        if time.time() - timestamp < GUIDES_CACHE_TTL_SEC:
            return data
    return None

def set_cached_guides(key: str, data):
    GUIDES_CACHE[key] = (time.time(), data)

def clear_guides_cache():
    GUIDES_CACHE.clear()


POSITIVE_WORDS = {
    "great", "excellent", "wonderful", "amazing", "helpful", "safe", "friendly",
    "best", "highly", "recommend", "professional", "good", "awesome", "polite",
    "kind", "punctual", "trusted", "sweet", "superb", "nice", "fantastic", "reliable"
}

NEGATIVE_WORDS = {
    "bad", "terrible", "awful", "unsafe", "rude", "horrible", "scam", "fake",
    "dangerous", "misbehave", "late", "worst", "fraud", "harassment", "threat",
    "extortion", "creepy", "inappropriate", "scared", "scary", "dirty", "unprofessional"
}

EMOJI_SCORES = {
    "very bad": -2.0,
    "bad": -1.0,
    "normal": 0.0,
    "good": 1.0,
    "very good": 2.0,
}


def analyze_sentiment(rating: int, comment: str, emoji: str = "") -> float:
    text_low = (comment or "").lower()
    words = text_low.split()
    pos_count = sum(1 for w in words if w.strip(".,!?:;()") in POSITIVE_WORDS)
    neg_count = sum(1 for w in words if w.strip(".,!?:;()") in NEGATIVE_WORDS)

    emoji_bonus = 0.0
    for e_key, e_val in EMOJI_SCORES.items():
        if e_key in (emoji or "").lower():
            emoji_bonus = e_val
            break

    # Rating normalized score (-2.0 to +2.0)
    rating_score = (rating - 3) * 1.0
    text_score = (pos_count - neg_count) * 0.8

    total = rating_score + emoji_bonus + text_score
    return round(total, 2)


@api.get("/guides")
async def list_guides(city: Optional[str] = None, country: Optional[str] = None, q: Optional[str] = None):
    cache_key = f"{city}:{country}:{q}"
    cached = get_cached_guides(cache_key)
    if cached is not None:
        return cached

    query: dict = {}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if country:
        query["country"] = {"$regex": country, "$options": "i"}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"city": {"$regex": q, "$options": "i"}},
            {"country": {"$regex": q, "$options": "i"}},
        ]

    raw_guides = await db.guides.find(query, {"_id": 0}).to_list(500)

    # Filter out suspended or banned guides
    active_guides = [
        g for g in raw_guides
        if g.get("status") != "suspended" and g.get("status") != "banned"
    ]

    # Sort dynamically by net sentiment score so +ve sentiment guides appear top/first, and -ve sentiment guides appear last/bottom!
    active_guides.sort(
        key=lambda g: (
            g.get("net_rank_score", (g.get("rating", 5.0) * 3.0)),
            g.get("positive_percent", 100),
            g.get("safety_score", 100),
            g.get("rating", 5.0)
        ),
        reverse=True
    )

    set_cached_guides(cache_key, active_guides)
    return active_guides


@api.get("/guides/locations")
async def guide_locations():
    """Distinct cities/countries that currently have at least one guide registered."""
    cities = await db.guides.distinct("city")
    countries = await db.guides.distinct("country")
    return {"cities": sorted([c for c in cities if c]), "countries": sorted([c for c in countries if c])}


@api.post("/guides/{guide_id}/reviews")
async def create_guide_review(guide_id: str, req: GuideReviewCreate, current=Depends(get_current_user)):
    g = await db.guides.find_one({"id": guide_id})
    if not g:
        raise HTTPException(404, "Guide not found")

    sentiment_val = analyze_sentiment(req.rating, req.comment, req.emoji or "")

    rev = {
        "id": new_id(),
        "guide_id": guide_id,
        "user_id": current["id"],
        "user_name": current.get("name", "Verified Traveller"),
        "user_avatar": current.get("avatar_url"),
        "rating": req.rating,
        "emoji": req.emoji or "🙂 Good",
        "comment": req.comment,
        "sentiment_score": sentiment_val,
        "booking_id": req.booking_id,
        "created_at": now_iso(),
    }
    await db.guide_reviews.insert_one(rev)

    # Compute aggregate rating and sentiment ranking for the guide
    all_revs = await db.guide_reviews.find({"guide_id": guide_id}).to_list(1000)
    avg_rating = round(sum(r["rating"] for r in all_revs) / len(all_revs), 1)
    avg_sentiment = round(sum(r.get("sentiment_score", 0.0) for r in all_revs) / len(all_revs), 2)

    pos_reviews = sum(1 for r in all_revs if r.get("sentiment_score", 0) >= 0)
    neg_reviews = sum(1 for r in all_revs if r.get("sentiment_score", 0) < 0)
    pos_pct = round((pos_reviews / len(all_revs)) * 100) if all_revs else 100

    net_rank_score = round(avg_rating * 3.0 + avg_sentiment * 2.0 + (pos_reviews - neg_reviews) * 0.5, 2)

    upd = {
        "rating": avg_rating,
        "reviews_count": len(all_revs),
        "sentiment_score": avg_sentiment,
        "positive_percent": pos_pct,
        "net_rank_score": net_rank_score,
    }
    await db.guides.update_one({"id": guide_id}, {"$set": upd})
    clear_guides_cache()

    rev.pop("_id", None)
    return {"ok": True, "review": rev, "guide_stats": upd}


@api.get("/guides/{guide_id}/reviews")
async def get_guide_reviews(guide_id: str):
    revs = await db.guide_reviews.find({"guide_id": guide_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return revs


@api.post("/guides/{guide_id}/report")
async def report_guide(guide_id: str, req: GuideReportCreate, current=Depends(get_current_user)):
    g = await db.guides.find_one({"id": guide_id})
    if not g:
        raise HTTPException(404, "Guide account not found")

    # Ensure caller is not reporting themselves
    if g.get("user_id") == current["id"]:
        raise HTTPException(400, "You cannot report your own guide account.")

    report_doc = {
        "id": new_id(),
        "guide_id": guide_id,
        "guide_name": g.get("name"),
        "reporter_user_id": current["id"],
        "reporter_name": current.get("name", "Anonymous"),
        "reason": req.reason,
        "details": req.details or "",
        "created_at": now_iso(),
    }
    await db.guide_reports.insert_one(report_doc)

    # Decrease guide safety score (-25 points per report)
    current_guide_score = max(0, g.get("safety_score", 100) - 25)

    # Total reports count against guide
    total_reports = await db.guide_reports.count_documents({"guide_id": guide_id})

    # Auto-ban threshold: safety_score < 50 OR total_reports >= 2
    is_banned = current_guide_score < 50 or total_reports >= 2
    new_status = "suspended" if is_banned else g.get("status", "active")

    await db.guides.update_one(
        {"id": guide_id},
        {"$set": {"safety_score": current_guide_score, "status": new_status, "reports_count": total_reports}}
    )

    guide_user_id = g.get("user_id")
    if guide_user_id:
        await db.users.update_one(
            {"id": guide_user_id},
            {"$set": {"safety_score": current_guide_score, "status": new_status}}
        )
        if is_banned:
            await ws_manager.broadcast("account_suspended", {"user_id": guide_user_id, "reason": req.reason})

    clear_guides_cache()

    return {
        "ok": True,
        "message": "In-trip incident report submitted to Platform Governance. Action taken.",
        "guide_safety_score": current_guide_score,
        "banned": is_banned,
        "status": new_status,
    }


@api.post("/guides/register")
async def register_guide(req: GuideCreate, current=Depends(get_current_user)):
    existing = await db.guides.find_one({"user_id": current["id"]})
    payload = {
        **req.dict(),
        "user_id": current["id"],
        "avatar_url": req.avatar_url or current.get("avatar_url"),
        "rating": existing.get("rating", 0.0) if existing else 0.0,
        "reviews_count": existing.get("reviews_count", 0) if existing else 0,
        "verified": True,  # MVP: mark self-registered guides as verified women travellers
    }
    if existing:
        await db.guides.update_one({"id": existing["id"]}, {"$set": payload})
        guide = await db.guides.find_one({"id": existing["id"]}, {"_id": 0})
    else:
        payload.update({"id": new_id(), "created_at": now_iso()})
        await db.guides.insert_one(payload)
        guide = {k: v for k, v in payload.items() if k != "_id"}
    await db.users.update_one({"id": current["id"]}, {"$set": {"is_guide": True, "guide_id": guide["id"]}})
    clear_guides_cache()
    return guide


@api.get("/guides/mine")
async def my_guide(current=Depends(get_current_user)):
    g = await db.guides.find_one({"user_id": current["id"]}, {"_id": 0})
    return g or {}


@api.get("/guides/{guide_id}")
async def get_guide(guide_id: str):
    g = await db.guides.find_one({"id": guide_id}, {"_id": 0})
    if not g:
        raise HTTPException(404, "Guide not found")
    return g


@api.post("/guides/{guide_id}/book")
async def book_guide(guide_id: str, req: BookingCreate, current=Depends(get_current_user)):
    g = await db.guides.find_one({"id": guide_id})
    if not g:
        raise HTTPException(404, "Guide not found")
    booking = {
        "id": new_id(),
        "guide_id": guide_id,
        "user_id": current["id"],
        "date": req.date,
        "notes": req.notes,
        "status": "pending",
        "created_at": now_iso(),
    }
    await db.bookings.insert_one(booking)
    booking.pop("_id", None)
    return booking


@api.get("/bookings/mine")
async def my_bookings(current=Depends(get_current_user)):
    items = await db.bookings.find({"user_id": current["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    out = []
    for b in items:
        g = await db.guides.find_one({"id": b["guide_id"]}, {"_id": 0})
        out.append({**b, "guide": g})
    return out


@api.get("/bookings/guide-managed")
async def guide_managed_bookings(current=Depends(get_current_user)):
    g = await db.guides.find_one({"user_id": current["id"]}, {"_id": 0})
    guide_id = g["id"] if g else current.get("guide_id") or current["id"]

    items = await db.bookings.find(
        {"$or": [{"guide_id": guide_id}, {"guide_id": current["id"]}]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)

    out = []
    for b in items:
        u = await db.users.find_one({"id": b["user_id"]}, {"_id": 0, "password": 0})
        user_info = public_user(u) if u else {
            "name": "Traveller User",
            "city": b.get("city", "Local Area"),
            "phone": "+91-9876543210",
            "safety_score": 100
        }
        out.append({
            **b,
            "user": user_info,
            "place": b.get("place") or (g.get("city") if g else "Local Destination"),
            "time": b.get("time") or "Day Session (10:00 AM)"
        })
    return out


@api.post("/bookings/{booking_id}/accept")
async def accept_guide_booking(booking_id: str, current=Depends(get_current_user)):
    b = await db.bookings.find_one({"id": booking_id})
    if not b:
        raise HTTPException(404, "Booking request not found")

    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": "confirmed", "updated_at": now_iso()}})
    await ws_manager.broadcast("booking_accepted", {"booking_id": booking_id, "user_id": b["user_id"]})
    return {"ok": True, "message": "Booking request accepted! Traveller notified."}


@api.post("/bookings/{booking_id}/reject")
async def reject_guide_booking(booking_id: str, current=Depends(get_current_user)):
    b = await db.bookings.find_one({"id": booking_id})
    if not b:
        raise HTTPException(404, "Booking request not found")

    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": "rejected", "updated_at": now_iso()}})
    await ws_manager.broadcast("booking_rejected", {"booking_id": booking_id, "user_id": b["user_id"]})
    return {"ok": True, "message": "Booking request declined."}


# ------------------------- Routes: Community Feed -------------------------
@api.get("/posts")
async def list_posts(current=Depends(get_current_user)):
    posts = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    out = []
    for p in posts:
        u = await db.users.find_one({"id": p["user_id"]}, {"_id": 0, "password": 0})
        p["user"] = public_user(u) if u else None
        p["liked"] = current["id"] in p.get("likes", [])
        p["likes_count"] = len(p.get("likes", []))
        comments_count = await db.comments.count_documents({"post_id": p["id"]})
        p["comments_count"] = comments_count
        out.append(p)
    return out


@api.post("/posts")
async def create_post(req: PostCreate, current=Depends(get_current_user)):
    post = {
        "id": new_id(),
        "user_id": current["id"],
        "caption": req.caption,
        "image_url": req.image_url,
        "location": req.location,
        "likes": [],
        "created_at": now_iso(),
    }
    await db.posts.insert_one(post)
    post.pop("_id", None)
    return post


@api.post("/posts/{post_id}/like")
async def like_post(post_id: str, current=Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(404, "Not found")
    if current["id"] in post.get("likes", []):
        await db.posts.update_one({"id": post_id}, {"$pull": {"likes": current["id"]}})
        return {"liked": False}
    await db.posts.update_one({"id": post_id}, {"$addToSet": {"likes": current["id"]}})
    return {"liked": True}


@api.get("/posts/{post_id}/comments")
async def get_comments(post_id: str):
    items = await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    out = []
    for c in items:
        u = await db.users.find_one({"id": c["user_id"]}, {"_id": 0, "password": 0})
        c["user"] = public_user(u) if u else None
        out.append(c)
    return out


@api.post("/posts/{post_id}/comments")
async def add_comment(post_id: str, req: CommentCreate, current=Depends(get_current_user)):
    c = {
        "id": new_id(),
        "post_id": post_id,
        "user_id": current["id"],
        "text": req.text,
        "created_at": now_iso(),
    }
    await db.comments.insert_one(c)
    c.pop("_id", None)
    return c


# ------------------------- Routes: Emergency Contacts + SOS -------------------------
@api.get("/emergency/contacts")
async def list_emergency_contacts(current=Depends(get_current_user)):
    items = await db.emergency_contacts.find({"user_id": current["id"]}, {"_id": 0}).to_list(50)
    return items


@api.post("/emergency/contacts")
async def add_emergency_contact(req: EmergencyContactCreate, current=Depends(get_current_user)):
    c = {**req.dict(), "id": new_id(), "user_id": current["id"], "created_at": now_iso()}
    await db.emergency_contacts.insert_one(c)
    c.pop("_id", None)
    return c


@api.delete("/emergency/contacts/{contact_id}")
async def delete_emergency_contact(contact_id: str, current=Depends(get_current_user)):
    await db.emergency_contacts.delete_one({"id": contact_id, "user_id": current["id"]})
    return {"ok": True}


@api.post("/sos/trigger")
async def trigger_sos(req: SosTrigger, current=Depends(get_current_user)):
    contacts = await db.emergency_contacts.find({"user_id": current["id"]}, {"_id": 0}).to_list(50)
    alert = {
        "id": new_id(),
        "user_id": current["id"],
        "latitude": req.latitude,
        "longitude": req.longitude,
        "message": req.message,
        "contacts_notified": [c["phone"] for c in contacts],
        "status": "active",
        "created_at": now_iso(),
    }
    await db.sos_alerts.insert_one(alert)
    alert.pop("_id", None)
    # Note: real SMS would be sent here via Twilio integration.
    return {
        "alert": alert,
        "notified_count": len(contacts),
        "message": f"Emergency alert sent to {len(contacts)} contact(s) and nearby travellers.",
    }


@api.get("/sos/alerts")
async def list_alerts(current=Depends(get_current_user)):
    items = await db.sos_alerts.find({"user_id": current["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return items


@api.post("/sos/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, current=Depends(get_current_user)):
    await db.sos_alerts.update_one(
        {"id": alert_id, "user_id": current["id"]},
        {"$set": {"status": "resolved", "resolved_at": now_iso()}},
    )
    return {"ok": True}


# ------------------------- Routes: AI Travel Assistant -------------------------
SYSTEM_PROMPT = (
    "You are SafeConnect AI, an expert women-only solo travel safety assistant. "
    "Help users plan trips, suggest safe places, recommend timings, give cultural tips, "
    "translate phrases, and detect risky areas. Always prioritize the user's physical safety, "
    "emphasize verified accommodations, women-only spaces when possible, and emergency preparedness. "
    "Keep responses concise (under 200 words), warm, and actionable with bullet points when useful."
)


def generate_safe_ai_response(msg: str) -> str:
    m = msg.lower()
    if "tokyo" in m or "japan" in m or "neighborhood" in m:
        return (
            "🏯 **Tokyo Solo Women Safety Guide:**\n\n"
            "• **Safest Areas:** Ginza, Roppongi (daytime), Shibuya, Shinjuku (stay on main lit streets).\n"
            "• **Koban (Police Boxes):** Located at every major train station exit — officers speak basic English.\n"
            "• **Women-Only Trains:** Active during morning/evening rush hours (look for pink car floor markings).\n"
            "• **24/7 Safe Havens:** Lawson, 7-Eleven, and FamilyMart stores are everywhere if you ever need shelter or assistance."
        )
    elif "bali" in m or "trip" in m or "itinerary" in m or "5-day" in m:
        return (
            "🌴 **5-Day Safe Solo Bali Itinerary:**\n\n"
            "• **Day 1-2 (Ubud):** Stay at verified female-friendly villas near Sacred Monkey Forest; take daytime yoga classes.\n"
            "• **Day 3 (Canggu):** Beachfront cafes, sunset at Echo Beach with trusted groups.\n"
            "• **Day 4-5 (Uluwatu):** Kecak Fire Dance, cliff views. Book certified female local guides via saFeConnect.\n"
            "• **Safety Rule:** Always use Grab or Gojek apps for rides rather than unmetered street taxis."
        )
    elif "unsafe" in m or "night" in m or "dark" in m or "walking" in m:
        return (
            "🚨 **Immediate Steps If Feeling Unsafe at Night:**\n\n"
            "1. **Enter a Public Space:** Step immediately into a well-lit hotel lobby, restaurant, or store.\n"
            "2. **Use Fake Call:** Tap 'Fake Call' in saFeConnect SOS tab to pretend you are meeting someone right away.\n"
            "3. **Share Live Location:** Send your real-time GPS link to your emergency contacts.\n"
            "4. **Hold SOS Button:** Hold the red SOS button if you feel in immediate danger — alerts emergency contacts instantly."
        )
    elif "translate" in m or "spanish" in m or "police" in m or "help" in m:
        return (
            "🗣️ **Essential Spanish Safety Phrases:**\n\n"
            "• *Necesito ayuda, por favor llame a la policía.* (I need help, please call the police.)\n"
            "• *¿Dónde está la comisaría más cercana?* (Where is the nearest police station?)\n"
            "• *Por favor déjame en paz.* (Please leave me alone.)\n"
            "• **Emergency Number in Spain/Europe:** Call **112** (free, works on all mobile networks)."
        )
    elif "scam" in m or "pack" in m or "hotel" in m:
        return (
            "🎒 **Solo Travel Safety Essentials & Scam Prevention:**\n\n"
            "• **Hotel Safety:** Request rooms between floors 2 and 4 (away from street level, accessible by fire ladders).\n"
            "• **Common Scams:** Beware of 'friendly strangers' offering unrequested tours or unofficial currency exchanges.\n"
            "• **Packing Tip:** Carry a portable door lock, door stop alarm, and a backup power bank for your phone."
        )
    else:
        return (
            f"💜 **SafeAI Travel Advice:**\n\n"
            f"Regarding *'{msg}'*:\n\n"
            "• **Location Awareness:** Always download offline maps (Google Maps / Maps.me) before exploring new areas.\n"
            "• **Emergency Contacts:** Ensure at least 1 contact is added under your saFeConnect SOS tab.\n"
            "• **Local Guides:** Connect with verified female local guides on saFeConnect for safe neighborhood orientation.\n"
            "• **Stay Connected:** Keep your phone charged and check in with family at scheduled times."
        )


@api.post("/ai/chat")
async def ai_chat(req: AiChatReq, current=Depends(get_current_user)):
    reply_text = generate_safe_ai_response(req.message)

    # Save user message
    await db.ai_messages.insert_one(
        {
            "id": new_id(),
            "user_id": current["id"],
            "session_id": req.session_id,
            "role": "user",
            "text": req.message,
            "created_at": now_iso(),
        }
    )

    # Save assistant reply
    await db.ai_messages.insert_one(
        {
            "id": new_id(),
            "user_id": current["id"],
            "session_id": req.session_id,
            "role": "assistant",
            "text": reply_text,
            "created_at": now_iso(),
        }
    )

    return {"reply": reply_text}


@api.get("/ai/history/{session_id}")
async def ai_history(session_id: str, current=Depends(get_current_user)):
    msgs = await db.ai_messages.find(
        {"user_id": current["id"], "session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    return msgs


# ------------------------- Seed data -------------------------
_SAMPLE_GUIDES_DISABLED = [
    {
        "name": "Aiko Tanaka",
        "city": "Tokyo",
        "country": "Japan",
        "languages": ["English", "Japanese"],
        "experience_years": 7,
        "bio": "Tokyo-born guide specializing in safe nightlife & cultural tours for solo women.",
        "price_per_day": 95,
        "rating": 4.9,
        "reviews_count": 142,
        "avatar_url": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80",
        "certifications": ["Licensed Tour Guide", "First Aid Certified"],
    },
    {
        "name": "Sofia Rossi",
        "city": "Rome",
        "country": "Italy",
        "languages": ["English", "Italian", "Spanish"],
        "experience_years": 5,
        "bio": "Art historian & women's solo-travel advocate in Rome.",
        "price_per_day": 110,
        "rating": 4.8,
        "reviews_count": 96,
        "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
        "certifications": ["Art History MA", "Safety-Certified"],
    },
    {
        "name": "Priya Sharma",
        "city": "Jaipur",
        "country": "India",
        "languages": ["English", "Hindi", "Rajasthani"],
        "experience_years": 6,
        "bio": "Heritage walks, palaces, and authentic women-only experiences in the Pink City.",
        "price_per_day": 45,
        "rating": 4.95,
        "reviews_count": 211,
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
        "certifications": ["Govt. Approved Guide", "Women Safety Trainer"],
    },
    {
        "name": "Camila Vargas",
        "city": "Mexico City",
        "country": "Mexico",
        "languages": ["English", "Spanish"],
        "experience_years": 4,
        "bio": "Food tours, art districts, and safe neighborhood walks in CDMX.",
        "price_per_day": 65,
        "rating": 4.85,
        "reviews_count": 78,
        "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
        "certifications": ["INAH Certified", "Self-Defense Trained"],
    },
    {
        "name": "Leila Karim",
        "city": "Istanbul",
        "country": "Turkey",
        "languages": ["English", "Turkish", "Arabic"],
        "experience_years": 8,
        "bio": "Bosphorus walks, bazaars, and women-only hammam experiences.",
        "price_per_day": 70,
        "rating": 4.9,
        "reviews_count": 165,
        "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
        "certifications": ["Ministry Licensed", "Multilingual Guide"],
    },
    {
        "name": "Hanna Bergman",
        "city": "Reykjavik",
        "country": "Iceland",
        "languages": ["English", "Icelandic", "Swedish"],
        "experience_years": 5,
        "bio": "Northern lights, glacier hikes, and remote safe travel for women.",
        "price_per_day": 140,
        "rating": 4.92,
        "reviews_count": 89,
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        "certifications": ["Wilderness First Responder", "Glacier Guide"],
    },
    {
        "name": "Mei Lin",
        "city": "Bangkok",
        "country": "Thailand",
        "languages": ["English", "Thai", "Mandarin"],
        "experience_years": 6,
        "bio": "Temples, floating markets, and trusted Bangkok nightlife for solo women.",
        "price_per_day": 55,
        "rating": 4.88,
        "reviews_count": 134,
        "avatar_url": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80",
        "certifications": ["TAT Licensed", "First Aid Certified"],
    },
    {
        "name": "Amara Okafor",
        "city": "Cape Town",
        "country": "South Africa",
        "languages": ["English", "Zulu", "Afrikaans"],
        "experience_years": 7,
        "bio": "Table Mountain, safari prep, and township cultural tours with a women's safety focus.",
        "price_per_day": 85,
        "rating": 4.9,
        "reviews_count": 102,
        "avatar_url": "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80",
        "certifications": ["FGASA Level 2", "Safety Trained"],
    },
]


_SAMPLE_USERS_DISABLED = [
    {
        "name": "Emma Wilson",
        "email": "emma@safeconnect.demo",
        "age": 28,
        "phone": "+1-555-0101",
        "bio": "Solo backpacker, 14 countries down. Love food markets & sunsets.",
        "interests": ["Hiking", "Photography", "Food"],
        "languages": ["English", "Spanish"],
        "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
        "countries_visited": 14,
        "trips_count": 22,
        "verified": True,
    },
    {
        "name": "Sara Ahmed",
        "email": "sara@safeconnect.demo",
        "age": 26,
        "phone": "+44-555-0102",
        "bio": "Yoga teacher exploring Asia. Looking for trekking buddies.",
        "interests": ["Yoga", "Trekking", "Wellness"],
        "languages": ["English", "Arabic"],
        "avatar_url": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80",
        "countries_visited": 9,
        "trips_count": 11,
        "verified": True,
    },
    {
        "name": "Lucia Fernandez",
        "email": "lucia@safeconnect.demo",
        "age": 30,
        "phone": "+34-555-0103",
        "bio": "Photographer based in Barcelona. Planning Japan in spring.",
        "interests": ["Photography", "Art", "Coffee"],
        "languages": ["English", "Spanish", "Catalan"],
        "avatar_url": "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=400&q=80",
        "countries_visited": 19,
        "trips_count": 27,
        "verified": True,
    },
    {
        "name": "Nina Patel",
        "email": "nina@safeconnect.demo",
        "age": 25,
        "phone": "+91-555-0104",
        "bio": "Software engineer & weekend explorer. Always up for a museum.",
        "interests": ["Museums", "History", "Tea"],
        "languages": ["English", "Hindi", "Gujarati"],
        "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
        "countries_visited": 7,
        "trips_count": 9,
        "verified": True,
    },
    {
        "name": "Chloe Martin",
        "email": "chloe@safeconnect.demo",
        "age": 27,
        "phone": "+33-555-0105",
        "bio": "Parisian wandering Europe. Coffee, books, slow travel.",
        "interests": ["Reading", "Coffee", "Architecture"],
        "languages": ["French", "English"],
        "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
        "countries_visited": 16,
        "trips_count": 24,
        "verified": True,
    },
    {
        "name": "Maya Johnson",
        "email": "maya@safeconnect.demo",
        "age": 29,
        "phone": "+1-555-0106",
        "bio": "Marine biologist, scuba diver, ocean lover.",
        "interests": ["Diving", "Ocean", "Wildlife"],
        "languages": ["English"],
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        "countries_visited": 11,
        "trips_count": 15,
        "verified": True,
    },
]


_SAMPLE_POSTS_DISABLED = [
    {
        "caption": "Sunrise at Mount Batur with my SafeConnect crew. Magical and so safe with the right group! 🌅",
        "image_url": "https://images.unsplash.com/photo-1476900543704-4312b78632f8?auto=format&fit=crop&w=800&q=80",
        "location": "Bali, Indonesia",
    },
    {
        "caption": "Found the cutest women-only hostel in Lisbon. Sharing the link in the group chat ✨",
        "image_url": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
        "location": "Lisbon, Portugal",
    },
    {
        "caption": "First solo trip done & verified! Thanks SafeConnect for the local guide tip.",
        "image_url": "https://images.pexels.com/photos/4901963/pexels-photo-4901963.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "location": "Paris, France",
    },
    {
        "caption": "Late-night ramen in Tokyo — guide Aiko knew exactly where to take us.",
        "image_url": "https://images.unsplash.com/photo-1554797589-7241bb691973?auto=format&fit=crop&w=800&q=80",
        "location": "Tokyo, Japan",
    },
]


async def seed_data():
    """Ensure default admin account exists and purge legacy non-Indian demo accounts."""
    admin_user = await db.users.find_one({"email": "admin@safeconnect.com"})
    if not admin_user:
        admin = {
            "id": "admin-super-001",
            "role": "admin",
            "name": "Super Admin",
            "email": "admin@safeconnect.com",
            "password": hash_pw("admin123"),
            "phone": "+91-9999999999",
            "gender": "Female",
            "dob": "1990-01-01",
            "state": "Tamil Nadu",
            "city": "Chennai",
            "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
            "verified": True,
            "verification_status": "approved",
            "status": "active",
            "created_at": now_iso(),
        }
        await db.users.insert_one(admin)
        logger.info("Created default Admin account (admin@safeconnect.com / admin123)")

    demo_users = await db.users.find({"email": {"$regex": "@safeconnect.demo$"}}, {"id": 1}).to_list(100)
    demo_ids = [u["id"] for u in demo_users]
    if demo_ids:
        await db.users.delete_many({"id": {"$in": demo_ids}})
        await db.posts.delete_many({"user_id": {"$in": demo_ids}})
        await db.trips.delete_many({"user_id": {"$in": demo_ids}})
        await db.matches.delete_many({"$or": [{"from_user": {"$in": demo_ids}}, {"to_user": {"$in": demo_ids}}]})
        logger.info("Purged %s legacy demo users and related data", len(demo_ids))
    
    res = await db.guides.delete_many({"user_id": {"$exists": False}})
    if res.deleted_count:
        logger.info("Purged %s legacy seeded guides", res.deleted_count)


# Mock database layers for offline load-testing compatibility
class MockCursor:
    def __init__(self, data):
        self.data = data
    def sort(self, *args, **kwargs):
        return self
    def limit(self, *args, **kwargs):
        return self
    async def to_list(self, length):
        return self.data[:length]

class MockCollection:
    def __init__(self, name, sample_data=None):
        self.name = name
        self.data = sample_data or []
    async def create_index(self, *args, **kwargs):
        pass
    async def find_one(self, filter=None, *args, **kwargs):
        import re
        if not filter:
            return self.data[0] if self.data else None
        for item in self.data:
            match = True
            for k, v in filter.items():
                if k == "$or":
                    or_match = False
                    for cond in v:
                        cond_match = True
                        for ck, cv in cond.items():
                            if isinstance(cv, dict) and "$regex" in cv:
                                pattern = cv["$regex"]
                                if not re.search(pattern, item.get(ck, ""), re.IGNORECASE):
                                    cond_match = False
                                    break
                            elif isinstance(cv, dict) and "$ne" in cv:
                                if item.get(ck) == cv["$ne"]:
                                    cond_match = False
                                    break
                            elif isinstance(cv, dict) and "$in" in cv:
                                if item.get(ck) not in cv["$in"]:
                                    cond_match = False
                                    break
                            else:
                                doc_val = item.get(ck)
                                if isinstance(doc_val, list):
                                    if cv not in doc_val:
                                        cond_match = False
                                        break
                                else:
                                    if doc_val != cv:
                                        cond_match = False
                                        break
                        if cond_match:
                            or_match = True
                            break
                    if not or_match:
                        match = False
                        break
                elif isinstance(v, dict) and "$regex" in v:
                    pattern = v["$regex"]
                    if not re.search(pattern, item.get(k, ""), re.IGNORECASE):
                        match = False
                        break
                elif isinstance(v, dict) and "$ne" in v:
                    if item.get(k) == v["$ne"]:
                        match = False
                        break
                elif isinstance(v, dict) and "$in" in v:
                    if item.get(k) not in v["$in"]:
                        match = False
                        break
                elif isinstance(v, dict) and "$exists" in v:
                    exists = v["$exists"]
                    if (k in item) != exists:
                        match = False
                        break
                else:
                    doc_val = item.get(k)
                    if isinstance(doc_val, list):
                        if v not in doc_val:
                            match = False
                            break
                    else:
                        if doc_val != v:
                            match = False
                            break
            if match:
                return item
        return None

    def find(self, filter=None, *args, **kwargs):
        import re
        if not filter:
            return MockCursor(self.data)
        matched = []
        for item in self.data:
            match = True
            for k, v in filter.items():
                if k == "$or":
                    or_match = False
                    for cond in v:
                        cond_match = True
                        for ck, cv in cond.items():
                            if isinstance(cv, dict) and "$regex" in cv:
                                pattern = cv["$regex"]
                                if not re.search(pattern, item.get(ck, ""), re.IGNORECASE):
                                    cond_match = False
                                    break
                            elif isinstance(cv, dict) and "$in" in cv:
                                if item.get(ck) not in cv["$in"]:
                                    cond_match = False
                                    break
                            else:
                                doc_val = item.get(ck)
                                if isinstance(doc_val, list):
                                    if cv not in doc_val:
                                        cond_match = False
                                        break
                                else:
                                    if doc_val != cv:
                                        cond_match = False
                                        break
                        if cond_match:
                            or_match = True
                            break
                    if not or_match:
                        match = False
                        break
                elif isinstance(v, dict) and "$regex" in v:
                    pattern = v["$regex"]
                    if not re.search(pattern, item.get(k, ""), re.IGNORECASE):
                        match = False
                        break
                elif isinstance(v, dict) and "$ne" in v:
                    if item.get(k) == v["$ne"]:
                        match = False
                        break
                elif isinstance(v, dict) and "$in" in v:
                    if item.get(k) not in v["$in"]:
                        match = False
                        break
                elif isinstance(v, dict) and "$exists" in v:
                    exists = v["$exists"]
                    if (k in item) != exists:
                        match = False
                        break
                else:
                    doc_val = item.get(k)
                    if isinstance(doc_val, list):
                        if v not in doc_val:
                            match = False
                            break
                    else:
                        if doc_val != v:
                            match = False
                            break
            if match:
                matched.append(item)
        return MockCursor(matched)

    async def insert_one(self, doc, *args, **kwargs):
        self.data.append(doc)
        return doc

    async def update_one(self, filter, update, *args, **kwargs):
        item = await self.find_one(filter)
        if not item:
            if kwargs.get("upsert"):
                new_doc = filter.copy()
                if "$set" in update:
                    new_doc.update(update["$set"])
                self.data.append(new_doc)
            return
        if "$set" in update:
            for k, v in update["$set"].items():
                item[k] = v
        if "$inc" in update:
            for k, v in update["$inc"].items():
                item[k] = item.get(k, 0) + v
        if "$addToSet" in update:
            for k, v in update["$addToSet"].items():
                if k not in item:
                    item[k] = []
                if v not in item[k]:
                    item[k].append(v)
        if "$pull" in update:
            for k, v in update["$pull"].items():
                if k in item and v in item[k]:
                    item[k].remove(v)

    async def delete_one(self, filter, *args, **kwargs):
        item = await self.find_one(filter)
        deleted = 0
        if item and item in self.data:
            self.data.remove(item)
            deleted = 1
        class Result:
            deleted_count = deleted
        return Result()

    async def delete_many(self, filter, *args, **kwargs):
        import re
        matched = []
        for item in self.data:
            match = True
            for k, v in filter.items():
                if k == "$or":
                    or_match = False
                    for cond in v:
                        cond_match = True
                        for ck, cv in cond.items():
                            if isinstance(cv, dict) and "$in" in cv:
                                if item.get(ck) not in cv["$in"]:
                                    cond_match = False
                                    break
                            else:
                                doc_val = item.get(ck)
                                if isinstance(doc_val, list):
                                    if cv not in doc_val:
                                        cond_match = False
                                        break
                                else:
                                    if doc_val != cv:
                                        cond_match = False
                                        break
                        if cond_match:
                            or_match = True
                            break
                    if not or_match:
                        match = False
                        break
                elif isinstance(v, dict) and "$in" in v:
                    if item.get(k) not in v["$in"]:
                        match = False
                        break
                elif isinstance(v, dict) and "$regex" in v:
                    pattern = v["$regex"]
                    if not re.search(pattern, item.get(k, ""), re.IGNORECASE):
                        match = False
                        break
                elif isinstance(v, dict) and "$exists" in v:
                    exists = v["$exists"]
                    if (k in item) != exists:
                        match = False
                        break
                else:
                    doc_val = item.get(k)
                    if isinstance(doc_val, list):
                        if v not in doc_val:
                            match = False
                            break
                    else:
                        if doc_val != v:
                            match = False
                            break
            if match:
                matched.append(item)
        for item in matched:
            self.data.remove(item)
        class Result:
            deleted_count = len(matched)
        return Result()

    async def distinct(self, field, *args, **kwargs):
        return list(set(d.get(field) for d in self.data if d.get(field)))

    async def count_documents(self, filter, *args, **kwargs):
        cursor = self.find(filter)
        return len(cursor.data)

class MockDatabase:
    def __init__(self):
        self.users = MockCollection("users")
        self.trips = MockCollection("trips")
        self.matches = MockCollection("matches")
        self.messages = MockCollection("messages")
        self.chats = MockCollection("chats")
        self.guides = MockCollection("guides")
        self.bookings = MockCollection("bookings")
        self.posts = MockCollection("posts")
        self.comments = MockCollection("comments")
        self.emergency_contacts = MockCollection("emergency_contacts")
        self.sos_alerts = MockCollection("sos_alerts")
        self.ai_messages = MockCollection("ai_messages")
        self.otps = MockCollection("otps")
        self.guide_reviews = MockCollection("guide_reviews")
        self.guide_reports = MockCollection("guide_reports")

    def __getitem__(self, name):
        if not hasattr(self, name):
            setattr(self, name, MockCollection(name))
        return getattr(self, name)


ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin.safeconnect@safeconnect.in").lower()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "AdminPass2026!Secure")

async def seed_data():
    try:
        existing_by_email = await db.users.find_one({"email": ADMIN_EMAIL})
        if existing_by_email:
            await db.users.update_one(
                {"email": ADMIN_EMAIL},
                {"$set": {"role": "admin", "password": hash_pw(ADMIN_PASSWORD), "verified": True, "verification_status": "approved"}}
            )
            logger.info("Admin account updated via ADMIN_EMAIL.")
        else:
            admin_user = {
                "id": "admin-super-001",
                "name": "Super Admin",
                "email": ADMIN_EMAIL,
                "password": hash_pw(ADMIN_PASSWORD),
                "role": "admin",
                "gender": "Female",
                "dob": "1990-01-01",
                "age": 30,
                "phone": "+91-9999999999",
                "state": "Tamil Nadu",
                "district": "Chennai",
                "city": "Chennai",
                "emergency_contact": {},
                "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
                "government_id": "AADHAAR-ADMIN-001",
                "selfie": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
                "verified": True,
                "verification_status": "approved",
                "status": "active",
                "bio": "Platform Security & Safety Governance Admin",
                "interests": ["Safety Governance"],
                "languages": ["English", "Hindi"],
                "safety_score": 100,
                "countries_visited": 0,
                "trips_count": 0,
                "rating": 5.0,
                "is_guide": False,
                "created_at": now_iso(),
            }
            await db.users.insert_one(admin_user)
            logger.info("Default Admin account seeded successfully.")

        # Wipe out all automated test & sample garbage accounts (@example.com, test_, usr-pending-, etc.)
        await db.users.delete_many({
            "$or": [
                {"email": {"$regex": "@example\\.com$", "$options": "i"}},
                {"email": {"$regex": "^test_", "$options": "i"}},
                {"email": "google_traveller@gmail.com"},
                {"email": "user_test_ind@safeconnect.in"},
                {"email": "guide_test_ind@safeconnect.in"},
                {"id": {"$regex": "^usr-pending-", "$options": "i"}},
                {"id": {"$regex": "^usr-approved-", "$options": "i"}},
            ]
        })
        logger.info("Cleaned garbage sample & test accounts from database.")
    except Exception as e:
        logger.warning("Seed data note: %s", e)


@app.on_event("startup")
async def on_startup():
    global client, db
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        await asyncio.wait_for(db.users.create_index("email", unique=True), timeout=1.5)
        await db.trips.create_index("user_id")
        await db.matches.create_index([("to_user", 1), ("status", 1)])
        await db.messages.create_index([("chat_id", 1), ("created_at", 1)])
        await db.chats.create_index("members")
        await seed_data()
        logger.info("Successfully connected to MongoDB Atlas!")
    except Exception as e:
        logger.warning("MongoDB connection failed or timed out: %s. Swapping to MockDatabase layer for offline execution.", e)
        db = MockDatabase()
        await seed_data()


@app.on_event("shutdown")
async def on_shutdown():
    global client
    try:
        if client:
            client.close()
    except Exception:
        pass


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "saFeConnect Backend Running 🚀"}