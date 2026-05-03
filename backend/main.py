from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from datetime import datetime
from pathlib import Path
import os, math, httpx, pandas as pd
from dotenv import load_dotenv

try:
    from database import get_verified_db, verify_sync_db
    from auth import hash_password, verify_password, create_access_token, get_current_user
    from train_model import train_and_save_model, get_model_prediction, get_feature_importance
except ImportError:
    from backend.database import get_verified_db, verify_sync_db
    from backend.auth import hash_password, verify_password, create_access_token, get_current_user
    from backend.train_model import train_and_save_model, get_model_prediction, get_feature_importance

load_dotenv()
BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="SafePrayag API", version="2.0.1")
import os
_origins = os.getenv("ALLOWED_ORIGINS", "")
_origin_list = [o.strip() for o in _origins.split(",") if o.strip()]
if not _origin_list:
    _origin_list = [
        "https://safeprayag-frontend.vercel.app",
        "https://safeprayag.vercel.app",
        "http://localhost:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

PS = [
    {"name":"George Town PS","lat":25.4484,"lon":81.8322,"phone":"0532-2623333"},
    {"name":"Civil Lines PS","lat":25.4609,"lon":81.8463,"phone":"0532-2623335"},
    {"name":"Kotwali PS","lat":25.4551,"lon":81.8398,"phone":"0532-2400100"},
    {"name":"Naini PS","lat":25.3921,"lon":81.8929,"phone":"0532-2691100"},
    {"name":"Holagadh PS","lat":25.3003,"lon":81.7290,"phone":"0532-2623334"},
    {"name":"Phaphamau PS","lat":25.5011,"lon":81.8601,"phone":"0532-2623336"},
    {"name":"Kareli PS","lat":25.4731,"lon":81.8712,"phone":"0532-2623337"},
    {"name":"Jhunsi PS","lat":25.4221,"lon":81.9012,"phone":"0532-2623338"},
    {"name":"Dhoomanganj PS","lat":25.4389,"lon":81.8654,"phone":"0532-2623339"},
    {"name":"Colonelganj PS","lat":25.4601,"lon":81.8512,"phone":"0532-2623340"},
    {"name":"Baghambari PS","lat":25.4712,"lon":81.8201,"phone":"0532-2623341"},
    {"name":"Soraon PS","lat":25.5234,"lon":81.8731,"phone":"0532-2623342"},
]

# ── Models ────────────────────────────────────────────────────────────────────

class Signup(BaseModel):
    name: str; email: str; password: str; phone: str
    gender: str = "Female"; age_group: str = "Adult"
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None

class Login(BaseModel):
    email: str; password: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    age_group: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None

class RouteReq(BaseModel):
    from_lat: float; from_lon: float; to_lat: float; to_lon: float
    from_address: Optional[str] = ""
    to_address: Optional[str] = ""
    time_of_day: str = "Evening"
    gender: str = "Female"
    age_group: str = "Adult"

class IncidentReq(BaseModel):
    lat: float; lon: float; crime_type: str; severity: int
    description: Optional[str] = ""
    time_of_day: str = "Evening"
    area: Optional[str] = ""

class SOSReq(BaseModel):
    lat: float; lon: float

class LocUpdate(BaseModel):
    lat: float; lon: float; route_id: Optional[str] = None

# ── Helpers ───────────────────────────────────────────────────────────────────

def hav(a, b, c, d):
    R = 6371000
    p1, p2 = math.radians(a), math.radians(c)
    x = math.sin((p2-p1)/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(math.radians(d-b)/2)**2
    return R * 2 * math.atan2(math.sqrt(x), math.sqrt(1-x))

def status(s):
    return "High Risk" if s > 65 else "Moderate Risk" if s > 35 else "Safe"

def precautions(s, t):
    p = (["🚨 HIGH RISK — Avoid this route", "Share live location NOW",
          "Call 100", "Do NOT go alone"] if s > 65
         else ["⚠️ Stay alert", "Share your location",
               "Keep contacts ready", "Avoid dark lanes"] if s > 35
         else ["✅ Route appears safe", "Stay aware", "Keep contacts saved"])
    if t in ["Night", "Late Night"]:
        p.append("🌙 Night travel — extra vigilance")
    return p

def recs(s, g):
    r = (["Use SOS throughout", "Inform family of route", "Consider daylight travel"] if s > 65
         else ["Travel in groups", "Update guardian every 30min"] if s > 35
         else ["Standard safety awareness"])
    if g == "Female":
        r.append("Women Helpline: 1091")
    r.append("Police:100 | Ambulance:108 | Childline:1098")
    return r

def oid(s):
    try:
        return ObjectId(s)
    except Exception:
        raise HTTPException(400, f"Invalid ID: {s}")

def mask_phone(phone: str) -> str:
    digits = "".join(ch for ch in str(phone or "") if ch.isdigit())
    if len(digits) >= 10:
        return f"{digits[0]}xxxxx{digits[-4:]}"
    if len(digits) >= 5:
        return f"{digits[0]}xxx{digits[-2:]}"
    return digits or "unknown"

# ── SMS ───────────────────────────────────────────────────────────────────────

async def send_sms(phone: str, message: str):
    key = os.getenv("FAST2SMS_API_KEY", "").strip()
    clean = phone.strip().replace("+91","").replace(" ","").replace("-","")
    if clean.startswith("91") and len(clean) == 12:
        clean = clean[2:]

    print(f"\n[SMS] To: {clean}")
    print(f"[SMS] Key set: {'YES (' + key[:8] + '...)' if key else 'NO — add FAST2SMS_API_KEY to .env'}")

    if not key:
        print(f"[SMS-SIM] Would send: {message}")
        return

    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(
                "https://www.fast2sms.com/dev/bulkV2",
                headers={"authorization": key, "Content-Type": "application/json"},
                json={"route":"q","message":message,"language":"english","flash":0,"numbers":clean},
            )
            result = r.json()
            print(f"[SMS] Fast2SMS response: {result}")
            if result.get("return"):
                print(f"[SMS] ✅ Sent to {clean}")
            else:
                print(f"[SMS] ❌ Rejected: {result.get('message','Unknown')}")
    except Exception as e:
        print(f"[SMS] ❌ Error: {e}")

# ── Routes ────────────────────────────────────────────────────────────────────

@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {"service": "SafePrayag API v2", "docs": "/docs", "health": "/health"}
@app.get("/health")
async def health():
    db_ok = True
    try:
        await get_verified_db()
    except HTTPException:
        db_ok = False
    return {
        "status": "ok" if db_ok else "degraded",
        "version": "2.0.1",
        "service": "SafePrayag",
        "database": "connected" if db_ok else "unreachable",
    }

@app.post("/auth/signup")
async def signup(req: Signup):
    db = await get_verified_db()
    if await db.users.find_one({"email": req.email}):
        raise HTTPException(400, "Email already registered.")
    r = await db.users.insert_one({
        "name": req.name, "email": req.email,
        "password": hash_password(req.password),
        "phone": req.phone, "gender": req.gender, "age_group": req.age_group,
        "guardian_name": req.guardian_name, "guardian_phone": req.guardian_phone,
        "sos_count": 0, "routes_checked": 0, "incidents_reported": 0,
        "created_at": datetime.utcnow(),
    })
    uid = str(r.inserted_id)
    return {"message": "Account created", "token": create_access_token(uid, req.email),
            "user": {"id": uid, "name": req.name, "email": req.email,
                     "gender": req.gender, "age_group": req.age_group,
                     "phone": req.phone, "guardian_name": req.guardian_name,
                     "guardian_phone": req.guardian_phone}}

@app.post("/auth/login")
async def login(req: Login):
    db = await get_verified_db()
    u = await db.users.find_one({"email": req.email})
    if not u:
        raise HTTPException(401, "No account with this email.")
    if not verify_password(req.password, u["password"]):
        raise HTTPException(401, "Wrong password.")
    uid = str(u["_id"])
    return {"message": "Login successful", "token": create_access_token(uid, req.email),
            "user": {"id": uid, "name": u["name"], "email": u["email"],
                     "gender": u.get("gender","Female"), "age_group": u.get("age_group","Adult"),
                     "phone": u.get("phone",""), "guardian_name": u.get("guardian_name"),
                     "guardian_phone": u.get("guardian_phone")}}

@app.get("/auth/profile")
async def get_profile(request: Request):
    cu = await get_current_user(request)
    db = await get_verified_db()
    u = await db.users.find_one({"_id": oid(cu["sub"])})
    if not u:
        raise HTTPException(404, "User not found.")
    return {"id": str(u["_id"]), "name": u["name"], "email": u["email"],
            "gender": u.get("gender","Female"), "age_group": u.get("age_group","Adult"),
            "phone": u.get("phone",""), "guardian_name": u.get("guardian_name"),
            "guardian_phone": u.get("guardian_phone"), "sos_count": u.get("sos_count",0),
            "routes_checked": u.get("routes_checked",0),
            "incidents_reported": u.get("incidents_reported",0),
            "created_at": u.get("created_at", datetime.utcnow()).isoformat()}

@app.put("/auth/profile")
async def update_profile(request: Request):
    """Accept any JSON body and update non-null fields — fixes profile save."""
    cu = await get_current_user(request)
    db = await get_verified_db()

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(400, "Invalid JSON body")

    # Only update fields that are present and not None/empty
    allowed = {"name","phone","gender","age_group","guardian_name","guardian_phone"}
    upd = {}
    for k, v in body.items():
        if k in allowed and v is not None:
            # Allow empty string for optional fields to clear them
            upd[k] = str(v).strip() if isinstance(v, str) else v

    if not upd:
        return {"message": "Nothing to update"}

    result = await db.users.update_one(
        {"_id": oid(cu["sub"])},
        {"$set": upd}
    )
    print(f"[Profile] Updated {list(upd.keys())} for {cu['sub']} — matched: {result.matched_count}")
    return {"message": "Profile updated successfully", "updated": list(upd.keys())}

@app.post("/route/analyse")
async def analyse(req: RouteReq, request: Request):
    cu = await get_current_user(request)
    db = await get_verified_db()
    await db.users.update_one({"_id": oid(cu["sub"])}, {"$inc": {"routes_checked": 1}})

    fs = get_model_prediction(req.from_lat, req.from_lon, req.time_of_day, req.age_group, req.gender)
    ts = get_model_prediction(req.to_lat, req.to_lon, req.time_of_day, req.age_group, req.gender)
    ml, mlo = (req.from_lat+req.to_lat)/2, (req.from_lon+req.to_lon)/2
    ms = get_model_prediction(ml, mlo, req.time_of_day, req.age_group, req.gender)
    avg = round(fs*.3 + ms*.4 + ts*.3, 1)

    route_data = None
    try:
        async with httpx.AsyncClient(timeout=8) as c:
            r = await c.get(
                f"https://router.project-osrm.org/route/v1/driving/"
                f"{req.from_lon},{req.from_lat};{req.to_lon},{req.to_lat}",
                params={"overview":"full","geometries":"geojson"})
            if r.status_code == 200:
                route_data = r.json()
    except Exception:
        pass

    crimes = []
    pad = 0.05
    async for c in db.crimes.find(
        {"latitude": {"$gte": min(req.from_lat,req.to_lat)-pad, "$lte": max(req.from_lat,req.to_lat)+pad},
         "longitude": {"$gte": min(req.from_lon,req.to_lon)-pad, "$lte": max(req.from_lon,req.to_lon)+pad}},
        {"_id":0,"latitude":1,"longitude":1,"crime_type":1,"severity":1,"time_of_day":1}
    ).limit(30):
        crimes.append(c)

    sps = sorted(PS, key=lambda p: hav(req.from_lat, req.from_lon, p["lat"], p["lon"]))[:3]
    ps = [{**p, "distance_km": round(hav(req.from_lat, req.from_lon, p["lat"], p["lon"])/1000, 2)} for p in sps]

    ins = await db.route_enquiries.insert_one({
        "user_id": cu["sub"],
        "from": {"lat": req.from_lat, "lon": req.from_lon, "address": req.from_address},
        "to": {"lat": req.to_lat, "lon": req.to_lon, "address": req.to_address},
        "time_of_day": req.time_of_day, "gender": req.gender, "age_group": req.age_group,
        "safety_score": avg, "status": status(avg), "timestamp": datetime.utcnow(),
    })
    return {"route_id": str(ins.inserted_id), "safety_score": avg, "status": status(avg),
            "from_safety": round(fs,1), "mid_safety": round(ms,1), "to_safety": round(ts,1),
            "route": route_data, "crimes_near_route": crimes, "nearest_police_stations": ps,
            "precautions": precautions(avg, req.time_of_day), "recommendations": recs(avg, req.gender),
            "feature_importance": get_feature_importance()}

@app.get("/predict")
async def predict(lat: float, lon: float, time_of_day: str="Evening",
                  age_group: str="Adult", gender: str="Female"):
    s = get_model_prediction(lat, lon, time_of_day, age_group, gender)
    return {"safety_score": round(s,1), "status": status(s), "precautions": precautions(s, time_of_day)}

@app.post("/sos/trigger")
async def sos_trigger(req: SOSReq, bg: BackgroundTasks, request: Request):
    cu = await get_current_user(request)
    db = await get_verified_db()
    u = await db.users.find_one({"_id": oid(cu["sub"])})
    if not u:
        raise HTTPException(404, "User not found.")

    print(f"\n[SOS] User: {u['name']} | Location: {req.lat},{req.lon}")
    print(f"[SOS] Guardian phone in DB: '{u.get('guardian_phone','NOT SET')}'")

    n = dict(sorted(PS, key=lambda p: hav(req.lat, req.lon, p["lat"], p["lon"]))[0])
    n["distance_km"] = round(hav(req.lat, req.lon, n["lat"], n["lon"])/1000, 2)
    maps = f"https://www.google.com/maps?q={req.lat},{req.lon}"
    gp = (u.get("guardian_phone") or "").strip()

    guardian_notified = False
    if gp:
        timestamp = datetime.now().strftime("%I:%M:%S%p")
        masked_user_phone = mask_phone(u.get("phone", ""))
        msg = (
            f"Greetings! This is a Safe Prayag system update. "
            f"User contact: {masked_user_phone}. "
            f"Time ({timestamp}) Status: GO. "
            f"Location: {round(req.lat,4)},{round(req.lon,4)}. "
            f"Nearest police contact: {n['name']} {n['phone']}."
        )
        bg.add_task(send_sms, gp, msg)
        guardian_notified = True
        print(f"[SOS] SMS queued for: {gp}")
    else:
        print("[SOS] No guardian phone — SMS skipped. Add it in Profile.")

    await db.sos_events.insert_one({
        "user_id": cu["sub"], "user_name": u["name"],
        "lat": req.lat, "lon": req.lon, "nearest_police": n["name"],
        "guardian_notified": guardian_notified, "timestamp": datetime.utcnow(),
    })
    await db.users.update_one({"_id": oid(cu["sub"])}, {"$inc": {"sos_count": 1}})

    return {"message": "SOS triggered!", "guardian_notified": guardian_notified,
            "nearest_police": n, "maps_link": maps,
            "emergency_numbers": {"Police":"100","Women Helpline":"1091",
                                   "Childline":"1098","Ambulance":"108",
                                   "Nearest Station": n["phone"]}}

@app.post("/sos/location-update")
async def loc_update(req: LocUpdate, request: Request):
    cu = await get_current_user(request)
    db = await get_verified_db()
    await db.location_updates.insert_one({
        "user_id": cu["sub"], "lat": req.lat, "lon": req.lon,
        "route_id": req.route_id, "timestamp": datetime.utcnow(),
    })
    dev = False
    if req.route_id:
        try:
            route = await db.route_enquiries.find_one({"_id": oid(req.route_id)})
            if route:
                df = hav(req.lat, req.lon, route["from"]["lat"], route["from"]["lon"])
                dt = hav(req.lat, req.lon, route["to"]["lat"], route["to"]["lon"])
                dd = hav(route["from"]["lat"], route["from"]["lon"],
                         route["to"]["lat"], route["to"]["lon"])
                if df + dt > dd * 1.25 + 50:
                    dev = True
        except Exception:
            pass
    return {"received": True, "deviation_alert": dev}

@app.post("/incidents/report")
async def report(req: IncidentReq, bg: BackgroundTasks, request: Request):
    cu = await get_current_user(request)
    db = await get_verified_db()
    now = datetime.utcnow()
    r = await db.crimes.insert_one({
        "user_id": cu["sub"], "latitude": req.lat, "longitude": req.lon,
        "area": req.area, "crime_type": req.crime_type, "severity": req.severity,
        "description": req.description, "time_of_day": req.time_of_day,
        "date": now.strftime("%d-%m-%Y"), "time": now.strftime("%H:%M"),
        "status": "Reported", "created_at": now,
    })
    await db.users.update_one({"_id": oid(cu["sub"])}, {"$inc": {"incidents_reported": 1}})
    bg.add_task(_retrain_bg)
    return {"message": "Incident reported. Model will retrain.", "id": str(r.inserted_id)}

def _retrain_bg():
    try:
        db = verify_sync_db()
        rows = list(db.crimes.find({}, {"_id": 0}))
        if len(rows) >= 100:
            train_and_save_model(pd.DataFrame(rows))
            print(f"[Retrain] Model retrained on {len(rows)} records.")
    except Exception as e:
        print(f"[Retrain] Error: {e}")

@app.get("/heatmap")
async def heatmap(limit: int = 500):
    db = await get_verified_db()
    return [c async for c in db.crimes.find(
        {}, {"_id":0,"latitude":1,"longitude":1,"severity":1,"crime_type":1}
    ).limit(limit)]

@app.get("/stats/hotspots")
async def hotspots(limit: int = 10):
    db = await get_verified_db()
    by_area = [
        {"area": d["_id"] or "Unknown", "count": d["count"],
         "lat": d["avg_lat"], "lon": d["avg_lon"], "top_crime": d["top_crime"]}
        async for d in db.crimes.aggregate([
            {"$match": {"area": {"$exists": True, "$ne": None, "$ne": ""}}},
            {"$group": {"_id": "$area", "count": {"$sum": 1},
                        "avg_lat": {"$avg": "$latitude"}, "avg_lon": {"$avg": "$longitude"},
                        "top_crime": {"$first": "$crime_type"}}},
            {"$sort": {"count": -1}}, {"$limit": limit},
        ])
    ]
    # Fallback to grid clustering if no named areas
    if not by_area:
        by_area = [
            {"area": f"Zone ({round(d['_id']['lat'],2)},{round(d['_id']['lon'],2)})",
             "count": d["count"], "lat": d["_id"]["lat"], "lon": d["_id"]["lon"],
             "top_crime": d["top_crime"]}
            async for d in db.crimes.aggregate([
                {"$group": {
                    "_id": {"lat": {"$round": [{"$toDouble":"$latitude"},2]},
                            "lon": {"$round": [{"$toDouble":"$longitude"},2]}},
                    "count": {"$sum": 1}, "top_crime": {"$first": "$crime_type"}}},
                {"$sort": {"count": -1}}, {"$limit": limit},
            ])
        ]
    return {"hotspots": by_area}

@app.get("/stats/dashboard")
async def dashboard(request: Request):
    cu = await get_current_user(request)
    db = await get_verified_db()

    tc = await db.crimes.count_documents({})
    hr = await db.crimes.count_documents({"severity": {"$gte": 4}})
    tu = await db.users.count_documents({})
    st = await db.sos_events.count_documents({})

    ct = [{"name": d["_id"] or "Other", "count": d["count"]} async for d in db.crimes.aggregate(
        [{"$group":{"_id":"$crime_type","count":{"$sum":1}}},{"$sort":{"count":-1}},{"$limit":8}])]
    ctm = [{"time": d["_id"] or "Unknown", "count": d["count"]} async for d in db.crimes.aggregate(
        [{"$group":{"_id":"$time_of_day","count":{"$sum":1}}}])]
    csv = [{"severity": d["_id"], "count": d["count"]} async for d in db.crimes.aggregate(
        [{"$group":{"_id":"$severity","count":{"$sum":1}}},{"$sort":{"_id":1}}])]
    tg = [{"group": d["_id"] or "Unknown", "count": d["count"]} async for d in db.crimes.aggregate(
        [{"$group":{"_id":"$target_group","count":{"$sum":1}}},{"$sort":{"count":-1}},{"$limit":6}])]
    top_hotspots = [
        {"area": d["_id"] or "Unknown", "count": d["count"], "top_crime": d["top_crime"]}
        async for d in db.crimes.aggregate([
            {"$match": {"area": {"$exists": True, "$ne": None, "$ne": ""}}},
            {"$group": {"_id":"$area","count":{"$sum":1},"top_crime":{"$first":"$crime_type"}}},
            {"$sort": {"count":-1}}, {"$limit": 10},
        ])
    ]

    routes = []
    async for r in db.route_enquiries.find(
        {"user_id": cu["sub"]},
        {"_id":1,"from":1,"to":1,"safety_score":1,"status":1,"timestamp":1}
    ).sort("timestamp", -1).limit(5):
        routes.append({
            "id": str(r["_id"]),
            "from_address": r.get("from",{}).get("address","Origin"),
            "to_address": r.get("to",{}).get("address","Destination"),
            "safety_score": r.get("safety_score",0),
            "status": r.get("status","Unknown"),
            "timestamp": r.get("timestamp", datetime.utcnow()).isoformat(),
        })

    u = await db.users.find_one({"_id": oid(cu["sub"])})
    return {
        "total_crimes": tc, "high_risk_incidents": hr,
        "total_users": tu, "sos_events_total": st,
        "crime_by_type": ct, "crime_by_time": ctm,
        "crime_by_severity": csv, "target_groups": tg,
        "top_hotspots": top_hotspots,
        "recent_routes": routes,
        "feature_importance": get_feature_importance(),
        "my_stats": {
            "routes_checked": u.get("routes_checked",0) if u else 0,
            "sos_used": u.get("sos_count",0) if u else 0,
            "incidents_reported": u.get("incidents_reported",0) if u else 0,
        },
    }

@app.get("/police-stations")
async def police_stations(lat: Optional[float]=None, lon: Optional[float]=None):
    ps = [dict(p) for p in PS]
    if lat and lon:
        for p in ps:
            p["distance_km"] = round(hav(lat, lon, p["lat"], p["lon"])/1000, 2)
        ps.sort(key=lambda p: p["distance_km"])
    return ps

@app.post("/retrain")
async def retrain():
    try:
        train_and_save_model()
        return {"message": "Retrained successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

# ── Startup — wrapped in try/except so server starts even if MongoDB is slow ──

# ── Dashboard graphs new ─────────────

@app.get("/stats/extra")
async def extra_stats():
    """Monthly trend, day-wise, police station stats, area-crime breakdown."""
    db = await get_verified_db()

    # Monthly crime trend (parses DD-MM-YYYY format from CSV)
    monthly = [
        {"month": d["_id"], "count": d["count"]}
        async for d in db.crimes.aggregate([
            {"$match": {"date": {"$exists": True, "$ne": None}}},
            {"$addFields": {
                "date_parsed": {
                    "$dateFromString": {
                        "dateString": "$date",
                        "format": "%d-%m-%Y",
                        "onError": None,
                        "onNull": None,
                    }
                }
            }},
            {"$match": {"date_parsed": {"$ne": None}}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m", "date": "$date_parsed"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}},
            {"$limit": 24},
        ])
    ]

    # Day-wise crime distribution
    raw_days = [
        {"day_num": d["_id"], "count": d["count"]}
        async for d in db.crimes.aggregate([
            {"$match": {"date": {"$exists": True, "$ne": None}}},
            {"$addFields": {
                "date_parsed": {
                    "$dateFromString": {
                        "dateString": "$date",
                        "format": "%d-%m-%Y",
                        "onError": None,
                    }
                }
            }},
            {"$match": {"date_parsed": {"$ne": None}}},
            {"$group": {"_id": {"$dayOfWeek": "$date_parsed"}, "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}},
        ])
    ]
    day_names = {1:"Sunday",2:"Monday",3:"Tuesday",4:"Wednesday",5:"Thursday",6:"Friday",7:"Saturday"}
    day_wise = [{"day": day_names.get(d["day_num"], str(d["day_num"])), "count": d["count"]} for d in raw_days]

    # Top 10 police stations by crime count
    police_stats = [
        {"station": d["_id"] or "Unknown", "count": d["count"]}
        async for d in db.crimes.aggregate([
            {"$match": {"police_station": {"$exists": True, "$ne": None, "$ne": ""}}},
            {"$group": {"_id": "$police_station", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
        ])
    ]

    # Crime type by area (for stacked bar chart)
    area_crime = [
        {"area": d["_id"]["area"], "crime_type": d["_id"]["crime_type"], "count": d["count"]}
        async for d in db.crimes.aggregate([
            {"$match": {
                "area": {"$exists": True, "$ne": None, "$ne": ""},
                "crime_type": {"$exists": True, "$ne": None},
            }},
            {"$group": {
                "_id": {"area": "$area", "crime_type": "$crime_type"},
                "count": {"$sum": 1},
            }},
            {"$sort": {"count": -1}},
            {"$limit": 80},
        ])
    ]

    return {
        "monthly_trend": monthly,
        "day_wise": day_wise,
        "police_stats": police_stats,
        "area_crime": area_crime,
    }

@app.on_event("startup")
async def startup():
    print("[SafePrayag] Starting up...")
    try:
        db = await get_verified_db()
        n = await db.crimes.count_documents({})
        if n == 0:
            csv_path = BASE_DIR / "data" / "crime_data_latlong.csv"
            if csv_path.exists():
                print("[SafePrayag] Seeding crime data...")
                df = pd.read_csv(csv_path)
                await db.crimes.insert_many(df.where(pd.notnull(df), None).to_dict("records"))
                print(f"[SafePrayag] Seeded {len(df)} records.")
                train_and_save_model(df)
            else:
                print("[SafePrayag] No CSV — training on synthetic data.")
                train_and_save_model()
        else:
            print(f"[SafePrayag] {n} crime records already in DB. Ready.")
    except Exception as e:
        # Don't crash the server if MongoDB is temporarily unreachable
        print(f"[SafePrayag] ⚠️  MongoDB startup check failed: {e}")
        print("[SafePrayag] Server will still start — DB will reconnect on first request.")
