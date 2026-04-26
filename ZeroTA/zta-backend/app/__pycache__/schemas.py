from pydantic import BaseModel, EmailStr


# =========================
# SIGNUP SCHEMA
# =========================
class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str


class SignupResponse(BaseModel):
    message: str


# =========================
# LOGIN SCHEMA
# =========================
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    username: str
    risk_score: float
    decision: str
