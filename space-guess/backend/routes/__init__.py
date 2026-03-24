from fastapi import APIRouter
from . import room, game, stream

router = APIRouter()
router.include_router(room.router, prefix="/room", tags=["Room"])
router.include_router(game.router, prefix="/game", tags=["Game"])
router.include_router(stream.router, tags=["Stream"])
