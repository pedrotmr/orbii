/** Semantic native colors. Each foreground is paired with its surface in both themes. */
export const lightColors = {
  bg: "#F5F5F3",
  bgMid: "#ECEDE9",
  bgDeep: "#E2E4DE",
  surface: "#FEFEFC",
  ink: "#252923",
  muted: "#60655C",
  line: "#D6D9D1",
  primary: "#B54420",
  primaryDeep: "#A33A18",
  primarySoft: "#FAE9DF",
  accent: "#596B39",
  accentSoft: "#E9EEDC",
  success: "#43662F",
  successSoft: "#E8EFDF",
  onPrimary: "#FFFBF7",
  buttonFill: "#B54420",
  onButton: "#FFFBF7",
  focus: "#CE5628",
  track: "#E3E6DE",
  disabled: "#DFE1DB",
} as const;
export type Palette = { [Key in keyof typeof lightColors]: string };
export const darkColors: Palette = {
  bg: "#181B18",
  bgMid: "#222621",
  bgDeep: "#2D332C",
  surface: "#242923",
  ink: "#F0F2E9",
  muted: "#B1B8AB",
  line: "#41483D",
  primary: "#FFA77C",
  primaryDeep: "#FFB48F",
  primarySoft: "#452E23",
  accent: "#B9CD94",
  accentSoft: "#303B26",
  success: "#B9CD94",
  successSoft: "#303B26",
  onPrimary: "#331D12",
  buttonFill: "#B54420",
  onButton: "#FFFBF7",
  focus: "#FFA77C",
  track: "#373F32",
  disabled: "#3A4136",
};

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
  xl: 16,
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
