import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, KeyboardAvoidingView, Platform, Alert, useWindowDimensions } from 'react-native';
import { SpaceBackground } from '../components/SpaceBackground';
import { NeonButton } from '../components/NeonButton';
import { ChatBubble } from '../components/ChatBubble';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { CountdownTimer } from '../components/CountdownTimer';
import { useGameStore, ChatMessage, Player } from '../store/gameStore';
import { apiClient, connectSSE } from '../services/api';
import { colors, typography } from '../theme/colors';

export const GameRoomScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const {
        roomId, userId, isHost, players, messages, status, currentTurn, awaitingHost, gameMode,
        maxQuestions, questionCount, guessCounts,
        setPlayers, addMessages, setStatus, setTurn, setGameOver, reset, resetForNewGame, setAwaitingHost
    } = useGameStore();

    const [inputText, setInputText] = useState('');
    const [isGuessMode, setIsGuessMode] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const { width, height } = useWindowDimensions();
    const isDesktop = width > 768;

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
                } else if (data.action === 'game_over') {
                    setGameOver(data.reason, data.word, data.winner);
                    navigation.navigate('Result');
                } else if (data.action === 'awaiting_host_response') {
                    useGameStore.getState().setAwaitingHost(true);
                } else if (data.action === 'host_answer_submitted') {
                    useGameStore.getState().setAwaitingHost(false);
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
                        Alert.alert('Kicked', 'You have been removed from the room.');
                        reset();
                        navigation.replace('Lobby');
                    } else {
                        const currentPlayers = useGameStore.getState().players;
                        useGameStore.getState().setPlayers(currentPlayers.filter(p => p.id !== data.user_id));
                    }
                } else if (data.action === 'room_closed') {
                    Alert.alert('Room Closed', 'The room has been closed.');
                    reset();
                    navigation.replace('Lobby');
                }
            } else if (data.type === 'chat') {
                addMessages(data.messages);
            }
        });

        return () => {
            sse.close();
        };
    }, [roomId, navigation]);

    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.type === 'system' && (lastMsg as any).action === 'player_kicked' && (lastMsg as any).user_id === userId) {
            alert('You have been ejected from the mission!');
            reset();
            navigation.navigate('Lobby');
        }
    }, [messages]);

    const handleKick = async (targetId: string) => {
        if (!roomId || !userId) return;
        try {
            await apiClient.post('/room/kick', {
                room_id: roomId,
                host_id: userId,
                target_user_id: targetId
            });
        } catch (e) {
            console.error("Kick failed", e);
        }
    };

    const handleStartGame = async () => {
        try {
            await apiClient.post('/game/start', { room_id: roomId, user_id: userId });
        } catch (e) {
            Alert.alert('Error', 'Failed to start game');
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;
        const path = isGuessMode ? '/game/guess' : '/game/question';
        const body = isGuessMode
            ? { room_id: roomId, user_id: userId, guess: inputText }
            : { room_id: roomId, user_id: userId, question: inputText };

        const text = inputText;
        setInputText('');

        try {
            await apiClient.post(path, body);
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.detail || 'Failed to send');
            setInputText(text); // restore
        }
    };

    const handleHostAnswer = async (ans: 'YES' | 'NO' | 'MAYBE') => {
        try {
            await apiClient.post('/game/host_answer', { room_id: roomId, user_id: userId, answer: ans });
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.detail || 'Failed to submit answer');
        }
    };

    const handleExit = async () => {
        try {
            await apiClient.post('/room/leave', { room_id: roomId, user_id: userId });
            reset();
            navigation.replace('Lobby');
        } catch (e: any) {
            Alert.alert('Error', 'Failed to leave room');
        }
    };

    const handlePlayAgain = async () => {
        try {
            await apiClient.post('/game/start', { room_id: roomId, user_id: userId });
            resetForNewGame();
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.detail || 'Failed to restart mission');
        }
    };

    const myTurn = currentTurn === userId;

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
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.gameTitle}>SPACE GUESS</Text>
                        <Text style={styles.roomText}>ID: <Text style={styles.roomHighlight}>{roomId}</Text></Text>
                    </View>

                    {status === 'playing' && <CountdownTimer />}

                    <NeonButton
                        title="EXIT"
                        onPress={handleExit}
                        style={styles.exitBtn}
                        textStyle={{ fontSize: 10 }}
                        gradientColors={['#ff3355', '#cc0022']}
                    />

                    {status === 'playing' && (
                        <View style={styles.headerCenter}>
                            <Text style={styles.statsLabel}>QUESTIONS</Text>
                            <Text style={styles.statsValue}>{Math.max(0, (maxQuestions * players.length) - questionCount)}</Text>
                        </View>
                    )}

                    {status === 'playing' && (
                        <View style={styles.headerCenter}>
                            <Text style={styles.statsLabel}>YOUR GUESSES</Text>
                            <Text style={[styles.statsValue, { color: '#FFCC00', textShadowColor: '#FFCC00' }]}>
                                {3 - (guessCounts[userId || ''] || 0)}
                            </Text>
                        </View>
                    )}

                    <View style={styles.playersContainer}>
                        {players.map(p => {
                            const isGameHost = p.is_host && gameMode === 'HOST';
                            const used = messages.filter(m => m.user_id === p.id && m.type === 'question').length;
                            return (
                                <PlayerAvatar
                                    key={p.id}
                                    username={p.username}
                                    isActive={currentTurn === p.id}
                                    isHost={p.is_host}
                                    isMe={p.id === userId}
                                    remaining={isGameHost ? undefined : Math.max(0, maxQuestions - used)}
                                    guessCount={isGameHost ? undefined : (guessCounts[p.id] || 0)}
                                    onKick={isHost && !p.is_host ? () => handleKick(p.id) : undefined}
                                />
                            );
                        })}
                    </View>
                </View>

                {/* Chat Area */}
                <FlatList
                    ref={flatListRef}
                    data={messages.filter(m => !m.visible_to || m.visible_to === userId)}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <ChatBubble message={item} isOwnMsg={item.user_id === userId} />}
                    contentContainerStyle={styles.chatList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Controls Area */}
                {status === 'lobby' ? (
                    <View style={styles.controlArea}>
                        <Text style={styles.waitingText}>Awaiting Mission Start...</Text>
                        {isHost && <NeonButton title="Initiate Sequence" onPress={handleStartGame} />}
                    </View>
                ) : status === 'finished' ? (
                    <View style={styles.controlArea}>
                        <Text style={styles.waitingText}>Mission Debug Finished.</Text>
                        {isHost && <NeonButton title="Prepare New Mission" onPress={handlePlayAgain} />}
                    </View>
                ) : awaitingHost && isHost ? (
                    <View style={styles.hostControlPanel}>
                        <Text style={styles.hostPrompt}>A player asked a question. Choose your answer:</Text>
                        <View style={styles.hostButtonsContainer}>
                            <NeonButton title="YES" onPress={() => handleHostAnswer('YES')} style={styles.choiceBtn} gradientColors={['#00ff66', '#00cc55']} />
                            <NeonButton title="NO" onPress={() => handleHostAnswer('NO')} style={styles.choiceBtn} gradientColors={['#ff0055', '#cc0044']} />
                            <NeonButton title="MAYBE" onPress={() => handleHostAnswer('MAYBE')} style={styles.choiceBtn} />
                        </View>
                    </View>
                ) : isHost && gameMode === 'HOST' ? (
                    <View style={styles.hostStatusPanel}>
                        <Text style={styles.hostStatusText}>You are the Mission Controller. Monitor the comms and wait for the next question.</Text>
                    </View>
                ) : (
                    <View style={[styles.inputContainer, (!myTurn || awaitingHost) && styles.disabledInput]}>
                        <View style={styles.modeToggle}>
                            <Text
                                style={[styles.modeText, !isGuessMode && styles.activeMode]}
                                onPress={() => setIsGuessMode(false)}>ASK</Text>
                            <Text style={styles.modeDivider}>|</Text>
                            <Text
                                style={[styles.modeText, isGuessMode && styles.activeMode]}
                                onPress={() => setIsGuessMode(true)}>GUESS</Text>
                        </View>
                        <View style={styles.row}>
                            <TextInput
                                style={styles.textInput}
                                placeholder={isGuessMode ? "Guess the hidden word..." : "Ask a Yes/No question..."}
                                placeholderTextColor={colors.textMuted}
                                value={inputText}
                                onChangeText={setInputText}
                                editable={myTurn && !awaitingHost}
                                onSubmitEditing={handleSend}
                            />
                            <NeonButton
                                title={isGuessMode ? "GUESS" : "SEND"}
                                onPress={handleSend}
                                disabled={!myTurn || awaitingHost || !inputText.trim() || (isGuessMode && (guessCounts[userId || ''] || 0) >= 3)}
                                style={styles.sendBtn}
                                textStyle={{ fontSize: 14 }}
                            />
                        </View>
                        {!myTurn && !awaitingHost && <Text style={styles.notTurnText}>Waiting for other player's move...</Text>}
                        {awaitingHost && !isHost && <Text style={styles.notTurnText}>Waiting for host response...</Text>}
                        {isGuessMode && (guessCounts[userId || ''] || 0) >= 3 && (
                            <Text style={[styles.notTurnText, { color: '#FF3131' }]}>You have used all your guesses (3/3)!</Text>
                        )}
                        {isGuessMode && (guessCounts[userId || ''] || 0) < 3 && (
                            <Text style={[styles.notTurnText, { color: '#FFCC00' }]}>
                                Warning: {3 - (guessCounts[userId || ''] || 0)} guesses remaining! Use them wisely.
                            </Text>
                        )}
                    </View>
                )}
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
        flexDirection: 'column',
    },
    header: {
        height: 70,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    headerLeft: {
        justifyContent: 'center',
        flex: 1,
    },
    headerCenter: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    statsLabel: {
        color: colors.textMuted,
        fontSize: 8,
        fontFamily: typography.fontFamily,
        letterSpacing: 1,
        marginBottom: 2,
    },
    statsValue: {
        color: colors.primary,
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: typography.fontFamily,
        textShadowColor: colors.primary,
        textShadowRadius: 5,
    },
    gameTitle: {
        color: colors.primary,
        fontFamily: typography.fontFamily,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    exitBtn: {
        width: 60,
        height: 34,
        marginVertical: 0,
        marginLeft: 10,
    },
    roomText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: 2,
    },
    roomHighlight: {
        color: colors.primary,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    playersContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chatList: {
        padding: 25,
        paddingBottom: 40,
    },
    controlArea: {
        padding: 20,
        alignItems: 'center',
        paddingBottom: 30,
    },
    waitingText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        marginBottom: 20,
        fontStyle: 'italic',
    },
    disabledInput: {
        opacity: 0.6,
    },
    inputContainer: {
        padding: 15,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderTopWidth: 1,
        borderColor: colors.border,
        paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    },
    modeToggle: {
        flexDirection: 'row',
        marginBottom: 10,
        marginLeft: 5,
    },
    modeText: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: 'bold',
    },
    activeMode: {
        color: colors.primary,
    },
    modeDivider: {
        color: colors.textMuted,
        marginHorizontal: 10,
        fontSize: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textInput: {
        flex: 0.8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        color: colors.text,
        padding: 12,
        marginRight: 10,
        fontFamily: typography.fontFamily,
    },
    sendBtn: {
        flex: 0.2,
        marginVertical: 0,
        paddingVertical: 12,
        paddingHorizontal: 0,
    },
    notTurnText: {
        color: colors.accent,
        fontSize: 12,
        textAlign: 'center',
        marginTop: 10,
        fontFamily: typography.fontFamily,
    },
    hostControlPanel: {
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderTopWidth: 1,
        borderColor: colors.primary,
        alignItems: 'center',
    },
    hostPrompt: {
        color: colors.text,
        fontSize: 14,
        fontFamily: typography.fontFamily,
        marginBottom: 15,
        fontWeight: 'bold',
    },
    hostButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    choiceBtn: {
        flex: 1,
        marginHorizontal: 5,
        marginVertical: 0,
        paddingVertical: 10,
    },
    hostStatusPanel: {
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        paddingBottom: 30,
    },
    hostStatusText: {
        color: colors.primary,
        fontSize: 13,
        fontFamily: typography.fontFamily,
        fontStyle: 'italic',
        textAlign: 'center',
        opacity: 0.8,
    }
});
