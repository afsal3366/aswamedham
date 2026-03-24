import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { colors, typography } from '../theme/colors';
import { apiClient } from '../services/api';

export const CountdownTimer: React.FC = () => {
    const { timerValue, setTimerValue, currentTurn, userId, roomId, status, awaitingHost, isHost } = useGameStore();

    useEffect(() => {
        if (status !== 'playing') return;

        const interval = setInterval(() => {
            if (timerValue > 0) {
                setTimerValue(timerValue - 1);
            } else {
                handleTimeout();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [timerValue, status]);

    // Reset timer on turn change or host response
    useEffect(() => {
        setTimerValue(60);
    }, [currentTurn, awaitingHost]);

    const handleTimeout = async () => {
        if (!roomId || !userId) return;

        // If it's my turn to ask/guess
        if (currentTurn === userId) {
            try {
                await apiClient.post('/game/skip_turn', { room_id: roomId, user_id: userId });
            } catch (e) {
                console.error("Failed to skip turn after timeout", e);
            }
        }
        // If it's host mode and host is taking too long
        else if (awaitingHost && isHost) {
            try {
                await apiClient.post('/game/skip_turn', { room_id: roomId, user_id: userId });
            } catch (e) {
                console.error("Failed to skip host turn after timeout", e);
            }
        }
    };

    if (status !== 'playing') return null;

    const getColor = () => {
        if (timerValue < 10) return '#FF3131'; // Warning red
        if (timerValue < 30) return '#FFD700'; // Caution yellow
        return colors.accent;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>TIME LEFT</Text>
            <View style={[styles.timerCircle, { borderColor: getColor() }]}>
                <Text style={[styles.timerValue, { color: getColor() }]}>{timerValue}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 15,
    },
    label: {
        color: colors.textMuted,
        fontSize: 8,
        fontFamily: typography.fontFamily,
        letterSpacing: 1,
        marginBottom: 2,
    },
    timerCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.surfaceGlow,
    },
    timerValue: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: typography.fontFamily,
    }
});
