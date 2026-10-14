import { Platform, TextStyle } from 'react-native';

export const colors = {
  brand: '#0F8A6D',
  brandDark: '#0B6B55',
  brandSoft: '#E3F4EF',

  background: '#F6F7F9',
  surface: '#FFFFFF',
  border: '#E3E6EA',

  textPrimary: '#14181F',
  textSecondary: '#5B6470',
  textInverse: '#FFFFFF',
  textDisabled: '#9AA2AD',

  success: '#1B8F4C',
  successSoft: '#E4F5EB',
  warning: '#B26A00',
  warningSoft: '#FFF3DC',
  danger: '#C62F2F',
  dangerSoft: '#FDE8E8',

  rx: '#B3261E',
  rxSoft: '#FDECEA',

  overlay: 'rgba(20, 24, 31, 0.5)',
} as const;

// 4-pt scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

// Minimum comfortable touch target (Material / WCAG guidance).
export const minTouchTarget = 48;

const fontFamily = Platform.select({
  android: 'sans-serif',
  default: 'System',
});

export const typography = {
  title: { fontFamily, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heading: { fontFamily, fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontFamily, fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontFamily, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  caption: { fontFamily, fontSize: 13, lineHeight: 18, fontWeight: '400' },
  captionStrong: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  button: { fontFamily, fontSize: 16, lineHeight: 22, fontWeight: '600' },
} satisfies Record<string, TextStyle>;

export const elevation = {
  card: {
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sheet: {
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
  },
} as const;
