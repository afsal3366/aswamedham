import uuid
import json
from fastapi import APIRouter, HTTPException
from models import RoomCreate, RoomJoin, Player
from redis_client import RedisStore

router = APIRouter()

@router.post("/create")
async def create_room(req: RoomCreate):
    room_id = str(uuid.uuid4())[:8].upper()
    user_id = str(uuid.uuid4())
    
    redis = RedisStore.get()
    
    meta = {
        "max_questions": req.max_questions,
        "hide_other_player_questions": str(req.hide_other_player_questions),
        "status": "lobby",
        "question_count": 0,
        "mode": req.mode.upper(),
        "awaiting_host": "False"
    }
    await redis.hset(f"room:{room_id}:meta", mapping=meta)
    
    if req.mode.upper() == "HOST" and req.custom_word:
        await redis.set(f"room:{room_id}:word", req.custom_word.upper(), ex=3600)
    
    player = Player(id=user_id, username=req.host_username, is_host=True)
    await redis.hset(f"room:{room_id}:players", user_id, player.model_dump_json())
    
    await redis.expire(f"room:{room_id}:meta", 3600)
    await redis.expire(f"room:{room_id}:players", 3600)
    
    return {"room_id": room_id, "user_id": user_id, "player": player, "meta": meta}

@router.post("/join")
async def join_room(req: RoomJoin):
    redis = RedisStore.get()
    
    exists = await redis.exists(f"room:{req.room_id}:meta")
    if not exists:
        raise HTTPException(status_code=404, detail="Room not found")
        
    user_id = str(uuid.uuid4())
    player = Player(id=user_id, username=req.username, is_host=False)
    
    await redis.hset(f"room:{req.room_id}:players", user_id, player.model_dump_json())
    
    await RedisStore.publish(f"channel:{req.room_id}", {
        "type": "system",
        "action": "player_joined",
        "player": player.model_dump()
    })
    
    meta = await redis.hgetall(f"room:{req.room_id}:meta")
    players_raw = await redis.hgetall(f"room:{req.room_id}:players")
    players = [json.loads(p) for p in players_raw.values()]
    
    return {"room_id": req.room_id, "user_id": user_id, "player": player, "meta": meta, "players": players}
