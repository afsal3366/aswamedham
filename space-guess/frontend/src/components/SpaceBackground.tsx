import React, { useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export const SpaceBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Generate a few stable "stars"
    const stars = useMemo(() => {
        return Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            top: Math.random() * height,
            left: Math.random() * width,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.7 + 0.3,
        }));
    }, []);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.background, colors.nebulaStart, colors.nebulaMid, colors.background]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            {stars.map(star => (
                <View
                    key={star.id}
                    style={[
                        styles.star,
                        {
                            top: star.top,
                            left: star.left,
                            width: star.size,
                            height: star.size,
                            opacity: star.opacity,
                        }
                    ]}
                />
            ))}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    star: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
        borderRadius: 5,
    },
    content: {
        flex: 1,
    }
});
