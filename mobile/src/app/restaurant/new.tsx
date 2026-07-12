import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { handleUpgradeError } from "@/lib/upgrade";
import { Button, Card, IconCircle, Input } from "@/components/ui";
import { colors, font } from "@/lib/theme";

export default function NewRestaurant() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Give your restaurant a name.");
      return;
    }
    setLoading(true);
    try {
      const { restaurant } = await api.createRestaurant({
        name: name.trim(),
        description,
        address,
        phone,
        currency: currency.trim().toUpperCase() || "USD",
      });
      router.replace(`/restaurant/${restaurant.id}`);
    } catch (err) {
      if (!handleUpgradeError(err)) {
        Alert.alert("Could not create restaurant", err instanceof Error ? err.message : "Try again");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.intro}>
        <IconCircle name="storefront" size={52} />
        <Text style={styles.introText}>
          Just the basics for now — you can add your logo, colors, and theme later in Settings.
        </Text>
      </View>

      <Card style={{ padding: 18 }}>
        <Input
          label="Restaurant name"
          value={name}
          onChangeText={setName}
          placeholder="The Copper Kettle"
        />
        <Input
          label="Short description"
          value={description}
          onChangeText={setDescription}
          placeholder="Slow food, open fire."
          multiline
        />
        <Input label="Address" value={address} onChangeText={setAddress} placeholder="12 Market Lane" />
        <Input
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 555 010 2030"
          keyboardType="phone-pad"
        />
        <Input
          label="Currency"
          value={currency}
          onChangeText={setCurrency}
          placeholder="USD"
          autoCapitalize="characters"
          hint="ISO code shown next to prices — USD, EUR, GBP…"
        />
      </Card>

      <Button
        title="Create restaurant"
        icon="add"
        onPress={submit}
        loading={loading}
        style={{ marginTop: 20 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  intro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
    marginTop: 4,
  },
  introText: {
    flex: 1,
    color: colors.textDim,
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: font.regular,
  },
});
