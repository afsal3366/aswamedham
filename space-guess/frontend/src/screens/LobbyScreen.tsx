import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Text, Switch, useWindowDimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
        if (!username) return alert('Enter A Username');
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
                // Auto-start for solo missions
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
                        width: isDesktop ? '70%' : '95%',
                        height: isDesktop ? height * 0.9 : '100%',
                        marginTop: isDesktop ? height * 0.05 : Platform.OS === 'ios' ? 40 : 0,
                    }
                ]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.title}>SPACE GUESS</Text>

                    <View style={styles.typeSelector}>
                        <Text
                            onPress={() => setIsSinglePlayer(true)}
                            style={[styles.typeButton, isSinglePlayer && styles.typeButtonActive]}
                        >
                            SOLO MISSION
                        </Text>
                        <Text
                            onPress={() => setIsSinglePlayer(false)}
                            style={[styles.typeButton, !isSinglePlayer && styles.typeButtonActive]}
                        >
                            CREW MISSION
                        </Text>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Astronaut Name"
                        placeholderTextColor={colors.textMuted}
                        value={username}
                        onChangeText={setUsername}
                    />

                    <View style={styles.card}>
                        <Text style={styles.subtitle}>{isSinglePlayer ? 'Mission Parameters' : 'Initialize Crew Mission'}</Text>

                        <View style={styles.row}>
                            <Text style={styles.label}>Chances to Guess:</Text>
                            <TextInput
                                style={styles.smallInput}
                                keyboardType="numeric"
                                value={maxQuestions}
                                onChangeText={setMaxQuestions}
                            />
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.label}>Secret Comms (Hide Qs):</Text>
                            <Switch
                                value={hideQuestions}
                                onValueChange={setHideQuestions}
                                trackColor={{ false: colors.textMuted, true: colors.primary }}
                                thumbColor={colors.text}
                            />
                        </View>

                        {!isSinglePlayer && (
                            <View style={styles.row}>
                                <Text style={styles.label}>Mode (AI / Host):</Text>
                                <Switch
                                    value={gameMode === 'HOST'}
                                    onValueChange={(val) => {
                                        setGameMode(val ? 'HOST' : 'AI');
                                        if (val) setCategory(null);
                                    }}
                                    trackColor={{ false: colors.textMuted, true: colors.primary }}
                                    thumbColor={colors.text}
                                />
                            </View>
                        )}

                        {(isSinglePlayer || gameMode === 'AI') && (
                            <View style={styles.aiOptions}>
                                <Text style={styles.label}>AI Subject Category:</Text>
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
                                    <View style={[styles.row, { marginTop: 10 }]}>
                                        <Text style={styles.label}>Difficulty:</Text>
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
                                style={styles.input}
                                placeholder="Enter Secret Word (Hidden)"
                                placeholderTextColor={colors.textMuted}
                                value={customWord}
                                onChangeText={setCustomWord}
                                secureTextEntry
                            />
                        )}

                        <View style={styles.buttonContainer}>
                            <NeonButton title="LAUNCH MISSION" onPress={handleCreate} />
                        </View>
                    </View>

                    {!isSinglePlayer && (
                        <View style={styles.card}>
                            <Text style={styles.subtitle}>Join Crew Mission</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Room ID"
                                placeholderTextColor={colors.textMuted}
                                value={roomId}
                                onChangeText={setJoinRoomId}
                                autoCapitalize="characters"
                            />
                            <View style={styles.buttonContainer}>
                                <NeonButton title="JOIN CREW" onPress={handleJoin} />
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SpaceBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        maxWidth: 1100,
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 255, 0.2)',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        overflow: 'hidden',
    },
    scrollContent: {
        justifyContent: 'center',
        padding: 30,
        flexGrow: 1,
    },
    title: {
        fontSize: 32,
        color: colors.primary,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        fontFamily: typography.fontFamily,
        textShadowColor: colors.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    typeSelector: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 10,
        padding: 4,
        marginBottom: 20,
    },
    typeButton: {
        flex: 1,
        textAlign: 'center',
        paddingVertical: 10,
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: typography.fontFamily,
        borderRadius: 8,
    },
    typeButtonActive: {
        backgroundColor: colors.primary,
        color: '#000',
    },
    card: {
        backgroundColor: colors.surface,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 15,
    },
    subtitle: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        fontFamily: typography.fontFamily,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        color: colors.textMuted,
        fontSize: 14,
        fontFamily: typography.fontFamily,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.text,
        padding: 12,
        marginBottom: 10,
        fontFamily: typography.fontFamily,
    },
    smallInput: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.text,
        padding: 10,
        width: 60,
        textAlign: 'center',
        fontFamily: typography.fontFamily,
    },
    buttonContainer: {
        width: '100%',
        alignSelf: 'center',
        marginTop: 5,
    },
    aiOptions: {
        marginTop: 10,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 8,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 5,
    },
    chip: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.textMuted,
        fontSize: 10,
        marginRight: 8,
        marginBottom: 5,
        fontFamily: typography.fontFamily,
    },
    smallChip: {
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.textMuted,
        fontSize: 8,
        marginLeft: 8,
        fontFamily: typography.fontFamily,
    },
    activeChip: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        color: '#000',
        fontWeight: 'bold',
    }
});
