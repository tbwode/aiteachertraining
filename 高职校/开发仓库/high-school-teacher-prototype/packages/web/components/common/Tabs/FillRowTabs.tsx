import React, { forwardRef } from 'react';
import { Flex, Box, type BoxProps, HStack } from '@chakra-ui/react';
import MyIcon from '../Icon';

type Props<T = string> = Omit<BoxProps, 'onChange'> & {
  list: {
    icon?: string;
    label: string | React.ReactNode;
    value: T;
  }[];
  value: T;
  onChange: (e: T) => void;
  iconSize?: string;
  labelSize?: string;
  iconGap?: number;
};

const FillRowTabs = ({
  list,
  value,
  onChange,
  py = '2.5',
  px = '4',
  iconSize = '18px',
  labelSize = 'base',
  iconGap = 2,
  ...props
}: Props) => {
  return (
    <Box
      display={'inline-flex'}
      px={'4px'}
      py={'4px'}
      borderRadius={'full'}
      // borderWidth={'1px'}
      // borderColor={'myGray.200'}
      bg={'#F4F4F5'}
      gap={'4px'}
      fontSize={'base'}
      w={'100%'}
      fontWeight={'medium'}
      {...props}
    >
      {list.map((item) => (
        <HStack
          key={item.value}
          flex={'1 0 0'}
          alignItems={'center'}
          justifyContent={'center'}
          cursor={'pointer'}
          borderRadius={'full'}
          px={px}
          py={py}
          userSelect={'none'}
          whiteSpace={'noWrap'}
          gap={iconGap}
          {...(value === item.value
            ? {
                bg: 'white',
                boxShadow: '1.5',
                color: 'primary.600'
              }
            : {
                color: '#71717A',
                _hover: {
                  color: 'primary.600'
                },
                onClick: () => onChange(item.value)
              })}
        >
          {/* {item.icon && <MyIcon name={item.icon as any} w={iconSize} />} */}
          <Box fontSize={labelSize}>{item.label}</Box>
        </HStack>
      ))}
    </Box>
  );
};

export default forwardRef(FillRowTabs) as <T>(
  props: Props<T> & { ref?: React.Ref<HTMLSelectElement> }
) => JSX.Element;
