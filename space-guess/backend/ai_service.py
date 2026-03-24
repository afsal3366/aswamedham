import g4f
from g4f.client import Client
from redis_client import RedisStore

# Initialize g4f client for a more robust API
client = Client()

async def generate_random_word_via_ai() -> str:
    prompt = "Generate a completely random, incredibly famous historical person, famous world landmark, or space object. Please ensure it is highly unique (do not pick Albert Einstein or Eiffel Tower). Reply ONLY with the exact name, and nothing else (no punctuation)."
    # Try different models to increase reliability
    models = ["gpt-4", "gpt-3.5-turbo", "default"]
    
    for model in models:
        try:
            # Note: create is synchronous in g4f Client, but we can run it in a thread or 
            # use the low-level async completion if we want true async, 
            # but for word gen a small block is okay or we can use the old async way.
            # Reverting to the old async way but with correct model objects or strings.
            
            response = await g4f.ChatCompletion.create_async(
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )
            word = response.strip().upper()
            word = word.replace('"', '').replace('.', '').replace('*', '')
            if 2 < len(word) < 30:
                return word
        except Exception as e:
            print(f"Word Gen Error ({model}): {e}")
            
    return "INTERNATIONAL SPACE STATION"

async def get_random_person(category: str = "actors", difficulty: str = "medium") -> str:
    prompt = f"Generate a famous person in the category: {category}. Difficulty: {difficulty} (easy=super famous, hard=niche). Reply ONLY with the exact name, and nothing else (no punctuation or info)."
    redis = RedisStore.get()
    
    models = ["gpt-4", "gpt-3.5-turbo"]
    
    for _ in range(2):
        for model in models:
            try:
                response = await g4f.ChatCompletion.create_async(
                    model=model,
                    messages=[{"role": "user", "content": prompt}]
                )
                person = response.strip().upper().replace('"', '').replace('.', '').replace('*', '')
                if not await redis.sismember("famous_people_cache", person) and 2 < len(person) < 40:
                    await redis.sadd("famous_people_cache", person)
                    return person
            except: pass
            
    # Category fallback
    fallbacks = {
        "actors": "TOM HANKS",
        "athletes": "USAIN BOLT",
        "scientists": "MARIE CURIE"
    }
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
