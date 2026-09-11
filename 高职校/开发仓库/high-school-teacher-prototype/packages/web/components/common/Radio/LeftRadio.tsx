import React, { useCallback } from 'react';
import { Box, Checkbox, Flex, Grid, type GridProps, HStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import QuestionTip from '../MyTooltip/QuestionTip';
import MyIcon from '../Icon';

type Props<T> = Omit<GridProps, 'onChange'> & {
  list: {
    icon?: string;
    title: string | React.ReactNode;
    desc?: string;
    value: T;
    children?: React.ReactNode;
    tooltip?: string;
  }[];
  align?: 'flex-top' | 'center';
  value: T;
  defaultBg?: string;
  activeBg?: string;
  onChange: (e: T) => void;
  isDisabled?: boolean;
  showCheckbox?: boolean;
};

const LeftRadio = <T = any,>({
  list,
  value,
  align = 'center',
  px = 3.5,
  py = 4,
  gridGap = [3, 5],
  defaultBg = 'myGray.50',
  activeBg = 'primary.50',
  onChange,
  isDisabled = false,
  showCheckbox = false,
  ...props
}: Props<T>) => {
  const { t } = useTranslation();

  const getBoxStyle = useCallback(
    (isActive: boolean) => {
      const baseStyle = {
        px,
        py,
        border: 'base',
        borderWidth: '1px',
        borderRadius: 'md'
      };

      if (isActive) {
        return {
          ...baseStyle,
          borderColor: '#000',
          bg: 'white',
          borderWidth: '1px',
          boxShadow: ' 0 4px 10px 0 rgba(0, 0, 0, 0.10)',
          cursor: 'pointer',
          opacity: 1
        };
      }
      if (isDisabled) {
        return {
          ...baseStyle,
          bg: 'white',
          borderColor: 'myGray.200',
          color: 'myGray.500',
          cursor: 'not-allowed',
          opacity: 0.6
        };
      }
      return {
        ...baseStyle,
        bg: 'white',
        _hover: { borderColor: 'primary.300' },
        cursor: 'pointer',
        opacity: 1
      };
    },
    [activeBg, defaultBg, isDisabled, px, py]
  );

  return (
    <Grid gridGap={gridGap} fontSize={['sm', 'md']} {...props}>
      {list.map((item) => {
        const isActive = value === item.value;
        return (
          <Box
            key={item.value as any}
            position={'relative'}
            userSelect={'none'}
            onClick={() => !isDisabled && onChange(item.value)}
            {...getBoxStyle(isActive)}
          >
            <Flex alignItems={align}>
              {showCheckbox && (
                <Checkbox isChecked={isActive} mr={3} variant={'noBorder'}></Checkbox>
              )}
              {/* Circle */}
              {!!item.icon && <MyIcon name={item.icon as any} w={'28px'} mr={3} />}
              <Box flex={'1 0 0'} py={2}>
                {typeof item.title === 'string' ? (
                  <HStack
                    spacing={1}
                    fontWeight={item.desc ? 'medium' : 'normal'}
                    whiteSpace={'nowrap'}
                    fontSize={'15px'}
                    lineHeight={1}
                    color={'#000'}
                  >
                    <Box mb={1}>{t(item.title as any)}</Box>
                    {!!item.tooltip && <QuestionTip label={item.tooltip} color={'myGray.600'} />}
                  </HStack>
                ) : (
                  item.title
                )}

                {!!item.desc && (
                  <Box fontSize={'13px'} mt={1.5} lineHeight={1.2} color={'#86909C'}>
                    {t(item.desc as any)}
                  </Box>
                )}
              </Box>
            </Flex>
            {item?.children && (
              <Box mt={4} pt={4} borderTop={'base'} cursor={'default'}>
                {item?.children}
              </Box>
            )}
          </Box>
        );
      })}
    </Grid>
  );
};

export default LeftRadio;
