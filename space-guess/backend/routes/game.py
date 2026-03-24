import uuid
import json
import random
from fastapi import APIRouter, HTTPException
from models import GameStart, QuestionSubmit, GuessSubmit, HostAnswerSubmit
from redis_client import RedisStore
from ai_service import get_yes_no_answer, generate_random_word_via_ai

import httpx

router = APIRouter()

async def fetch_random_word() -> str:
    return await generate_random_word_via_ai()

@router.post("/start")
async def start_game(req: GameStart):
    redis = RedisStore.get()
    meta = await redis.hgetall(f"room:{req.room_id}:meta")
    if not meta:
        raise HTTPException(status_code=404, detail="Room not found")
        
    players_raw = await redis.hgetall(f"room:{req.room_id}:players")
    player_info_raw = players_raw.get(req.user_id)
    if not player_info_raw:
        raise HTTPException(status_code=403, detail="Not in room")
    # Verify host
    player_info = json.loads(player_info_raw)
    if not player_info.get("is_host"):
        raise HTTPException(status_code=403, detail="Only host can start")

    if meta.get("mode", "AI") == "AI":
        word = await fetch_random_word()
        await redis.set(f"room:{req.room_id}:word", word, ex=3600)
    
    player_ids = list(players_raw.keys())
    first_turn = random.choice(player_ids)
    await redis.set(f"room:{req.room_id}:turn", first_turn, ex=3600)
    
    await redis.hset(f"room:{req.room_id}:meta", "status", "playing")
    await redis.hset(f"room:{req.room_id}:meta", "question_count", "0")
    
    await RedisStore.publish(f"channel:{req.room_id}", {
        "type": "system",
        "action": "game_started",
        "turn": first_turn
    })
    
    return {"status": "started"}

@router.post("/question")
async def ask_question(req: QuestionSubmit):
    redis = RedisStore.get()
    current_turn = await redis.get(f"room:{req.room_id}:turn")
    if current_turn != req.user_id:
        raise HTTPException(status_code=400, detail="Not your turn")
        
    meta = await redis.hgetall(f"room:{req.room_id}:meta")
    if meta.get("status") != "playing":
        raise HTTPException(status_code=400, detail="Game not playing")
        
    
    mode = meta.get("mode", "AI")
    
    players_raw = await redis.hgetall(f"room:{req.room_id}:players")
    player_info = json.loads(players_raw.get(req.user_id, "{}"))
    username = player_info.get("username", "Unknown")
    
    hide_others = meta.get("hide_other_player_questions") == "True"
    visible_to = req.user_id if hide_others else None
    
    q_msg = {
        "id": str(uuid.uuid4()),
        "user_id": req.user_id,
        "username": username,
        "message": req.question,
        "type": "question",
        "visible_to": visible_to
    }
    
    if mode == "HOST":
        await redis.rpush(f"room:{req.room_id}:chat", json.dumps(q_msg))
        await redis.hset(f"room:{req.room_id}:meta", "awaiting_host", "True")
        # Store pending question so host can verify or for UI context
        await redis.set(f"room:{req.room_id}:pending_question", json.dumps(q_msg), ex=3600)
        
        await RedisStore.publish(f"channel:{req.room_id}", {
            "type": "chat",
            "messages": [q_msg]
        })
        await RedisStore.publish(f"channel:{req.room_id}", {
            "type": "system",
            "action": "awaiting_host_response"
        })
        return {"status": "awaiting_host"}

    # --- AI MODE Logic ---
    word = await redis.get(f"room:{req.room_id}:word")
    answer = await get_yes_no_answer(req.question, word)
    
    q_count = int(meta.get("question_count", 0)) + 1
    await redis.hset(f"room:{req.room_id}:meta", "question_count", str(q_count))
    
    a_msg = {
        "id": str(uuid.uuid4()),
        "user_id": "system",
        "username": "AI",
        "message": answer,
        "type": "answer",
        "visible_to": visible_to
    }
    
    await redis.rpush(f"room:{req.room_id}:chat", json.dumps(q_msg), json.dumps(a_msg))
    
    # Change turn
    player_ids = list(players_raw.keys())
    idx = player_ids.index(req.user_id)
    next_turn = player_ids[(idx + 1) % len(player_ids)]
    await redis.set(f"room:{req.room_id}:turn", next_turn)
    
    await RedisStore.publish(f"channel:{req.room_id}", {
        "type": "chat",
        "messages": [q_msg, a_msg]
    })
    
    # End game if total chances reached
    chances_per_player = int(meta.get("max_questions", 5))
    num_players = len(player_ids)
    total_allowed_questions = chances_per_player * num_players
    
    if q_count >= total_allowed_questions:
        await redis.hset(f"room:{req.room_id}:meta", "status", "finished")
        end_msg = {"type": "system", "action": "game_over", "reason": "max_questions", "word": word}
        await RedisStore.publish(f"channel:{req.room_id}", end_msg)
    else:
        await RedisStore.publish(f"channel:{req.room_id}", {
            "type": "system",
            "action": "turn_change",
            "turn": next_turn
        })
        
    return {"status": "ok", "answer": answer}

@router.post("/host_answer")
async def host_answer(req: HostAnswerSubmit):
    redis = RedisStore.get()
    meta = await redis.hgetall(f"room:{req.room_id}:meta")
    
    # Verify game is playing and awaiting host
    if meta.get("status") != "playing" or meta.get("awaiting_host") != "True":
        raise HTTPException(status_code=400, detail="Not awaiting host response")
        
    players_raw = await redis.hgetall(f"room:{req.room_id}:players")
    player_info = json.loads(players_raw.get(req.user_id, "{}"))
    if not player_info.get("is_host"):
        raise HTTPException(status_code=403, detail="Only host can answer")
        
    pending_q_str = await redis.get(f"room:{req.room_id}:pending_question")
    if not pending_q_str:
        raise HTTPException(status_code=400, detail="No pending question")
        
    pending_q = json.loads(pending_q_str)
    
    # Increment question count
    q_count = int(meta.get("question_count", 0)) + 1
    await redis.hset(f"room:{req.room_id}:meta", "question_count", str(q_count))
    await redis.hset(f"room:{req.room_id}:meta", "awaiting_host", "False")
    await redis.delete(f"room:{req.room_id}:pending_question")
    
    a_msg = {
        "id": str(uuid.uuid4()),
        "user_id": "system",
        "username": "HOST",
        "message": req.answer.upper(),
        "type": "answer",
        "visible_to": pending_q.get("visible_to")
    }
    
    await redis.rpush(f"room:{req.room_id}:chat", json.dumps(a_msg))
    
    # Turn logic
    current_turn = await redis.get(f"room:{req.room_id}:turn")
    player_ids = list(players_raw.keys())
    try:
        idx = player_ids.index(current_turn)
    except ValueError:
        idx = 0
    next_turn = player_ids[(idx + 1) % len(player_ids)]
    await redis.set(f"room:{req.room_id}:turn", next_turn)
    
    await RedisStore.publish(f"channel:{req.room_id}", {
        "type": "chat",
        "messages": [a_msg]
    })
    
    await RedisStore.publish(f"channel:{req.room_id}", {
        "type": "system",
        "action": "host_answer_submitted"
    })
    
    # Check max questions
    chances_per_player = int(meta.get("max_questions", 5))
    num_players = len(player_ids)
    if q_count >= chances_per_player * num_players:
        word = await redis.get(f"room:{req.room_id}:word")
        await redis.hset(f"room:{req.room_id}:meta", "status", "finished")
        end_msg = {"type": "system", "action": "game_over", "reason": "max_questions", "word": word}
        await RedisStore.publish(f"channel:{req.room_id}", end_msg)
    else:
        await RedisStore.publish(f"channel:{req.room_id}", {
            "type": "system",
            "action": "turn_change",
            "turn": next_turn
        })
        
    return {"status": "ok"}

@router.post("/guess")
async def make_guess(req: GuessSubmit):
    redis = RedisStore.get()
    meta = await redis.hgetall(f"room:{req.room_id}:meta")
    if meta.get("status") != "playing":
        raise HTTPException(status_code=400, detail="Game not playing")
        
    word = await redis.get(f"room:{req.room_id}:word")
    
    players_raw = await redis.hgetall(f"room:{req.room_id}:players")
    player_info = json.loads(players_raw.get(req.user_id, "{}"))
    username = player_info.get("username", "Unknown")
    
    correct = (req.guess.strip().upper() == word.upper())
    
    g_msg = {
        "id": str(uuid.uuid4()),
        "user_id": req.user_id,
        "username": username,
        "message": f"Guessed: {req.guess} - {'CORRECT' if correct else 'WRONG'}",
        "type": "guess",
        "visible_to": None
    }
    
    await redis.rpush(f"room:{req.room_id}:chat", json.dumps(g_msg))
    await RedisStore.publish(f"channel:{req.room_id}", {
        "type": "chat",
        "messages": [g_msg]
    })
    
    if correct:
        await redis.hset(f"room:{req.room_id}:meta", "status", "finished")
        end_msg = {"type": "system", "action": "game_over", "reason": "guessed", "winner": req.user_id, "word": word}
        await RedisStore.publish(f"channel:{req.room_id}", end_msg)
        
    return {"correct": correct}
