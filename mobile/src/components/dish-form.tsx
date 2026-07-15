import { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { api, mediaUrl, MenuItem } from "@/lib/api";
import { Card, Icon, Input } from "@/components/ui";
import { colors, font, GlyphName, radius } from "@/lib/theme";

export type DishDraft = {
  name: string;
  caption: string;
  description: string;
  price: string;
  imageUrl: string;
  videoUrl: string;
  isVegetarian: boolean;
  isSpicy: boolean;
  isAvailable: boolean;
};

export function draftFromItem(item?: MenuItem): DishDraft {
  return {
    name: item?.name ?? "",
    caption: item?.caption ?? "",
    description: item?.description ?? "",
    price: item ? String(item.price) : "",
    imageUrl: item?.imageUrl ?? "",
    videoUrl: item?.videoUrl ?? "",
    isVegetarian: item?.isVegetarian ?? false,
    isSpicy: item?.isSpicy ?? false,
    isAvailable: item?.isAvailable ?? true,
  };
}

export async function captureMedia(
  kind: "image" | "video",
  source: "camera" | "library"
): Promise<string | null> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: kind === "image" ? ["images"] : ["videos"],
    quality: 0.8,
    videoMaxDuration: 60,
    allowsEditing: kind === "image",
  };
  let result: ImagePicker.ImagePickerResult;
  if (source === "camera") {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera permission needed", "Allow camera access in Settings to film dishes.");
      return null;
    }
    result = await ImagePicker.launchCameraAsync(options);
  } else {
    result = await ImagePicker.launchImageLibraryAsync(options);
  }
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export function chooseSource(onPick: (source: "camera" | "library") => void) {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ["Cancel", "Use camera", "Choose from library"], cancelButtonIndex: 0 },
      (i) => {
        if (i === 1) onPick("camera");
        if (i === 2) onPick("library");
      }
    );
  } else {
    Alert.alert("Add media", undefined, [
      { text: "Use camera", onPress: () => onPick("camera") },
      { text: "Choose from library", onPress: () => onPick("library") },
      { text: "Cancel", style: "cancel" },
    ]);
  }
}

const SWITCHES: { label: string; key: "isVegetarian" | "isSpicy" | "isAvailable"; icon: GlyphName }[] = [
  { label: "Vegetarian", key: "isVegetarian", icon: "eco" },
  { label: "Spicy", key: "isSpicy", icon: "fire" },
  { label: "Visible on menu", key: "isAvailable", icon: "visibility" },
];

export function DishForm({
  draft,
  onChange,
  onRemoveMedia,
}: {
  draft: DishDraft;
  onChange: (patch: Partial<DishDraft>) => void;
  /** When provided (edit screen), removal persists to the server immediately. */
  onRemoveMedia?: (kind: "image" | "video") => void;
}) {
  const [uploading, setUploading] = useState<"image" | "video" | null>(null);

  const confirmRemove = (kind: "image" | "video") => {
    Alert.alert(
      kind === "image" ? "Remove photo?" : "Remove 360° video?",
      "It will no longer appear on your menu.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            if (onRemoveMedia) onRemoveMedia(kind);
            else onChange(kind === "image" ? { imageUrl: "" } : { videoUrl: "" });
          },
        },
      ]
    );
  };

  const addMedia = (kind: "image" | "video") =>
    chooseSource(async (source) => {
      const uri = await captureMedia(kind, source);
      if (!uri) return;
      setUploading(kind);
      try {
        const { url } = await api.upload(uri, kind);
        onChange(kind === "image" ? { imageUrl: url } : { videoUrl: url });
      } catch (err) {
        Alert.alert("Upload failed", err instanceof Error ? err.message : "Try again");
      } finally {
        setUploading(null);
      }
    });

  return (
    <View>
      {/* Media */}
      <View style={styles.mediaRow}>
        <Pressable style={styles.mediaBox} onPress={() => addMedia("image")}>
          {draft.imageUrl ? (
            <>
              <Image source={{ uri: mediaUrl(draft.imageUrl) }} style={styles.mediaFill} />
              <Pressable style={styles.removeChip} hitSlop={8} onPress={() => confirmRemove("image")}>
                <Icon name="close" size={15} color="#fff" />
              </Pressable>
            </>
          ) : (
            <View style={styles.mediaInner}>
              <Icon name="photo_camera" size={26} color={colors.accent} />
              <Text style={styles.mediaHint} allowFontScaling={false}>
                {uploading === "image" ? "Uploading…" : "Add photo"}
              </Text>
            </View>
          )}
        </Pressable>
        <Pressable style={styles.mediaBox} onPress={() => addMedia("video")}>
          {draft.videoUrl ? (
            <Pressable style={styles.removeChip} hitSlop={8} onPress={() => confirmRemove("video")}>
              <Icon name="close" size={15} color="#fff" />
            </Pressable>
          ) : null}
          <View style={styles.mediaInner}>
            <Icon
              name="videocam"
              size={26}
              color={draft.videoUrl ? colors.success : colors.sky}
            />
            <Text style={styles.mediaHint} allowFontScaling={false}>
              {uploading === "video"
                ? "Uploading…"
                : draft.videoUrl
                  ? "Video added\nTap to replace"
                  : "Film 360° video"}
            </Text>
          </View>
        </Pressable>
      </View>
      <Text style={styles.mediaTip}>
        The photo appears on your menu for every plan — and on Pro it also becomes the 3D model.
        Filming tip: place the plate on a table and walk slowly around it.
      </Text>

      <Input
        label="Dish name"
        value={draft.name}
        onChangeText={(v) => onChange({ name: v })}
        placeholder="Fire-Grilled Burger"
      />
      <Input
        label="Caption"
        value={draft.caption}
        onChangeText={(v) => onChange({ caption: v })}
        placeholder="Our signature since day one"
        hint="A short tasty line shown under the dish name."
      />
      <Input
        label="Description"
        value={draft.description}
        onChangeText={(v) => onChange({ description: v })}
        placeholder="Dry-aged beef, smoked cheddar…"
        multiline
      />
      <Input
        label="Price"
        value={draft.price}
        onChangeText={(v) => onChange({ price: v.replace(",", ".") })}
        keyboardType="decimal-pad"
        placeholder="12.50"
      />

      <Card style={{ paddingVertical: 6 }}>
        {SWITCHES.map(({ label, key, icon }, i) => (
          <View key={key} style={[styles.switchRow, i > 0 && styles.switchDivider]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <Icon name={icon} size={19} color={draft[key] ? colors.accent : colors.textFaint} />
              <Text style={styles.switchLabel}>{label}</Text>
            </View>
            <Switch
              value={draft[key]}
              onValueChange={(v) => onChange({ [key]: v })}
              trackColor={{ true: colors.accent, false: colors.border }}
              thumbColor={colors.text}
            />
          </View>
        ))}
      </Card>
    </View>
  );
}

export function parseDraft(draft: DishDraft): { error?: string; price?: number } {
  if (!draft.name.trim()) return { error: "Give the dish a name." };
  const price = Number(draft.price);
  if (!draft.price || Number.isNaN(price) || price < 0)
    return { error: "Enter a valid price." };
  return { price };
}

const styles = StyleSheet.create({
  mediaRow: { flexDirection: "row", gap: 10 },
  mediaBox: {
    flex: 1,
    aspectRatio: 1.2,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  mediaInner: { alignItems: "center", gap: 6 },
  mediaFill: { width: "100%", height: "100%" },
  mediaHint: {
    color: colors.textDim,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: font.medium,
  },
  removeChip: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(10,10,12,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaTip: {
    color: colors.textFaint,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
    marginBottom: 18,
    fontFamily: font.regular,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  switchDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  switchLabel: { color: colors.text, fontSize: 14.5, fontFamily: font.medium },
});
