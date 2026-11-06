import type { ConfigContext, ExpoConfig } from "expo/config";

const RELEASE_PROFILES = new Set(["production", "android-apk", "diagnostic"]);

export default ({ config }: ConfigContext): ExpoConfig => {
  const profile = process.env.EAS_BUILD_PROFILE ?? "";
  const forkRelease = process.env.RAKAZO_FORK_RELEASE === "1";
  const forkProjectId = process.env.EXPO_PROJECT_ID;
  const forkOwner = process.env.EXPO_OWNER;
  if (!forkRelease && ((forkProjectId && !forkOwner) || (forkOwner && !forkProjectId))) {
    throw new Error("EXPO_OWNER and EXPO_PROJECT_ID must be set together.");
  }

  if (RELEASE_PROFILES.has(profile) && !forkRelease) {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error(
        "EXPO_PUBLIC_API_URL must be set in the EAS production environment before building a release.",
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(apiUrl);
    } catch {
      throw new Error("EXPO_PUBLIC_API_URL must be a valid URL.");
    }
    if (parsed.protocol !== "https:") {
      throw new Error("EXPO_PUBLIC_API_URL must use HTTPS for production builds.");
    }
  }

  let result = config as ExpoConfig;
  if (forkRelease) {
    // This fork builds directly with Gradle. It has no Expo project and must never
    // inherit the upstream project's OTA URL or EAS identity from app.json.
    const extra = { ...result.extra };
    delete extra.eas;
    const updates = { ...result.updates };
    delete updates.url;
    result = {
      ...result,
      owner: undefined,
      extra,
      updates: { ...updates, enabled: false },
    };
  }
  if (!forkRelease && forkProjectId && forkOwner) {
    result = {
      ...result,
      owner: forkOwner,
      extra: {
        ...result.extra,
        eas: { ...result.extra?.eas, projectId: forkProjectId },
      },
      updates: { ...result.updates, url: `https://u.expo.dev/${forkProjectId}` },
    };
  }
  const rpId = passkeyRpId(process.env.EXPO_PUBLIC_API_URL);
  if (rpId) {
    // Native passkeys only work for domains the binary is associated with, so the app reads the
    // same list at runtime to hide passkeys on other servers. Developer mode makes a
    // development-signed build fetch the association file itself, for a server on a private
    // network or VPN that Apple's CDN cannot reach.
    const mode = process.env.RAKAZO_PASSKEY_DEVELOPER_MODE === "1" ? "?mode=developer" : "";
    result = {
      ...result,
      ios: {
        ...result.ios,
        associatedDomains: [
          ...(result.ios?.associatedDomains ?? []),
          `webcredentials:${rpId}${mode}`,
        ],
      },
      extra: { ...result.extra, passkeyRpIds: [rpId] },
    };
  }

  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON;
  if (googleServicesFile) {
    result = { ...result, android: { ...result.android, googleServicesFile } };
  }

  // Native crash handling autolinks; upload build hooks are optional and require credentials.
  if (process.env.SENTRY_AUTH_TOKEN) {
    result = {
      ...result,
      plugins: [
        ...(result.plugins ?? []),
        [
          "@sentry/react-native/expo",
          {
            organization: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            url: process.env.SENTRY_URL,
            // R8 obfuscates release Java and Kotlin, so upload its mapping to read native stacks.
            experimental_android: {
              enableAndroidGradlePlugin: true,
              autoUploadProguardMapping: true,
              uploadNativeSymbols: false,
              includeNativeSources: false,
            },
          },
        ],
      ],
    };
  }
  return result;
};

/** The default server's host when native passkeys can use it: HTTPS and a domain name. */
function passkeyRpId(apiUrl: string | undefined): string | null {
  let url: URL;
  try {
    url = new URL(apiUrl ?? "");
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || !host.includes(".")) return null;
  if (host.startsWith("[") || /^\d+(\.\d+){3}$/.test(host)) return null;
  return host;
}
