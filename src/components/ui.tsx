import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';

import { avatarPalette, colors, fonts } from '@/lib/theme';
import type { Status } from '@/lib/status';
import { STATUS_META } from '@/lib/status';

export function T({ style, variant = 'body', ...rest }: TextProps & { variant?: 'title' | 'display' | 'body' | 'medium' | 'semibold' | 'label' | 'small' }) {
  return <Text {...rest} style={[styles.base, variantStyles[variant], style]} />;
}

const variantStyles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 32, letterSpacing: -0.6, lineHeight: 36 },
  display: { fontFamily: fonts.displayMedium, fontSize: 22, lineHeight: 27 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
  medium: { fontFamily: fonts.medium, fontSize: 15 },
  semibold: { fontFamily: fonts.semibold, fontSize: 16 },
  label: { fontFamily: fonts.semibold, fontSize: 13, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.muted },
  small: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
});

export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).replace(/^./, (c) => c.toUpperCase());
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function Avatar({ name, colorIdx, size = 44, status, muted, selected }: { name: string; colorIdx: number; size?: number; status?: Status; muted?: boolean; selected?: boolean }) {
  const [bg, fg] = muted ? ['#E9EBE7', colors.muted] : avatarPalette[colorIdx % avatarPalette.length];
  const ring = status && status !== 'on' ? { borderWidth: 2, borderStyle: STATUS_META[status].ring, borderColor: STATUS_META[status].stroke } : null;
  return (
    <View style={selected ? { padding: 2, borderRadius: size, borderWidth: 2, borderColor: colors.ink } : null}>
      <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }, ring]}>
        <Text style={{ color: fg, fontFamily: fonts.semibold, fontSize: Math.round(size * 0.34) }}>{initials(name)}</Text>
      </View>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ backgroundColor: colors.card, borderRadius: 18 }, style]}>{children}</View>;
}

export function Chip({ label, on, onPress, style }: { label: string; on: boolean; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.chip, on ? styles.chipOn : null, style]}
    >
      <Text style={[styles.chipText, on ? { color: '#FFFFFF' } : null]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ children, onPress, label, bg = colors.accentSoft, size = 44, style }: { children: ReactNode; onPress: () => void; label: string; bg?: string; size?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 }, style]}
    >
      {children}
    </Pressable>
  );
}

export function PrimaryButton({ label, onPress, disabled, style, textStyle }: { label: string; onPress: () => void; disabled?: boolean; style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.primary, { opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }, style]}
    >
      <Text style={[{ color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 16 }, textStyle]}>{label}</Text>
    </Pressable>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.hairline }} />;
}

const styles = StyleSheet.create({
  base: { color: colors.ink },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  primary: { height: 54, borderRadius: 27, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
