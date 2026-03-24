import asyncio
import g4f

async def test():
    prompt = "Generate a single random subject for a 20-Questions guessing game. It must be either a highly famous person, a extremely famous place, or a common space-related object. Reply ONLY with the exact name, no punctuation, no extra text."
    try:
        response = await g4f.ChatCompletion.create_async(
            model=g4f.models.gpt_4,
            messages=[{"role": "user", "content": prompt}]
        )
        print("SUCCESS:", response)
    except Exception as e:
        print("ERROR:", e)

asyncio.run(test())
