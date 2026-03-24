from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from redis_client import RedisStore
from routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await RedisStore.init()
    yield
    await RedisStore.close()

app = FastAPI(lifespan=lifespan, title="Space 20 Questions")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Space 20 Questions API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
