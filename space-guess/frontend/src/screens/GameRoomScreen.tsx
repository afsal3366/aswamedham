import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, KeyboardAvoidingView, Platform, Alert, useWindowDimensions, Pressable } from 'react-native';
import { SpaceBackground } from '../components/SpaceBackground';
import { NeonButton } from '../components/NeonButton';
import { ChatBubble } from '../components/ChatBubble';
import { AstronautSidebar } from '../components/AstronautSidebar';
import { MissionHeader } from '../components/MissionHeader';
import { useGameStore } from '../store/gameStore';
import { apiClient, connectSSE } from '../services/api';
import { colors, typography } from '../theme/colors';
import { ShimmerLoader } from '../components/ShimmerLoader';

export const GameRoomScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const {
        roomId, userId, isHost, players, messages, status, currentTurn, awaitingHost, gameMode,
        guessCounts, addMessages, setStatus, setTurn, setGameOver, reset, resetForNewGame,
        triggerTimerReset, setIsSubmitting, isSubmitting
    } = useGameStore();

    const [inputText, setInputText] = useState('');
    const [isGuessMode, setIsGuessMode] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);
    const { width, height } = useWindowDimensions();
    const isDesktop = width > 1024;
    const isTablet = width > 768 && width <= 1024;

    useEffect(() => {
        if (!roomId) {
            navigation.replace('Lobby');
            return;
        }

        const sse = connectSSE(roomId, (data: any) => {
            if (data.type === 'system') {
                if (data.action === 'player_joined') {
                    useGameStore.getState().setPlayers(
                        [...useGameStore.getState().players, data.player]
                            .filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i)
                    );
                } else if (data.action === 'game_started') {
                    setStatus('playing');
                    setTurn(data.turn);
                } else if (data.action === 'turn_change') {
                    setTurn(data.turn);
                    triggerTimerReset();
                } else if (data.action === 'game_over') {
                    setGameOver(data.reason, data.word, data.winner);
                    navigation.navigate('Result');
                } else if (data.action === 'awaiting_host_response') {
                    useGameStore.getState().setAwaitingHost(true);
                    triggerTimerReset();
                } else if (data.action === 'host_answer_submitted') {
                    useGameStore.getState().setAwaitingHost(false);
                    triggerTimerReset();
                } else if (data.action === 'player_left') {
                    const currentPlayers = useGameStore.getState().players;
                    useGameStore.getState().setPlayers(currentPlayers.filter(p => p.id !== data.user_id));
                    if (data.is_host) {
                        Alert.alert('Room Closed', 'The host has left the room.');
                        reset();
                        navigation.replace('Lobby');
                    }
                } else if (data.action === 'player_kicked') {
                    if (data.user_id === userId) {
                        Alert.alert('Ejected', 'You have been ejected from the mission.');
                        reset();
                        navigation.replace('Lobby');
                    } else {
                        const currentPlayers = useGameStore.getState().players;
                        useGameStore.getState().setPlayers(currentPlayers.filter(p => p.id !== data.user_id));
                    }
                } else if (data.action === 'room_closed') {
                    Alert.alert('Mission Aborted', 'The mission control has closed the session.');
                    reset();
                    navigation.replace('Lobby');
                }
            } else if (data.type === 'chat') {
                addMessages(data.messages);
            }
        });

        return () => sse.close();
    }, [roomId, navigation]);

    const handleSend = async () => {
        if (!inputText.trim() || isSubmitting) return;
        setIsSubmitting(true);
        const path = isGuessMode ? '/game/guess' : '/game/question';
        const body = isGuessMode
            ? { room_id: roomId, user_id: userId, guess: inputText }
            : { room_id: roomId, user_id: userId, question: inputText };

        const text = inputText;
        setInputText('');

        try {
            await apiClient.post(path, body);
            triggerTimerReset();
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.detail || 'Transmission failed');
            setInputText(text);
        } finally {
            setIsSubmitting(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleHostAnswer = async (ans: 'YES' | 'NO' | 'MAYBE') => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await apiClient.post('/game/host_answer', { room_id: roomId, user_id: userId, answer: ans });
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.detail || 'Failed to submit response');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStartGame = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await apiClient.post('/game/start', { room_id: roomId, user_id: userId });
        } catch (e) {
            Alert.alert('Error', 'Initialization failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePlayAgain = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await apiClient.post('/game/start', { room_id: roomId, user_id: userId });
            resetForNewGame();
        } catch (e: any) {
            Alert.alert('Error', 'New mission initialization failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExit = async () => {
        try {
            await apiClient.post('/room/leave', { room_id: roomId, user_id: userId });
            reset();
            navigation.replace('Lobby');
        } catch (e) {
            reset();
            navigation.replace('Lobby');
        }
    };

    const myTurn = currentTurn === userId;
    const currentUser = players.find(p => p.id === userId);

    return (
        <SpaceBackground>
            <View style={styles.screenWrapper}>
                {/* Desktop Sidebar */}
                {(isDesktop || isTablet) && (
                    <AstronautSidebar
                        username={currentUser?.username || 'Astronaut'}
                        roomId={roomId || '0000'}
                        isHost={isHost}
                        players={players}
                        onExit={handleExit}
                        isCollapsed={isSidebarCollapsed}
                        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    />
                )}

                <KeyboardAvoidingView
                    style={[
                        styles.mainContainer,
                        isDesktop && { width: isSidebarCollapsed ? width - 80 : width - 260 }
                    ]}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <MissionHeader />

                    <View style={styles.gameContent}>
                        {/* Status Messages for Lobby/Finished */}
                        {status !== 'playing' && (
                            <View style={styles.overlay}>
                                <Text style={styles.overlayText}>
                                    {status === 'lobby' ? 'WAITING FOR CREW INITIATION' : 'MISSION DATA ANALYSIS COMPLETE'}
                                </Text>
                                {isHost && (
                                    <NeonButton
                                        title={status === 'lobby' ? 'START MISSION' : 'NEW MISSION'}
                                        onPress={status === 'lobby' ? handleStartGame : handlePlayAgain}
                                        style={styles.actionBtn}
                                    />
                                )}
                            </View>
                        )}

                        <FlatList
                            ref={flatListRef}
                            data={messages.filter(m => !m.visible_to || m.visible_to === userId)}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => <ChatBubble message={item} isOwnMsg={item.user_id === userId} />}
                            contentContainerStyle={styles.chatList}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        />
                    </View>

                    {/* Controls Footer */}
                    {status === 'playing' && (
                        <View style={styles.footer}>
                            {awaitingHost && isHost ? (
                                <View style={styles.hostPanel}>
                                    <Text style={styles.hostPrompt}>MISSION COMMANDER: SEND RESPONSE</Text>
                                    <View style={styles.hostButtons}>
                                        <NeonButton title="YES" onPress={() => handleHostAnswer('YES')} style={styles.hBtn} gradientColors={['#39FF14', '#28cc10']} />
                                        <NeonButton title="NO" onPress={() => handleHostAnswer('NO')} style={styles.hBtn} gradientColors={['#FF3131', '#cc2020']} />
                                        <NeonButton title="MAYBE" onPress={() => handleHostAnswer('MAYBE')} style={styles.hBtn} gradientColors={[colors.primary, colors.secondary]} />
                                    </View>
                                </View>
                            ) : isHost && gameMode === 'HOST' ? (
                                <View style={styles.hostIdlePanel}>
                                    <Text style={styles.hostIdleText}>MONITORING SECTOR COMMUNICATIONS...</Text>
                                </View>
                            ) : (
                                <View style={[styles.inputPanel, (!myTurn || awaitingHost) && styles.disabledPanel]}>
                                    <View style={styles.modeToggle}>
                                        <Pressable
                                            style={[styles.modeBtn, !isGuessMode && styles.activeModeBtn]}
                                            onPress={() => setIsGuessMode(false)}
                                        >
                                            <Text style={[styles.modeBtnText, !isGuessMode && styles.activeModeBtnText]}>ASK</Text>
                                        </Pressable>
                                        <Pressable
                                            style={[styles.modeBtn, isGuessMode && styles.activeModeBtn]}
                                            onPress={() => setIsGuessMode(true)}
                                        >
                                            <Text style={[styles.modeBtnText, isGuessMode && styles.activeModeBtnText]}>GUESS</Text>
                                        </Pressable>
                                    </View>

                                    <View style={styles.inputRow}>
                                        {isSubmitting ? (
                                            <View style={{ flex: 1, height: 45, justifyContent: 'center' }}>
                                                <ShimmerLoader height={35} style={{ borderRadius: 4 }} />
                                            </View>
                                        ) : (
                                            <TextInput
                                                ref={inputRef}
                                                style={styles.terminalInput}
                                                placeholder={isGuessMode ? "Identify target..." : "Transmit question..."}
                                                placeholderTextColor="rgba(0, 245, 255, 0.3)"
                                                value={inputText}
                                                onChangeText={setInputText}
                                                editable={myTurn && !awaitingHost}
                                                onSubmitEditing={handleSend}
                                            />
                                        )}
                                        <NeonButton
                                            title={isGuessMode ? "GUESS" : "SEND"}
                                            onPress={handleSend}
                                            disabled={!myTurn || awaitingHost || !inputText.trim() || isSubmitting || (isGuessMode && (guessCounts[userId || ''] || 0) >= 3)}
                                            style={styles.sendBtn}
                                        />
                                    </View>

                                    {!myTurn && !awaitingHost && (
                                        <Text style={styles.statusText}>WAITING FOR OTHER ASTRONAUTS...</Text>
                                    )}
                                    {awaitingHost && !isHost && (
                                        <Text style={styles.statusText}>WAITING FOR MISSION COMMANDER...</Text>
                                    )}
                                </View>
                            )}
                        </View>
                    )}
                </KeyboardAvoidingView>
            </View>
        </SpaceBackground>
    );
};

const styles = StyleSheet.create({
    screenWrapper: {
        flex: 1,
        flexDirection: 'row',
    },
    mainContainer: {
        flex: 1,
        backgroundColor: 'rgba(5, 8, 22, 0.4)',
    },
    gameContent: {
        flex: 1,
        position: 'relative',
    },
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(5, 8, 22, 0.8)',
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    overlayText: {
        color: colors.primary,
        fontSize: 16,
        fontFamily: typography.titleFont,
        letterSpacing: 4,
        textAlign: 'center',
        marginBottom: 30,
        textShadowColor: colors.primary,
        textShadowRadius: 15,
    },
    actionBtn: {
        width: 240,
    },
    chatList: {
        padding: 20,
        paddingBottom: 40,
    },
    footer: {
        borderTopWidth: 1,
        borderColor: colors.border,
        backgroundColor: 'rgba(5, 8, 22, 0.9)',
        padding: 20,
    },
    hostPanel: {
        alignItems: 'center',
    },
    hostPrompt: {
        color: colors.primary,
        fontSize: 10,
        fontFamily: typography.titleFont,
        letterSpacing: 2,
        marginBottom: 15,
    },
    hostButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 10,
    },
    hBtn: {
        flex: 1,
    },
    hostIdlePanel: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    hostIdleText: {
        color: colors.primary,
        fontSize: 10,
        fontFamily: typography.titleFont,
        letterSpacing: 2,
        opacity: 0.6,
    },
    inputPanel: {
        width: '100%',
    },
    disabledPanel: {
        opacity: 0.5,
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: 4,
        padding: 2,
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
    modeBtn: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 4,
    },
    activeModeBtn: {
        backgroundColor: colors.primary,
    },
    modeBtnText: {
        color: colors.textMuted,
        fontSize: 9,
        fontWeight: 'bold',
        fontFamily: typography.titleFont,
    },
    activeModeBtnText: {
        color: colors.background,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    terminalInput: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 4,
        color: colors.primary,
        padding: 12,
        fontFamily: typography.monoFont,
        fontSize: 14,
    },
    sendBtn: {
        width: 100,
        marginVertical: 0,
    },
    statusText: {
        color: colors.accent,
        fontSize: 9,
        fontFamily: typography.titleFont,
        textAlign: 'center',
        marginTop: 10,
        letterSpacing: 1,
    }
});
