# 🏠 NuVista — Full-Stack Real Estate Platform

A modern, HouseSigma-inspired real estate platform with live IDX listing sync, an AI assistant, and a market-analytics dashboard.

## 🎥 Local Deployment Recording

A walkthrough of the app running locally (frontend + backend + MongoDB):

<!--
  HOW TO ADD YOUR VIDEO:
  • Drag-and-drop your screen recording (.mp4 / .mov) directly into this section
    on the GitHub web editor — GitHub uploads it and inserts a link automatically.
  • OR commit the file to docs/ and reference it, e.g.:
        https://github.com/iMuks/nuvista-realtor-platform/assets/<id>/<file>.mp4
  • OR link an external host (Loom / YouTube) using the badge below.
-->

> 📌 _Recording placeholder — drop your `.mp4`/`.mov` here, or replace this line with a Loom/YouTube link._

<!-- Example once uploaded:
https://github.com/iMuks/nuvista-realtor-platform/assets/00000000/demo.mp4
-->

## Tech Stack

| Layer        | Technology                                |
|--------------|-------------------------------------------|
| Frontend     | React 18 + TypeScript + Vite              |
| Backend      | Node.js + Express + TypeScript            |
| Database     | MongoDB + Mongoose ODM                     |
| Auth         | JWT + bcrypt                              |
| Maps         | Leaflet + React-Leaflet                   |
| Realtime     | Socket.IO                                 |
| Listing Feed | IDX sync (SimplyRETS)                      |
| Charts       | Recharts                                  |
| Hosting      | Google Cloud Platform (Cloud Run)         |
| Container    | Docker + Docker Compose                   |
| CI/CD        | Cloud Build → Cloud Run                    |

## Features

- **Public Property Portal** — Hero search, filterable listings, interactive map, detail pages
- **AI Chatbot (Nova)** — Realtor-domain assistant with multimodal input and property cards
- **IDX Listing Sync** — Scheduled delta sync from a listing feed (SimplyRETS) into MongoDB
- **Market Stats** — Live KPIs, price trends, and neighbourhood analytics
- **Admin Dashboard** — Listing management and sync monitoring
- **Realtime** — Socket.IO updates for sync state and new activity
- **Responsive** — Mobile-first design, works on all devices

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 7+ running locally (or a MongoDB Atlas URI)
- npm

### 1. Clone & Install

```bash
git clone https://github.com/iMuks/nuvista-realtor-platform.git realtor-platform
cd realtor-platform

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

### 2. Environment Setup

```bash
# Backend
cp backend/.env.example backend/.env
# Edit with your MongoDB URI, JWT secret, and IDX feed credentials

# Frontend
cp frontend/.env.example frontend/.env
```

> The committed `.env.example` uses SimplyRETS public test credentials, so the
> IDX sync works out of the box for local development.

### 3. Run Development

```bash
# Terminal 1 — Backend (http://localhost:5001)
cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:5174)
cd frontend && npm run dev
```

MongoDB must be running first (`mongod` or `brew services start mongodb-community`).

### 4. Open Browser
- **Frontend:** http://localhost:5174
- **Backend API:** http://localhost:5001/api
- **Health check:** http://localhost:5001/api/health

The Vite dev server proxies `/api/*` to the backend automatically.

## GCP Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full GCP deployment guide including:
- Docker containerization
- Cloud Run deployment
- MongoDB Atlas setup on GCP
- Cloud Storage for images
- Cloud Build CI/CD pipeline
- Custom domain + SSL setup

## Project Structure

```
realtor-platform/
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components (public + admin)
│   │   ├── pages/         # Route-level pages
│   │   ├── services/      # API client + chatbot service
│   │   ├── hooks/         # Custom React hooks (useProperties, useSync)
│   │   ├── store/         # Zustand stores
│   │   ├── types/         # TypeScript interfaces
│   │   └── utils/         # Helpers
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # Mongoose schemas (incl. SyncState)
│   │   ├── routes/        # Express routes (incl. sync)
│   │   ├── services/      # Business logic + IDX sync
│   │   ├── jobs/          # Scheduled sync jobs
│   │   ├── config/        # DB, env, constants
│   │   └── utils/         # Helpers, seed
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## License

Proprietary — All rights reserved.
