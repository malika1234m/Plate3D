import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/lib/theme";

/**
 * Branded full-screen loading state. Uses no custom fonts or icon glyphs so
 * it can render while those are still being loaded at app start.
 */

/** Matches the loading artwork's paper background so it fills edge-to-edge. */
const PAPER = "#fbf7f1";

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Image
        source={require("../../assets/images/loading-screen.png")}
        style={styles.art}
        resizeMode="contain"
        fadeDuration={0}
      />
      <ActivityIndicator color={colors.accent} size="large" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  art: { flex: 1, width: "100%" },
  spinner: { position: "absolute", alignSelf: "center", bottom: "24%" },
});
