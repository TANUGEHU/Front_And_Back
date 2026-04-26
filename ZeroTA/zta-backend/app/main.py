from fastapi import FastAPI, Request, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from datetime import datetime
import numpy as np
import joblib
import os
import random

# ==========================
# Local Imports
# ==========================
from .database import SessionLocal, engine
from . import models

# ==========================
# App
# ==========================
app = FastAPI(title="Zero Trust Auth + ML Backend")
from fastapi import Response

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)

# ==========================
# CORS
# ==========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# DB Init
# ==========================
models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================
# Password Hashing
# ==========================
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

# ==========================
# Load ML Model
# ==========================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "zero_trust_random_forest.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "models", "feature_scaler.pkl")

rf_model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

print("✅ ML model loaded")

# ==========================
# Schemas
# ==========================
class SignupRequest(BaseModel):
    username: str
    password: str
    email: str

class LoginRequest(BaseModel):
    username: str
    password: str

# ==========================
# Zero Trust Logic
# ==========================
def zero_trust_decision(risk: float) -> str:
    if risk < 0.3:
        return "ALLOW"
    elif risk < 0.7:
        return "MFA"
    return "BLOCK"

# ==========================
# Telemetry Simulation
# ==========================
def simulate_rtt(ip_octet1: int) -> float:
    return round(40 + ip_octet1 % 40 + random.uniform(5, 30), 2)

def simulate_asn(ip_octet1: int) -> int:
    return 20000 + (ip_octet1 * 37) % 4000

def simulate_country(ip_octet1: int) -> str:
    return "IN" if ip_octet1 < 128 else "OTHER"

# ==========================
# Health Check
# ==========================
@app.get("/")
def root():
    return {"message": "Backend running"}

# ==========================
# SIGNUP
# ==========================
@app.post("/signup")
def signup(data: SignupRequest, db: Session = Depends(get_db)):

    existing_user = db.query(models.User).filter(
        models.User.username == data.username
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    existing_email = db.query(models.User).filter(
        models.User.email == data.email
    ).first()

    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_password = pwd_context.hash(data.password)

    new_user = models.User(
        username=data.username,
        email=data.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Signup successful", "username": data.username}

# ==========================
# DEBUG: list users (temporary)
# ==========================
@app.get("/debug/users")
def list_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "created_at": u.created_at.isoformat() if getattr(u, 'created_at', None) else None,
        })
    return result

# ==========================
# LOGIN + ML RISK
# ==========================
@app.post("/login-risk")
def login_risk(
    data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    raw_login = data.username.strip()

    # ==========================
    # ✅ DEMO MODE (SAFE)
    # Works only if username starts with "demo_"
    # Examples:
    # demo_tanu_mfa
    # demo_tanu_block
    # ==========================
    demo_mode = None
    base_login = raw_login

    if raw_login.lower().startswith("demo_"):
        temp = raw_login[5:]  # remove "demo_"

        if temp.lower().endswith("_block"):
            demo_mode = "BLOCK"
            base_login = temp[:-6]  # remove "_block"

        elif temp.lower().endswith("_mfa"):
            demo_mode = "MFA"
            base_login = temp[:-4]  # remove "_mfa"

        else:
            base_login = temp

    # ✅ Find user by username OR email (using base_login)
    user = db.query(models.User).filter(
        (models.User.username == base_login) | (models.User.email == base_login)
    ).first()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    now = datetime.now()
    hour = now.hour
    day_of_week = now.weekday()
    is_weekend = 1 if day_of_week >= 5 else 0

    client_ip = request.client.host

    # ✅ Safe IP parsing (IPv4 + IPv6)
    try:
        if "." in client_ip:
            ip_octet1 = int(client_ip.split(".")[0])
        else:
            ip_octet1 = 127
    except:
        ip_octet1 = 127

    # ==========================
    # DEMO: modify environment features
    # (ML still predicts)
    # ==========================
    if demo_mode == "BLOCK":
        hour = 3
        day_of_week = 6
        is_weekend = 1
        ip_octet1 = 220

    elif demo_mode == "MFA":
        hour = 1
        day_of_week = 5
        is_weekend = 1
        ip_octet1 = 180

    ua = request.headers.get("user-agent", "").lower()
    browser_chrome = 1 if "chrome" in ua and "edg" not in ua else 0
    browser_edge = 1 if "edg" in ua else 0
    browser_other = 1 if browser_chrome == 0 and browser_edge == 0 else 0

    rtt = simulate_rtt(ip_octet1)
    asn = simulate_asn(ip_octet1)
    country = simulate_country(ip_octet1)
    country_in = 1 if country == "IN" else 0

    # ==========================
    # ✅ STRONG DEMO OVERRIDE (ML still runs)
    # ==========================
    if demo_mode == "BLOCK":
        rtt = 350.0
        asn = 99999
        country_in = 0

    elif demo_mode == "MFA":
        rtt = 220.0
        asn = 70000
        country_in = 0

    features = np.array([[
        rtt,
        asn,
        hour,
        day_of_week,
        is_weekend,
        ip_octet1,
        country_in,
        browser_chrome,
        browser_edge,
        browser_other
    ]])

    features_scaled = scaler.transform(features)
    risk_score = rf_model.predict_proba(features_scaled)[0][1]
    decision = zero_trust_decision(risk_score)

    # ==========================
    # ✅ FINAL DEMO OVERRIDE (GUARANTEED RESULT)
    # ML still computed risk_score, but decision is forced for demo reliability
    # ==========================
    if demo_mode == "BLOCK":
        decision = "BLOCK"
        risk_score = max(float(risk_score), 0.95)

    elif demo_mode == "MFA":
        decision = "MFA"
        risk_score = max(float(risk_score), 0.55)

    return {
        "username": base_login,
        "risk_score": round(float(risk_score), 4),
        "decision": decision
    }
