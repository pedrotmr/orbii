import returnLoop from "@orbii/tokens/return-loop.json";

const appVariant = process.env.APP_VARIANT ?? "development";
const easProjectId = "cebd63af-63fc-4c5a-a302-dbae0bdcd6e8";

const variants = {
  development: {
    bundleIdentifier: "app.orbii.mobile.dev",
    name: "Orbii Dev",
    scheme: "orbiidev",
  },
  preview: {
    bundleIdentifier: "app.orbii.mobile.dev",
    name: "Orbii Dev",
    scheme: "orbiidev",
  },
  production: {
    bundleIdentifier: "app.orbii.mobile",
    name: "Orbii",
    scheme: "orbii",
  },
};

const variant = variants[appVariant];

if (!variant) {
  throw new Error(`Unsupported APP_VARIANT: ${appVariant}`);
}

/** @type {import("expo/config").ExpoConfig} */
const withAppVariant = ({ config }) => ({
  ...config,
  owner: "peedrotmr",
  name: variant.name,
  scheme: variant.scheme,
  runtimeVersion: {
    policy: "fingerprint",
  },
  updates: {
    ...config.updates,
    url: `https://u.expo.dev/${easProjectId}`,
  },
  ios: {
    ...config.ios,
    bundleIdentifier: variant.bundleIdentifier,
  },
  android: {
    ...config.android,
    package: variant.bundleIdentifier,
    adaptiveIcon: {
      ...config.android?.adaptiveIcon,
      backgroundColor: returnLoop.brand.fog,
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
  },
  plugins: (config.plugins ?? []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === "expo-splash-screen") {
      return [
        plugin[0],
        {
          ...plugin[1],
          backgroundColor: returnLoop.brand.fog,
          dark: {
            image: "./assets/splash-icon-dark.png",
            backgroundColor: returnLoop.night,
          },
        },
      ];
    }

    return plugin;
  }),
  extra: {
    ...config.extra,
    appVariant,
    eas: {
      ...config.extra?.eas,
      projectId: easProjectId,
    },
  },
});

export default withAppVariant;
