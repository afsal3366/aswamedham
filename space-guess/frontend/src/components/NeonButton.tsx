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
        opacity: disabled ? 0.4 : 1,
    }));

    const onPressIn = () => { scale.value = withSpring(0.96); };
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
                colors={(gradientColors || [colors.primary, colors.accent]) as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <Text style={[styles.text, textStyle]}>{title}</Text>
            </LinearGradient>
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 100, // Fully rounded
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 10,
        marginVertical: 8,
    },
    gradient: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: colors.text,
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: typography.titleFont,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
});
