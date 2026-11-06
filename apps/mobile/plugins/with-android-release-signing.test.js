import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { applyReleaseSigning } from "./with-android-release-signing.js";

const require = createRequire(import.meta.url);
const expoTemplateTgz = join(dirname(require.resolve("expo/package.json")), "template.tgz");
const TEMPLATE = execFileSync(
  "tar",
  ["-xOf", expoTemplateTgz, "package/android/app/build.gradle"],
  { encoding: "utf8" },
);

describe("applyReleaseSigning", () => {
  it("adds a dedicated Release signing config sourced only from the build environment", () => {
    const result = applyReleaseSigning(TEMPLATE);
    expect(result).toContain('storeFile file(System.getenv("RAKAZO_ANDROID_KEYSTORE_PATH"))');
    expect(result).toContain('storeType "PKCS12"');
    expect(result).toContain('storePassword System.getenv("RAKAZO_ANDROID_KEYSTORE_PASSWORD")');
    expect(result).toContain('keyAlias System.getenv("RAKAZO_ANDROID_KEY_ALIAS")');
    expect(result).toContain('keyPassword System.getenv("RAKAZO_ANDROID_KEY_PASSWORD")');
    expect(result).toContain("signingConfig signingConfigs.release");
    expect(result).toContain("signingConfig signingConfigs.debug");
    expect(result).not.toMatch(/release\s*\{[^}]*signingConfig signingConfigs\.debug/s);
  });

  it("is idempotent", () => {
    const once = applyReleaseSigning(TEMPLATE);
    expect(applyReleaseSigning(once)).toBe(once);
  });

  it("fails loudly if the pinned Expo template no longer has the expected Release shape", () => {
    expect(() => applyReleaseSigning("android {}")).toThrow(/no signingConfigs block/);
    expect(() =>
      applyReleaseSigning(TEMPLATE.replace("        release {", "        releaseVariant {")),
    ).toThrow(/no release build type/);
  });
});
