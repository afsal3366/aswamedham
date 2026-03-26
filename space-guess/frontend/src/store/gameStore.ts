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
    questionCount: number;
    gameMode: 'AI' | 'HOST';
    awaitingHost: boolean;
    gameOverReason: string | null;
    timerValue: number;
    timerResetKey: number;
    isSubmitting: boolean;
    userColors: Record<string, string>;
    guessCounts: Record<string, number>;

    setRoomInfo: (roomId: string, userId: string, username: string, isHost: boolean, maxQ: number, mode?: 'AI' | 'HOST') => void;
    setAwaitingHost: (awaiting: boolean) => void;
    setPlayers: (players: Player[]) => void;
    setQuestionCount: (count: number) => void;
    setTimerValue: (val: number) => void;
    triggerTimerReset: () => void;
    setIsSubmitting: (val: boolean) => void;
    addMessage: (msg: ChatMessage) => void;
    addMessages: (msgs: ChatMessage[]) => void;
    setStatus: (status: 'lobby' | 'playing' | 'finished') => void;
    setTurn: (turn: string) => void;
    reset: () => void;
    resetForNewGame: () => void;
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
    maxQuestions: 20,
    word: null,
    winner: null,
    questionCount: 0,
    gameMode: 'AI',
    awaitingHost: false,
    gameOverReason: null,
    timerValue: 60,
    userColors: {
        'AI': '#00FF9F',
        'HOST': '#FF00A0'
    },
    guessCounts: {},
    timerResetKey: 0,
    isSubmitting: false,

    setRoomInfo: (roomId, userId, username, isHost, maxQ, mode) => set({ roomId, userId, username, isHost, maxQuestions: maxQ, gameMode: mode || 'AI' }),
    setAwaitingHost: (awaiting) => set({ awaitingHost: awaiting }),
    setPlayers: (players) => set((state) => {
        const newColors = { ...state.userColors };
        const availableColors = [
            '#00F0FF', '#BC13FE', '#FFDD00', '#FF007C',
            '#39FF14', '#FF4E00', '#007FFF', '#7B2CBF'
        ];
        players.forEach((p, i) => {
            if (!newColors[p.id]) {
                newColors[p.id] = availableColors[i % availableColors.length];
            }
        });
        return { players, userColors: newColors };
    }),
    setQuestionCount: (count) => set({ questionCount: count }),
    setTimerValue: (val) => set({ timerValue: val }),
    triggerTimerReset: () => set((state) => ({
        timerValue: 60,
        timerResetKey: state.timerResetKey + 1
    })),
    setIsSubmitting: (val) => set({ isSubmitting: val }),
    addMessage: (msg) => set((state) => {
        if (state.messages.find(m => m.id === msg.id)) return state;
        const newMessages = [...state.messages, msg];
        const newCount = newMessages.filter(m => m.type === 'question').length;
        const newGuessCounts = { ...state.guessCounts };
        if (msg.type === 'guess') {
            newGuessCounts[msg.user_id] = (newGuessCounts[msg.user_id] || 0) + 1;
        }
        return { messages: newMessages, questionCount: newCount, guessCounts: newGuessCounts };
    }),
    addMessages: (msgs) => set((state) => {
        const newMsgs = msgs.filter(m => !state.messages.find(existing => existing.id === m.id));
        const newMessages = [...state.messages, ...newMsgs];
        const newCount = newMessages.filter(m => m.type === 'question').length;
        const newGuessCounts = { ...state.guessCounts };
        newMsgs.forEach(m => {
            if (m.type === 'guess') {
                newGuessCounts[m.user_id] = (newGuessCounts[m.user_id] || 0) + 1;
            }
        });
        return { messages: newMessages, questionCount: newCount, guessCounts: newGuessCounts };
    }),
    setStatus: (status) => set({ status }),
    setTurn: (turn) => set({ currentTurn: turn }),
    setGameOver: (reason, word, winner) => set({ status: 'finished', gameOverReason: reason, word, winner: winner || null }),
    reset: () => set({
        roomId: null, userId: null, username: '', isHost: false, players: [],
        messages: [], status: 'lobby', currentTurn: null, word: null, winner: null, gameOverReason: null, gameMode: 'AI', awaitingHost: false, questionCount: 0,
        timerValue: 60, timerResetKey: 0, userColors: { 'AI': '#00FF9F', 'HOST': '#FF00A0' }, guessCounts: {}
    }),
    resetForNewGame: () => set({
        messages: [], status: 'playing', currentTurn: null, word: null, winner: null, gameOverReason: null, questionCount: 0,
        awaitingHost: false, timerValue: 60, timerResetKey: 0, guessCounts: {}
    }),
}));
