# Space 20 Questions Game

A full-stack real-time multiplayer AI-based guessing game with a modern space-themed UI.

## Architecture

- **Backend**: FastAPI + Redis (Pub/Sub & Storage) + Server-Sent Events (SSE).
- **Frontend**: Expo React Native (Web + Mobile), Zustand, React Native Reanimated.
- **AI**: OpenAI API for YES/NO/MAYBE responses.
- **Deployment**: Render Blueprint (render.yaml).

## Deployment (Render)

> [!IMPORTANT]
> To avoid the **"dockerfile parse error: unknown instruction: services:"** error, do NOT create a manual Web Service. Instead, use Render's **Blueprint** feature:
> 1. Go to the Render Dashboard.
> 2. Click **New +** -> **Blueprint**.
> 3. Connect this repository.
> 4. Render will use `render.yaml` to automatically set up Redis, the Backend, and the Frontend.

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- Redis Server running on `localhost:6379`

### 1. Start Redis
Ensure your Redis server is running locally:
```bash
redis-server
```

### 2. Run Backend
Open a terminal and set up the Python backend:
```bash
cd space-guess/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt # (If generated) 
# Or manually install:
# pip install fastapi uvicorn redis openai sse-starlette pydantic pydantic-settings

# Set your OpenAI API Key
export OPENAI_API_KEY="your-api-key-here"

# Start the server
uvicorn main:app --reload --port 8000
```

### 3. Run Frontend
Open a new terminal and set up the Expo frontend:
```bash
cd space-guess/frontend
npm install

# Run on Web (Recommended for quick testing)
npm run web
# Run on iOS simulator
npm run ios
# Run on Android emulator
npm run android
```

## How to Play

1. Open the Web app (`http://localhost:8081`).
2. Player 1: Enter Username -> Create Room. You will get a `Room ID`.
3. Open a second window/tab to simulate Player 2.
4. Player 2: Enter Username + `Room ID` -> Join.
5. Player 1 clicks "Initiate Sequence" to start.
6. Take turns asking questions using the "ASK" input or toggle to "GUESS" when you know the answer!

**Note**: The AI will randomly select a space-themed word from the list `["SUN", "MOON", "MARS", "JUPITER", "BLACK HOLE", "GALAXY", "METEOR", "COMET", "ASTRONAUT", "SPACESHIP", "ALIEN", "NEBULA", "SUPERNOVA", "EARTH", "SATURN", "PLUTO"]`.
