import axios from 'axios';


import { Platform } from 'react-native';

const getApiUrl = () => {
    // Priority: Environment Variable (for Render/Production)
    const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
    if (envUrl) return envUrl;

    if (Platform.OS === 'web') {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        return `http://${hostname}:8000`;
    }
    // Fallback for native simulators
    return 'http://10.10.0.184:8000';
};

export const API_URL = getApiUrl();

export const apiClient = axios.create({
    baseURL: API_URL,
});

export const connectSSE = (roomId: string, onMessage: (eventData: any) => void) => {
    const eventSource = new EventSource(`${API_URL}/stream/${roomId}`);

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            onMessage(data);
        } catch (e) {
            console.error('Failed to parse SSE message', e);
        }
    };

    eventSource.onerror = (err) => {
        console.error('SSE Error', err);
    };

    return {
        close: () => eventSource.close()
    };
};
