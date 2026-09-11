import React, { useMemo } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import type { GridProps } from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import type { IconNameType } from '@fastgpt/web/components/common/Icon/type.d';

export type Props<ValueType = string> = Omit<GridProps, 'onChange'> & {
  list: {
    value?: ValueType;
    label: string;
    icon?: string;
    activeIcon?: string;
    isGroupName?: boolean;
  }[];
  value: ValueType;
  size?: 'sm' | 'md' | 'lg';
  onChange: (value: ValueType) => void;
};

const SideTabs = <ValueType = string,>({
  list,
  size = 'md',
  value,
  onChange,
  ...props
}: Props<ValueType>) => {
  const sizeMap = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          fontSize: 'xs',
          inlineP: 1
        };
      case 'md':
        return {
          fontSize: 'sm',
          inlineP: 2
        };
      case 'lg':
        return {
          fontSize: 'md',
          inlineP: 3
        };
    }
  }, [size]);

  return (
    <Box fontSize={sizeMap.fontSize} {...props}>
      {list.map((item) => (
        <>
          {item.isGroupName ? (
            <Box color={'#7A7A7A'} fontSize={'12px'} mb={2}>
              {item.label}
            </Box>
          ) : (
            <Flex
              key={item.value as string}
              py={sizeMap.inlineP}
              borderRadius={'12px'}
              px={4}
              mb={2}
              fontWeight={'medium'}
              alignItems={'center'}
              {...(value === item.value
                ? {
                    bg: 'rgba(0, 0, 0, 0.04) !important',
                    color: 'primary.600 ',
                    cursor: 'default'
                  }
                : {
                    cursor: 'pointer',
                    color: 'myBlack.pure'
                  })}
              _hover={{
                color: 'primary.600',
                bg: 'myGray.100'
              }}
              onClick={() => {
                if (value === item.value) return;
                if (item.value) onChange(item.value);
              }}
            >
              <MyIcon mr={2} name={item.icon as IconNameType} w={'24px'} h={'24px'} />
              {item.label}
            </Flex>
          )}
        </>
      ))}
    </Box>
  );
};

export default SideTabs;
