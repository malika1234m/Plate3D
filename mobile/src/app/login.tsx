import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { api, setToken } from "@/lib/api";
import { Button, Card, Input } from "@/components/ui";
import { colors, font } from "@/lib/theme";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const { token } = await api.login(email.trim(), password);
      await setToken(token);
      router.replace("/restaurants");
    } catch (err) {
      Alert.alert("Sign in failed", err instanceof Error ? err.message : "Try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Image source={require("../../assets/images/plate-logo.png")} style={styles.logoImg} />
          <Text style={styles.logo} allowFontScaling={false}>
            Plate<Text style={{ color: colors.accent }}>3D</Text>
          </Text>
          <Text style={styles.tagline}>Your menu, in three dimensions.</Text>
        </View>

        <Card style={styles.formCard}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@restaurant.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          <Button
            title="Sign in"
            icon="arrow_forward"
            onPress={submit}
            loading={loading}
            style={{ marginTop: 4 }}
          />
        </Card>

        <Pressable onPress={() => router.push("/register")} style={{ marginTop: 26 }}>
          <Text style={styles.switch}>
            New to Plate3D? <Text style={styles.switchAccent}>Create an account</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  hero: { alignItems: "center", marginBottom: 28 },
  logoImg: { width: 88, height: 88, marginBottom: 14 },
  logo: {
    color: colors.text,
    fontSize: 38,
    fontFamily: font.heavy,
  },
  tagline: {
    color: colors.textFaint,
    marginTop: 2,
    fontSize: 14,
    fontFamily: font.regular,
  },
  formCard: { padding: 20, borderRadius: 24 },
  switch: {
    color: colors.textDim,
    textAlign: "center",
    fontSize: 14,
    fontFamily: font.regular,
  },
  switchAccent: { color: colors.accent, fontFamily: font.semibold },
});
