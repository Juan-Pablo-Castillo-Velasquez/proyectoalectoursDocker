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

def delete_pattern(pattern: str):
    """Borra todas las keys que calcen con un patrón (ej. 'reservas:list:*').
    Usado para invalidar cachés de listados paginados de admin donde
    skip/limit (y a veces otro filtro) varían, así que no alcanza con
    borrar una sola key exacta como hace home:destacados."""
    for key in redis_client.scan_iter(match=pattern):
        redis_client.delete(key)