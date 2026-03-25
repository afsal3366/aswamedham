import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { colors, typography } from '../theme/colors';

interface Props {
    username: string;
    isActive?: boolean;
    isHost: boolean;
    isMe?: boolean;
    remaining?: number;
    guessCount?: number;
    onKick?: () => void;
    size?: number;
}

export const PlayerAvatar: React.FC<Props> = ({
    username, isActive, isHost, isMe, remaining, guessCount, onKick, size = 50
}) => {
    const animatedGlow = useAnimatedStyle(() => {
        if (!isActive) return { shadowOpacity: 0, transform: [{ scale: 1 }] };
        return {
            shadowOpacity: withRepeat(withSequence(withTiming(0.3, { duration: 1500 }), withTiming(0.6, { duration: 1500 })), -1, true),
            transform: [{ scale: withRepeat(withSequence(withTiming(1, { duration: 1500 }), withTiming(1.03, { duration: 1500 })), -1, true) }]
        };
    });

    const initials = username?.substring(0, 2).toUpperCase() || '??';

    return (
        <View style={[styles.container, { width: size + 10 }]}>
            <Animated.View style={[
                styles.avatarCircle,
                { width: size, height: size, borderRadius: size / 2 },
                isActive && styles.activeCircle,
                isMe && styles.meCircle,
                animatedGlow
            ]}>
                <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>

                {remaining !== undefined && (
                    <View style={[styles.badge, { top: -size * 0.1, right: -size * 0.1 }]}>
                        <Text style={styles.badgeText}>{remaining}</Text>
                    </View>
                )}

                {guessCount !== undefined && (
                    <View style={[styles.badge, styles.guessBadge, { bottom: -size * 0.1, right: -size * 0.1 }]}>
                        <Text style={styles.badgeText}>{3 - guessCount}</Text>
                    </View>
                )}
            </Animated.View>

            <Text style={[styles.username, isActive && styles.activeUsername, isMe && styles.meUsername]} numberOfLines={1}>
                {username} {isHost ? '★' : ''}
            </Text>

            {onKick && (
                <TouchableOpacity onPress={onKick} style={[styles.kickButton, { bottom: size * 0.4 }]}>
                    <Text style={styles.kickText}>×</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginHorizontal: 8,
    },
    avatarCircle: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    activeCircle: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(0, 245, 255, 0.1)',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 12,
    },
    meCircle: {
        borderColor: colors.accent,
        borderWidth: 2,
    },
    initials: {
        color: colors.text,
        fontFamily: typography.monoFont,
        fontWeight: 'bold',
    },
    username: {
        color: colors.textMuted,
        fontSize: 10,
        fontFamily: typography.bodyFont,
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
    guessBadge: {
        backgroundColor: '#FFCC00',
        shadowColor: '#FFCC00',
    },
    badgeText: {
        color: colors.text,
        fontSize: 9,
        fontWeight: 'bold',
        fontFamily: typography.monoFont,
    },
    kickButton: {
        position: 'absolute',
        right: 0,
        backgroundColor: colors.danger,
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    kickText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        lineHeight: 14,
    }
});
