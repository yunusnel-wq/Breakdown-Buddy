export default {
  expo: {
    name: "Breakdown Buddy",
    slug: "breakdown-buddy",
    version: "2.1",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    platforms: [
      "android",
      "ios"
    ],
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    extra: {
      eas: {
        projectId: "190140ee-746c-44dd-a719-c8b3e5e958fb"
      }
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.breakdownbuddy.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#e63946"
      },
      package: "com.breakdownbuddy.app",
      versionCode: 6,
      permissions: [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "POST_NOTIFICATIONS",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "WAKE_LOCK"
      ],
      softwareKeyboardLayoutMode: "pan"
    },
    plugins: [
      "expo-camera",
      "expo-location",
      "expo-notifications",
      "expo-secure-store",
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0",
            kotlinVersion: "1.9.22"
          }
        }
      ],
      "expo-font"
    ],
    notification: {
      icon: "./assets/notification-icon.png",
      color: "#e63946"
    }
  }
};