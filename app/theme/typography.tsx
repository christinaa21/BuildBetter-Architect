import { StyleSheet, Platform } from 'react-native';
import { fonts } from './fonts';

// Scale factor for different text styles
const fontScale = {
  title: 1.1875,      // 19px equivalent
  subtitle1: 1,       // 16px equivalent
  subtitle2: 0.875,   // 14px equivalent
  body1: 0.9375,      // 15px equivalent
  body2: 0.875,       // 14px equivalent
  caption: 0.75,      // 12px equivalent
  overline: 0.625,    // 10px equivalent
};

// Base size in points (1pt = 1.333333px)
const BASE_FONT_SIZE = 16;

export const createTypography = (scale = 1) => {
  return StyleSheet.create({
    title: {
      fontSize: BASE_FONT_SIZE * fontScale.title * scale,
      fontFamily: fonts.poppins.semiBold,
      lineHeight: Platform.select({ ios: 24, android: 28 }),
    },
    subtitle1: {
      fontSize: BASE_FONT_SIZE * fontScale.subtitle1 * scale,
      fontFamily: fonts.poppins.regular,
      lineHeight: Platform.select({ ios: 20, android: 24 }),
    },
    subtitle2: {
      fontSize: BASE_FONT_SIZE * fontScale.subtitle2 * scale,
      fontFamily: fonts.poppins.medium,
      lineHeight: Platform.select({ ios: 18, android: 22 }),
    },
    body1: {
      fontSize: BASE_FONT_SIZE * fontScale.body1 * scale,
      fontFamily: fonts.poppins.regular,
      lineHeight: Platform.select({ ios: 20, android: 24 }),
    },
    body2: {
      fontSize: BASE_FONT_SIZE * fontScale.body2 * scale,
      fontFamily: fonts.poppins.regular,
      lineHeight: Platform.select({ ios: 18, android: 22 }),
    },
    caption: {
      fontSize: BASE_FONT_SIZE * fontScale.caption * scale,
      fontFamily: fonts.poppins.medium,
      lineHeight: Platform.select({ ios: 16, android: 20 }),
    },
    overline: {
      fontSize: BASE_FONT_SIZE * fontScale.overline * scale,
      fontFamily: fonts.poppins.medium,
      lineHeight: Platform.select({ ios: 14, android: 18 }),
    },
  });
};

export const typography = createTypography();

export default {
  createTypography,
  typography
};