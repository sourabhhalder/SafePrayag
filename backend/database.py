from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = "safeprayag"

_async_client = None

async def get_db():
    global _async_client
    if _async_client is None:
        _async_client = AsyncIOMotorClient(MONGODB_URL)
    return _async_client[DB_NAME]

def get_sync_db():
    """Synchronous client for background tasks"""
    client = MongoClient(MONGODB_URL)
    return client[DB_NAME]

async def close_db():
    global _async_client
    if _async_client:
        _async_client.close()
        _async_client = None
