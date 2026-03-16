# 🏠 RealtorHub — Full-Stack Real Estate Platform

A modern, HouseSigma-inspired real estate platform built with cutting-edge technologies.

## Tech Stack

| Layer        | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React 18 + TypeScript + Vite      |
| Backend     | Node.js + Express + TypeScript    |
| Database    | MongoDB + Mongoose ODM            |
| Auth        | JWT + bcrypt                      |
| Maps        | Google Maps / Mapbox GL           |
| Hosting     | Google Cloud Platform (GCP)       |
| Container   | Docker + Docker Compose           |
| CI/CD       | Cloud Build → Cloud Run           |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    GCP Cloud Run                     │
│  ┌─────────────┐          ┌──────────────────────┐  │
│  │  Frontend    │  REST    │   Backend API        │  │
│  │  React+TS    │ ◄──────► │   Express+TS         │  │
│  │  (Vite)      │  /api/*  │   JWT Auth           │  │
│  └─────────────┘          │   Mongoose ODM        │  │
│                           └──────────┬───────────┘  │
│                                      │              │
│                           ┌──────────▼───────────┐  │
│                           │   MongoDB Atlas       │  │
│                           │   (GCP Region)        │  │
│                           └──────────────────────┘  │
│                                                     │
│  ┌─────────────┐   ┌────────────┐  ┌────────────┐  │
│  │ Cloud Storage│   │ Pub/Sub    │  │ Cloud Tasks│  │
│  │ (Images)     │   │ (Events)   │  │ (Queue)    │  │
│  └─────────────┘   └────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Features

- **Dashboard** — Real-time market overview with KPIs, charts, recent activity
- **Property Search** — Location-based search with map integration, filters, saved searches
- **Lead Management** — Track, score, and manage leads by location/status
- **Listings** — Full CRUD for property listings with image uploads
- **Analytics** — Market trends, price history, neighbourhood stats
- **Responsive** — Mobile-first design, works on all devices
- **Notifications** — Real-time alerts for new leads and price changes

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 7+ (or MongoDB Atlas)
- npm or yarn

### 1. Clone & Install

```bash
git clone <your-repo-url> realtor-platform
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
# Edit with your MongoDB URI, JWT secret, API keys

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Run Development

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

### 4. Open Browser
- Frontend: http://localhost:5173
- API: http://localhost:5000/api
- API Docs: http://localhost:5000/api/docs

## GCP Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full GCP deployment guide including:
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
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route-level pages
│   │   ├── services/      # API client services
│   │   ├── hooks/         # Custom React hooks
│   │   ├── types/         # TypeScript interfaces
│   │   ├── styles/        # Global styles + theme
│   │   └── assets/        # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express routes
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── services/      # Business logic layer
│   │   ├── config/        # DB, env, constants
│   │   ├── types/         # TypeScript interfaces
│   │   └── utils/         # Helper functions
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## License

Proprietary — All rights reserved.
