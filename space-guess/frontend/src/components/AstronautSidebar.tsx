import React from 'react';
import { StyleSheet, View, Text, useWindowDimensions, Pressable } from 'react-native';
import { colors, typography } from '../theme/colors';
import { NeonButton } from './NeonButton';
import { PlayerAvatar } from './PlayerAvatar';

interface Props {
    username: string;
    roomId: string;
    isHost: boolean;
    players?: any[];
    onExit: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export const AstronautSidebar: React.FC<Props> = ({
    username, roomId, isHost, players = [], onExit, isCollapsed, onToggleCollapse
}) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    if (isMobile && isCollapsed) return null;

    return (
        <View style={[styles.container, isCollapsed && styles.collapsedContainer]}>
            <View style={styles.topSection}>
                <View style={styles.avatarWrapper}>
                    <PlayerAvatar
                        username={username}
                        isMe
                        isHost={isHost}
                        size={isCollapsed ? 40 : 80}
                    />
                </View>

                {!isCollapsed && (
                    <View style={styles.infoSection}>
                        <Text style={styles.username}>{username}</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{isHost ? 'MISSION COMMANDER' : 'ASTRONAUT'}</Text>
                        </View>
                        <View style={styles.roomIdBadge}>
                            <Text style={styles.roomIdLabel}>SECTOR:</Text>
                            <Text style={styles.roomIdValue}>{roomId}</Text>
                        </View>
                    </View>
                )}

                {!isCollapsed && players.length > 0 && (
                    <View style={styles.crewSection}>
                        <Text style={styles.crewTitle}>CREW MEMBERS</Text>
                        <View style={styles.crewList}>
                            {players.map((p) => (
                                <View key={p.id} style={styles.crewItem}>
                                    <View style={[styles.statusDot, p.is_host && styles.hostDot]} />
                                    <View style={styles.crewItemInfo}>
                                        <Text style={styles.crewName} numberOfLines={1}>{p.username}</Text>
                                        <Text style={styles.crewRole}>{p.is_host ? 'COMMANDER' : 'MISSION SPECIALIST'}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.bottomSection}>
                {!isCollapsed && (
                    <NeonButton
                        title="ABORT MISSION"
                        onPress={onExit}
                        style={styles.exitBtn}
                        gradientColors={[colors.danger, '#990022']}
                        textStyle={{ fontSize: 10 }}
                    />
                )}
                {onToggleCollapse && (
                    <Pressable onPress={onToggleCollapse} style={styles.collapseToggle}>
                        <Text style={styles.toggleText}>{isCollapsed ? '>' : '<'}</Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 260,
        height: '100%',
        backgroundColor: colors.surface,
        borderRightWidth: 1,
        borderColor: colors.border,
        padding: 20,
        justifyContent: 'space-between',
        zIndex: 100,
    },
    collapsedContainer: {
        width: 80,
        padding: 10,
        alignItems: 'center',
    },
    topSection: {
        alignItems: 'center',
        marginTop: 20,
    },
    avatarWrapper: {
        marginBottom: 20,
        padding: 4,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: colors.primary,
        shadowColor: colors.primary,
        shadowRadius: 10,
        shadowOpacity: 0.3,
    },
    infoSection: {
        alignItems: 'center',
        width: '100%',
    },
    username: {
        color: colors.text,
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: typography.titleFont,
        marginBottom: 8,
        textAlign: 'center',
    },
    badge: {
        backgroundColor: colors.surfaceGlow,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.primary,
        marginBottom: 15,
    },
    badgeText: {
        color: colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: typography.monoFont,
        letterSpacing: 1,
    },
    roomIdBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        width: '100%',
        justifyContent: 'center',
    },
    roomIdLabel: {
        color: colors.textMuted,
        fontSize: 10,
        fontFamily: typography.monoFont,
        marginRight: 8,
    },
    roomIdValue: {
        color: colors.accent,
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: typography.monoFont,
        letterSpacing: 2,
    },
    bottomSection: {
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    exitBtn: {
        width: '100%',
        marginVertical: 10,
    },
    collapseToggle: {
        marginTop: 10,
        padding: 10,
    },
    toggleText: {
        color: colors.textMuted,
        fontSize: 18,
        fontFamily: typography.monoFont,
    },
    crewSection: {
        marginTop: 30,
        width: '100%',
        flex: 1,
    },
    crewTitle: {
        color: colors.textMuted,
        fontSize: 10,
        fontFamily: typography.monoFont,
        letterSpacing: 2,
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        paddingBottom: 5,
    },
    crewList: {
        width: '100%',
    },
    crewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 8,
        borderRadius: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.primary,
        marginRight: 10,
    },
    hostDot: {
        backgroundColor: colors.accent,
        shadowColor: colors.accent,
        shadowRadius: 4,
        shadowOpacity: 0.8,
    },
    crewItemInfo: {
        flex: 1,
    },
    crewName: {
        color: colors.text,
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: typography.bodyFont,
        marginBottom: 2,
    },
    crewRole: {
        color: colors.textMuted,
        fontSize: 8,
        fontFamily: typography.monoFont,
        textTransform: 'uppercase',
    }
});
