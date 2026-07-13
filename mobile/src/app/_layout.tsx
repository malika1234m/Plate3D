import { DarkTheme, ThemeProvider } from "expo-router";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import { MaterialSymbols_400Regular } from "@expo-google-fonts/material-symbols/400Regular";
import { LoadingScreen } from "@/components/loading-screen";
import { colors, font } from "@/lib/theme";

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

export default function RootLayout() {
  const [loaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    MaterialSymbols_400Regular,
  });

  useEffect(() => {
    // Hand off from the native splash to our branded loading screen right away.
    SplashScreen.hideAsync();
  }, []);

  if (!loaded) return <LoadingScreen />;

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: font.bold, fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="restaurants" options={{ headerShown: false }} />
        <Stack.Screen name="restaurant/new" options={{ title: "New Restaurant" }} />
        <Stack.Screen name="restaurant/[id]/index" options={{ title: "Menu" }} />
        <Stack.Screen name="restaurant/[id]/qr" options={{ title: "QR Code" }} />
        <Stack.Screen name="restaurant/[id]/settings" options={{ title: "Restaurant Settings" }} />
        <Stack.Screen name="item/new" options={{ title: "New Dish" }} />
        <Stack.Screen name="item/[id]" options={{ title: "Edit Dish" }} />
      </Stack>
    </ThemeProvider>
  );
}
