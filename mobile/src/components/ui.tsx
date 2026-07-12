import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { colors, font, glyphs, GlyphName, radius } from "@/lib/theme";

/* ---------- Icon (Material Symbols glyph) ---------- */

export function Icon({
  name,
  size = 20,
  color = colors.textDim,
  style,
}: {
  name: GlyphName;
  size?: number;
  color?: string;
  style?: TextStyle;
}) {
  return (
    <Text
      style={[{ fontFamily: font.icon, fontSize: size, color, lineHeight: size * 1.15 }, style]}
      allowFontScaling={false}
    >
      {glyphs[name]}
    </Text>
  );
}

/** Icon inside a tinted circle — used for action tiles and empty states. */
export function IconCircle({
  name,
  size = 44,
  color = colors.accent,
  background = colors.accentSoft,
}: {
  name: GlyphName;
  size?: number;
  color?: string;
  background?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={name} size={size * 0.5} color={color} />
    </View>
  );
}

/* ---------- Button ---------- */

export function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  small,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: GlyphName;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;
  const textColor =
    variant === "primary" ? "#fff" : variant === "danger" ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        variant === "primary" && { backgroundColor: colors.accent },
        variant === "secondary" && {
          backgroundColor: colors.surfaceRaised,
          borderWidth: 1,
          borderColor: colors.border,
        },
        variant === "ghost" && {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.borderLight,
        },
        variant === "danger" && { backgroundColor: colors.dangerSoft },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : colors.accent} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {icon ? <Icon name={icon} size={small ? 16 : 19} color={textColor} /> : null}
          <Text
            style={[styles.buttonText, small && { fontSize: 13 }, { color: textColor }]}
            allowFontScaling={false}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/* ---------- Input ---------- */

export function Input(props: TextInputProps & { label?: string; hint?: string }) {
  const { label, hint, style, ...rest } = props;
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textFaint}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, focused && { borderColor: colors.accent }, style]}
        {...rest}
      />
      {hint ? <Text style={styles.inputHint}>{hint}</Text> : null}
    </View>
  );
}

/* ---------- Card & sections ---------- */

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={{ marginTop: 24, marginBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={styles.sectionTick} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

/* ---------- Badge (status pill) ---------- */

export type BadgeTone = "accent" | "sky" | "success" | "danger" | "neutral";

const badgeTones: Record<BadgeTone, { fg: string; bg: string }> = {
  accent: { fg: colors.accent, bg: colors.accentSoft },
  sky: { fg: colors.sky, bg: colors.skySoft },
  success: { fg: colors.success, bg: colors.successSoft },
  danger: { fg: colors.danger, bg: colors.dangerSoft },
  neutral: { fg: colors.textFaint, bg: colors.surfaceRaised },
};

export function Badge({
  label,
  tone = "neutral",
  dot,
}: {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
}) {
  const t = badgeTones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {dot ? <View style={[styles.badgeDot, { backgroundColor: t.fg }]} /> : null}
      <Text style={[styles.badgeText, { color: t.fg }]} allowFontScaling={false}>
        {label}
      </Text>
    </View>
  );
}

/* ---------- Chip (selectable pill) ---------- */

export function Chip({
  label,
  active,
  onPress,
  swatch,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  swatch?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: colors.accent, borderColor: colors.accent },
      ]}
    >
      {swatch ? <View style={[styles.chipSwatch, { backgroundColor: swatch }]} /> : null}
      <Text
        style={{
          color: active ? "#fff" : colors.textDim,
          fontFamily: font.semibold,
          fontSize: 13,
        }}
        allowFontScaling={false}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ---------- Empty state ---------- */

export function EmptyState({
  icon = "restaurant_menu",
  title,
  body,
}: {
  icon?: GlyphName;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.empty}>
      <IconCircle name={icon} size={64} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.full,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSmall: { paddingVertical: 9, paddingHorizontal: 16 },
  buttonText: { fontSize: 15, fontFamily: font.bold, letterSpacing: 0.3 },
  label: {
    color: colors.textDim,
    fontSize: 13,
    marginBottom: 6,
    fontFamily: font.semibold,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    fontFamily: font.regular,
  },
  inputHint: {
    color: colors.textFaint,
    fontSize: 12,
    marginTop: 5,
    lineHeight: 17,
    fontFamily: font.regular,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  sectionTick: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  sectionTitle: { color: colors.text, fontSize: 17, fontFamily: font.heavy },
  sectionHint: {
    color: colors.textFaint,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
    fontFamily: font.regular,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontFamily: font.bold, letterSpacing: 0.4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  chipSwatch: { width: 12, height: 12, borderRadius: 6 },
  empty: { alignItems: "center", paddingVertical: 56, paddingHorizontal: 30 },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontFamily: font.bold,
    marginTop: 16,
  },
  emptyBody: {
    color: colors.textFaint,
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 21,
    fontFamily: font.regular,
  },
});
