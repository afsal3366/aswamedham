import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, Theme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LobbyScreen } from './src/screens/LobbyScreen';
import { GameRoomScreen } from './src/screens/GameRoomScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { colors } from './src/theme/colors';

const Stack = createNativeStackNavigator();

const navigatorTheme: Theme = {
    ...DefaultTheme,
    dark: true,
    colors: {
        ...DefaultTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.background,
        text: colors.text,
        border: colors.border,
        notification: colors.accent,
    },
};

export default function App() {
    return (
        <SafeAreaProvider style={{ flex: 1 }}>
            <NavigationContainer theme={navigatorTheme}>
                <Stack.Navigator
                    id="RootStack"
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: colors.background },
                        animation: 'fade',
                    }}
                    initialRouteName="Lobby"
                >
                    <Stack.Screen name="Lobby" component={LobbyScreen} />
                    <Stack.Screen name="GameRoom" component={GameRoomScreen} />
                    <Stack.Screen name="Result" component={ResultScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}
