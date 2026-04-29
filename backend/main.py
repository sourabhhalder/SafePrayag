from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from datetime import datetime
import os, math, httpx, pandas as pd
from dotenv import load_dotenv

from database import get_db, get_sync_db
from auth import hash_password, verify_password, create_access_token, get_current_user
from train_model import train_and_save_model, get_model_prediction, get_feature_importance

load_dotenv()

app = FastAPI(title="SafePrayag API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

POLICE_STATIONS = [
    {"name":"George Town PS","lat":25.4484,"lon":81.8322,"phone":"0532-2623333"},
    {"name":"Holagadh PS","lat":25.3003,"lon":81.7290,"phone":"0532-2623334"},
    {"name":"Civil Lines PS","lat":25.4609,"lon":81.8463,"phone":"0532-2623335"},
    {"name":"Kotwali PS","lat":25.4551,"lon":81.8398,"phone":"0532-2400100"},
    {"name":"Naini PS","lat":25.3921,"lon":81.8929,"phone":"0532-2691100"},
    {"name":"Phaphamau PS","lat":25.5011,"lon":81.8601,"phone":"0532-2623336"},
    {"name":"Kareli PS","lat":25.4731,"lon":81.8712,"phone":"0532-2623337"},
    {"name":"Jhunsi PS","lat":25.4221,"lon":81.9012,"phone":"0532-2623338"},
    {"name":"Dhoomanganj PS","lat":25.4389,"lon":81.8654,"phone":"0532-2623339"},
    {"name":"Colonelganj PS","lat":25.4601,"lon":81.8512,"phone":"0532-2623340"},
    {"name":"Baghambari PS","lat":25.4712,"lon":81.8201,"phone":"0532-2623341"},
    {"name":"Soraon PS","lat":25.5234,"lon":81.8731,"phone":"0532-2623342"},
]

class SignupRequest(BaseModel):
    name: str; email: str; password: str; phone: str
    gender: str = "Female"; age_group: str = "Adult"
    guardian_name: Optional[str] = None; guardian_phone: Optional[str] = None

class LoginRequest(BaseModel):
    email: str; password: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None; phone: Optional[str] = None
    gender: Optional[str] = None; age_group: Optional[str] = None
    guardian_name: Optional[str] = None; guardian_phone: Optional[str] = None

class RouteEnquiryRequest(BaseModel):
    from_lat: float; from_lon: float; to_lat: float; to_lon: float
    from_address: Optional[str] = ""; to_address: Optional[str] = ""
    time_of_day: str = "Evening"; gender: str = "Female"; age_group: str = "Adult"

class IncidentReportRequest(BaseModel):
    lat: float; lon: float; crime_type: str; severity: int
    description: Optional[str] = ""; time_of_day: str = "Evening"; area: Optional[str] = ""

class SOSRequest(BaseModel):
    lat: float; lon: float

class LocationUpdateRequest(BaseModel):
    lat: float; lon: float; route_id: Optional[str] = None

def haversine(lat1,lon1,lat2,lon2):
    R=6371000; phi1,phi2=math.radians(lat1),math.radians(lat2)
    a=math.sin((phi2-phi1)/2)**2+math.cos(phi1)*math.cos(phi2)*math.sin(math.radians(lon2-lon1)/2)**2
    return R*2*math.atan2(math.sqrt(a),math.sqrt(1-a))

def safety_status(s): return "High Risk" if s>65 else "Moderate Risk" if s>35 else "Safe"

def precautions(score,tod):
    night=tod in["Night","Late Night"]
    p=(["🚨 HIGH RISK — Avoid this route","Share live location NOW","Call police: 100","Do NOT travel alone"]
       if score>65 else
       ["⚠️ Stay alert","Share your location","Keep emergency contacts","Avoid isolated lanes"]
       if score>35 else
       ["✅ Route appears safe","Stay aware","Keep contacts saved"])
    if night: p.append("🌙 Night travel — extra vigilance")
    return p

def recommendations(score,gender):
    r=(["Use SafePrayag SOS","Inform family of route","Consider daylight travel"] if score>65
       else ["Travel in groups","Update guardian every 30 min"] if score>35
       else ["Proceed with standard safety awareness"])
    if gender=="Female": r.append("Women Helpline: 1091")
    r.append("Police:100 | Ambulance:108 | Childline:1098")
    return r

async def sms(phone,msg):
    key=os.getenv("FAST2SMS_API_KEY","")
    if not key: print(f"[SMS-SIM] {phone}: {msg}"); return True
    try:
        async with httpx.AsyncClient(timeout=8) as c:
            r=await c.post("https://www.fast2sms.com/dev/bulkV2",
                headers={"authorization":key},
                json={"route":"q","message":msg,"language":"english","flash":0,
                      "numbers":phone.replace("+91","").replace(" ","").strip()})
            return r.json().get("return",False)
    except Exception as e:
        print(f"[SMS] {e}"); return False

def oid(s):
    try: return ObjectId(s)
    except: raise HTTPException(400,f"Invalid ID: {s}")

# ── ROUTES ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status":"ok","version":"2.0.0","service":"SafePrayag"}

@app.get("/")
async def root():
    return {"service":"SafePrayag API","docs":"/docs","health":"/health"}

@app.post("/auth/signup")
async def signup(req: SignupRequest):
    db=await get_db()
    if await db.users.find_one({"email":req.email}):
        raise HTTPException(400,"Email already registered.")
    doc={"name":req.name,"email":req.email,"password":hash_password(req.password),
         "phone":req.phone,"gender":req.gender,"age_group":req.age_group,
         "guardian_name":req.guardian_name,"guardian_phone":req.guardian_phone,
         "sos_count":0,"routes_checked":0,"incidents_reported":0,"created_at":datetime.utcnow()}
    r=await db.users.insert_one(doc)
    uid=str(r.inserted_id)
    return {"message":"Account created","token":create_access_token(uid,req.email),
            "user":{"id":uid,"name":req.name,"email":req.email,"gender":req.gender,
                    "age_group":req.age_group,"phone":req.phone,
                    "guardian_name":req.guardian_name,"guardian_phone":req.guardian_phone}}

@app.post("/auth/login")
async def login(req: LoginRequest):
    db=await get_db()
    u=await db.users.find_one({"email":req.email})
    if not u: raise HTTPException(401,"No account with this email.")
    if not verify_password(req.password,u["password"]): raise HTTPException(401,"Wrong password.")
    uid=str(u["_id"])
    return {"message":"Login successful","token":create_access_token(uid,req.email),
            "user":{"id":uid,"name":u["name"],"email":u["email"],"gender":u.get("gender","Female"),
                    "age_group":u.get("age_group","Adult"),"phone":u.get("phone",""),
                    "guardian_name":u.get("guardian_name"),"guardian_phone":u.get("guardian_phone")}}

@app.get("/auth/profile")
async def get_profile(request: Request):
    cu=await get_current_user(request); db=await get_db()
    u=await db.users.find_one({"_id":oid(cu["sub"])})
    if not u: raise HTTPException(404,"User not found.")
    return {"id":str(u["_id"]),"name":u["name"],"email":u["email"],
            "gender":u.get("gender","Female"),"age_group":u.get("age_group","Adult"),
            "phone":u.get("phone",""),"guardian_name":u.get("guardian_name"),
            "guardian_phone":u.get("guardian_phone"),"sos_count":u.get("sos_count",0),
            "routes_checked":u.get("routes_checked",0),"incidents_reported":u.get("incidents_reported",0),
            "created_at":u.get("created_at",datetime.utcnow()).isoformat()}

@app.put("/auth/profile")
async def update_profile(req: ProfileUpdateRequest, request: Request):
    cu=await get_current_user(request); db=await get_db()
    upd={k:v for k,v in req.dict().items() if v is not None}
    if upd: await db.users.update_one({"_id":oid(cu["sub"])},{"$set":upd})
    return {"message":"Profile updated"}

@app.post("/route/analyse")
async def analyse_route(req: RouteEnquiryRequest, request: Request):
    cu=await get_current_user(request); db=await get_db()
    await db.users.update_one({"_id":oid(cu["sub"])},{"$inc":{"routes_checked":1}})
    fs=get_model_prediction(req.from_lat,req.from_lon,req.time_of_day,req.age_group,req.gender)
    ts=get_model_prediction(req.to_lat,req.to_lon,req.time_of_day,req.age_group,req.gender)
    ml=(req.from_lat+req.to_lat)/2; mlo=(req.from_lon+req.to_lon)/2
    ms=get_model_prediction(ml,mlo,req.time_of_day,req.age_group,req.gender)
    avg=round(fs*.3+ms*.4+ts*.3,1)
    route_data=None
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r=await c.get(f"https://router.project-osrm.org/route/v1/driving/{req.from_lon},{req.from_lat};{req.to_lon},{req.to_lat}",
                params={"overview":"full","geometries":"geojson","steps":"true"})
            if r.status_code==200: route_data=r.json()
    except: pass
    crimes=[]
    pad=0.05
    async for c in db.crimes.find(
        {"latitude":{"$gte":min(req.from_lat,req.to_lat)-pad,"$lte":max(req.from_lat,req.to_lat)+pad},
         "longitude":{"$gte":min(req.from_lon,req.to_lon)-pad,"$lte":max(req.from_lon,req.to_lon)+pad}},
        {"_id":0,"latitude":1,"longitude":1,"crime_type":1,"severity":1,"time_of_day":1}).limit(30):
        crimes.append(c)
    ps=[dict(p) for p in sorted(POLICE_STATIONS,key=lambda p:haversine(req.from_lat,req.from_lon,p["lat"],p["lon"]))[:3]]
    for p in ps: p["distance_km"]=round(haversine(req.from_lat,req.from_lon,p["lat"],p["lon"])/1000,2)
    ins=await db.route_enquiries.insert_one({"user_id":cu["sub"],
        "from":{"lat":req.from_lat,"lon":req.from_lon,"address":req.from_address},
        "to":{"lat":req.to_lat,"lon":req.to_lon,"address":req.to_address},
        "time_of_day":req.time_of_day,"gender":req.gender,"age_group":req.age_group,
        "safety_score":avg,"status":safety_status(avg),"timestamp":datetime.utcnow()})
    return {"route_id":str(ins.inserted_id),"safety_score":avg,"status":safety_status(avg),
            "from_safety":round(fs,1),"mid_safety":round(ms,1),"to_safety":round(ts,1),
            "route":route_data,"crimes_near_route":crimes,"nearest_police_stations":ps,
            "precautions":precautions(avg,req.time_of_day),"recommendations":recommendations(avg,req.gender),
            "feature_importance":get_feature_importance()}

@app.get("/predict")
async def predict(lat:float,lon:float,time_of_day:str="Evening",age_group:str="Adult",gender:str="Female"):
    s=get_model_prediction(lat,lon,time_of_day,age_group,gender)
    return {"safety_score":round(s,1),"status":safety_status(s),"precautions":precautions(s,time_of_day)}

@app.post("/sos/trigger")
async def sos_trigger(req: SOSRequest, bg: BackgroundTasks, request: Request):
    cu=await get_current_user(request); db=await get_db()
    u=await db.users.find_one({"_id":oid(cu["sub"])})
    if not u: raise HTTPException(404,"User not found.")
    nearest=dict(sorted(POLICE_STATIONS,key=lambda p:haversine(req.lat,req.lon,p["lat"],p["lon"]))[0])
    nearest["distance_km"]=round(haversine(req.lat,req.lon,nearest["lat"],nearest["lon"])/1000,2)
    maps=f"https://www.google.com/maps?q={req.lat},{req.lon}"
    guardian=u.get("guardian_phone")
    if guardian:
        bg.add_task(sms,guardian,
            f"SOS ALERT from {u['name']}! Location: {maps} Nearest Police: {nearest['name']} ({nearest['phone']})")
    await db.sos_events.insert_one({"user_id":cu["sub"],"user_name":u["name"],
        "lat":req.lat,"lon":req.lon,"nearest_police":nearest["name"],
        "guardian_notified":bool(guardian),"timestamp":datetime.utcnow()})
    await db.users.update_one({"_id":oid(cu["sub"])},{"$inc":{"sos_count":1}})
    return {"message":"SOS triggered.","guardian_notified":bool(guardian),
            "nearest_police":nearest,"maps_link":maps,
            "emergency_numbers":{"Police":"100","Women Helpline":"1091","Childline":"1098",
                                  "Ambulance":"108","Nearest Station":nearest["phone"]}}

@app.post("/sos/location-update")
async def loc_update(req: LocationUpdateRequest, request: Request):
    cu=await get_current_user(request); db=await get_db()
    await db.location_updates.insert_one({"user_id":cu["sub"],"lat":req.lat,"lon":req.lon,
        "route_id":req.route_id,"timestamp":datetime.utcnow()})
    dev=False
    if req.route_id:
        try:
            route=await db.route_enquiries.find_one({"_id":oid(req.route_id)})
            if route:
                df=haversine(req.lat,req.lon,route["from"]["lat"],route["from"]["lon"])
                dt=haversine(req.lat,req.lon,route["to"]["lat"],route["to"]["lon"])
                dd=haversine(route["from"]["lat"],route["from"]["lon"],route["to"]["lat"],route["to"]["lon"])
                if df+dt>dd*1.25+50: dev=True
        except: pass
    return {"received":True,"deviation_alert":dev}

@app.post("/incidents/report")
async def report_incident(req: IncidentReportRequest, bg: BackgroundTasks, request: Request):
    cu=await get_current_user(request); db=await get_db()
    now=datetime.utcnow()
    r=await db.crimes.insert_one({"user_id":cu["sub"],"latitude":req.lat,"longitude":req.lon,
        "area":req.area,"crime_type":req.crime_type,"severity":req.severity,
        "description":req.description,"time_of_day":req.time_of_day,
        "date":now.strftime("%d-%m-%Y"),"time":now.strftime("%H:%M"),
        "status":"Reported","created_at":now})
    await db.users.update_one({"_id":oid(cu["sub"])},{"$inc":{"incidents_reported":1}})
    bg.add_task(_retrain)
    return {"message":"Incident reported.","id":str(r.inserted_id)}

def _retrain():
    try:
        db=get_sync_db(); crimes=list(db.crimes.find({},{"_id":0}))
        if len(crimes)>=100: train_and_save_model(pd.DataFrame(crimes))
    except Exception as e: print(f"[Retrain] {e}")

@app.get("/heatmap")
async def heatmap(limit:int=1000):
    db=await get_db()
    return [c async for c in db.crimes.find({},{"_id":0,"latitude":1,"longitude":1,"severity":1,"crime_type":1}).limit(limit)]

@app.get("/stats/dashboard")
async def dashboard(request: Request):
    cu=await get_current_user(request); db=await get_db()
    tc=await db.crimes.count_documents({})
    hr=await db.crimes.count_documents({"severity":{"$gte":4}})
    tu=await db.users.count_documents({})
    st=await db.sos_events.count_documents({})
    ct=[{"name":d["_id"] or "Unknown","count":d["count"]} async for d in db.crimes.aggregate(
        [{"$group":{"_id":"$crime_type","count":{"$sum":1}}},{"$sort":{"count":-1}},{"$limit":8}])]
    ctime=[{"time":d["_id"] or "Unknown","count":d["count"]} async for d in db.crimes.aggregate(
        [{"$group":{"_id":"$time_of_day","count":{"$sum":1}}}])]
    csev=[{"severity":d["_id"],"count":d["count"]} async for d in db.crimes.aggregate(
        [{"$group":{"_id":"$severity","count":{"$sum":1}}},{"$sort":{"_id":1}}])]
    tg=[{"group":d["_id"] or "Unknown","count":d["count"]} async for d in db.crimes.aggregate(
        [{"$group":{"_id":"$target_group","count":{"$sum":1}}},{"$sort":{"count":-1}},{"$limit":6}])]
    routes=[]
    async for r in db.route_enquiries.find({"user_id":cu["sub"]},
        {"_id":1,"from":1,"to":1,"safety_score":1,"status":1,"timestamp":1}).sort("timestamp",-1).limit(5):
        routes.append({"id":str(r["_id"]),"from_address":r.get("from",{}).get("address","Origin"),
            "to_address":r.get("to",{}).get("address","Destination"),
            "safety_score":r.get("safety_score",0),"status":r.get("status","Unknown"),
            "timestamp":r.get("timestamp",datetime.utcnow()).isoformat()})
    u=await db.users.find_one({"_id":oid(cu["sub"])})
    return {"total_crimes":tc,"high_risk_incidents":hr,"total_users":tu,"sos_events_total":st,
            "crime_by_type":ct,"crime_by_time":ctime,"crime_by_severity":csev,"target_groups":tg,
            "recent_routes":routes,"feature_importance":get_feature_importance(),
            "my_stats":{"routes_checked":u.get("routes_checked",0) if u else 0,
                        "sos_used":u.get("sos_count",0) if u else 0,
                        "incidents_reported":u.get("incidents_reported",0) if u else 0}}

@app.get("/police-stations")
async def police_stations(lat:Optional[float]=None,lon:Optional[float]=None):
    ps=[dict(s) for s in POLICE_STATIONS]
    if lat and lon:
        for s in ps: s["distance_km"]=round(haversine(lat,lon,s["lat"],s["lon"])/1000,2)
        ps.sort(key=lambda s:s["distance_km"])
    return ps

@app.post("/retrain")
async def retrain():
    try: train_and_save_model(); return {"message":"Retrained"}
    except Exception as e: raise HTTPException(500,str(e))

@app.on_event("startup")
async def startup():
    db=await get_db()
    if await db.crimes.count_documents({})==0:
        csv="data/crime_data_latlong.csv"
        if os.path.exists(csv):
            print("[SafePrayag] Seeding CSV...")
            df=pd.read_csv(csv)
            await db.crimes.insert_many(df.where(pd.notnull(df),None).to_dict("records"))
            print(f"[SafePrayag] Seeded {len(df)} records.")
            train_and_save_model(df)
        else:
            train_and_save_model()
    else:
        print(f"[SafePrayag] DB has {await db.crimes.count_documents({})} records.")
