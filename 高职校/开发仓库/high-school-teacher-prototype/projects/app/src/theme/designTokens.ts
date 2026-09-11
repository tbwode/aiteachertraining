export const designTokens = {
  colors: {
    primary: '#C83E3E',
    primaryHover: '#B33636',
    primaryActive: '#A32E2E',
    complementary: '#1F2937',
    complementaryHover: '#111827',
    complementaryActive: '#0F172A',
    complementaryLight: '#FEF2F2',
    success: '#10B981',
    successHover: '#059669',
    warning: '#F59E0B',
    warningHover: '#D97706',
    error: '#EF4444',
    errorHover: '#DC2626',
    info: '#2563EB',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textTertiary: '#6B7280',
    textDisabled: '#9CA3AF',
    textWhite: '#FFFFFF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    divider: '#E5E7EB',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F9FAFB',
    bgTertiary: '#F4F1EC',
    bgHover: '#FEF2F2',
    fill: {
      1: '#F9FAFB',
      2: '#F3F4F6',
      3: '#E5E7EB',
      4: '#D1D5DB'
    }
  },
  typography: {
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    fontFamily:
      'PingFang SC, PingFang, Noto Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    size: {
      xs: '12px',
      sm: '13px',
      base: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px',
      headlineMedium: '28px',
      headlineLarge: '36px',
      displayMedium: '48px',
      displayLarge: '64px'
    }
  },
  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease'
  },
  spacing: {
    card: {
      gap: '20px',
      padding: '20px'
    },
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px'
  },
  shadows: {
    sm: '0 1px 10px rgba(0, 0, 0, 0.05), 0 4px 5px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.12)',
    md: '0 3px 14px 2px rgba(0, 0, 0, 0.05), 0 8px 10px 1px rgba(0, 0, 0, 0.06), 0 5px 5px -3px rgba(0, 0, 0, 0.10)',
    lg: '0 6px 30px 5px rgba(0, 0, 0, 0.05), 0 16px 24px 2px rgba(0, 0, 0, 0.04), 0 8px 10px -5px rgba(0, 0, 0, 0.08)',
    xl: '0 6px 30px 5px rgba(0, 0, 0, 0.05), 0 16px 24px 2px rgba(0, 0, 0, 0.04), 0 8px 10px -5px rgba(0, 0, 0, 0.08)'
  },
  borderRadius: {
    sm: '3px',
    md: '6px',
    lg: '9px',
    xl: '12px',
    xxl: '12px',
    full: '999px'
  },
  button: {
    height: '40px',
    borderRadius: '10px',
    fontWeight: 600,
    heights: {
      xs: '32px',
      sm: '36px',
      md: '40px',
      lg: '44px'
    },
    primary: {
      bg: '#C83E3E',
      hover: '#B33636',
      active: '#A32E2E'
    },
    focusRing: '0 0 0 3px rgba(200, 62, 62, 0.18)'
  },
  form: {
    input: {
      height: '36px',
      borderRadius: '6px'
    }
  },
  modal: {
    overlay: 'rgba(0,0,0,0.5)',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: {
      sm: '400px',
      md: '560px',
      lg: '700px'
    }
  }
} as const;

export const studentProfileTokens = {
  card: {
    bg: designTokens.colors.bgPrimary,
    border: `1px solid ${designTokens.colors.borderLight}`,
    borderRadius: designTokens.borderRadius.xl,
    shadow: designTokens.shadows.sm
  },
  input: {
    h: designTokens.form.input.height,
    px: '12px',
    borderRadius: designTokens.form.input.borderRadius,
    borderColor: designTokens.colors.border,
    fontSize: designTokens.typography.size.base,
    color: designTokens.colors.textPrimary
  },
  inputHoverBorderColor: designTokens.colors.primaryHover,
  inputFocusBorderColor: designTokens.colors.primary,
  inputFocusShadow: `0 0 0 1px ${designTokens.colors.primary}`,
  readonlyInput: {
    bg: designTokens.colors.bgSecondary,
    borderColor: designTokens.colors.borderLight,
    color: designTokens.colors.textTertiary,
    hoverBorderColor: designTokens.colors.borderLight,
    focusBorderColor: designTokens.colors.borderLight,
    focusShadow: 'none'
  }
} as const;
