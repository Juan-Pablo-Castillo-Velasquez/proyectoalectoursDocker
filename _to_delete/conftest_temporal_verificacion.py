"""
ARCHIVO TEMPORAL SOLO PARA VERIFICACION LOCAL — se borra despues de correr
los tests una vez. No es parte del proyecto real: en CI ya hay un servicio
Redis real (ver ci.yml), asi que este mock no hace falta ahi.
"""
import fakeredis
from app.core import cache as cache_module

cache_module.redis_client = fakeredis.FakeRedis(decode_responses=True)
