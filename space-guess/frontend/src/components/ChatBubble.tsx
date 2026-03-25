import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors, typography } from '../theme/colors';
import { ChatMessage, useGameStore } from '../store/gameStore';

interface Props {
    message: ChatMessage;
    isOwnMsg: boolean;
}

export const ChatBubble: React.FC<Props> = ({ message, isOwnMsg }) => {
    const { userColors } = useGameStore();
    const isAI = message.username === 'AI' || message.username === 'HOST';
    const isSystem = message.type === 'system';
    const isGuess = message.type === 'guess';

    const userColor = isAI ? colors.primary : (userColors[message.user_id] || colors.textMuted);

    // Semantic colors for answers
    const getAnswerStyle = () => {
        if (message.type !== 'answer') return null;
        const text = message.message.toUpperCase();
        if (text.includes('YES')) return { borderColor: '#39FF14', shadowColor: '#39FF14' };
        if (text.includes('NO')) return { borderColor: '#FF3131', shadowColor: '#FF3131' };
        if (text.includes('MAYBE')) return { borderColor: '#FFD700', shadowColor: '#FFD700' };
        return { borderColor: colors.primary, shadowColor: colors.primary };
    };

    const answerStyle = getAnswerStyle();

    if (isSystem || isGuess) {
        return (
            <Animated.View entering={FadeIn.duration(400)} style={styles.systemContainer}>
                <View style={[styles.systemLine, { backgroundColor: isGuess ? colors.accent : colors.border }]} />
                <Text style={[styles.systemText, isGuess && styles.guessText]}>
                    {isGuess ? '🚀 ' : ''}{message.message}
                </Text>
                <View style={[styles.systemLine, { backgroundColor: isGuess ? colors.accent : colors.border }]} />
            </Animated.View>
        );
    }

    return (
        <Animated.View
            entering={FadeInDown.springify().damping(12)}
            style={[
                styles.container,
                isOwnMsg ? styles.ownContainer : styles.otherContainer,
                isAI && styles.aiContainer,
                answerStyle && { borderColor: answerStyle.borderColor, shadowColor: answerStyle.shadowColor }
            ]}
        >
            <View style={styles.header}>
                <Text style={[styles.username, { color: userColor }]}>
                    {isAI ? '⦿ ' : ''}{message.username}
                </Text>
                {isAI && <View style={[styles.pulse, { backgroundColor: answerStyle?.borderColor || colors.primary }]} />}
            </View>
            <Text style={[
                styles.messageText,
                isAI && styles.aiMessageText,
                isAI && { textShadowColor: answerStyle?.borderColor || colors.primary }
            ]}>
                {message.message}
            </Text>

            {/* Holographic detail line */}
            <View style={[styles.detailLine, { backgroundColor: userColor, opacity: 0.3 }]} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    systemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 12,
        paddingHorizontal: 20,
    },
    systemLine: {
        height: 1,
        flex: 1,
        opacity: 0.2,
    },
    systemText: {
        color: colors.textMuted,
        fontSize: 10,
        fontFamily: typography.monoFont,
        marginHorizontal: 15,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    guessText: {
        color: colors.accent,
        fontWeight: 'bold',
        fontSize: 11,
    },
    container: {
        maxWidth: '85%',
        padding: 12,
        borderRadius: 4,
        marginVertical: 6,
        backgroundColor: 'rgba(20, 20, 40, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
    },
    ownContainer: {
        alignSelf: 'flex-end',
        borderRightWidth: 3,
        borderRightColor: colors.secondary,
    },
    otherContainer: {
        alignSelf: 'flex-start',
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
    },
    aiContainer: {
        alignSelf: 'center',
        width: '90%',
        backgroundColor: 'rgba(0, 245, 255, 0.05)',
        borderColor: colors.primary,
        borderWidth: 1,
        borderTopWidth: 2,
        shadowRadius: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    username: {
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: typography.titleFont,
        letterSpacing: 1,
    },
    pulse: {
        width: 6,
        height: 6,
        borderRadius: 3,
        opacity: 0.8,
    },
    messageText: {
        color: colors.text,
        fontSize: 14,
        fontFamily: typography.bodyFont,
        lineHeight: 20,
    },
    aiMessageText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
        fontFamily: typography.titleFont,
        textShadowRadius: 8,
    },
    detailLine: {
        height: 1,
        width: '30%',
        marginTop: 8,
        alignSelf: 'flex-start',
    }
});
