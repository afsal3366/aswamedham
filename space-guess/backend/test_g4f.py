import g4f
from g4f.client import Client
import asyncio

async def test():
    client = Client()
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "You are a strict yes/no bot. Is Earth round? Answer YES or NO."}]
        )
        print("SUCCESS: ", response.choices[0].message.content)
    except Exception as e:
        print(f"FAILED: {e}")

asyncio.run(test())
