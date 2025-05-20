import colors from './colors';
import fonts from './fonts';
import { typography } from './typography';

export const theme = {
  colors,
  fonts,
  typography
} as const;

export default theme;

export type ThemeColors = typeof colors;
export type ThemeFonts = typeof fonts;
export type Theme = typeof theme;