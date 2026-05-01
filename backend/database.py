from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = "safeprayag"

_async_client = None

def _make_async_client():
    """Create Motor async client with SSL settings for Python 3.14 compatibility."""
    # For MongoDB Atlas (cloud), we need tlsAllowInvalidCertificates for Python 3.14
    kwargs = {
        "serverSelectionTimeoutMS": 10000,
        "connectTimeoutMS": 10000,
        "socketTimeoutMS": 20000,
    }
    # Atlas URLs contain mongodb+srv — add TLS tolerance for Python 3.14
    if "mongodb+srv" in MONGODB_URL or "mongodb.net" in MONGODB_URL:
        kwargs["tlsAllowInvalidCertificates"] = True
    return AsyncIOMotorClient(MONGODB_URL, **kwargs)

async def get_db():
    global _async_client
    if _async_client is None:
        _async_client = _make_async_client()
    return _async_client[DB_NAME]

def get_sync_db():
    """Synchronous client for background tasks (model retraining)."""
    kwargs = {
        "serverSelectionTimeoutMS": 10000,
        "connectTimeoutMS": 10000,
    }
    if "mongodb+srv" in MONGODB_URL or "mongodb.net" in MONGODB_URL:
        kwargs["tlsAllowInvalidCertificates"] = True
    client = MongoClient(MONGODB_URL, **kwargs)
    return client[DB_NAME]

async def close_db():
    global _async_client
    if _async_client:
        _async_client.close()
        _async_client = None
