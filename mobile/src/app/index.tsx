import { useEffect } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { api, getToken, setToken } from "@/lib/api";
import { LoadingScreen } from "@/components/loading-screen";
import { ONBOARDED_KEY } from "./welcome";

/** Entry point: welcome tour on first launch, then login/dashboard. */
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        const seenTour = await SecureStore.getItemAsync(ONBOARDED_KEY).catch(() => null);
        router.replace(seenTour ? "/login" : "/welcome");
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

  return <LoadingScreen />;
}
