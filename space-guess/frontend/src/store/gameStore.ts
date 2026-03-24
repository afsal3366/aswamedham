import { create } from 'zustand';

export type Player = {
    id: string;
    username: string;
    is_host: boolean;
};

export type ChatMessage = {
    id: string;
    user_id: string;
    username: string;
    message: string;
    type: 'question' | 'answer' | 'system' | 'guess';
    visible_to?: string | null;
};

export interface GameState {
    roomId: string | null;
    userId: string | null;
    username: string;
    isHost: boolean;
    players: Player[];
    messages: ChatMessage[];
    status: 'lobby' | 'playing' | 'finished';
    currentTurn: string | null;
    maxQuestions: number;
    word: string | null;
    winner: string | null;
    gameMode: 'AI' | 'HOST';
    awaitingHost: boolean;

    setRoomInfo: (roomId: string, userId: string, username: string, isHost: boolean, maxQ: number, mode?: 'AI' | 'HOST') => void;
    setAwaitingHost: (awaiting: boolean) => void;
    setPlayers: (players: Player[]) => void;
    addMessage: (msg: ChatMessage) => void;
    addMessages: (msgs: ChatMessage[]) => void;
    setStatus: (status: 'lobby' | 'playing' | 'finished') => void;
    setTurn: (turn: string) => void;
    reset: () => void;
    setGameOver: (reason: string, word: string, winner?: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
    roomId: null,
    userId: null,
    username: '',
    isHost: false,
    players: [],
    messages: [],
    status: 'lobby',
    currentTurn: null,
    maxQuestions: 10,
    word: null,
    winner: null,
    gameMode: 'AI',
    awaitingHost: false,

    setRoomInfo: (roomId, userId, username, isHost, maxQ, mode) => set({ roomId, userId, username, isHost, maxQuestions: maxQ, gameMode: mode || 'AI' }),
    setAwaitingHost: (awaiting) => set({ awaitingHost: awaiting }),
    setPlayers: (players) => set({ players }),
    addMessage: (msg) => set((state) => {
        if (state.messages.find(m => m.id === msg.id)) return state;
        return { messages: [...state.messages, msg] };
    }),
    addMessages: (msgs) => set((state) => {
        const newMsgs = msgs.filter(m => !state.messages.find(existing => existing.id === m.id));
        return { messages: [...state.messages, ...newMsgs] };
    }),
    setStatus: (status) => set({ status }),
    setTurn: (turn) => set({ currentTurn: turn }),
    setGameOver: (reason, word, winner) => set({ status: 'finished', word, winner: winner || null }),
    reset: () => set({
        roomId: null, userId: null, username: '', isHost: false, players: [],
        messages: [], status: 'lobby', currentTurn: null, word: null, winner: null, gameMode: 'AI', awaitingHost: false
    }),
}));
