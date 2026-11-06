import type {
  AppearancePreference as SharedAppearancePreference,
  ResolvedAppearance,
} from "@rakazo/ui-tokens";
import {
  normalizeAppearancePreference,
  resolveAppearance,
  tokensForAppearance,
  UI_APPEARANCE_STORAGE_KEY,
} from "@rakazo/ui-tokens";
import * as SecureStore from "expo-secure-store";
import type { ColorSchemeName } from "react-native";
import { Appearance } from "react-native";

export type AppearancePreference = SharedAppearancePreference | "amoled";
export type { ResolvedAppearance };

const AMOLED_OVERRIDES = {
  background: "#000000",
  dialog: "#050505",
  card: "#080808",
  popover: "#080808",
  glassFill: "#151515",
  glassStroke: "#FFFFFF26",
  secondary: "#FFFFFF1A",
  chatUser: "#343434",
  muted: "#090909",
  accent: "#FFFFFF1C",
  border: "#FFFFFF1A",
  input: "#FFFFFF40",
  sidebar: "#050505",
  sidebarBorder: "#FFFFFF14",
  sidebarAccent: "#151515",
} as const;

let memoryPreference: AppearancePreference | null = null;
let writeGeneration = 0;
const listeners = new Set<() => void>();

function systemAppearance(scheme?: ColorSchemeName | null): ResolvedAppearance {
  return (scheme ?? Appearance.getColorScheme()) === "light" ? "light" : "dark";
}

export function getCachedAppearancePreference(): AppearancePreference {
  return memoryPreference ?? "system";
}

export async function loadAppearancePreference(): Promise<AppearancePreference> {
  try {
    const stored = await SecureStore.getItemAsync(UI_APPEARANCE_STORAGE_KEY);
    memoryPreference = stored === "amoled" ? "amoled" : normalizeAppearancePreference(stored);
  } catch {
    memoryPreference = memoryPreference ?? "system";
  }
  applyNativeColorScheme(memoryPreference);
  notify();
  return memoryPreference;
}

export async function setAppearancePreference(
  preference: AppearancePreference,
): Promise<AppearancePreference> {
  memoryPreference = preference;
  const generation = ++writeGeneration;
  applyNativeColorScheme(preference);
  notify();
  await persistAppearancePreference(preference, generation);
  return preference;
}

export function resolveMobileAppearance(
  preference: AppearancePreference = getCachedAppearancePreference(),
  scheme?: ColorSchemeName | null,
): ResolvedAppearance {
  return resolveAppearance(
    preference === "amoled" ? "dark" : preference,
    systemAppearance(scheme),
  );
}

export function mobileTokens(
  preference: AppearancePreference = getCachedAppearancePreference(),
  scheme?: ColorSchemeName | null,
) {
  const tokens = tokensForAppearance(resolveMobileAppearance(preference, scheme));
  return preference === "amoled" ? { ...tokens, ...AMOLED_OVERRIDES } : tokens;
}

export function subscribeAppearance(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  for (const listener of listeners) listener();
}

async function persistAppearancePreference(
  preference: AppearancePreference,
  generation: number,
): Promise<void> {
  try {
    await SecureStore.setItemAsync(UI_APPEARANCE_STORAGE_KEY, preference);
  } catch {
    // Keep the in-memory preference when SecureStore is unavailable.
    return;
  }
  if (generation === writeGeneration) return;
  const latest = memoryPreference;
  if (latest === null) return;
  await persistAppearancePreference(latest, writeGeneration);
}

// Native surfaces (alerts, action sheets, the keyboard, iOS platform colors) follow the
// window's scheme, so an explicit app choice overrides it and System hands it back to the OS.
function applyNativeColorScheme(preference: AppearancePreference) {
  Appearance.setColorScheme(
    preference === "system" ? "unspecified" : preference === "amoled" ? "dark" : preference,
  );
}

Appearance.addChangeListener(() => {
  if (getCachedAppearancePreference() === "system") notify();
});
