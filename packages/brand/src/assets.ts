/** Paths relative to packages/brand, matching Mira La Cancha's brand package. */
export const brandSvg = {
  markLight: "svg/return-loop.svg",
  markDark: "svg/return-loop-dark.svg",
} as const;

export const brandPng = {
  icon1024: "png/icon-1024.png",
  iconDark1024: "png/icon-dark-1024.png",
  adaptiveIcon: "png/adaptive-icon.png",
  monochromeIcon: "png/monochrome-icon.png",
  splashLogo: "png/splash-logo.png",
  splashLogoDark: "png/splash-logo-dark.png",
  appleTouchIcon: "png/apple-touch-icon.png",
  favicon32: "png/favicon-32.png",
} as const;

export const brandIcon = { iosComposer: "icon/orbii.icon" } as const;

export type BrandSvgKey = keyof typeof brandSvg;
export type BrandPngKey = keyof typeof brandPng;
