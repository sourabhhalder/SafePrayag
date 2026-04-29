# 🛡️ SafePrayag — AI-Powered Safety Navigator

AI-powered crime prediction and safe route navigation platform for women and children in Prayagraj.
**Built with:** FastAPI + XGBoost + MongoDB + React + Leaflet

---

## 🏗️ Architecture

```
safe-prayag/
├── backend/          ← FastAPI (Python) — Deploy on Render (free)
│   ├── main.py       ← All API routes
│   ├── train_model.py← XGBoost training & prediction
│   ├── auth.py       ← JWT + bcrypt auth
│   ├── database.py   ← MongoDB Motor async client
│   ├── requirements.txt
│   ├── Procfile      ← Render start command
│   ├── render.yaml   ← Render deploy config
│   └── data/crime_data_latlong.csv   ← Place your CSV here
│
└── frontend/         ← React 18 SPA — Deploy on Vercel (free)
    ├── src/
    │   ├── App.jsx
    │   ├── pages/    ← Home, Login, Signup, Profile, Dashboard, RouteEnquiry
    │   ├── components/← Header, Footer, SOSButton, ProtectedRoute
    │   ├── context/  ← AuthContext (JWT state)
    │   └── services/ ← api.js (all Axios calls)
    ├── public/
    └── vercel.json
```

---

## 🚀 Quick Start (Local)

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Atlas account (free) OR local MongoDB

### 1. Backend Setup

```bash
cd backend

# Copy env file and fill in values
cp .env.example .env
# Edit .env — set MONGODB_URL, SECRET_KEY, FAST2SMS_API_KEY (optional)

# Place your crime CSV in backend/data/
cp /path/to/crime_data_latlong.csv data/

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload --port 8000
```
Backend runs at: http://localhost:8000
API docs at:     http://localhost:8000/docs

### 2. Frontend Setup

```bash
cd frontend

# Copy env file
cp .env.example .env.local
# .env.local already points to http://localhost:8000

# Install & run
npm install
npm start
```
Frontend runs at: http://localhost:3000

---

## ☁️ Free Cloud Deployment

### Step 1 — MongoDB Atlas (Free M0 tier)
1. Go to https://cloud.mongodb.com → Create free account
2. Create a free M0 cluster
3. Database Access → Add user with username/password
4. Network Access → Allow from anywhere (0.0.0.0/0)
5. Copy your connection string:  
   `mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/safeprayag?retryWrites=true&w=majority`

### Step 2 — Deploy Backend to Render (Free)
1. Push `safe-prayag/backend/` to a GitHub repo
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables:**
     - `MONGODB_URL` = your Atlas connection string
     - `SECRET_KEY` = any random 32-char string
     - `FAST2SMS_API_KEY` = your Fast2SMS key (or leave blank)
5. Deploy → copy your Render URL (e.g. `https://safeprayag-api.onrender.com`)

> **Note:** Free Render instances sleep after 15 min. First request may take ~30s to wake.

### Step 3 — Deploy Frontend to Vercel (Free)
1. Push `safe-prayag/frontend/` to GitHub
2. Go to https://vercel.com → New Project → import repo
3. Add environment variable:
   - `REACT_APP_API_URL` = your Render backend URL
4. Deploy → get your Vercel URL (e.g. `https://safeprayag.vercel.app`)
5. Update Render env `ALLOWED_ORIGINS` with your Vercel URL

---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/signup` | Create account |
| POST | `/auth/login`  | Login → JWT token |
| GET  | `/auth/profile` | Get user profile (auth) |
| PUT  | `/auth/profile` | Update profile (auth) |
| POST | `/route/analyse` | Full route safety analysis (auth) |
| GET  | `/predict` | Single point safety score |
| POST | `/sos/trigger` | Trigger SOS + SMS to guardian (auth) |
| POST | `/sos/location-update` | Live location + deviation check (auth) |
| POST | `/incidents/report` | Report a crime (auth) |
| GET  | `/heatmap` | All crime points for map |
| GET  | `/stats/dashboard` | Full analytics (auth) |
| GET  | `/police-stations` | List stations (sorted by distance if lat/lon given) |
| POST | `/retrain` | Manual model retrain |

---

## 🤖 ML Model Details

- **Algorithm:** XGBoost Regressor
- **Target:** Crime severity score → normalized 0–100 safety score
- **Features:** latitude, longitude, time_of_day, age_group, gender
- **Training data:** `crime_data_latlong.csv` seeded into MongoDB on startup
- **Auto-retrain:** Triggers when a new incident is reported (min 100 records)
- **Inference:** Real-time per route enquiry (origin, midpoint, destination)

---

## 🆘 SOS System

1. User presses SOS button → GPS coordinates captured
2. Nearest police station found via Haversine distance
3. SMS sent to guardian via **Fast2SMS** (free: 50/day for India):
   - Contains GPS link, police station name + phone
4. SOS event logged to MongoDB
5. Route deviation auto-SOS: if user strays >50m from planned route, SOS fires automatically

### Get Fast2SMS API Key (Free)
- Register at https://www.fast2sms.com
- Go to Dev API → Quick SMS → copy API key
- Add as `FAST2SMS_API_KEY` environment variable

---

## 🗺️ Maps & Routing

- **Map tiles:** OpenStreetMap (free, no API key)
- **Routing:** OSRM public demo server (free, no API key)
- **Geocoding:** Nominatim / OpenStreetMap (free)
- **Library:** React-Leaflet + Leaflet.js

---

## 📋 CSV Format

Your `crime_data_latlong.csv` should have these columns:

```
id, area, latitude, longitude, crime_type, severity, date, time,
time_of_day, target_group, gender, age, age_group, crime_count,
police_station, status
```

Required for ML: `latitude`, `longitude`, `time_of_day`, `age_group`, `gender`, `severity`

---

## 🔐 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens (HS256, 7-day expiry)
- CORS configured for frontend origins only
- No passwords stored in plain text

---

## 📞 Emergency Numbers

| Helpline | Number |
|----------|--------|
| Police | 100 |
| Women Helpline | 1091 |
| Childline | 1098 |
| Ambulance | 108 |
| Cyber Crime | 1930 |
| Disaster | 1078 |

---

Built with ❤️ for the safety of Prayagraj's women and children.
