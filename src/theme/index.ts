// ispy pastel design system — cute, Pinterest-like. Soft lavender base,
// pastel colour blocks, big rounded cards, friendly rounded type.
export const colors = {
  background: '#F3EFFF', // soft lavender
  surface: '#FFFFFF',
  ink: '#2B2140', // dark plum ink
  plum: '#33244A', // floating nav / dark pill
  plumSoft: '#4A3568',
  muted: '#7A6E96',
  mutedLight: '#A79CC4',
  border: '#E6DEF7',
  lavender: '#C9B8F0',
  lavenderLight: '#E4DBFB',
  butter: '#FFD97A',
  butterLight: '#FFF1C4',
  babyBlue: '#A8D8F0',
  babyBlueLight: '#D6ECFA',
  blush: '#FFC9D6',
  pink: '#F7A8C4',
  pinkDeep: '#F27FA8',
  mint: '#B8E6C8',
  mintLight: '#DDF5E4',
  peach: '#FFD3B3',
  white: '#FFFFFF',
  danger: '#E5484D',
} as const;

export type PastelKey = 'lavender' | 'butter' | 'babyBlue' | 'blush' | 'mint' | 'peach';
export const pastels: Record<PastelKey, string> = {
  lavender: colors.lavender,
  butter: colors.butter,
  babyBlue: colors.babyBlue,
  blush: colors.blush,
  mint: colors.mint,
  peach: colors.peach,
};
export const pastelLights: Record<PastelKey, string> = {
  lavender: colors.lavenderLight,
  butter: colors.butterLight,
  babyBlue: colors.babyBlueLight,
  blush: colors.blush,
  mint: colors.mintLight,
  peach: '#FFE9D6',
};
export const pastelCycle: PastelKey[] = ['lavender', 'butter', 'babyBlue', 'blush', 'mint', 'peach'];

export const radii = { sm: 14, md: 20, lg: 28, xl: 36, pill: 999 } as const;
export const spacing = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30 } as const;

// Friendly rounded type. Quicksand for headings, Nunito for body.
// Loaded in App.tsx via expo-font when available; every style falls back
// to the system font if the font files are not bundled yet.
export const fonts = {
  heading: 'Quicksand',
  body: 'Nunito',
} as const;
