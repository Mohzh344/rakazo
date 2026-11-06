import { StyleSheet } from "react-native";
import { mobileTokens } from "../lib/appearance";
import { transparentColor } from "../lib/color";
import { HEADER_CONTROL_SIZE } from "../lib/native-controls";

export function createThreadHeaderStyles() {
  const tokens = mobileTokens();
  const transparentBackground = transparentColor(tokens.background);
  return StyleSheet.create({
    titleCapsule: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      maxWidth: 280,
      minHeight: HEADER_CONTROL_SIZE,
      paddingVertical: 3,
      paddingStart: 11,
      paddingEnd: 9,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.glassStroke,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.16,
      shadowRadius: 10,
      elevation: 3,
    },
    titleCapsuleFill: {
      backgroundColor: tokens.glassFill,
    },
    title: {
      // Two compact lines give the agent's full name room beside its avatar.
      flexShrink: 1,
      fontSize: 13,
      lineHeight: 16,
      fontWeight: "600",
      color: tokens.foreground,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 20,
    },
    circleButton: {
      flex: 1,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    composerFill: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.glassStroke,
      backgroundColor: tokens.glassFill,
    },
    statusBarFade: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      experimental_backgroundImage: `linear-gradient(to bottom, ${tokens.background} 0%, ${tokens.background} 60%, ${transparentBackground} 100%)`,
    },
  });
}
