import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

export const SpaceBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <LinearGradient
            colors={[colors.background, '#1A1423', '#0B0F1A']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            {/* Optional: Add animated stars as absolute views overlay */}
            {children}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
