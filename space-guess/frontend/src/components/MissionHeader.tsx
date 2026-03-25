import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { colors, typography } from '../theme/colors';
import { CountdownTimer } from './CountdownTimer';

export const MissionHeader: React.FC = () => {
    const {
        roomId, status, maxQuestions, questionCount, players, userId, guessCounts
    } = useGameStore();

    if (status !== 'playing') {
        return (
            <View style={styles.lobbyHeader}>
                <Text style={styles.lobbyTitle}>MISSION DEPLOYMENT SYSTEM</Text>
                <View style={styles.lobbyBadge}>
                    <Text style={styles.lobbyBadgeText}>READY FOR INITIATION</Text>
                </View>
            </View>
        );
    }

    const remainingQuestions = Math.max(0, (maxQuestions * players.length) - questionCount);
    const userGuesses = 3 - (guessCounts[userId || ''] || 0);

    return (
        <View style={styles.container}>
            <View style={styles.left}>
                <Text style={styles.title}>SPACE GUESS</Text>
                <View style={styles.tag}>
                    <Text style={styles.tagText}>LIVE MISSION</Text>
                </View>
            </View>

            <View style={styles.center}>
                <CountdownTimer />
            </View>

            <View style={styles.right}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>COMMS LEFT</Text>
                    <Text style={styles.statValue}>{remainingQuestions}</Text>
                </View>
                <View style={[styles.statBox, styles.statBoxAccent]}>
                    <Text style={styles.statLabel}>GUESSES</Text>
                    <Text style={[styles.statValue, { color: colors.secondary }]}>{userGuesses}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 80,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        backgroundColor: 'rgba(5, 8, 22, 0.8)',
        borderBottomWidth: 1,
        borderColor: colors.border,
        zIndex: 50,
    },
    lobbyHeader: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: colors.border,
    },
    lobbyTitle: {
        color: colors.textMuted,
        fontSize: 12,
        fontFamily: typography.titleFont,
        letterSpacing: 3,
    },
    lobbyBadge: {
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        backgroundColor: colors.surfaceGlow,
        borderRadius: 4,
    },
    lobbyBadgeText: {
        color: colors.primary,
        fontSize: 8,
        fontWeight: 'bold',
        fontFamily: typography.monoFont,
    },
    left: {
        flex: 1,
    },
    title: {
        color: colors.primary,
        fontSize: 20,
        fontFamily: typography.titleFont,
        fontWeight: 'bold',
        letterSpacing: 2,
        textShadowColor: colors.primary,
        textShadowRadius: 10,
    },
    tag: {
        marginTop: 2,
        backgroundColor: 'rgba(0, 245, 255, 0.1)',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 2,
        borderWidth: 0.5,
        borderColor: colors.primary,
    },
    tagText: {
        color: colors.primary,
        fontSize: 8,
        fontWeight: 'bold',
        fontFamily: typography.monoFont,
    },
    center: {
        flex: 1,
        alignItems: 'center',
    },
    right: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    statBox: {
        alignItems: 'center',
        marginHorizontal: 10,
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        minWidth: 60,
    },
    statBoxAccent: {
        borderColor: 'rgba(123, 97, 255, 0.3)',
    },
    statLabel: {
        color: colors.textMuted,
        fontSize: 8,
        fontFamily: typography.monoFont,
        marginBottom: 2,
    },
    statValue: {
        color: colors.text,
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: typography.monoFont,
    }
});
