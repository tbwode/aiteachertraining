import { extendTheme } from '@chakra-ui/react';
import { theme as baseTheme } from '@fastgpt/web/styles/theme';
import { designTokens } from './designTokens';

const buttonAccentByScheme: Record<
  string,
  { base: string; hover: string; active: string; soft: string; softHover: string; border: string }
> = {
  red: {
    base: '#EF4444',
    hover: '#DC2626',
    active: '#B91C1C',
    soft: '#FEF2F2',
    softHover: '#FEE2E2',
    border: '#FCA5A5'
  },
  green: {
    base: '#10B981',
    hover: '#059669',
    active: '#047857',
    soft: '#ECFDF5',
    softHover: '#D1FAE5',
    border: '#A7F3D0'
  },
  blue: {
    base: '#2563EB',
    hover: '#1D4ED8',
    active: '#1E40AF',
    soft: '#EFF6FF',
    softHover: '#DBEAFE',
    border: '#BFDBFE'
  },
  purple: {
    base: '#7C3AED',
    hover: '#6D28D9',
    active: '#5B21B6',
    soft: '#F5F3FF',
    softHover: '#EDE9FE',
    border: '#DDD6FE'
  },
  orange: {
    base: '#F59E0B',
    hover: '#D97706',
    active: '#B45309',
    soft: '#FFFBEB',
    softHover: '#FEF3C7',
    border: '#FDE68A'
  },
  gray: {
    base: '#374151',
    hover: '#1F2937',
    active: '#111827',
    soft: '#F7F8FA',
    softHover: '#F2F3F5',
    border: '#D8DAE0'
  },
  primary: {
    base: designTokens.colors.primary,
    hover: designTokens.colors.primaryHover,
    active: designTokens.colors.primaryActive,
    soft: '#FEF2F2',
    softHover: '#FDE8E8',
    border: '#E8A4A4'
  }
};

const getButtonAccent = (colorScheme?: string) =>
  buttonAccentByScheme[colorScheme || 'primary'] || buttonAccentByScheme.primary;

const solidButtonVariant = (props: any) => {
  const accent = getButtonAccent(props.colorScheme);
  return {
    bg: accent.base,
    color: 'white',
    border: '1px solid',
    borderColor: accent.base,
    boxShadow: `0 4px 12px ${accent.base}2E`,
    _hover: {
      bg: accent.hover,
      borderColor: accent.hover,
      boxShadow: `0 6px 16px ${accent.base}38`,
      transform: 'translateY(-1px)',
      _disabled: { transform: 'none' }
    },
    _active: { bg: accent.active, borderColor: accent.active, transform: 'translateY(0)' }
  };
};

const outlineButtonVariant = (props: any) => {
  const hasSemanticColor = props.colorScheme && props.colorScheme !== 'gray';
  const accent = getButtonAccent(hasSemanticColor ? props.colorScheme : 'gray');
  return {
    bg: 'white',
    color: hasSemanticColor ? accent.base : '#1F2937',
    border: '1px solid',
    borderColor: hasSemanticColor ? accent.border : '#D8DAE0',
    boxShadow: '0 1px 2px rgba(31,35,41,0.04)',
    _hover: {
      bg: accent.soft,
      borderColor: hasSemanticColor ? accent.base : '#AEB3BC',
      boxShadow: '0 3px 10px rgba(31,35,41,0.08)',
      transform: 'translateY(-1px)',
      _disabled: { transform: 'none' }
    },
    _active: { bg: accent.softHover, borderColor: accent.hover, transform: 'translateY(0)' }
  };
};

const ghostButtonVariant = (props: any) => {
  const hasSemanticColor = props.colorScheme && props.colorScheme !== 'gray';
  const accent = getButtonAccent(hasSemanticColor ? props.colorScheme : 'gray');
  return {
    bg: 'transparent',
    color: hasSemanticColor ? accent.base : '#4E5969',
    border: '1px solid transparent',
    boxShadow: 'none',
    _hover: { bg: accent.soft, color: hasSemanticColor ? accent.hover : '#1F2937' },
    _active: { bg: accent.softHover, color: hasSemanticColor ? accent.active : '#111827' }
  };
};

export const appChakraTheme = extendTheme(baseTheme, {
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
  appColors: designTokens.colors,
  appSpacing: designTokens.spacing,
  appShadows: designTokens.shadows,
  appBorderRadius: designTokens.borderRadius,
  appTypography: designTokens.typography,
  colors: {
    ...baseTheme.colors,
    bg: {
      ...(baseTheme.colors?.bg || {}),
      page: designTokens.colors.bgSecondary
    },
    teacherAdmin: {
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
      ...(baseTheme.colors?.text || {}),
      1: designTokens.colors.textPrimary,
      2: designTokens.colors.textSecondary,
      3: designTokens.colors.textTertiary,
      4: designTokens.colors.textDisabled,
      5: designTokens.colors.textWhite
    },
    fill: {
      ...(baseTheme.colors?.fill || {}),
      1: designTokens.colors.fill[1],
      2: designTokens.colors.fill[2],
      3: designTokens.colors.fill[3],
      4: designTokens.colors.fill[4]
    },
    primary: {
      ...(baseTheme.colors?.primary || {}),
      50: designTokens.colors.complementaryLight,
      100: '#F9D7D7',
      200: '#F1AFAF',
      300: '#E98787',
      400: '#D95E5E',
      500: designTokens.colors.primary,
      600: designTokens.colors.primaryHover,
      700: designTokens.colors.primaryActive
    },
    complementary: {
      1: designTokens.colors.complementaryLight,
      2: '#EEB2B5',
      3: '#E16B71',
      5: designTokens.colors.complementary,
      6: designTokens.colors.complementary,
      7: designTokens.colors.complementaryHover
    },
    success: {
      1: '#ECFDF3',
      2: '#A7F3D0',
      3: '#6EE7B7',
      6: designTokens.colors.success,
      7: designTokens.colors.successHover
    },
    warning: {
      1: '#FFF7E8',
      2: '#FDE68A',
      3: '#FCD34D',
      6: designTokens.colors.warning,
      7: designTokens.colors.warningHover
    },
    danger: {
      1: '#FEE2E2',
      2: '#FECACA',
      3: '#FCA5A5',
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
    Button: {
      ...baseTheme.components?.Button,
      baseStyle: {
        ...baseTheme.components?.Button?.baseStyle,
        borderRadius: designTokens.button.borderRadius,
        fontWeight: designTokens.button.fontWeight,
        letterSpacing: '0.01em',
        transition:
          'background-color 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 120ms ease',
        _focusVisible: {
          outline: 'none',
          boxShadow: designTokens.button.focusRing
        },
        _disabled: {
          opacity: 1,
          cursor: 'not-allowed',
          color: '#86909C',
          bg: '#F2F3F5',
          borderColor: '#E5E6EB',
          boxShadow: 'none',
          transform: 'none'
        }
      },
      sizes: {
        ...baseTheme.components?.Button?.sizes,
        xs: {
          ...(baseTheme.components?.Button as any)?.sizes?.xs,
          h: designTokens.button.heights.xs,
          minH: designTokens.button.heights.xs,
          px: '3',
          fontSize: 'xs',
          borderRadius: designTokens.button.borderRadius
        },
        xsSquare: {
          ...(baseTheme.components?.Button as any)?.sizes?.xsSquare,
          h: designTokens.button.heights.xs,
          minH: designTokens.button.heights.xs,
          w: designTokens.button.heights.xs,
          minW: designTokens.button.heights.xs,
          borderRadius: designTokens.button.borderRadius
        },
        sm: {
          ...(baseTheme.components?.Button as any)?.sizes?.sm,
          h: designTokens.button.heights.sm,
          minH: designTokens.button.heights.sm,
          px: '4',
          borderRadius: designTokens.button.borderRadius
        },
        smSquare: {
          ...(baseTheme.components?.Button as any)?.sizes?.smSquare,
          h: designTokens.button.heights.sm,
          minH: designTokens.button.heights.sm,
          w: designTokens.button.heights.sm,
          minW: designTokens.button.heights.sm,
          borderRadius: designTokens.button.borderRadius
        },
        base: {
          ...(baseTheme.components?.Button as any)?.sizes?.base,
          h: designTokens.button.height,
          minH: designTokens.button.height,
          px: '4',
          borderRadius: designTokens.button.borderRadius
        },
        baseSquare: {
          ...(baseTheme.components?.Button as any)?.sizes?.baseSquare,
          h: designTokens.button.heights.md,
          minH: designTokens.button.heights.md,
          w: designTokens.button.heights.md,
          minW: designTokens.button.heights.md,
          borderRadius: designTokens.button.borderRadius
        },
        md: {
          ...(baseTheme.components?.Button as any)?.sizes?.md,
          h: designTokens.button.height,
          minH: designTokens.button.height,
          px: '4',
          borderRadius: designTokens.button.borderRadius
        },
        mdSquare: {
          ...(baseTheme.components?.Button as any)?.sizes?.mdSquare,
          h: designTokens.button.heights.md,
          minH: designTokens.button.heights.md,
          w: designTokens.button.heights.md,
          minW: designTokens.button.heights.md,
          borderRadius: designTokens.button.borderRadius
        },
        lg: {
          ...(baseTheme.components?.Button as any)?.sizes?.lg,
          h: designTokens.button.heights.lg,
          minH: designTokens.button.heights.lg,
          px: '5',
          borderRadius: designTokens.button.borderRadius
        },
        lgSquare: {
          ...(baseTheme.components?.Button as any)?.sizes?.lgSquare,
          h: designTokens.button.heights.lg,
          minH: designTokens.button.heights.lg,
          w: designTokens.button.heights.lg,
          minW: designTokens.button.heights.lg,
          borderRadius: designTokens.button.borderRadius
        }
      },
      variants: {
        ...baseTheme.components?.Button?.variants,
        solid: solidButtonVariant,
        primary: solidButtonVariant,
        dangerFill: (props: any) => solidButtonVariant({ ...props, colorScheme: 'red' }),
        outline: outlineButtonVariant,
        primaryOutline: (props: any) => outlineButtonVariant({ ...props, colorScheme: 'primary' }),
        danger: (props: any) => outlineButtonVariant({ ...props, colorScheme: 'red' }),
        ghost: ghostButtonVariant,
        whiteBase: outlineButtonVariant,
        whitePrimary: (props: any) => outlineButtonVariant({ ...props, colorScheme: 'primary' }),
        whiteDanger: (props: any) => outlineButtonVariant({ ...props, colorScheme: 'red' }),
        link: {
          color: designTokens.colors.primary,
          h: 'auto',
          minH: 0,
          px: 0,
          borderRadius: '4px',
          _hover: { color: designTokens.colors.primaryHover, textDecoration: 'underline' },
          _active: { color: designTokens.colors.primaryActive }
        }
      },
      defaultProps: {
        ...baseTheme.components?.Button?.defaultProps,
        variant: 'solid',
        colorScheme: 'primary'
      }
    },
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
    Checkbox: {
      ...baseTheme.components?.Checkbox,
      defaultProps: {
        ...(baseTheme.components?.Checkbox as any)?.defaultProps,
        colorScheme: 'gray'
      },
      baseStyle: {
        ...(baseTheme.components?.Checkbox as any)?.baseStyle,
        control: {
          ...((baseTheme.components?.Checkbox as any)?.baseStyle?.control || {}),
          borderColor: '#D9D9D9',
          _checked: {
            bg: '#333333',
            borderColor: '#333333',
            color: '#FFFFFF',
            _hover: {
              bg: '#333333',
              borderColor: '#333333'
            }
          },
          _indeterminate: {
            bg: '#333333',
            borderColor: '#333333',
            color: '#FFFFFF'
          },
          _focusVisible: {
            boxShadow: '0 0 0 3px rgba(51, 51, 51, 0.12)'
          }
        }
      }
    }
  }
});
