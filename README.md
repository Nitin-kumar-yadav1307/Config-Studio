# AI Signal Demo - Config Driven App Generator

A mini app generator that reads JSON configuration and dynamically runs end-to-end apps (auth + backend APIs + data storage + UI runtime) with resilience for incomplete and inconsistent configs.

## What was enhanced for recruiter evaluation

This project now emphasizes reliability under imperfect inputs, extensibility, and feature integration.

### Core architecture

- Dynamic runtime from config (not hardcoded)
- Reusable config validation/normalization engine (`server/utils/configEngine.js`)
- User-scoped auth and data access via JWT
- Dynamic CRUD APIs generated from config entities and fields
- Dynamic UI generation for forms, tables, dashboards, and CSV import from config (`uiComponents`)
- Unknown component fallback and graceful error states
- Standalone project scaffold generation from config (`server/utils/projectGenerator.js`)

### Reliability upgrades

- Field type normalization and fallback handling (`text`, `number`, `email`, `date`, `boolean`)
- Required-field validation at create time
- Schema mismatch protection (unknown payload fields stored in `__extra`)
- Strict user/config scoping for update and delete operations
- Defensive handling for invalid/empty entity definitions
- Normalization warnings are captured and stored in config metadata for auditability
- New config validation endpoint: `POST /api/configs/validate`

## Mandatory integrated features implemented

1. Multi-language UI (Localization)
- Runtime supports language switching (EN/ES/HI)
- Config supports `settings.supportedLocales` and `settings.defaultLocale`
- Translation fallback avoids runtime breakage

2. CSV Import System (Upload -> Map -> Store -> Render)
- CSV upload and parse
- Column mapping to dynamic fields
- Required field mapping checks
- Authenticated row import to dynamic APIs
- Partial-success and failure notifications

3. Event-based Notifications
- Central toast event system
- Success/error notifications on create, delete, import, and API failures
- Works across dashboard and runtime workflows

## Additional quality fixes

- Fixed login token persistence bug (login now stores JWT in localStorage)
- Multi-entity runtime support (entity selector)
- Improved error feedback in dashboard/runtime actions
- Runtime API + DB explorer panel shows generated endpoints and schema contracts
- Dynamic backend schema sync endpoint: `POST /api/data/sync/:configId`
- Dynamic contract metadata endpoint: `GET /api/data/meta/:configId`
- New project export endpoint: `GET /api/generator/:configId/export`
- ZIP export endpoint: `GET /api/generator/:configId/export.zip`
- GitHub push endpoint: `POST /api/generator/:configId/push-github`
- Runtime project exporter UI can generate and download scaffold JSON for a standalone app blueprint
- Runtime project exporter UI can download ZIP and push generated scaffold to a GitHub repository

## Tech stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT + bcrypt

## Run locally

### 1) Server

- Go to `server`
- Add `.env` with:
  - `MONGO_URI=<your_mongodb_connection_string>`
  - `JWT_SECRET=<your_secret>`
  - `PORT=5000`
- Install and run:

```bash
npm install
node index.js
```

### 2) Client

- Go to `client`
- Install and run:

```bash
npm install
npm run dev
```

Open the Vite local URL and sign up/login.

## Deployment setup

### Frontend environment

- Create `client/.env` from `client/.env.example`
- Set `VITE_API_URL` to your backend URL in production

### Backend environment

- Create `server/.env` from `server/.env.example`
- Set `MONGO_URI`, `JWT_SECRET`, and `CORS_ORIGIN`

### Build and start

- Frontend: `npm run build` inside `client`
- Backend: `npm start` inside `server`

The backend now serves the built frontend automatically if `client/dist` exists, so you can deploy both behind one Node process if you prefer.

### Render deployment

This repo is designed for a single Render web service on one port. The backend serves the built React app from `client/dist`, so the frontend and backend run together in the same Node process.

- Build command: `cd client && npm install && npm run build && cd ../server && npm install`
- Start command: `cd server && npm start`
- Required env vars on Render:
  - `MONGO_URI` = your MongoDB Atlas connection string
  - `JWT_SECRET` = a strong random secret
  - `CORS_ORIGIN` = the same Render service URL

Do not create a separate frontend service for the default deployment. One Render web service is enough.

## Suggested deployment

- Frontend: Vercel or Netlify
- Backend: Render or Railway
- Database: MongoDB Atlas

## Loom demo flow (5-10 min)

1. Show architecture and config-driven flow
2. Call `POST /api/configs/validate` with imperfect JSON and show warnings/errors
3. Create a new app from builder (with locales and UI modules)
4. Open runtime and switch entities/languages
5. Add data with dynamic form and validate required fields
6. Import CSV and show mapped rows in table
7. Show API + DB explorer generated from config metadata
8. Click "Generate Scaffold" in runtime and download ZIP scaffold
9. Push generated scaffold to a GitHub repo from runtime
10. Show edge-case handling (invalid type, missing field, unknown component fallback)
11. Explain tradeoffs and extension strategy

## Extension strategy

- Add new field/component types by extending normalized type handlers and UI renderer maps
- Add new API capabilities by expanding dynamic route adapters, not per-app hardcoding
- Add richer auth methods (OAuth) by extending auth provider and backend strategy modules
