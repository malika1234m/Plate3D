import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { api, ApiError } from "./api";

export async function startUpgrade() {
  try {
    const { url } = await api.checkout();
    if (url) await WebBrowser.openBrowserAsync(url);
  } catch (err) {
    Alert.alert(
      "Billing unavailable",
      err instanceof Error ? err.message : "Try again later"
    );
  }
}

/**
 * Show the upgrade prompt when the server answers 402 (plan limit).
 * Returns true when the error was handled.
 */
export function handleUpgradeError(err: unknown): boolean {
  if (err instanceof ApiError && err.status === 402) {
    Alert.alert("Upgrade to Pro", err.message, [
      { text: "Not now", style: "cancel" },
      { text: "Upgrade", onPress: () => startUpgrade() },
    ]);
    return true;
  }
  return false;
}

/** Local date as YYYY-MM-DD — matches the server's sold-out convention. */
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
