import redis.asyncio as redis
import json
from typing import Dict, Any

redis_client = None

class RedisStore:
    @staticmethod
    async def init():
        global redis_client
        import os
        redis_url = os.getenv("REDIS_URL")
        if redis_url:
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
