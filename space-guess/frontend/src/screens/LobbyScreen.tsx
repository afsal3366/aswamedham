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
    const [maxQuestions, setMaxQuestions] = useState('5');
    const [hideQuestions, setHideQuestions] = useState(false);
    const [gameMode, setGameMode] = useState<'AI' | 'HOST'>('AI');
    const [customWord, setCustomWord] = useState('');

    const { width, height } = useWindowDimensions();
    const isDesktop = width > 768;

    const { setRoomInfo, setPlayers } = useGameStore();

    const handleCreate = async () => {
        if (!username) return alert('Enter A Username');
        try {
            const { data } = await apiClient.post('/room/create', {
                host_username: username,
                max_questions: parseInt(maxQuestions) || 5,
                hide_other_player_questions: hideQuestions,
                mode: gameMode,
                custom_word: gameMode === 'HOST' ? customWord : null
            });
            setRoomInfo(data.room_id, data.user_id, username, true, data.meta.max_questions, data.meta.mode);
            setPlayers([{ id: data.user_id, username, is_host: true }]);
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
            setRoomInfo(data.room_id, data.user_id, username, false, parseInt(data.meta.max_questions) || 5, data.meta.mode);
            setPlayers(data.players);
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
                    <TextInput
                        style={styles.input}
                        placeholder="Astronaut Name"
                        placeholderTextColor={colors.textMuted}
                        value={username}
                        onChangeText={setUsername}
                    />

                    <View style={styles.card}>
                        <Text style={styles.subtitle}>Create Mission</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>Chances Per Player:</Text>
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
                        <View style={styles.row}>
                            <Text style={styles.label}>Mode (AI / Host):</Text>
                            <Switch
                                value={gameMode === 'HOST'}
                                onValueChange={(val) => setGameMode(val ? 'HOST' : 'AI')}
                                trackColor={{ false: colors.textMuted, true: colors.primary }}
                                thumbColor={colors.text}
                            />
                        </View>

                        {gameMode === 'HOST' && (
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Secret Word (Hidden)"
                                placeholderTextColor={colors.textMuted}
                                value={customWord}
                                onChangeText={setCustomWord}
                                secureTextEntry
                            />
                        )}

                        <NeonButton title="Initialize Room" onPress={handleCreate} />
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.subtitle}>Join Mission</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Room ID"
                            placeholderTextColor={colors.textMuted}
                            value={roomId}
                            onChangeText={setJoinRoomId}
                            autoCapitalize="characters"
                        />
                        <NeonButton title="Join Crew" onPress={handleJoin} />
                    </View>
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
        marginBottom: 20,
        fontFamily: typography.fontFamily,
        textShadowColor: colors.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
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
});
