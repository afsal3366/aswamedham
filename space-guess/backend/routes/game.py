import uuid
import json
import random
from fastapi import APIRouter, HTTPException
from models import GameStart, QuestionSubmit, GuessSubmit, HostAnswerSubmit, RoomKick, SkipTurn
from redis_client import RedisStore
from ai_service import get_yes_no_answer, generate_random_word_via_ai, get_random_person

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
        category = meta.get("category")
        difficulty = meta.get("difficulty", "medium")
        if category and category != "null":
            word = await get_random_person(category, difficulty)
        else:
            word = await fetch_random_word()
        await redis.set(f"room:{req.room_id}:word", word, ex=3600)
    
    player_ids = list(players_raw.keys())
    # If Host Mode, exclude the host from turn rotation
    if meta.get("mode") == "HOST":
        player_ids = [pid for pid in player_ids if not json.loads(players_raw[pid]).get("is_host")]
        
    if not player_ids: # Should not happen if room creation logic is sound
         raise HTTPException(status_code=400, detail="No players besides host")

    first_turn = random.choice(player_ids)
    await redis.set(f"room:{req.room_id}:turn", first_turn, ex=3600)
    
    await redis.hset(f"room:{req.room_id}:meta", "status", "playing")
    await redis.hset(f"room:{req.room_id}:meta", "question_count", "0")
    await redis.delete(f"room:{req.room_id}:guess_counts")
    await redis.delete(f"room:{req.room_id}:chat")
    
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
    
    await RedisStore.publish(f"channel:{req.room_id}", {
        "type": "chat",
        "messages": [q_msg, a_msg]
    })
    
    # Check max questions
    total_max_questions = int(meta.get("max_questions", 20))
    if q_count >= total_max_questions:
        await redis.hset(f"room:{req.room_id}:meta", "status", "finished")
        end_msg = {"type": "system", "action": "game_over", "reason": "max_questions", "word": word}
        await RedisStore.publish(f"channel:{req.room_id}", end_msg)
    else:
        # Change turn
        await rotate_turn(req.room_id, req.user_id)
        
    return {"status": "ok", "answer": answer}

@router.post("/host_answer")
async def host_answer(req: HostAnswerSubmit):
    redis = RedisStore.get()
    meta = await redis.hgetall(f"room:{req.room_id}:meta")
    
    # Verify game is playing and awaiting host
    awaiting = meta.get("awaiting_host", "False")
    status = meta.get("status", "unknown")
    print(f"DEBUG: Host Answer Request - Room: {req.room_id}, User: {req.user_id}, Status: {status}, Awaiting: {awaiting}")
    
    if status != "playing" or awaiting != "True":
        print(f"DEBUG: Host answer REJECTED. Room: {req.room_id}, Status: {status}, Awaiting: {awaiting}")
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
    
    await RedisStore.publish(f"channel:{req.room_id}", {
        "type": "chat",
        "messages": [a_msg]
    })
    
    # Sync Fix: Notify all clients that the host has submitted their answer
    await RedisStore.publish(f"channel:{req.room_id}", {
        "type": "system",
        "action": "host_answer_submitted",
        "user_id": req.user_id,
        "answer": req.answer
    })
    
    # Check max questions (Global total)
    total_max_questions = int(meta.get("max_questions", 5))
    if q_count >= total_max_questions:
        word = await redis.get(f"room:{req.room_id}:word")
        await redis.hset(f"room:{req.room_id}:meta", "status", "finished")
        end_msg = {"type": "system", "action": "game_over", "reason": "max_questions", "word": word}
        await RedisStore.publish(f"channel:{req.room_id}", end_msg)
    else:
        # Crucial: Advance turn based on the person who ASKED the question
        await rotate_turn(req.room_id, pending_q["user_id"])
        
    return {"status": "ok"}

@router.post("/guess")
async def make_guess(req: GuessSubmit):
    redis = RedisStore.get()
    meta = await redis.hgetall(f"room:{req.room_id}:meta")
    if meta.get("status") != "playing":
        raise HTTPException(status_code=400, detail="Game not playing")
        
    word = await redis.get(f"room:{req.room_id}:word")
    
    # Track and enforce guess count
    guess_counts = await redis.hgetall(f"room:{req.room_id}:guess_counts")
    user_guess_count = int(guess_counts.get(req.user_id, 0))
    
    if user_guess_count >= 3:
        raise HTTPException(status_code=403, detail="You have reached the maximum number of guesses (3).")

    players_raw = await redis.hgetall(f"room:{req.room_id}:players")
    player_info = json.loads(players_raw.get(req.user_id, "{}"))
    username = player_info.get("username", "Unknown")

    correct = (req.guess.strip().upper() == word.upper())
    
    # Increment guess count if wrong
    if not correct:
        await redis.hset(f"room:{req.room_id}:guess_counts", req.user_id, str(user_guess_count + 1))
    
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

@router.post("/kick")
async def kick_player(req: RoomKick):
    redis = RedisStore.get()
    players_raw = await redis.hgetall(f"room:{req.room_id}:players")
    host_info = json.loads(players_raw.get(req.host_id, "{}"))
    if not host_info.get("is_host"):
        raise HTTPException(status_code=403, detail="Only host can kick")
    
    if req.target_user_id not in players_raw:
        raise HTTPException(status_code=404, detail="Target player not found")
        
    await redis.hdel(f"room:{req.room_id}:players", req.target_user_id)
    
    # Notify everyone
    await RedisStore.publish(f"channel:{req.room_id}", {
        "type": "system",
        "action": "player_kicked",
        "user_id": req.target_user_id
    })
    
    # If it was their turn, skip it
    current_turn = await redis.get(f"room:{req.room_id}:turn")
    if current_turn == req.target_user_id:
        await rotate_turn(req.room_id, req.target_user_id)

@router.post("/skip_turn")
async def skip_turn_endpoint(req: SkipTurn):
    redis = RedisStore.get()
    # Only rotate if the current turn matches what the client observed
    # This prevents multiple timeout triggers from skipping multiple players
    current_turn = await redis.get(f"room:{req.room_id}:turn")
    await rotate_turn(req.room_id, current_turn)
    return {"status": "ok"}

async def rotate_turn(room_id: str, expected_current_user_id: str):
    redis = RedisStore.get()
    
    # Atomic check: only rotate if the turn hasn't changed already
    actual_current = await redis.get(f"room:{room_id}:turn")
    if actual_current != expected_current_user_id:
        print(f"DEBUG: Skipping rotate_turn. Expected {expected_current_user_id}, but current is {actual_current}")
        return
        
    players_raw = await redis.hgetall(f"room:{room_id}:players")
    meta = await redis.hgetall(f"room:{room_id}:meta")
    
    player_ids = list(players_raw.keys())
    if meta.get("mode") == "HOST":
        player_ids = [pid for pid in player_ids if not json.loads(players_raw[pid]).get("is_host")]
        
    if not player_ids:
        return

    try:
        idx = player_ids.index(expected_current_user_id)
        next_turn = player_ids[(idx + 1) % len(player_ids)]
    except ValueError:
        # User who was current turn might have been kicked/left
        next_turn = random.choice(player_ids)
        
    await redis.set(f"room:{room_id}:turn", next_turn)
    # Clear awaiting_host if we skip the host's turn (timer on host side)
    print(f"DEBUG: Rotating Turn - Room: {room_id}, New Turn: {next_turn}, Clearing awaiting_host")
    await redis.hset(f"room:{room_id}:meta", "awaiting_host", "False")
    
    await RedisStore.publish(f"channel:{room_id}", {
        "type": "system",
        "action": "turn_change",
        "turn": next_turn
    })
