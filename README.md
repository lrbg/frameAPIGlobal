# QA API Framework

Automated API testing framework built with **Bruno + Node.js + React**. Uses the [PokéAPI](https://pokeapi.co/api/v2/) as a live example.

**Live Dashboard →** https://lrbg.github.io/frameAPIGlobal/

---

## Stack

| Layer | Technology |
|-------|-----------|
| Test collections | Bruno (`.bru` files) |
| Backend / runner | Node.js + Express |
| Dashboard | React + Vite + Tailwind |
| Documentation | Swagger UI (OpenAPI 3.0, auto-generated) |
| CI/CD | GitHub Actions |
| Hosting | GitHub Pages |

## Covered Endpoints

| Resource | List | Get by name |
|----------|------|-------------|
| Pokemon  | ✅  | ✅ |
| Berry    | ✅  | ✅ |
| Item     | ✅  | ✅ |
| Move     | ✅  | ✅ |
| Type     | ✅  | ✅ |
| Ability  | ✅  | ✅ |

Each endpoint has **6–10 test assertions** covering: status code, response structure, field types, array lengths, and response time.

---

## Local Setup

```bash
# 1. Install all dependencies
npm run install:all

# 2. Start backend + frontend dev servers
npm run dev
# Backend → http://localhost:3001
# Frontend → http://localhost:3000
```

### Run Bruno Tests via CLI

```bash
# Install Bruno CLI globally
npm install -g @usebruno/cli

# Run all tests
npm run test:bruno

# Run a specific resource group
cd collections/pokeapi && bru run --env Prod --no-bail pokemon/
```

### Run via Backend API

```bash
# Start backend
cd backend && npm run dev

# POST to run tests
curl -X POST http://localhost:3001/api/run-tests \
  -H "Content-Type: application/json" \
  -d '{"folder": "pokemon"}'

# GET latest results
curl http://localhost:3001/api/results/latest

# GET Swagger spec
curl http://localhost:3001/api/swagger
```

---

## GitHub Actions

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `run-tests.yml` | push to main, PR, manual | Runs Bruno tests, saves results to `frontend/public/data/`, generates Swagger |
| `deploy.yml` | push to main, manual | Builds React app and deploys to GitHub Pages |

### Manual trigger with folder filter

Go to **Actions → Run Bruno Tests → Run workflow** and select a resource group.

---

## Project Structure

```
frameAPIGlobal/
├── .github/workflows/
│   ├── run-tests.yml       # CI test runner
│   └── deploy.yml          # GitHub Pages deploy
├── collections/pokeapi/    # Bruno test collections
│   ├── environments/Prod.bru
│   ├── pokemon/
│   ├── berry/
│   ├── item/
│   ├── move/
│   ├── type/
│   └── ability/
├── backend/                # Express API server
│   └── src/
│       ├── server.js
│       └── routes/
│           ├── tests.js    # POST /api/run-tests
│           ├── results.js  # GET /api/results
│           └── docs.js     # GET /api/swagger
└── frontend/               # React dashboard
    └── src/
        ├── pages/
        │   ├── Dashboard.jsx
        │   ├── TestRunner.jsx
        │   ├── Results.jsx
        │   └── Documentation.jsx
        └── services/api.js
```

## Enable GitHub Pages

1. Go to **Settings → Pages**
2. Set source to **GitHub Actions**
3. Push to `main` — the `deploy.yml` workflow will build and deploy automatically
