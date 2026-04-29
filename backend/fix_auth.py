"""
Run this once to write the correct auth.py:
  python fix_auth.py
No PowerShell execution policy needed.
"""
import os

auth_code = '''import bcrypt, os, importlib, inspect as _inspect
from datetime import datetime, timedelta
from fastapi import HTTPException, Request
from dotenv import load_dotenv
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "safeprayag_secret_2025_prayagraj")
_jwt = importlib.import_module("jwt")
if "algorithms" not in _inspect.signature(_jwt.decode).parameters:
    raise RuntimeError("Wrong jwt package. Run: pip uninstall python-jwt -y && pip install PyJWT==2.8.0")

def hash_password(p): return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()
def verify_password(plain, hashed): return bcrypt.checkpw(plain.encode(), hashed.encode())

def create_access_token(uid, email):
    tok = _jwt.encode({"sub": str(uid), "email": email,
        "exp": datetime.utcnow() + timedelta(hours=168),
        "iat": datetime.utcnow()}, SECRET_KEY, algorithm="HS256")
    return tok if isinstance(tok, str) else tok.decode()

def verify_token(token):
    try:
        return _jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except _jwt.ExpiredSignatureError:
        raise HTTPException(401, "Session expired. Please log in again.")
    except Exception:
        raise HTTPException(401, "Invalid token. Please log in again.")

async def get_current_user(request: Request):
    auth = request.headers.get("authorization", "") or request.headers.get("Authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(401, "Authentication required.")
    return verify_token(auth.split(" ", 1)[1].strip())
'''

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "auth.py")
with open(path, "w", encoding="utf-8") as f:
    f.write(auth_code)

print(f"✅ auth.py written to: {path}")
print("Now run: python -m uvicorn main:app --port 8000")
