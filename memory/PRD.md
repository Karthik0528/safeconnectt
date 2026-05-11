# SafeConnect — Product Requirements (MVP)

## Overview
SafeConnect is a women-only solo travel safety & networking mobile app built with Expo (React Native) + FastAPI + MongoDB. Verified women travellers can connect, plan trips, chat in real time, find verified local guides, use a one-tap SOS, and chat with an AI safety assistant powered by GPT-4o (via Emergent universal LLM key).

## Stack
- Frontend: Expo Router (SDK 54), TypeScript, React Native, expo-blur, expo-linear-gradient, AsyncStorage
- Backend: FastAPI, MongoDB (Motor), JWT auth, bcrypt
- AI: GPT-4o via `emergentintegrations` + EMERGENT_LLM_KEY
- Location: expo-location

## Features (MVP)
1. Animated splash + 3-slide onboarding
2. Email/password auth with ID + selfie verification (base64 upload, optional)
3. Floating glass bottom tab bar (Home, Discover, SOS, Chat, Profile)
4. Home dashboard: greeting, safety/country/trip stats, quick actions, suggested travellers, trip cards, AI tip card, feed preview
5. Trip planner (create + detail + delete) with cover image and interests
6. Discover with two tabs: women travellers + verified local guides (8 seeded)
7. Match request & accept/decline flow with notifications screen
8. Real-time chat (3 s polling) — list + conversation with read timestamps
9. SOS screen with pulsing button, fake-call, emergency contact CRUD, live location capture, alert log, resolve
10. AI travel assistant chat (GPT-4o, session-based history, suggestion chips)
11. Community feed (Instagram-style) — create, like, comment
12. Profile page with stats, safety score, dark mode toggle, edit profile
13. Guide detail + date-based booking flow
14. Bookings + Trips list screens

## API surface (FastAPI, all under `/api`)
- `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/me`
- `POST /trips`, `GET /trips/mine`, `GET /trips/{id}`, `DELETE /trips/{id}`
- `GET /travellers/suggested`
- `POST /matches/request`, `GET /matches/incoming`, `POST /matches/{id}/respond`
- `POST /chats/start`, `GET /chats`, `GET /chats/{id}/messages`, `POST /chats/messages`
- `GET /guides`, `GET /guides/{id}`, `POST /guides/{id}/book`, `GET /bookings/mine`
- `GET /posts`, `POST /posts`, `POST /posts/{id}/like`, `GET/POST /posts/{id}/comments`
- `GET/POST /emergency/contacts`, `DELETE /emergency/contacts/{id}`
- `POST /sos/trigger`, `GET /sos/alerts`, `POST /sos/alerts/{id}/resolve`
- `POST /ai/chat`, `GET /ai/history/{session_id}`

## Seeded data on startup
- 8 verified local guides (Tokyo, Rome, Jaipur, CDMX, Istanbul, Reykjavik, Bangkok, Cape Town)
- 6 sample women travellers (all `Demo1234!` password)
- 4 community posts

## Deferred (Phase 2)
Google Maps live tracking + heatmap (needs API key), push notifications, voice/video recording in SOS, admin panel, web search & translation tools for AI, group chat, encrypted media storage.

## Business hook
"Verified women-only travel safety network" — natural premium tier (priority verification, unlimited AI chats, guide bookings without commission). Strong differentiation vs. generic travel apps.
