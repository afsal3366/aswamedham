import g4f
import random
import json
import os
import time
from g4f.client import Client
from redis_client import RedisStore

# Initialize g4f client for a more robust API
client = Client()

# Load word pool for high-quality fallbacks/randomness
WORD_POOL = {}
pool_path = os.path.join(os.path.dirname(__file__), "word_pool.json")
try:
    if os.path.exists(pool_path):
        with open(pool_path, "r") as f:
            WORD_POOL = json.load(f)
except Exception as e:
    print(f"Error loading word pool: {e}")

async def generate_random_word_via_ai() -> str:
    redis = RedisStore.get()
    salt = hex(random.getrandbits(32))[2:]
    prompt = f"Generate a completely random, incredibly famous historical person, famous world landmark, or space object. Please ensure it is highly unique. Salt: {salt}. Reply ONLY with the exact name, and nothing else (no punctuation)."
    # Try different models to increase reliability
    models = ["gpt-4", "gpt-3.5-turbo", "default"]
    
    for model in models:
        try:
            response = await g4f.ChatCompletion.create_async(
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )
            word = response.strip().upper()
            word = word.replace('"', '').replace('.', '').replace('*', '')
            if 2 < len(word) < 40:
                if not await redis.sismember("famous_people_cache", word):
                    await redis.sadd("famous_people_cache", word)
                    return word
        except Exception as e:
            print(f"Word Gen Error ({model}): {e}")
            
    # Fallback to Pool if AI fails or returns repeat
    if WORD_POOL:
        cat = random.choice(list(WORD_POOL.keys()))
        word = random.choice(WORD_POOL[cat])
        return word
            
    return "INTERNATIONAL SPACE STATION"

async def get_random_person(category: str = "actors", difficulty: str = "medium") -> str:
    redis = RedisStore.get()
    
    # Try AI first with higher randomization
    salt = hex(random.getrandbits(32))[2:]
    used_people = list(await redis.smembers("famous_people_cache"))
    avoid_list = ", ".join(used_people[-15:]) if used_people else "None"
    
    prompt = (
        f"Generate a famous person in the category: {category}. Difficulty: {difficulty}. "
        f"MUST NOT BE: {avoid_list}. Generate a different name every time. salt={salt}. "
        f"Reply ONLY with the exact name, and nothing else."
    )
    
    models = ["gpt-4", "gpt-3.5-turbo"]
    for model in models:
        try:
            response = await g4f.ChatCompletion.create_async(
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )
            person = response.strip().upper().replace('"', '').replace('.', '').replace('*', '')
            if not await redis.sismember("famous_people_cache", person) and 2 < len(person) < 45:
                await redis.sadd("famous_people_cache", person)
                return person
        except: pass
            
    # AI failed or returned repeat -> Use Word Pool
    if category in WORD_POOL:
        candidates = WORD_POOL[category][:]
        random.shuffle(candidates)
        for person in candidates:
            if not await redis.sismember("famous_people_cache", person):
                await redis.sadd("famous_people_cache", person)
                return person
        # If all candidates used, just pick one randomly
        return random.choice(WORD_POOL[category])
        
    fallbacks = {"actors": "TOM HANKS", "athletes": "SACHIN TENDULKAR", "scientists": "CV RAMAN"}
    return fallbacks.get(category.lower(), "NEIL ARMSTRONG")

async def get_yes_no_answer(question: str, word: str) -> str:
    prompt = f"""You are a strict yes/no answering system for a guessing game.
Hidden word: {word}
User question: {question}

Rules:
* If the user question is random gibberish, not a valid question, or completely unclear, answer exactly: "QUESTION IS NOT CLEAR"
* Otherwise, ONLY answer "YES", "NO", or "MAYBE".
* Do not reveal the word.
* Be logically consistent."""
    
    models = ["gpt-4", "gpt-3.5-turbo"]
    
    for _ in range(2):
        for model in models:
            try:
                response = await g4f.ChatCompletion.create_async(
                    model=model,
                    messages=[{"role": "user", "content": prompt}]
                )
                answer = response.strip().upper()
                if "YES" in answer: return "YES"
                elif "NO" in answer: return "NO"
                elif "NOT CLEAR" in answer or "UNCLEAR" in answer: return "QUESTION IS NOT CLEAR"
                elif "MAYBE" in answer: return "MAYBE"
            except Exception as e:
                print(f"AI Answer Error ({model}): {e}")
            
    return "MAYBE (AI Provider Offline)"
