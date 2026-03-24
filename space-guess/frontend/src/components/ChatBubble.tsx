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
    const isAI = message.type === 'answer';
    const isSystem = message.type === 'system';
    const isGuess = message.type === 'guess';

    const userColor = userColors[message.user_id] || colors.textMuted;

    // Semantic colors for answers
    const getAnswerStyle = () => {
        if (!isAI) return null;
        const text = message.message.toUpperCase();
        if (text.includes('YES')) return { borderColor: '#39FF14', shadowColor: '#39FF14', backgroundColor: 'rgba(57, 255, 20, 0.1)' };
        if (text.includes('NO')) return { borderColor: '#FF3131', shadowColor: '#FF3131', backgroundColor: 'rgba(255, 49, 49, 0.1)' };
        if (text.includes('MAYBE')) return { borderColor: '#FFD700', shadowColor: '#FFD700', backgroundColor: 'rgba(255, 215, 0, 0.1)' };
        return styles.aiContainer;
    };

    const answerStyle = getAnswerStyle();

    if (isSystem || isGuess) {
        return (
            <Animated.View entering={FadeIn.duration(400)} style={styles.systemContainer}>
                <Text style={[styles.systemText, isGuess && styles.guessText]}>{message.message}</Text>
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
                answerStyle
            ]}
        >
            <Text style={[styles.username, { color: userColor }]}>{message.username}</Text>
            <Text style={[styles.messageText, isAI && styles.aiMessageText, isAI && { textShadowColor: answerStyle?.borderColor || colors.primary }]}>
                {message.message}
            </Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    systemContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    systemText: {
        color: colors.textMuted,
        fontSize: 12,
        fontFamily: typography.fontFamily,
        fontStyle: 'italic',
    },
    guessText: {
        color: colors.accent,
        fontWeight: 'bold',
        fontSize: 14,
    },
    container: {
        maxWidth: '60%',
        padding: 15,
        borderRadius: 16,
        marginVertical: 8,
    },
    ownContainer: {
        alignSelf: 'flex-end',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderBottomRightRadius: 4,
    },
    otherContainer: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderBottomLeftRadius: 4,
    },
    aiContainer: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
        borderColor: colors.primary,
        borderWidth: 1.5,
        borderBottomLeftRadius: 4,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    username: {
        color: colors.textMuted,
        fontSize: 10,
        marginBottom: 4,
        fontFamily: typography.fontFamily,
    },
    messageText: {
        color: colors.text,
        fontSize: 14,
        fontFamily: typography.fontFamily,
    },
    aiMessageText: {
        color: '#fff',
        fontWeight: 'bold',
        letterSpacing: 1,
        textShadowColor: colors.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
});
