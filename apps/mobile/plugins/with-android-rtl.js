const { withAndroidManifest } = require("expo/config-plugins");

function enableAndroidRtl(manifest) {
  const app = manifest.application?.[0];
  if (!app) throw new Error("with-android-rtl: the manifest has no <application>.");
  app.$["android:supportsRtl"] = "true";
  return manifest;
}

function withAndroidRtl(config) {
  return withAndroidManifest(config, (cfg) => {
    enableAndroidRtl(cfg.modResults.manifest);
    return cfg;
  });
}

module.exports = withAndroidRtl;
module.exports.enableAndroidRtl = enableAndroidRtl;
