import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { SpaceBackground } from '../components/SpaceBackground';
import { NeonButton } from '../components/NeonButton';
import { useGameStore } from '../store/gameStore';
import { colors, typography } from '../theme/colors';

export const ResultScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { word, winner, players, reset, userId } = useGameStore();

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
                <Animated.View entering={ZoomIn.duration(800).springify()} style={styles.content}>
                    <Text style={styles.title}>MISSION DEBRIEF</Text>

                    {winnerData ? (
                        <>
                            <Text style={styles.resultText}>
                                {isWinner ? "YOU WON!" : `${winnerData.username.toUpperCase()} WON!`}
                            </Text>
                            <Text style={styles.subText}>The hidden anomaly was detected.</Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.resultText}>MISSION FAILED</Text>
                            <Text style={styles.subText}>You ran out of comms bandwidth.</Text>
                        </>
                    )}

                    <Animated.View entering={FadeIn.delay(500).duration(1000)} style={styles.wordContainer}>
                        <Text style={styles.wordLabel}>TARGET WORD:</Text>
                        <Text style={styles.wordText}>{word}</Text>
                    </Animated.View>

                    <View style={styles.buttonRow}>
                        <NeonButton title="Return to Room" onPress={handleStay} style={{ flex: 1, marginRight: 10 }} />
                        <NeonButton
                            title="Exit to Lobby"
                            onPress={handleReturn}
                            style={{ flex: 1 }}
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
    content: {
        alignItems: 'center',
        width: '100%',
        maxWidth: 500,
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 40,
        width: '100%',
    },
    title: {
        fontSize: 32,
        color: colors.primary,
        fontFamily: typography.fontFamily,
        fontWeight: 'bold',
        marginBottom: 30,
        textShadowColor: colors.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    resultText: {
        fontSize: 28,
        color: colors.accent,
        fontWeight: 'bold',
        fontFamily: typography.fontFamily,
        marginBottom: 10,
        textAlign: 'center',
    },
    subText: {
        fontSize: 16,
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        marginBottom: 40,
    },
    wordContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: colors.border,
        padding: 25,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
    },
    wordLabel: {
        color: colors.textMuted,
        fontSize: 14,
        fontFamily: typography.fontFamily,
        marginBottom: 5,
    },
    wordText: {
        color: colors.secondary,
        fontSize: 36,
        fontWeight: 'bold',
        fontFamily: typography.fontFamily,
        textShadowColor: colors.secondary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        letterSpacing: 4,
    },
});
