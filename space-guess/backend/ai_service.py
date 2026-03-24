import g4f
import random

async def generate_random_word_via_ai() -> str:
    prompt = "Generate a completely random, incredibly famous historical person, famous world landmark, or space object. Please ensure it is highly unique (do not pick Albert Einstein or Eiffel Tower). Reply ONLY with the exact name, and nothing else (no punctuation)."
    try:
        response = await g4f.ChatCompletion.create_async(
            model=g4f.models.gpt_4,
            messages=[{"role": "user", "content": prompt}]
        )
        word = response.strip().upper()
        # Clean up any potential markdown or quotes
        word = word.replace('"', '').replace('.', '').replace('*', '')
        if len(word) > 25 or len(word) < 2:
            raise ValueError("Invalid length")
        return word
    except Exception as e:
        print(f"Word Gen Error: {e}")
        return "AI GENERATOR ERROR"


async def get_yes_no_answer(question: str, word: str) -> str:
    prompt = f"""You are a strict yes/no answering system for a guessing game.
Hidden word: {word}
User question: {question}

Rules:
* If the user question is random gibberish, not a valid question, or completely unclear, answer exactly: "QUESTION IS NOT CLEAR"
* Otherwise, ONLY answer "YES", "NO", or "MAYBE".
* Do not reveal the word.
* Be logically consistent."""
    
    try:
        response = await g4f.ChatCompletion.create_async(
            model=g4f.models.gpt_4,
            messages=[{"role": "user", "content": prompt}]
        )
        answer = response.strip().upper()
        if "YES" in answer: return "YES"
        elif "NO" in answer: return "NO"
        elif "NOT CLEAR" in answer or "UNCLEAR" in answer: return "QUESTION IS NOT CLEAR"
        else: return "MAYBE"
    except Exception as e:
        print(f"AI Error: {e}")
        return "MAYBE (AI API Error / Backend Failure)"
