import { expect, it } from "vitest";
import { enableAndroidRtl } from "./with-android-rtl.js";

it("enables Android RTL support on the application manifest", () => {
  const manifest = { application: [{ $: { "android:name": ".MainApplication" } }] };
  expect(enableAndroidRtl(manifest).application[0].$).toEqual({
    "android:name": ".MainApplication",
    "android:supportsRtl": "true",
  });
});

it("fails prebuild when the manifest has no application", () => {
  expect(() => enableAndroidRtl({})).toThrow(/no <application>/);
});
