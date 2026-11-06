import { Image, StyleSheet, Text, View } from "react-native";
import { mobileTokens } from "../lib/appearance";
import { useThemedStyles } from "../lib/native";
import { NativeSymbol } from "./native-symbol";

export function ProfileAvatar({
  uri,
  initials,
  size,
}: {
  uri: string | null;
  initials?: string;
  size: number;
}) {
  const styles = useThemedStyles(createStyles);
  if (uri) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}
    >
      {initials ? (
        <Text style={[styles.initials, { fontSize: Math.max(13, size * 0.36) }]}>{initials}</Text>
      ) : (
        <NativeSymbol
          ios="person.fill"
          android="person"
          size={size * 0.48}
          color={styles.icon.color}
        />
      )}
    </View>
  );
}

function createStyles() {
  const tokens = mobileTokens();
  return StyleSheet.create({
    fallback: {
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      backgroundColor: tokens.secondary,
    },
    initials: {
      color: tokens.foreground,
      fontWeight: "600",
    },
    icon: { color: tokens.mutedForeground },
  });
}
