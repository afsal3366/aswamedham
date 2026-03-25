import { Platform } from 'react-native';

export const colors = {
  background: '#050816',
  nebulaStart: '#0b0f2a',
  nebulaMid: '#130a24',
  primary: '#00F5FF', // Neon Cyan
  secondary: '#7B61FF', // Purple
  accent: '#9D4EDD', // Highlight Glow
  danger: '#FF3B5C', // Red
  text: '#FFFFFF',
  textMuted: '#A0AABF',
  surface: 'rgba(20, 20, 40, 0.75)', // Glassmorphism base
  surfaceGlow: 'rgba(0, 245, 255, 0.15)',
  border: 'rgba(0, 245, 255, 0.2)',
};

export const typography = {
  titleFont: Platform.OS === 'web' ? 'Orbitron, sans-serif' : 'System',
  bodyFont: Platform.OS === 'web' ? 'Inter, sans-serif' : 'System',
  monoFont: Platform.OS === 'web' ? 'JetBrains Mono, monospace' : 'System',
  fontFamily: Platform.OS === 'web' ? 'Inter, sans-serif' : 'System', // Legacy compatibility
};
