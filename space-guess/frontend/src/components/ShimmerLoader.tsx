import React, { useEffect } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import { colors } from '../theme/colors';

interface ShimmerProps {
    width?: any;
    height?: number;
    style?: any;
}

export const ShimmerLoader: React.FC<ShimmerProps> = ({ width = '100%', height = 20, style }) => {
    const animatedValue = new Animated.Value(0);

    useEffect(() => {
        Animated.loop(
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    return (
        <View style={[styles.container, { width, height }, style]}>
            <Animated.View
                style={[
                    styles.shimmer,
                    {
                        width: '100%',
                        height: '100%',
                        transform: [{ translateX }],
                    },
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
        borderRadius: 4,
        position: 'relative',
    },
    shimmer: {
        backgroundColor: 'rgba(0, 245, 255, 0.15)',
        position: 'absolute',
        top: 0,
        left: 0,
    },
});
