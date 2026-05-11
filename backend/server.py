"""SafeConnect Backend - FastAPI + MongoDB
Women-only solo travel safety & networking platform.
"""
import os
import uuid
import logging
import asyncio
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
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


# ------------------------- Models -------------------------
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
    email: EmailStr
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
    created_at: str


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
    return user


def public_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "name": u["name"],
        "email": u["email"],
        "age": u["age"],
        "phone": u.get("phone", ""),
        "bio": u.get("bio", ""),
        "interests": u.get("interests", []),
        "languages": u.get("languages", []),
        "avatar_url": u.get("avatar_url"),
        "verified": u.get("verified", False),
        "safety_score": u.get("safety_score", 85),
        "countries_visited": u.get("countries_visited", 0),
        "trips_count": u.get("trips_count", 0),
        "rating": u.get("rating", 5.0),
        "is_guide": bool(u.get("is_guide", False)),
        "guide_id": u.get("guide_id"),
        "created_at": u.get("created_at", now_iso()),
    }


# ------------------------- Routes: Health -------------------------
@api.get("/")
async def root():
    return {"app": "SafeConnect", "status": "ok", "time": now_iso()}


# ------------------------- Routes: Auth -------------------------
@api.post("/auth/signup")
async def signup(req: SignupReq):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered")
    user_id = new_id()
    user = {
        "id": user_id,
        "name": req.name,
        "email": req.email.lower(),
        "password": hash_pw(req.password),
        "age": req.age,
        "phone": req.phone,
        "bio": req.bio or "",
        "interests": req.interests,
        "languages": req.languages or ["English"],
        "avatar_url": req.avatar_url
        or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        "id_image_b64": req.id_image_b64,
        "selfie_b64": req.selfie_b64,
        "verified": bool(req.id_image_b64 and req.selfie_b64),
        "safety_score": 85,
        "countries_visited": 0,
        "trips_count": 0,
        "rating": 5.0,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    token = make_token(user_id)
    return {"token": token, "user": public_user(user)}


@api.post("/auth/login")
async def login(req: LoginReq):
    user = await db.users.find_one({"email": req.email.lower()})
    if not user or not verify_pw(req.password, user["password"]):
        raise HTTPException(401, "Invalid email or password")
    token = make_token(user["id"])
    return {"token": token, "user": public_user(user)}


@api.get("/auth/me")
async def me(current=Depends(get_current_user)):
    return public_user(current)


@api.patch("/auth/me")
async def update_me(updates: dict, current=Depends(get_current_user)):
    allowed = {"name", "bio", "interests", "languages", "avatar_url", "phone"}
    upd = {k: v for k, v in updates.items() if k in allowed}
    if upd:
        await db.users.update_one({"id": current["id"]}, {"$set": upd})
    user = await db.users.find_one({"id": current["id"]}, {"_id": 0, "password": 0})
    return public_user(user)


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
@api.get("/guides")
async def list_guides(city: Optional[str] = None, country: Optional[str] = None, q: Optional[str] = None):
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
    guides = await db.guides.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return guides


@api.get("/guides/locations")
async def guide_locations():
    """Distinct cities/countries that currently have at least one guide registered."""
    cities = await db.guides.distinct("city")
    countries = await db.guides.distinct("country")
    return {"cities": sorted([c for c in cities if c]), "countries": sorted([c for c in countries if c])}


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
        "status": "confirmed",
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


@api.post("/ai/chat")
async def ai_chat(req: AiChatReq, current=Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    session_id = f"{current['id']}:{req.session_id}"
    chat = (
        LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_id, system_message=SYSTEM_PROMPT)
        .with_model("openai", "gpt-4o")
    )
    try:
        reply = await chat.send_message(UserMessage(text=req.message))
    except Exception as e:
        logger.exception("AI chat failed")
        raise HTTPException(500, f"AI error: {e}")

    # persist history
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
    await db.ai_messages.insert_one(
        {
            "id": new_id(),
            "user_id": current["id"],
            "session_id": req.session_id,
            "role": "assistant",
            "text": reply,
            "created_at": now_iso(),
        }
    )
    return {"reply": reply}


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
    """Cold-start: no seeding. Purge legacy demo accounts and their content."""
    demo_users = await db.users.find({"email": {"$regex": "@safeconnect.demo$"}}, {"id": 1}).to_list(100)
    demo_ids = [u["id"] for u in demo_users]
    if demo_ids:
        await db.users.delete_many({"id": {"$in": demo_ids}})
        await db.posts.delete_many({"user_id": {"$in": demo_ids}})
        await db.trips.delete_many({"user_id": {"$in": demo_ids}})
        await db.matches.delete_many({"$or": [{"from_user": {"$in": demo_ids}}, {"to_user": {"$in": demo_ids}}]})
        logger.info("Purged %s legacy demo users and related data", len(demo_ids))
    # Also clear any legacy seeded guides that were inserted without a user_id (older builds)
    res = await db.guides.delete_many({"user_id": {"$exists": False}})
    if res.deleted_count:
        logger.info("Purged %s legacy seeded guides", res.deleted_count)


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.trips.create_index("user_id")
    await db.matches.create_index([("to_user", 1), ("status", 1)])
    await db.messages.create_index([("chat_id", 1), ("created_at", 1)])
    await db.chats.create_index("members")
    await seed_data()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
