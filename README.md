# AROHA+ (SwasthyaSetu)

A unified digital care ecosystem for rural public healthcare in Maharashtra — connecting citizens, ASHA/ANM field workers, PHC doctors, hospital staff, and district administrators on one platform. Built as a public-health coordination prototype covering symptom triage, OPD appointment booking, live token queues, medicine/equipment inventory, inter-facility referrals, and longitudinal patient records across the 5-tier facility network (Sub-Centre → PHC → Rural Hospital → Sub-District Hospital → District Hospital).

## Tech stack

- **Frontend**: React 19 + TypeScript, built with Vite (no router — a single `currentView` state drives the app shell)
- **Backend**: Express + TypeScript, PostgreSQL (via `pg`)
- **AI**: Google Gemini for the symptom-assessment chatbot

## Project structure

```
backend/    Express API — controllers, routes, PostgreSQL schema & seed data
frontend/   React app — role-specific dashboards (Patient, ASHA/ANM, Doctor, Hospital, Admin)
database/   Reference schema/design notes
docs/       Project documentation
```

## Getting started

### Prerequisites

- Node.js 18+
- A running PostgreSQL instance
- A Gemini API key (for the AI symptom assessment feature) — get one free at [Google AI Studio](https://aistudio.google.com/apikey)

### 1. Install dependencies

```bash
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure environment variables

Copy each `.env.example` to `.env` and fill in your own values — these files are gitignored and must never be committed.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**`backend/.env`**

| Variable | Description |
|---|---|
| `PORT` | Backend server port (default `5000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used for demo session tokens |
| `GEMINI_API_KEY` | Your Gemini API key, powers the symptom-assessment chatbot |
| `GEMINI_MODEL` | Gemini model name (default `gemini-3.6-flash`) |

**`frontend/.env`**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (default `http://localhost:5000/api`) |

### 3. Create and seed the database

```bash
createdb swasthyasetu   # or create it however you normally manage Postgres
npm run seed
```

### 4. Run the app

```bash
npm run dev
```

This starts both the backend (`:5000`) and frontend (`:5173`) together via `concurrently`. Open [http://localhost:5173](http://localhost:5173).

## Demo accounts

| Role | ID | Password |
|---|---|---|
| Patient | `P-10452` | — (OTP login, demo OTP `123456`) |
| ASHA / ANM | `ASHA001` | `Demo@123` |
| Doctor | `DOC001` | `Demo@123` |
| Hospital Management | `HOSP001` | `Demo@123` |
| Admin | `ADMIN001` | `Demo@123` |

## Scripts (run from the repo root)

| Command | Description |
|---|---|
| `npm run dev` | Start backend + frontend together |
| `npm run build` | Build backend then frontend |
| `npm run seed` | Reseed the database with demo data |
| `npm run start` | Run the built backend |
