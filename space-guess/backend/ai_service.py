import g4f
import random
import json
import os
import asyncio
import httpx
from g4f.client import Client
from redis_client import RedisStore

# Initialize g4f client
client = Client()

# Load word pool
WORD_POOL = {}
pool_path = os.path.join(os.path.dirname(__file__), "word_pool.json")
try:
    if os.path.exists(pool_path):
        with open(pool_path, "r") as f:
            WORD_POOL = json.load(f)
except Exception as e:
    print(f"Error loading word pool: {e}")

async def _call_ollama(prompt: str, model: str = "llama3:latest") -> str:
    """Fast local LLM call using Ollama with strict length limits."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post("http://127.0.0.1:11434/api/generate", json={
                "model": model,
                "prompt": f"System: Reply ONLY with 1-3 words. Be extremely brief.\nUser: {prompt}",
                "stream": False,
                "options": {
                    "num_predict": 10,  # Stop very early
                    "temperature": 0.0
                }
            })
            if resp.status_code == 200:
                return resp.json().get("response", "").strip()
            else:
                print(f"Ollama RPC Error: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"Ollama Network Error: {repr(e)}")
    return None

async def _call_ai_batch(prompt: str, models: list) -> str:
    """Try local Ollama first, then fall back to g4f parallel batch."""
    # PRIMARY SOURCE: Local Ollama (Super fast & reliable)
    ollama_result = await _call_ollama(prompt)
    if ollama_result:
        return ollama_result

    # SECONDARY SOURCE/FALLBACK: g4f parallel execution
    async def _single_call(model):
        try:
            response = await g4f.ChatCompletion.create_async(
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.strip()
        except:
            return None

    tasks = [asyncio.create_task(_single_call(m)) for m in models]
    
    try:
        # Wait up to 10s for the first one to finish
        done, pending = await asyncio.wait(tasks, timeout=10.0, return_when=asyncio.FIRST_COMPLETED)
        
        # Cancel pending tasks
        for task in pending:
            task.cancel()
            
        for task in done:
            try:
                result = task.result()
                if result:
                    return result
            except:
                continue
    except Exception as e:
        print(f"Parallel AI Error: {e}")
        
    return None

async def generate_random_word_via_ai() -> str:
    redis = RedisStore.get()
    salt = hex(random.getrandbits(32))[2:]
    prompt = f"Generate a completely random, incredibly famous historical person, famous world landmark, or space object. " \
             f"Prioritize people or landmarks from Kerala, India or India in general (e.g., Mammootty, Taj Mahal, ISRO). " \
             f"Please ensure it is highly unique. Salt: {salt}. Reply ONLY with the exact name (e.g., MOHANLAL), and nothing else (no punctuation)."
    
    # Use fast models for generation fallback
    models = ["gpt-3.5-turbo", "gpt-4", "claude-3-haiku"]
    
    result = await _call_ai_batch(prompt, models)
    if result:
        word = result.upper().replace('"', '').replace('.', '').replace('*', '')
        if 2 < len(word) < 40:
            if not await redis.sismember("famous_people_cache", word):
                await redis.sadd("famous_people_cache", word)
                return word
            
    # Immediate Fallback to Pool
    if WORD_POOL:
        cat = random.choice(list(WORD_POOL.keys()))
        word = random.choice(WORD_POOL[cat])
        return word
            
    return "INTERNATIONAL SPACE STATION"

async def get_random_person(category: str = "actors", difficulty: str = "medium") -> str:
    redis = RedisStore.get()
    
    # If category is "others" or empty, use the general generator
    if not category or category.lower() == "others":
        return await generate_random_word_via_ai()
        
    salt = hex(random.getrandbits(32))[2:]
    used_people = list(await redis.smembers("famous_people_cache"))
    avoid_list = ", ".join(used_people[-10:]) if used_people else "None"
    
    prompt = (
        f"Generate a famous person in the category: {category}. Difficulty: {difficulty}. "
        f"The target audience is from Kerala, India, so prioritize famous people from Kerala or highly famous Indians. "
        f"MUST NOT BE: {avoid_list}. Generate a different name every time. salt={salt}. "
        f"Reply ONLY with the exact name (e.g., SACHIN TENDULKAR), and nothing else."
    )
    
    models = ["gpt-3.5-turbo", "gpt-4"]
    result = await _call_ai_batch(prompt, models)
    
    if result:
        person = result.upper().replace('"', '').replace('.', '').replace('*', '')
        if not await redis.sismember("famous_people_cache", person) and 2 < len(person) < 45:
            await redis.sadd("famous_people_cache", person)
            return person
            
    # Fast Pool Fallback
    if category in WORD_POOL:
        candidates = WORD_POOL[category][:]
        random.shuffle(candidates)
        for person in candidates:
            if not await redis.sismember("famous_people_cache", person):
                await redis.sadd("famous_people_cache", person)
                return person
        return random.choice(WORD_POOL[category])
        
    fallbacks = {"actors": "TOM HANKS", "athletes": "SACHIN TENDULKAR", "scientists": "CV RAMAN"}
    return fallbacks.get(category.lower(), "NEIL ARMSTRONG")

async def get_yes_no_answer(question: str, word: str) -> str:
    prompt = f"""You are a strict yes/no answering system for a guessing game.
Hidden word: {word}
User question: {question}

Rules:
* SPELLING/TYPOS: If the user question or the hidden word has minor spelling errors or typos, be lenient and answer based on the intended meaning.
* If the user question is random gibberish or completely unclear, answer exactly: "QUESTION IS NOT CLEAR"
* Otherwise, ONLY answer "YES", "NO", or "MAYBE".
* Do not reveal the word.
* Be logically consistent."""
    
    models = ["gpt-3.5-turbo", "gpt-4", "llama-3-8b"]
    result = await _call_ai_batch(prompt, models)
    
    if result:
        answer = result.upper()
        if "YES" in answer: return "YES"
        if "NO" in answer: return "NO"
        if "NOT CLEAR" in answer or "UNCLEAR" in answer: return "QUESTION IS NOT CLEAR"
        if "MAYBE" in answer: return "MAYBE"
            
    return "MAYBE (AI Provider Delay)"
