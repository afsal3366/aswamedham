import uuid
import json
from fastapi import APIRouter, HTTPException
from models import RoomCreate, RoomJoin, RoomLeave, Player
from redis_client import RedisStore
from ai_service import get_random_person, generate_random_word_via_ai

router = APIRouter()

@router.post("/create")
async def create_room(req: RoomCreate):
    room_id = str(uuid.uuid4())[:8].upper()
    user_id = str(uuid.uuid4())
    
    redis = RedisStore.get()
    
    # Store all mission parameters in meta for start_game to used
    meta = {
        "max_questions": str(req.max_questions),
        "hide_other_player_questions": str(req.hide_other_player_questions),
        "status": "lobby",
        "question_count": "0",
        "mode": req.mode.upper(),
        "awaiting_host": "False",
        "is_single_player": str(req.is_single_player),
        "category": req.category if req.category else "",
        "difficulty": req.difficulty if req.difficulty else "medium"
    }
    await redis.hset(f"room:{room_id}:meta", mapping=meta)
    
    if req.mode.upper() == "HOST" and req.custom_word:
        await redis.set(f"room:{room_id}:word", req.custom_word.upper(), ex=3600)
    # AI mode word generation is deferred to start_game to allow for 
    # category-aware generation without redundant calls here.
    
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
    
    # Fetch chat history for joining players
    chat_raw = await redis.lrange(f"room:{req.room_id}:chat", 0, -1)
    messages = [json.loads(m) for m in chat_raw]
    
    return {"room_id": req.room_id, "user_id": user_id, "player": player, "meta": meta, "players": players, "messages": messages}

@router.post("/leave")
async def leave_room(req: RoomLeave):
    redis = RedisStore.get()
    
    players_raw = await redis.hgetall(f"room:{req.room_id}:players")
    if req.user_id not in players_raw:
        return {"status": "already_left"}
        
    player_info = json.loads(players_raw[req.user_id])
    is_host = player_info.get("is_host", False)
    
    await redis.hdel(f"room:{req.room_id}:players", req.user_id)
    
    await RedisStore.publish(f"channel:{req.room_id}", {
        "type": "system",
        "action": "player_left",
        "user_id": req.user_id,
        "is_host": is_host
    })
    
    # If host leaves, the game is over/room is closed
    if is_host:
        await redis.hset(f"room:{req.room_id}:meta", "status", "finished")
        await RedisStore.publish(f"channel:{req.room_id}", {
            "type": "system",
            "action": "room_closed",
            "reason": "host_left"
        })
        
    return {"status": "ok"}
