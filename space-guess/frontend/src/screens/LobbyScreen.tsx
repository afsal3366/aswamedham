import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Text, Switch, useWindowDimensions, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { SpaceBackground } from '../components/SpaceBackground';
import { NeonButton } from '../components/NeonButton';
import { useGameStore } from '../store/gameStore';
import { apiClient } from '../services/api';
import { colors, typography } from '../theme/colors';

export const LobbyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [roomId, setJoinRoomId] = useState('');
    const [maxQuestions, setMaxQuestions] = useState('10');
    const [hideQuestions, setHideQuestions] = useState(false);
    const [gameMode, setGameMode] = useState<'AI' | 'HOST'>('AI');
    const [isSinglePlayer, setIsSinglePlayer] = useState(true);
    const [customWord, setCustomWord] = useState('');
    const [category, setCategory] = useState<string | null>(null);
    const [difficulty, setDifficulty] = useState('medium');

    const { width, height } = useWindowDimensions();
    const isDesktop = width > 768;

    const { setRoomInfo, setPlayers } = useGameStore();

    const handleCreate = async () => {
        if (!username.trim()) return alert('PLEASE IDENTIFY YOURSELF (ASTRONAUT NAME REQUIRED)');

        const currentMode = isSinglePlayer ? 'AI' : gameMode;

        if (currentMode === 'AI' && !category) {
            return alert('SELECT TARGET SECTOR: ACTORS, ATHLETES, OR SCIENTISTS');
        }

        if (currentMode === 'HOST' && !customWord.trim()) {
            return alert('SECURITY CLEARANCE REQUIRED: ENTER ENCRYPTED WORD FOR CREW');
        }

        try {
            const { data } = await apiClient.post('/room/create', {
                host_username: username,
                max_questions: parseInt(maxQuestions) || 10,
                hide_other_player_questions: hideQuestions,
                mode: isSinglePlayer ? 'AI' : gameMode,
                custom_word: !isSinglePlayer && gameMode === 'HOST' ? customWord : null,
                category,
                difficulty,
                is_single_player: isSinglePlayer
            });

            setRoomInfo(data.room_id, data.user_id, username, true, data.meta.max_questions, data.meta.mode);
            setPlayers([{ id: data.user_id, username, is_host: true }]);

            if (isSinglePlayer) {
                await apiClient.post('/game/start', {
                    room_id: data.room_id,
                    user_id: data.user_id
                });
            }

            navigation.navigate('GameRoom');
        } catch (e) {
            alert('Error creating room');
        }
    };

    const handleJoin = async () => {
        if (!username || !roomId) return alert('Enter Username & Room ID');
        try {
            const { data } = await apiClient.post('/room/join', {
                room_id: roomId.toUpperCase(),
                username
            });
            setRoomInfo(data.room_id, data.user_id, username, false, parseInt(data.meta.max_questions) || 10, data.meta.mode);
            setPlayers(data.players);
            if (data.messages) {
                useGameStore.getState().addMessages(data.messages);
            }
            navigation.navigate('GameRoom');
        } catch (e) {
            alert('Error joining room');
        }
    };

    return (
        <SpaceBackground>
            <KeyboardAvoidingView
                style={[
                    styles.container,
                    {
                        width: isDesktop ? 600 : '95%',
                        height: isDesktop ? 'auto' : '100%',
                        marginTop: isDesktop ? height * 0.1 : Platform.OS === 'ios' ? 40 : 0,
                        maxHeight: isDesktop ? height * 0.8 : '100%',
                    }
                ]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.title}>SPACE GUESS</Text>
                    <Text style={styles.tagline}>INTERSTELLAR MISSION CONTROL</Text>

                    <View style={styles.typeSelector}>
                        <Pressable
                            onPress={() => setIsSinglePlayer(true)}
                            style={[styles.typeBtn, isSinglePlayer && styles.typeBtnActive]}
                        >
                            <Text style={[styles.typeBtnText, isSinglePlayer && styles.typeBtnTextActive]}>SOLO MISSION</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setIsSinglePlayer(false)}
                            style={[styles.typeBtn, !isSinglePlayer && styles.typeBtnActive]}
                        >
                            <Text style={[styles.typeBtnText, !isSinglePlayer && styles.typeBtnTextActive]}>CREW MISSION</Text>
                        </Pressable>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="IDENTIFY ASTRONAUT NAME..."
                        placeholderTextColor="rgba(0, 245, 255, 0.3)"
                        value={username}
                        onChangeText={setUsername}
                    />

                    <View style={styles.card}>
                        <Text style={styles.cardHeader}>{isSinglePlayer ? 'MISSION PARAMETERS' : 'INITIALIZE CREW MISSION'}</Text>

                        <View style={styles.row}>
                            <Text style={styles.label}>TRANSMISSION LIMIT:</Text>
                            <TextInput
                                style={styles.smallInput}
                                keyboardType="numeric"
                                value={maxQuestions}
                                onChangeText={setMaxQuestions}
                            />
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.label}>STEALTH COMMS:</Text>
                            <Switch
                                value={hideQuestions}
                                onValueChange={setHideQuestions}
                                trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.primary }}
                                thumbColor={colors.text}
                            />
                        </View>

                        {!isSinglePlayer && (
                            <View style={styles.row}>
                                <Text style={styles.label}>MODE (AI / HOST):</Text>
                                <Switch
                                    value={gameMode === 'HOST'}
                                    onValueChange={(val) => {
                                        setGameMode(val ? 'HOST' : 'AI');
                                        if (val) setCategory(null);
                                    }}
                                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.primary }}
                                    thumbColor={colors.text}
                                />
                            </View>
                        )}

                        {(isSinglePlayer || gameMode === 'AI') && (
                            <View style={styles.aiOptions}>
                                <Text style={styles.subLabel}>TARGET CATEGORY:</Text>
                                <View style={styles.chipRow}>
                                    {['actors', 'athletes', 'scientists'].map(cat => (
                                        <Text
                                            key={cat}
                                            onPress={() => setCategory(category === cat ? null : cat)}
                                            style={[styles.chip, category === cat && styles.activeChip]}
                                        >
                                            {cat.toUpperCase()}
                                        </Text>
                                    ))}
                                </View>
                                {category && (
                                    <View style={{ marginTop: 12 }}>
                                        <Text style={styles.subLabel}>THREAT LEVEL:</Text>
                                        <View style={styles.chipRow}>
                                            {['easy', 'medium', 'hard'].map(diff => (
                                                <Text
                                                    key={diff}
                                                    onPress={() => setDifficulty(diff)}
                                                    style={[styles.smallChip, difficulty === diff && styles.activeChip]}
                                                >
                                                    {diff.toUpperCase()}
                                                </Text>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                        {!isSinglePlayer && gameMode === 'HOST' && (
                            <TextInput
                                style={[styles.input, { marginTop: 15 }]}
                                placeholder="ENTER ENCRYPTED WORD..."
                                placeholderTextColor="rgba(0, 245, 255, 0.3)"
                                value={customWord}
                                onChangeText={setCustomWord}
                                secureTextEntry
                            />
                        )}

                        <NeonButton
                            title="LAUNCH MISSION"
                            onPress={handleCreate}
                            style={{ marginTop: 20 }}
                        />
                    </View>

                    {!isSinglePlayer && (
                        <View style={styles.card}>
                            <Text style={styles.cardHeader}>JOIN ACTIVE CREW</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ENTER SECTOR ID..."
                                placeholderTextColor="rgba(0, 245, 255, 0.3)"
                                value={roomId}
                                onChangeText={setJoinRoomId}
                                autoCapitalize="characters"
                            />
                            <NeonButton
                                title="SYNC WITH CREW"
                                onPress={handleJoin}
                                style={{ marginTop: 10 }}
                                gradientColors={[colors.accent, colors.secondary]}
                            />
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SpaceBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: 'center',
        backgroundColor: 'rgba(5, 8, 22, 0.85)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    scrollContent: {
        padding: 30,
        flexGrow: 1,
    },
    title: {
        fontSize: 36,
        color: colors.primary,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: typography.titleFont,
        letterSpacing: 4,
        textShadowColor: colors.primary,
        textShadowRadius: 15,
    },
    tagline: {
        fontSize: 10,
        color: colors.textMuted,
        textAlign: 'center',
        fontFamily: typography.monoFont,
        letterSpacing: 2,
        marginBottom: 30,
    },
    typeSelector: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 4,
        padding: 4,
        marginBottom: 20,
    },
    typeBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 4,
    },
    typeBtnActive: {
        backgroundColor: colors.primary,
    },
    typeBtnText: {
        color: colors.textMuted,
        fontSize: 10,
        fontFamily: typography.titleFont,
        letterSpacing: 1,
    },
    typeBtnTextActive: {
        color: colors.background,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 20,
    },
    cardHeader: {
        color: colors.primary,
        fontSize: 12,
        fontFamily: typography.titleFont,
        letterSpacing: 2,
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 245, 255, 0.2)',
        paddingBottom: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    label: {
        color: colors.text,
        fontSize: 11,
        fontFamily: typography.titleFont,
        letterSpacing: 1,
    },
    subLabel: {
        color: colors.textMuted,
        fontSize: 10,
        fontFamily: typography.monoFont,
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.primary,
        padding: 12,
        marginBottom: 15,
        fontFamily: typography.monoFont,
        fontSize: 14,
    },
    smallInput: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.primary,
        padding: 8,
        width: 60,
        textAlign: 'center',
        fontFamily: typography.monoFont,
    },
    aiOptions: {
        padding: 15,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        color: colors.textMuted,
        fontSize: 9,
        fontFamily: typography.titleFont,
    },
    smallChip: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        color: colors.textMuted,
        fontSize: 8,
        fontFamily: typography.titleFont,
    },
    activeChip: {
        backgroundColor: 'rgba(0, 245, 255, 0.15)',
        borderColor: colors.primary,
        color: colors.primary,
    }
});
