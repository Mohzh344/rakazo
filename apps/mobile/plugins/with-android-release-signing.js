const { withAppBuildGradle } = require("expo/config-plugins");

const SIGNING_ENV = [
  "RAKAZO_ANDROID_KEYSTORE_PATH",
  "RAKAZO_ANDROID_KEYSTORE_PASSWORD",
  "RAKAZO_ANDROID_KEY_ALIAS",
  "RAKAZO_ANDROID_KEY_PASSWORD",
];

const RELEASE_CONFIG = `        release {
            def rakazoSigningEnv = ${JSON.stringify(SIGNING_ENV)}
            if (rakazoSigningEnv.any { !System.getenv(it) }) {
                throw new GradleException("GitHub Actions must provide the Rakazo release keystore environment variables.")
            }
            storeFile file(System.getenv("RAKAZO_ANDROID_KEYSTORE_PATH"))
            storeType "PKCS12"
            storePassword System.getenv("RAKAZO_ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("RAKAZO_ANDROID_KEY_ALIAS")
            keyPassword System.getenv("RAKAZO_ANDROID_KEY_PASSWORD")
        }
`;

function applyReleaseSigning(gradle) {
  if (
    gradle.includes("RAKAZO_ANDROID_KEYSTORE_PATH") &&
    gradle.includes("signingConfig signingConfigs.release")
  ) {
    return gradle;
  }

  const signingMarker = "    signingConfigs {\n";
  if (!gradle.includes(signingMarker)) {
    throw new Error("with-android-release-signing: app/build.gradle has no signingConfigs block.");
  }
  gradle = gradle.replace(signingMarker, `${signingMarker}${RELEASE_CONFIG}`);

  const buildTypesMarker = "    buildTypes {\n";
  const buildTypesStart = gradle.indexOf(buildTypesMarker);
  if (buildTypesStart < 0) {
    throw new Error("with-android-release-signing: app/build.gradle has no buildTypes block.");
  }
  const releaseStart = gradle.indexOf("        release {", buildTypesStart);
  const releaseEnd = gradle.indexOf("\n        }", releaseStart);
  if (releaseStart < 0 || releaseEnd < 0) {
    throw new Error("with-android-release-signing: app/build.gradle has no release build type.");
  }
  const releaseBlock = gradle.slice(releaseStart, releaseEnd);
  const debugSigning = "signingConfig signingConfigs.debug";
  if (!releaseBlock.includes(debugSigning)) {
    throw new Error(
      "with-android-release-signing: release no longer uses the expected signing config.",
    );
  }
  const before = gradle.slice(0, releaseStart);
  const after = gradle
    .slice(releaseStart)
    .replace(debugSigning, "signingConfig signingConfigs.release");
  return `${before}${after}`;
}

function withAndroidReleaseSigning(config) {
  if (process.env.RAKAZO_FORK_RELEASE !== "1") return config;
  return withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = applyReleaseSigning(cfg.modResults.contents);
    return cfg;
  });
}

module.exports = withAndroidReleaseSigning;
module.exports.applyReleaseSigning = applyReleaseSigning;
