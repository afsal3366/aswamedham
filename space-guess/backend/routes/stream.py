from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse
from redis_client import RedisStore
import asyncio
import json

router = APIRouter()

@router.get("/stream/{room_id}")
async def event_stream(request: Request, room_id: str):
    redis = RedisStore.get()
    pubsub = redis.pubsub()
    channel = f"channel:{room_id}"
    await pubsub.subscribe(channel)

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message:
                    try:
                        data = json.loads(message["data"])
                        yield {
                            "event": "message",
                            "data": json.dumps(data)
                        }
                    except Exception:
                        pass
                await asyncio.sleep(0.1)
        finally:
            await pubsub.unsubscribe(channel)

    return EventSourceResponse(event_generator())
