import { useSyncExternalStore } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeSegmentedControl } from "../../components/native-segmented-control";
import { SettingsGroup, SettingsLabel, SettingsSwitch } from "../../components/settings-group";
import {
  getCachedAppearancePreference,
  mobileTokens,
  setAppearancePreference,
  subscribeAppearance,
} from "../../lib/appearance";
import { useI18n } from "../../lib/i18n";
import {
  getCachedMessageBubbleColors,
  MESSAGE_BUBBLE_COLOR_CHOICES,
  messageBubbleForeground,
  setMessageBubbleColor,
  subscribeMessageBubbleColors,
} from "../../lib/message-bubble-colors";
import { native, useThemedStyles } from "../../lib/native";
import { useSideInsets } from "../../lib/side-insets";

export default function AppearanceSettings() {
  const { t } = useI18n();
  const sideInsets = useSideInsets();
  const styles = useThemedStyles(createStyles);
  const appearance = useSyncExternalStore(
    subscribeAppearance,
    getCachedAppearancePreference,
    getCachedAppearancePreference,
  );
  const bubbleColors = useSyncExternalStore(
    subscribeMessageBubbleColors,
    getCachedMessageBubbleColors,
    getCachedMessageBubbleColors,
  );
  const isDeepBlack = appearance === "amoled";
  const selectedTheme = appearance === "amoled" ? "dark" : appearance;

  return (
    <SafeAreaView edges={["bottom"]} style={styles.screen}>
      <ScrollView
        style={sideInsets}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.section}>
          <SettingsLabel>{t("Appearance")}</SettingsLabel>
          <NativeSegmentedControl
            accessibilityLabel={t("Appearance")}
            onChange={(value) => void setAppearancePreference(value)}
            options={[
              { value: "system", label: t("System") },
              { value: "light", label: t("Light") },
              { value: "dark", label: t("Dark") },
            ]}
            value={selectedTheme}
          />
          {selectedTheme === "dark" ? (
            <SettingsGroup>
              <SettingsSwitch
                label={t("Deep black (AMOLED)")}
                accessibilityLabel={t("Deep black (AMOLED)")}
                value={isDeepBlack}
                onChange={(enabled) => void setAppearancePreference(enabled ? "amoled" : "dark")}
              />
            </SettingsGroup>
          ) : null}
        </View>

        <BubbleColorSection
          label={t("User messages")}
          kind="user"
          color={bubbleColors.user}
          onChange={(color) => void setMessageBubbleColor("user", color)}
          styles={styles}
          translate={t}
        />
        <BubbleColorSection
          label={t("Agent messages")}
          kind="agent"
          color={bubbleColors.agent}
          onChange={(color) => void setMessageBubbleColor("agent", color)}
          styles={styles}
          translate={t}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function BubbleColorSection({
  label,
  kind,
  color,
  onChange,
  styles,
  translate,
}: {
  label: string;
  kind: "user" | "agent";
  color: string | null;
  onChange: (color: string | null) => void;
  styles: ReturnType<typeof createStyles>;
  translate: (message: string, values?: Record<string, string | number>) => string;
}) {
  const tokens = mobileTokens();
  const previewColor = color ?? (kind === "user" ? tokens.chatUser : tokens.muted);
  const previewText = color ? messageBubbleForeground(color) : tokens.foreground;
  return (
    <View style={styles.section}>
      <SettingsLabel>{label}</SettingsLabel>
      <SettingsGroup>
        <View style={styles.previewRow}>
          <View
            style={[
              styles.previewBubble,
              {
                alignSelf: kind === "user" ? "flex-end" : "flex-start",
                backgroundColor: previewColor,
              },
            ]}
          >
            <Text style={[styles.previewText, { color: previewText }]}>{translate("Message")}</Text>
          </View>
        </View>
        <View style={styles.palette}>
          {MESSAGE_BUBBLE_COLOR_CHOICES.map((choice) => {
            const selected = color === choice.value;
            const fill = choice.value ?? (kind === "user" ? tokens.chatUser : tokens.muted);
            const name = translate(choice.label);
            return (
              <Pressable
                key={choice.label}
                accessibilityRole="button"
                accessibilityLabel={translate("{color} color", { color: name })}
                accessibilityState={{ selected }}
                onPress={() => onChange(choice.value)}
                style={({ pressed }) => [styles.swatchTarget, pressed && styles.pressed]}
              >
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: fill },
                    choice.value === "#FFFFFF" && styles.whiteSwatch,
                    selected && styles.selectedSwatch,
                  ]}
                >
                  {selected ? (
                    <Text style={[styles.check, { color: messageBubbleForeground(fill) }]}>✓</Text>
                  ) : null}
                </View>
                <Text
                  style={[styles.swatchLabel, selected && styles.selectedLabel]}
                  numberOfLines={1}
                >
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SettingsGroup>
    </View>
  );
}

function createStyles() {
  const tokens = mobileTokens();
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: native.groupedPage },
    content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 32, gap: 26 },
    section: { gap: 8 },
    previewRow: {
      minHeight: 72,
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    previewBubble: {
      minWidth: 96,
      maxWidth: "75%",
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    previewText: { fontSize: 15, fontWeight: "500" },
    palette: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      paddingBottom: 12,
      gap: 4,
    },
    swatchTarget: {
      width: 68,
      minHeight: 70,
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      borderRadius: 12,
      paddingVertical: 6,
    },
    swatch: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: tokens.border,
    },
    selectedSwatch: {
      borderWidth: 2,
      borderColor: tokens.foreground,
      transform: [{ scale: 1.08 }],
    },
    whiteSwatch: { borderColor: "#A8A8A8" },
    check: { fontSize: 17, fontWeight: "700" },
    swatchLabel: { maxWidth: 68, color: tokens.mutedForeground, fontSize: 10, textAlign: "center" },
    selectedLabel: { color: tokens.foreground, fontWeight: "600" },
    pressed: { opacity: 0.65 },
  });
}
