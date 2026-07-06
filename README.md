# GreenPulse 🌿
### Ghana's First Integrated Waste Intelligence Ecosystem
**Global Challenge Lab 2026 | Smart Cities Track | University of Ghana, Legon**

---

## Project Structure

```
greenpulse/
├── greenpulse-frontend/     ← React + Vite  (deploy to Vercel)
├── greenpulse-backend/      ← Node.js + Express + Prisma  (deploy to Render)
└── greenpulse-routing/      ← Python + FastAPI  (deploy to Render)
```

---

## Five User Roles

| Role | Entry Point | What they do |
|------|------------|--------------|
| **Citizen** | `/report` | Scan QR code, report choked drain, earn GreenPoints |
| **Collector** | `/login` | Accept drain jobs, clear waste, log weight → auto-listed on marketplace |
| **Recycler** | `/recycler/login` | Browse sorted waste, place orders, dispatch tricycles |
| **City Admin** | `/dashboard` | View live heatmap, KPIs, flood-risk forecasts |
| **Any visitor** | `/` | Landing page, /recycler info portal |

---

## Quick Start (Local Development)

### 1. Prerequisites
```bash
node --version   # need v18+
python --version # need v3.10+
```

### 2. Clone & set up all three repos
```bash
mkdir greenpulse && cd greenpulse

git clone https://github.com/aggreypaintsil168/greenpulse-frontend.git
git clone https://github.com/aggreypaintsil168/greenpulse-backend.git
git clone https://github.com/aggreypaintsil168/greenpulse-routing.git
```

### 3. Backend setup
```bash
cd greenpulse-backend
npm install

# Copy env file and fill in your values
cp .env.example .env
# Edit .env: add your Neon DATABASE_URL, Cloudinary keys

npx prisma generate
npx prisma db push
npm run seed        # loads test data including recyclers + tricycles

npm run dev         # starts on http://localhost:3001
```

### 4. Frontend setup
```bash
cd ../greenpulse-frontend
npm install

cp .env.example .env
# .env already points to localhost:3001 by default

npm run dev         # starts on http://localhost:5173
```

### 5. Routing service (optional — backend has fallback)
```bash
cd ../greenpulse-routing
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## Environment Variables

### Backend `.env`
```
DATABASE_URL="postgresql://USER:PASS@HOST/greenpulse?sslmode=require"
JWT_SECRET="greenpulse_super_secret_2026_gcl"
PORT=3001
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
FRONTEND_URL="http://localhost:5173"
ROUTING_SERVICE_URL="http://localhost:8000"
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:3001/api
```

---

## Test Accounts (after seeding)

| Role | Phone | Password |
|------|-------|----------|
| Collector | 0244000001 | password123 |
| Collector | 0244000002 | password123 |
| Recycler (Plastic) | 0302000001 | password123 |
| Recycler (Organic) | 0302000002 | password123 |
| Recycler (E-Waste) | 0302000003 | password123 |

---

## API Endpoints

### Reports
```
POST   /api/reports                   Submit drain report (+ photo)
GET    /api/reports                   All active reports
GET    /api/reports/heatmap           Lat/lng intensity array
GET    /api/reports/available-waste   Cleared waste for recyclers
PATCH  /api/reports/:id               Update status
```

### Collections
```
POST   /api/collections               Log waste collection (auth)
GET    /api/collections/stats         Aggregate totals
GET    /api/collections/available     Unsold batches for marketplace
GET    /api/collections/collector/:id By collector ID
```

### Auth
```
POST   /api/auth/collector/register
POST   /api/auth/collector/login
POST   /api/auth/recycler/register
POST   /api/auth/recycler/login
```

### Recyclers (new)
```
GET    /api/recyclers/marketplace     Browse available waste (filter by type)
GET    /api/recyclers/tricycles/available  Live tricycle map
POST   /api/recyclers/orders          Place purchase order
GET    /api/recyclers/:id/orders      My orders
POST   /api/recyclers/dispatch        Assign tricycle to order
GET    /api/recyclers/:id/dispatches  My dispatches
PATCH  /api/recyclers/dispatches/:id  Update dispatch status
```

### Dashboard & Utilities
```
GET    /api/dashboard/summary         Full KPI summary
POST   /api/routing/optimize          Dijkstra route optimization
GET    /api/weather/forecast          7-day Accra rainfall forecast
```

---

## Deployment

### Frontend → Vercel
1. `vercel.com` → Add New Project → Import `greenpulse-frontend`
2. Framework: Vite (auto-detected)
3. Environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`
4. Deploy → get URL like `https://greenpulse-frontend.vercel.app`

### Backend → Render
1. `render.com` → New Web Service → Connect `greenpulse-backend`
2. Build: `npm install && npx prisma generate`
3. Start: `node server.js`
4. Add all `.env` variables in Render dashboard
5. Deploy → get URL like `https://greenpulse-api.onrender.com`

### Routing Service → Render
1. New Web Service → Connect `greenpulse-routing`
2. Build: `pip install -r requirements.txt`
3. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add `ROUTING_SERVICE_URL` to backend env vars

### After deploying backend:
- Go back to Vercel → Update `VITE_API_URL` to your Render URL → Redeploy
- Run seed on production: In Render shell → `node prisma/seed.js`

---

## Recycler Feature Flow

```
1. Collector clears drain → logs weight + waste type
   → WasteCollection created with listedOnMarket=true

2. Recycler logs in → browses /recycler/dashboard → Marketplace tab
   → Sees available batches filtered by their recycler type
   → Places an order (sets price per kg, quantity)
   → WasteCollection marked soldToRecycler=true

3. Recycler → Tricycle Dispatch tab
   → Views live map of available tricycles
   → Selects a tricycle → clicks Dispatch
   → TricycleDispatch created, tricycle marked unavailable

4. Tricycle driver collects waste → Recycler updates dispatch to COLLECTED
5. Delivery confirmed → status → DELIVERED, tricycle freed

6. Dashboard shows recyclerOrders count for AMA reporting
```

---

## Demo Flow (Day 14 Pitch)

1. **Landing page** — show the full value chain diagram (Citizen → Collector → Recycler → City)
2. **Citizen report** — live QR scan simulation, submit a drain report
3. **Collector app** — accept job, show optimized route, log 15kg plastic
4. **Recycler dashboard** — show plastic batch appearing on marketplace, place order, dispatch tricycle
5. **Admin dashboard** — live CO₂ pulse counter, heatmap, recycler order count
6. **Green CV** — show collector's verified work history

---

*Built by Ishmeal Aggrey Paintsil | University of Ghana, Legon | GCL 2026*
