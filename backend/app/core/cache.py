import redis
import json
import os

redis_client = redis.Redis.from_url(
    os.getenv("REDIS_URL", "redis://redis:6379/0"),
    decode_responses=True
)

def get_cached(key: str):
    data = redis_client.get(key)
    return json.loads(data) if data else None

def set_cached(key: str, value, ttl_seconds: int = 600):
    redis_client.set(key, json.dumps(value), ex=ttl_seconds)