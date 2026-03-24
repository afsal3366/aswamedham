import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, KeyboardAvoidingView, Platform, Alert, useWindowDimensions } from 'react-native';
import { SpaceBackground } from '../components/SpaceBackground';
import { NeonButton } from '../components/NeonButton';
import { ChatBubble } from '../components/ChatBubble';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { useGameStore, ChatMessage, Player } from '../store/gameStore';
import { apiClient, connectSSE } from '../services/api';
import { colors, typography } from '../theme/colors';

export const GameRoomScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const {
        roomId, userId, isHost, players, messages, status, currentTurn, awaitingHost, gameMode,
        setPlayers, addMessages, setStatus, setTurn, setGameOver, reset, setAwaitingHost
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
                    // Simplistic merge to avoid dupes purely relying on SSE if multiple players join
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
                }
            } else if (data.type === 'chat') {
                addMessages(data.messages);
            }
        });

        return () => {
            sse.close();
        };
    }, [roomId, navigation]); // Removed `players` dependency to avoid reconnects

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
                    <View style={styles.playersContainer}>
                        {players.map(p => (
                            <PlayerAvatar
                                key={p.id}
                                username={p.username}
                                isActive={currentTurn === p.id}
                                isHost={p.is_host}
                            />
                        ))}
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
                ) : awaitingHost && isHost ? (
                    <View style={styles.hostControlPanel}>
                        <Text style={styles.hostPrompt}>A player asked a question. Choose your answer:</Text>
                        <View style={styles.hostButtonsContainer}>
                            <NeonButton title="YES" onPress={() => handleHostAnswer('YES')} style={styles.choiceBtn} gradientColors={['#00ff66', '#00cc55']} />
                            <NeonButton title="NO" onPress={() => handleHostAnswer('NO')} style={styles.choiceBtn} gradientColors={['#ff0055', '#cc0044']} />
                            <NeonButton title="MAYBE" onPress={() => handleHostAnswer('MAYBE')} style={styles.choiceBtn} />
                        </View>
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
                                disabled={!myTurn || awaitingHost || !inputText.trim()}
                                style={styles.sendBtn}
                                textStyle={{ fontSize: 14 }}
                            />
                        </View>
                        {!myTurn && !awaitingHost && <Text style={styles.notTurnText}>Waiting for other player's move...</Text>}
                        {awaitingHost && !isHost && <Text style={styles.notTurnText}>Waiting for host response...</Text>}
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
    },
    gameTitle: {
        color: colors.primary,
        fontFamily: typography.fontFamily,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 2,
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
    }
});
