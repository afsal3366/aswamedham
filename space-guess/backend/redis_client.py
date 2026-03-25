import redis.asyncio as redis
import json
from typing import Dict, Any

redis_client = None

class RedisStore:
    @staticmethod
    async def init():
        global redis_client
        import os
        # Support both standard REDIS_URL and the new VALKEY_URL
        redis_url = os.getenv("VALKEY_URL") or os.getenv("REDIS_URL")
        
        if redis_url:
            # Normalize valkey:// protocol to redis:// for compatibility with redis-py
            if redis_url.startswith("valkey://"):
                redis_url = redis_url.replace("valkey://", "redis://", 1)
            elif redis_url.startswith("valkeys://"):
                redis_url = redis_url.replace("valkeys://", "rediss://", 1)
                
            redis_client = redis.from_url(redis_url, decode_responses=True)
        else:
            host = os.getenv("REDIS_HOST", "localhost")
            port = int(os.getenv("REDIS_PORT", "6379"))
            redis_client = redis.Redis(host=host, port=port, db=0, decode_responses=True)

    @staticmethod
    async def close():
        if redis_client:
            await redis_client.close()

    @staticmethod
    def get() -> redis.Redis:
        return redis_client

    @staticmethod
    async def publish(channel: str, message: dict):
        if redis_client:
            await redis_client.publish(channel, json.dumps(message))
