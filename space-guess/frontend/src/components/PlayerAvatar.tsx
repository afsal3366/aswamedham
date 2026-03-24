import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { colors, typography } from '../theme/colors';

interface Props {
    username: string;
    isActive: boolean;
    isHost: boolean;
}

export const PlayerAvatar: React.FC<Props> = ({ username, isActive, isHost }) => {
    const animatedGlow = useAnimatedStyle(() => {
        if (!isActive) return { shadowOpacity: 0, transform: [{ scale: 1 }] };
        return {
            shadowOpacity: withRepeat(withSequence(withTiming(0.4, { duration: 1000 }), withTiming(0.8, { duration: 1000 })), -1, true),
            transform: [{ scale: withRepeat(withSequence(withTiming(1, { duration: 1000 }), withTiming(1.05, { duration: 1000 })), -1, true) }]
        };
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.avatarCircle, isActive && styles.activeCircle, animatedGlow]}>
                <Text style={styles.initials}>{username.substring(0, 2).toUpperCase()}</Text>
            </Animated.View>
            <Text style={[styles.username, isActive && styles.activeUsername]} numberOfLines={1}>
                {username} {isHost ? '(Host)' : ''}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginHorizontal: 10,
        width: 60,
    },
    avatarCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    activeCircle: {
        borderColor: colors.primary,
        backgroundColor: colors.surfaceGlow,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 10,
    },
    initials: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: 'bold',
        fontSize: 16,
    },
    username: {
        color: colors.textMuted,
        fontSize: 10,
        fontFamily: typography.fontFamily,
        textAlign: 'center',
    },
    activeUsername: {
        color: colors.primary,
        fontWeight: 'bold',
    },
});
