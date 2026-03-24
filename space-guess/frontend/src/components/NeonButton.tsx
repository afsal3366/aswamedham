import React from 'react';
import { StyleSheet, Text, Pressable, ViewStyle, TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '../theme/colors';

interface Props {
    title: string;
    onPress: () => void;
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
    gradientColors?: string[];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const NeonButton: React.FC<Props> = ({ title, onPress, style, textStyle, disabled, gradientColors }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: disabled ? 0.5 : 1,
    }));

    const onPressIn = () => { scale.value = withSpring(0.95); };
    const onPressOut = () => { scale.value = withSpring(1); };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={disabled}
            style={[styles.container, animatedStyle, style]}
        >
            <LinearGradient
                colors={gradientColors || [colors.primary, colors.secondary]}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.gradient}
            >
                <Text style={[styles.text, textStyle]}>{title}</Text>
            </LinearGradient>
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 8,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 8,
        marginVertical: 10,
    },
    gradient: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: typography.fontFamily,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
});
