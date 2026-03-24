import g4f

try:
    response = g4f.ChatCompletion.create(
        model=g4f.models.gpt_4,
        messages=[{"role": "user", "content": "You are a YES/NO bot. Is the earth flat? Answer YES or NO."}]
    )
    print("SUCCESS: ", response)
except Exception as e:
    print("FAILED: ", e)
