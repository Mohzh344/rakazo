import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  path.resolve(import.meta.dirname, "../../../.github/workflows/release-android-apk.yml"),
  "utf8",
);
const forkWorkflow = readFileSync(
  path.resolve(import.meta.dirname, "../../../.github/workflows/fork-android-arm64-apk.yml"),
  "utf8",
);
const easConfig = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "../eas.json"), "utf8"),
) as { build: Record<string, { extends?: string; android?: { buildType?: string } }> };

describe("Android APK release workflow", () => {
  it("only runs on demand or from release-mobile, from main with release credentials", () => {
    expect(workflow).toMatch(/^on:\n {2}workflow_dispatch:\n {2}workflow_call:\n\n/m);
    expect(workflow).toContain("permissions:\n  contents: read");
    expect(workflow).toContain("if: github.ref == 'refs/heads/main'");
    expect(workflow).toContain("persist-credentials: false");
    expect(workflow).not.toContain("cache: pnpm");
  });

  it("pins every third-party action to an immutable commit", () => {
    const actionReferences = [...workflow.matchAll(/uses:\s+([^\s#]+)/g)].map((match) => match[1]);
    expect(actionReferences.length).toBeGreaterThan(0);
    for (const reference of actionReferences) {
      expect(reference, reference).toMatch(/@[0-9a-f]{40}$/);
    }
  });

  it("builds a production-channel APK and never takes the desktop updater's latest release", () => {
    expect(easConfig.build["android-apk"]).toEqual({
      extends: "production",
      android: { buildType: "apk" },
      environment: "production",
    });
    expect(workflow).toContain("--profile android-apk");
    expect(workflow).toContain("--latest=false");
    expect(workflow).not.toContain("gh release delete");
    expect(readFileSync(path.resolve(import.meta.dirname, "../app.config.ts"), "utf8")).toContain(
      '"android-apk"',
    );
  });
});

describe("fork Android ARM64 workflow", () => {
  it("uses Gradle locally, signs with the fork key, and checks the arm64 artifact", () => {
    expect(forkWorkflow).toContain("workflow_dispatch:");
    expect(forkWorkflow).toContain(
      "pnpm exec expo prebuild --platform android --no-install --clean",
    );
    expect(forkWorkflow).toContain(":app:assembleRelease");
    expect(forkWorkflow).toContain("-PreactNativeArchitectures=arm64-v8a");
    expect(forkWorkflow).toContain("ANDROID_RELEASE_KEYSTORE_BASE64");
    expect(forkWorkflow).toContain("ANDROID_RELEASE_CERT_SHA256");
    expect(forkWorkflow).toContain("verify --verbose");
    expect(forkWorkflow).toContain("--print-certs");
    expect(forkWorkflow).toContain("actions/upload-artifact");
    expect(forkWorkflow).not.toContain("EXPO_TOKEN");
    expect(forkWorkflow).not.toContain("eas build");
    expect(forkWorkflow).not.toContain("eas env:list");
    expect(forkWorkflow).not.toContain("expo/expo-github-action");
  });

  it("pins every third-party action to an immutable commit", () => {
    const references = [...forkWorkflow.matchAll(/uses:\s+([^\s#]+)/g)].map((match) => match[1]);
    expect(references.length).toBeGreaterThan(0);
    for (const reference of references) expect(reference, reference).toMatch(/@[0-9a-f]{40}$/);
  });
});
