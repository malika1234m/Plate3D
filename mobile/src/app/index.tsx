import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { api, getToken, setToken } from "@/lib/api";
import { colors } from "@/lib/theme";

/** Entry point: route to the dashboard when a valid session exists. */
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      try {
        await api.me();
        router.replace("/restaurants");
      } catch {
        await setToken(null);
        router.replace("/login");
      }
    })();
  }, [router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}
