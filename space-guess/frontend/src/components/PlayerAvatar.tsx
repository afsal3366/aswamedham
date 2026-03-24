import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { colors, typography } from '../theme/colors';

interface Props {
    username: string;
    isActive: boolean;
    isHost: boolean;
    isMe?: boolean;
    remaining?: number;
    onKick?: () => void;
}

export const PlayerAvatar: React.FC<Props> = ({ username, isActive, isHost, isMe, remaining, onKick }) => {
    const animatedGlow = useAnimatedStyle(() => {
        if (!isActive) return { shadowOpacity: 0, transform: [{ scale: 1 }] };
        return {
            shadowOpacity: withRepeat(withSequence(withTiming(0.4, { duration: 1000 }), withTiming(0.8, { duration: 1000 })), -1, true),
            transform: [{ scale: withRepeat(withSequence(withTiming(1, { duration: 1000 }), withTiming(1.05, { duration: 1000 })), -1, true) }]
        };
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[
                styles.avatarCircle,
                isActive && styles.activeCircle,
                isMe && styles.meCircle,
                animatedGlow
            ]}>
                <Text style={styles.initials}>{username.substring(0, 2).toUpperCase()}</Text>
                {remaining !== undefined && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{remaining}</Text>
                    </View>
                )}
            </Animated.View>
            <Text style={[styles.username, isActive && styles.activeUsername, isMe && styles.meUsername]} numberOfLines={1}>
                {username} {isHost ? '(Host)' : ''}
            </Text>
            {onKick && (
                <TouchableOpacity onPress={onKick} style={styles.kickButton}>
                    <Text style={styles.kickText}>×</Text>
                </TouchableOpacity>
            )}
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
    meCircle: {
        borderColor: colors.accent,
        borderWidth: 2,
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
    meUsername: {
        color: colors.accent,
        fontWeight: 'bold',
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: colors.accent,
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.text,
        shadowColor: colors.accent,
        shadowRadius: 5,
        shadowOpacity: 0.8,
    },
    badgeText: {
        color: colors.text,
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: typography.fontFamily,
    },
    kickButton: {
        position: 'absolute',
        bottom: 20,
        right: 0,
        backgroundColor: '#FF3131',
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    kickText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        lineHeight: 14,
    }
});
