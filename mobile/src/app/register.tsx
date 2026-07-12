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

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name || !email || !password) {
      Alert.alert("Missing details", "Fill in your name, email, and a password.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Use at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const { token } = await api.register(name.trim(), email.trim(), password);
      await setToken(token);
      router.replace("/restaurants");
    } catch (err) {
      Alert.alert("Sign up failed", err instanceof Error ? err.message : "Try again");
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
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Set up your restaurant and publish a 3D menu in minutes.
          </Text>
        </View>

        <Card style={styles.formCard}>
          <Input label="Your name" value={name} onChangeText={setName} placeholder="Alex Chef" />
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
            placeholder="At least 8 characters"
          />
          <Button
            title="Create account"
            icon="arrow_forward"
            onPress={submit}
            loading={loading}
            style={{ marginTop: 4 }}
          />
        </Card>

        <Pressable onPress={() => router.back()} style={{ marginTop: 26 }}>
          <Text style={styles.switch}>
            Already have an account? <Text style={styles.switchAccent}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  hero: { alignItems: "center", marginBottom: 28 },
  logoImg: { width: 72, height: 72, marginBottom: 14 },
  title: { color: colors.text, fontSize: 26, fontFamily: font.heavy, textAlign: "center" },
  subtitle: {
    color: colors.textFaint,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 21,
    textAlign: "center",
    fontFamily: font.regular,
    maxWidth: 300,
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
