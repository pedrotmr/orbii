/** RN-facing tokens ported from design-ideas (hex approximations of OKLCH). */

export const colors = {
  bg: "#F4F7FA",
  bgMid: "#EBF1F6",
  bgDeep: "#DDE8F0",
  surface: "#FBFCFD",
  ink: "#3D342E",
  muted: "#6B7380",
  line: "#D5DDE6",
  primary: "#E4572E",
  primaryDeep: "#C44522",
  primarySoft: "#F8E4DC",
  accent: "#2A9B9B",
  accentSoft: "#E0F2F2",
  success: "#3D9B6E",
  successSoft: "#E5F5EC",
  onPrimary: "#FFFCFA",
} as const;

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  "2xl": 26,
  "3xl": 32,
} as const;

export const fonts = {
  /** Loaded via `@expo-google-fonts/outfit` in the mobile root layout. */
  regular: "Outfit_400Regular",
  medium: "Outfit_500Medium",
  semiBold: "Outfit_600SemiBold",
  bold: "Outfit_700Bold",
  ui: "Outfit_400Regular",
  display: "Outfit_700Bold",
} as const;
