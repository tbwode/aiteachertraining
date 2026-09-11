import React, { forwardRef } from 'react';
import {
  Button as ChakraButton,
  type ButtonProps as ChakraButtonProps,
  HStack,
  type ResponsiveValue
} from '@chakra-ui/react';

export type AppButtonVariant =
  | 'primary'
  | 'primaryOutline'
  | 'secondary'
  | 'tertiary'
  | 'danger'
  | 'dangerSolid'
  | 'next';
type LegacyButtonVariant =
  | 'whiteBase'
  | 'whitePrimary'
  | 'whiteDanger'
  | 'dangerFill'
  | 'outline'
  | 'solid'
  | 'ghost';
type PreservedChakraVariant = 'ghost' | 'link' | 'unstyled';
type CompatibleButtonVariant =
  | AppButtonVariant
  | LegacyButtonVariant
  | PreservedChakraVariant
  | string;

export interface ButtonProps extends Omit<ChakraButtonProps, 'variant'> {
  variant?: CompatibleButtonVariant;
}

type ButtonStyleConfig = {
  bg: string;
  color: string;
  borderColor: string;
  borderWidth: string;
  fontSize: ResponsiveValue<string>;
  fontWeight: number;
  lineHeight: string;
  letterSpacing?: string;
  hoverBg: string;
  hoverColor?: string;
  hoverBorderColor?: string;
  activeBg: string;
  activeBorderColor?: string;
  boxShadow?: string;
  hoverBoxShadow?: string;
  focusShadow: string;
  disabledBg: string;
  disabledColor: string;
  disabledBorderColor: string;
};

const buttonStyleMap: Record<AppButtonVariant, ButtonStyleConfig> = {
  primary: {
    bg: '#C83E3E',
    color: '#FFFFFF',
    borderColor: '#C83E3E',
    borderWidth: '1px',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '20px',
    letterSpacing: '0.01em',
    hoverBg: '#B33636',
    hoverBorderColor: '#B33636',
    activeBg: '#A32E2E',
    activeBorderColor: '#A32E2E',
    boxShadow: '0 4px 12px rgba(200, 62, 62, 0.18)',
    hoverBoxShadow: '0 6px 16px rgba(200, 62, 62, 0.24)',
    focusShadow: '0 0 0 3px rgba(200, 62, 62, 0.18)',
    disabledBg: '#F2F3F5',
    disabledColor: '#86909C',
    disabledBorderColor: '#F2F3F5'
  },
  secondary: {
    bg: '#FFFFFF',
    color: '#1F2937',
    borderColor: '#D8DAE0',
    borderWidth: '1px',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '20px',
    hoverBg: '#F7F8FA',
    hoverBorderColor: '#AEB3BC',
    activeBg: '#F2F3F5',
    activeBorderColor: '#86909C',
    boxShadow: '0 1px 2px rgba(31, 35, 41, 0.04)',
    hoverBoxShadow: '0 3px 10px rgba(31, 35, 41, 0.08)',
    focusShadow: '0 0 0 3px rgba(78, 89, 105, 0.14)',
    disabledBg: '#FFFFFF',
    disabledColor: '#C9CDD4',
    disabledBorderColor: '#E5E6EB'
  },
  danger: {
    bg: '#FFFFFF',
    color: '#DC2626',
    borderColor: '#FCA5A5',
    borderWidth: '1px',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '20px',
    hoverBg: '#FEF2F2',
    hoverBorderColor: '#EF4444',
    activeBg: '#FEE2E2',
    activeBorderColor: '#DC2626',
    boxShadow: '0 1px 2px rgba(220, 38, 38, 0.04)',
    hoverBoxShadow: '0 3px 10px rgba(220, 38, 38, 0.10)',
    focusShadow: '0 0 0 3px rgba(239, 68, 68, 0.16)',
    disabledBg: '#FFFFFF',
    disabledColor: '#D4A4A7',
    disabledBorderColor: '#F7C7CC'
  },
  dangerSolid: {
    bg: '#EF4444',
    color: '#FFFFFF',
    borderColor: '#EF4444',
    borderWidth: '1px',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '20px',
    hoverBg: '#DC2626',
    hoverBorderColor: '#DC2626',
    activeBg: '#B91C1C',
    activeBorderColor: '#B91C1C',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.18)',
    hoverBoxShadow: '0 6px 16px rgba(239, 68, 68, 0.22)',
    focusShadow: '0 0 0 3px rgba(239, 68, 68, 0.18)',
    disabledBg: '#F2F3F5',
    disabledColor: '#86909C',
    disabledBorderColor: '#F2F3F5'
  },
  primaryOutline: {
    bg: '#FFFFFF',
    color: '#C83E3E',
    borderColor: '#E8A4A4',
    borderWidth: '1px',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '20px',
    hoverBg: '#FEF2F2',
    hoverBorderColor: '#C83E3E',
    activeBg: '#FDE8E8',
    activeBorderColor: '#B33636',
    boxShadow: '0 1px 2px rgba(200, 62, 62, 0.04)',
    hoverBoxShadow: '0 3px 10px rgba(200, 62, 62, 0.10)',
    focusShadow: '0 0 0 3px rgba(200, 62, 62, 0.16)',
    disabledBg: '#FFFFFF',
    disabledColor: '#C9CDD4',
    disabledBorderColor: '#E5E6EB'
  },
  tertiary: {
    bg: 'transparent',
    color: '#4E5969',
    borderColor: 'transparent',
    borderWidth: '1px',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '20px',
    hoverBg: '#F2F3F5',
    activeBg: '#E5E6EB',
    boxShadow: 'none',
    hoverBoxShadow: 'none',
    focusShadow: '0 0 0 3px rgba(78, 89, 105, 0.14)',
    disabledBg: 'transparent',
    disabledColor: '#C9CDD4',
    disabledBorderColor: 'transparent'
  },
  next: {
    bg: '#FFF4F4',
    color: '#B33636',
    borderColor: '#F3D0D0',
    borderWidth: '1px',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '20px',
    hoverBg: '#FDE8E8',
    hoverBorderColor: '#E8A4A4',
    activeBg: '#F9D7D7',
    activeBorderColor: '#C83E3E',
    boxShadow: 'none',
    hoverBoxShadow: '0 3px 10px rgba(200, 62, 62, 0.08)',
    focusShadow: '0 0 0 3px rgba(200, 62, 62, 0.16)',
    disabledBg: '#FFFFFF',
    disabledColor: '#D4A4A7',
    disabledBorderColor: '#F7C7CC'
  }
};

const variantAliasMap: Record<LegacyButtonVariant, AppButtonVariant> = {
  whiteBase: 'secondary',
  whitePrimary: 'primaryOutline',
  whiteDanger: 'danger',
  dangerFill: 'dangerSolid',
  outline: 'secondary',
  solid: 'primary',
  ghost: 'tertiary'
};

const preservedVariantSet = new Set<PreservedChakraVariant>(['ghost', 'link', 'unstyled']);

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', children, leftIcon, rightIcon, isDisabled, ...props }, ref) => {
    if (preservedVariantSet.has(variant as PreservedChakraVariant)) {
      return (
        <ChakraButton
          ref={ref}
          variant={variant}
          isDisabled={isDisabled}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          {...props}
        >
          {children}
        </ChakraButton>
      );
    }

    const normalizedVariant = (variantAliasMap[variant as LegacyButtonVariant] ||
      (variant as AppButtonVariant)) as AppButtonVariant;
    const styles = buttonStyleMap[normalizedVariant] || buttonStyleMap.primary;

    return (
      <ChakraButton
        ref={ref}
        minH={'40px'}
        h={'40px'}
        px={'18px'}
        py={'10px'}
        borderRadius={'10px'}
        borderWidth={styles.borderWidth}
        borderStyle={'solid'}
        borderColor={styles.borderColor}
        bg={styles.bg}
        color={styles.color}
        fontFamily={'inherit'}
        fontSize={styles.fontSize}
        fontStyle={'normal'}
        fontWeight={styles.fontWeight}
        lineHeight={styles.lineHeight}
        letterSpacing={styles.letterSpacing}
        textAlign={'center'}
        style={{ fontFeatureSettings: `'liga' off, 'clig' off` }}
        boxShadow={styles.boxShadow}
        transition={
          'background-color 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 120ms ease'
        }
        _hover={{
          bg: styles.hoverBg,
          borderColor: styles.hoverBorderColor || styles.borderColor,
          color: styles.hoverColor || styles.color,
          boxShadow: styles.hoverBoxShadow,
          transform: 'translateY(-1px)',
          _disabled: {
            bg: styles.disabledBg,
            borderColor: styles.disabledBorderColor,
            color: styles.disabledColor
          }
        }}
        _active={{
          bg: styles.activeBg,
          borderColor: styles.activeBorderColor || styles.borderColor,
          color: styles.color,
          boxShadow: styles.boxShadow,
          transform: 'translateY(0)'
        }}
        _focusVisible={{
          boxShadow: styles.focusShadow
        }}
        _disabled={{
          bg: styles.disabledBg,
          color: styles.disabledColor,
          borderColor: styles.disabledBorderColor,
          opacity: 1,
          cursor: 'not-allowed',
          transform: 'none'
        }}
        isDisabled={isDisabled}
        leftIcon={
          leftIcon ? (
            <HStack spacing={0} align={'center'}>
              {leftIcon}
            </HStack>
          ) : undefined
        }
        rightIcon={
          rightIcon ? (
            <HStack spacing={0} align={'center'}>
              {rightIcon}
            </HStack>
          ) : undefined
        }
        iconSpacing={'6px'}
        {...props}
      >
        {children}
      </ChakraButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;
