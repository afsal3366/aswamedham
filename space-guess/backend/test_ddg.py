from duckduckgo_search import DDGS
import asyncio

async def test():
    try:
        results = DDGS().chat("You are a strict yes/no bot. Is Earth round? Answer YES or NO.")
        print(f"SUCCESS: {results}")
    except Exception as e:
        print(f"FAILED: {e}")

asyncio.run(test())
