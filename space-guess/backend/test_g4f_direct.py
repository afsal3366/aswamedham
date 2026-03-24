import g4f
import asyncio

async def test():
    try:
        response = await g4f.ChatCompletion.create_async(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "You are a strict yes/no bot. Is Earth round? Answer YES or NO."}],
            provider=g4f.Provider.Blackbox
        )
        print("SUCCESS: ", response)
    except Exception as e:
        print(f"FAILED: {e}")

asyncio.run(test())
