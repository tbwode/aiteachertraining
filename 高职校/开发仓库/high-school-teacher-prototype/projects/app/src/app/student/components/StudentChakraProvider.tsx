'use client';

import type { ReactNode } from 'react';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { theme as baseTheme } from '@fastgpt/web/styles/theme';
import { designTokens } from '@/theme/designTokens';
import { appChakraTheme } from '@/theme/appChakraTheme';

const studentTheme = extendTheme(baseTheme, {
  config: {
    ...baseTheme.config,
    initialColorMode: 'light',
    useSystemColorMode: false
  },
  styles: {
    global: {
      'html, body': {
        ...baseTheme.styles?.global?.['html, body'],
        color: designTokens.colors.textSecondary,
        background: designTokens.colors.bgSecondary,
        fontSize: designTokens.typography.size.base,
        overflowX: 'hidden',
        overflowY: 'auto'
      },
      a: {
        color: designTokens.colors.primary
      }
    }
  },
  studentColors: designTokens.colors,
  studentSpacing: designTokens.spacing,
  studentShadows: designTokens.shadows,
  studentBorderRadius: designTokens.borderRadius,
  studentTypography: designTokens.typography,
  colors: {
    ...baseTheme.colors,
    bg: {
      ...(baseTheme.colors?.bg || {}),
      page: designTokens.colors.bgSecondary
    },
    student: {
      primary: designTokens.colors.primary,
      primaryHover: designTokens.colors.primaryHover,
      primaryActive: designTokens.colors.primaryActive,
      success: designTokens.colors.success,
      warning: designTokens.colors.warning,
      error: designTokens.colors.error,
      textPrimary: designTokens.colors.textPrimary,
      textSecondary: designTokens.colors.textSecondary,
      textTertiary: designTokens.colors.textTertiary,
      border: designTokens.colors.border,
      borderLight: designTokens.colors.borderLight,
      bgSecondary: designTokens.colors.bgSecondary
    },
    text: {
      1: designTokens.colors.textPrimary,
      2: designTokens.colors.textSecondary,
      3: designTokens.colors.textTertiary,
      4: designTokens.colors.textDisabled,
      5: designTokens.colors.textWhite
    },
    fill: {
      1: designTokens.colors.fill[1],
      2: designTokens.colors.fill[2],
      3: designTokens.colors.fill[3],
      4: designTokens.colors.fill[4]
    },
    primary: {
      1: '#C9C9C9',
      2: '#888888',
      3: '#606060',
      4: '#444444',
      50: designTokens.colors.bgSecondary,
      100: designTokens.colors.fill[2],
      200: designTokens.colors.fill[3],
      300: designTokens.colors.fill[4],
      400: '#888888',
      500: designTokens.colors.primary,
      600: designTokens.colors.primaryActive,
      700: designTokens.colors.primaryActive
    },
    complementary: {
      1: '#FFEDED',
      2: '#EEB2B5',
      3: '#E16B71',
      5: designTokens.colors.complementary,
      6: designTokens.colors.complementary,
      7: designTokens.colors.complementaryHover
    },
    success: {
      1: '#E8FFEA',
      2: '#AFF0B5',
      3: '#7BE188',
      6: designTokens.colors.success,
      7: designTokens.colors.successHover
    },
    warning: {
      1: '#FFF7E8',
      2: '#FFE4BA',
      3: '#FFCF8B',
      6: designTokens.colors.warning,
      7: designTokens.colors.warningHover
    },
    danger: {
      1: '#FFECE8',
      2: '#FDCDC5',
      3: '#FBACA3',
      6: designTokens.colors.error,
      7: designTokens.colors.errorHover
    }
  },
  fonts: {
    ...baseTheme.fonts,
    body: designTokens.typography.fontFamily,
    heading: designTokens.typography.fontFamily
  },
  fontSizes: {
    ...baseTheme.fontSizes,
    mini: designTokens.typography.size.xs,
    xs: designTokens.typography.size.xs,
    sm: designTokens.typography.size.sm,
    base: designTokens.typography.size.base,
    md: designTokens.typography.size.md,
    lg: designTokens.typography.size.lg,
    xl: designTokens.typography.size.xl,
    '2xl': designTokens.typography.size.xxl,
    '3xl': designTokens.typography.size.headlineMedium,
    '4xl': designTokens.typography.size.headlineLarge,
    '5xl': designTokens.typography.size.displayMedium,
    '6xl': designTokens.typography.size.displayLarge
  },
  radii: {
    ...baseTheme.radii,
    xs: designTokens.borderRadius.sm,
    sm: designTokens.borderRadius.md,
    md: designTokens.borderRadius.lg,
    lg: designTokens.borderRadius.xl,
    xl: designTokens.borderRadius.xl,
    xxl: designTokens.borderRadius.xxl,
    full: designTokens.borderRadius.full
  },
  shadows: {
    ...baseTheme.shadows,
    1: designTokens.shadows.sm,
    1.5: designTokens.shadows.sm,
    2: designTokens.shadows.md,
    3: designTokens.shadows.lg,
    3.5: designTokens.shadows.lg,
    4: designTokens.shadows.xl,
    5: designTokens.shadows.xl,
    6: designTokens.shadows.xl,
    7: designTokens.shadows.xl
  },
  components: {
    ...baseTheme.components,
    Button: appChakraTheme.components.Button,
    Input: {
      ...baseTheme.components?.Input,
      sizes: {
        ...baseTheme.components?.Input?.sizes,
        md: {
          ...(baseTheme.components?.Input as any)?.sizes?.md,
          field: {
            ...((baseTheme.components?.Input as any)?.sizes?.md?.field || {}),
            h: designTokens.form.input.height,
            borderRadius: designTokens.form.input.borderRadius
          }
        }
      }
    },
    Modal: {
      ...baseTheme.components?.Modal,
      baseStyle: {
        ...(baseTheme.components?.Modal as any)?.baseStyle,
        dialog: {
          ...((baseTheme.components?.Modal as any)?.baseStyle?.dialog || {}),
          borderRadius: designTokens.modal.borderRadius
        }
      }
    }
  }
});

interface StudentChakraProviderProps {
  children: ReactNode;
}

export function StudentChakraProvider({ children }: StudentChakraProviderProps) {
  return (
    <ChakraProvider theme={studentTheme} resetCSS>
      {children}
    </ChakraProvider>
  );
}

export default StudentChakraProvider;
