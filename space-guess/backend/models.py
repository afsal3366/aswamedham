from pydantic import BaseModel
from typing import List, Optional

class RoomCreate(BaseModel):
    host_username: str
    max_questions: int = 10
    hide_other_player_questions: bool = False
    mode: str = "AI"
    custom_word: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = "medium"
    is_single_player: bool = False

class RoomJoin(BaseModel):
    room_id: str
    username: str

class RoomLeave(BaseModel):
    room_id: str
    user_id: str

class GameStart(BaseModel):
    room_id: str
    user_id: str # must be host to trigger

class QuestionSubmit(BaseModel):
    room_id: str
    user_id: str
    question: str

class HostAnswerSubmit(BaseModel):
    room_id: str
    user_id: str
    answer: str

class RoomKick(BaseModel):
    room_id: str
    host_id: str
    target_user_id: str

class SkipTurn(BaseModel):
    room_id: str
    user_id: str # The user whose turn is being skipped # YES, NO, MAYBE

class GuessSubmit(BaseModel):
    room_id: str
    user_id: str
    guess: str

class ChatMessage(BaseModel):
    id: str
    user_id: str
    username: str
    message: str
    type: str # 'question', 'answer', 'system', 'guess'
    visible_to: Optional[str] = None # None means all, otherwise user_id

class Player(BaseModel):
    id: str
    username: str
    is_host: bool = False
    connected: bool = True
