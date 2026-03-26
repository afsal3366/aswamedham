import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { SpaceBackground } from '../components/SpaceBackground';
import { NeonButton } from '../components/NeonButton';
import { useGameStore } from '../store/gameStore';
import { colors, typography } from '../theme/colors';

export const ResultScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { word, winner, players, reset, userId, gameOverReason } = useGameStore();

    const winnerData = players.find(p => p.id === winner);
    const isWinner = winner === userId;

    const handleReturn = () => {
        reset();
        navigation.replace('Lobby');
    };

    const handleStay = () => {
        navigation.goBack();
    };

    return (
        <SpaceBackground>
            <View style={styles.container}>
                <Animated.View entering={ZoomIn.duration(800).springify()} style={styles.card}>
                    <Text style={styles.title}>MISSION DEBRIEF</Text>

                    <View style={styles.statusBadge}>
                        <Text style={[styles.statusText, { color: winnerData ? colors.primary : colors.danger }]}>
                            {winnerData ? 'SUCCESS' : 'MISSION FAILURE'}
                        </Text>
                    </View>

                    <Text style={styles.resultHeadline}>
                        {winnerData
                            ? (isWinner ? "TARGET NEUTRALIZED" : `${winnerData.username.toUpperCase()} SUCCESSFUL`)
                            : (gameOverReason === 'max_guesses' ? "GUESS CAPACITY EXCEEDED" : "DATA LINK LOST")}
                    </Text>

                    <Text style={styles.subtext}>
                        {winnerData
                            ? "The hidden anomaly was successfully identified."
                            : (gameOverReason === 'max_guesses'
                                ? "A crew member exhausted their identification attempts. The mission is aborted."
                                : "The crew exhausted all transmission bandwidth.")
                        }
                    </Text>

                    <Animated.View entering={FadeIn.delay(500).duration(1000)} style={styles.wordBox}>
                        <Text style={styles.wordLabel}>IDENTIFIED ANOMALY:</Text>
                        <Text style={styles.wordValue}>{word?.toUpperCase() || '---'}</Text>
                        <View style={styles.decoLine} />
                    </Animated.View>

                    <View style={styles.buttonContainer}>
                        <NeonButton title="BACK TO BASE" onPress={handleStay} style={styles.btn} />
                        <NeonButton
                            title="ABANDON STATION"
                            onPress={handleReturn}
                            style={styles.btn}
                            gradientColors={['#333', '#111']}
                        />
                    </View>
                </Animated.View>
            </View>
        </SpaceBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: 'rgba(5, 8, 22, 0.9)',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 4,
        padding: 40,
        alignItems: 'center',
        width: '100%',
        maxWidth: 500,
        shadowColor: colors.primary,
        shadowRadius: 20,
        shadowOpacity: 0.2,
    },
    title: {
        fontSize: 12,
        color: colors.textMuted,
        fontFamily: typography.monoFont,
        letterSpacing: 6,
        marginBottom: 20,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        marginBottom: 20,
    },
    statusText: {
        fontSize: 10,
        fontFamily: typography.titleFont,
        letterSpacing: 2,
    },
    resultHeadline: {
        fontSize: 24,
        color: colors.text,
        fontFamily: typography.titleFont,
        textAlign: 'center',
        letterSpacing: 2,
        marginBottom: 10,
        textShadowColor: colors.primary,
        textShadowRadius: 10,
    },
    subtext: {
        fontSize: 11,
        color: colors.textMuted,
        fontFamily: typography.bodyFont,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 30,
    },
    wordBox: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        padding: 30,
        width: '100%',
        alignItems: 'center',
        marginBottom: 40,
    },
    wordLabel: {
        color: colors.primary,
        fontSize: 9,
        fontFamily: typography.titleFont,
        letterSpacing: 1,
        marginBottom: 8,
        opacity: 0.8,
    },
    wordValue: {
        color: colors.text,
        fontSize: 32,
        fontFamily: typography.titleFont,
        letterSpacing: 6,
        textShadowColor: colors.primary,
        textShadowRadius: 15,
    },
    decoLine: {
        width: 40,
        height: 2,
        backgroundColor: colors.primary,
        marginTop: 15,
        opacity: 0.5,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 15,
        width: '100%',
    },
    btn: {
        flex: 1,
    }
});
