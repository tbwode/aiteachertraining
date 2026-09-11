import React from 'react';
import { Box, Flex, useTheme, Grid, type GridProps, Radio, Center } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@fastgpt/web/hooks/useToast';
import Avatar from '@fastgpt/web/components/common/Avatar';

// @ts-ignore
interface Props extends GridProps {
  list: {
    icon?: string;
    title: string | React.ReactNode;
    desc?: string;
    value: any;
    forbidTip?: string; // If this value is exists, it will be prompted to disable when clicked
  }[];
  iconSize?: string;
  align?: 'top' | 'center';
  value: any;
  hiddenCircle?: boolean;

  onChange: (e: any) => void;
}

const MyRadio = ({
  list,
  value,
  align = 'center',
  iconSize = '18px',
  hiddenCircle = false,
  p,
  onChange,
  ...props
}: Props) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { toast } = useToast();

  return (
    <Grid rowGap={5} columnGap={'10px'} {...props}>
      {list.map((item) => (
        <Flex
          key={item.value}
          alignItems={align}
          cursor={'pointer'}
          userSelect={'none'}
          // p={5}
          p={p !== undefined ? `${p} !important` : 5}
          border={theme.borders.sm}
          borderWidth={'1.5px'}
          borderRadius={'md'}
          position={'relative'}
          {...(value === item.value
            ? {
                borderColor: 'primary.600',
                bg: '#fff',
                color: 'primary.600',
                'box-shadow': '0 4px 10px 0 rgba(0, 0, 0, 0.10)'
              }
            : {
                bg: '#fff',
                _hover: {
                  borderColor: 'primary.400'
                }
              })}
          onClick={() => {
            if (item.forbidTip) {
              toast({
                status: 'warning',
                title: item.forbidTip
              });
            } else {
              onChange(item.value);
            }
          }}
        >
          {!!item.icon && (
            <>
              <Center
                p={'5px'}
                w={iconSize}
                h={iconSize}
                mr={'12px'}
                border={'base'}
                borderRadius={'50%'}
              >
                <Avatar src={item.icon} w="full" />
              </Center>
            </>
          )}
          <Box pr={hiddenCircle ? 0 : 2} flex={'1 0 0'}>
            <Box fontSize={'15px'} color={'#000'}>
              {typeof item.title === 'string' ? t(item.title as any) : item.title}
            </Box>
            {!!item.desc && (
              <Box fontSize={'13px'} color={'#86909C'}>
                {t(item.desc as any)}
              </Box>
            )}
          </Box>
          {!hiddenCircle && <Radio isChecked={value === item.value} />}
        </Flex>
      ))}
    </Grid>
  );
};

export default MyRadio;
