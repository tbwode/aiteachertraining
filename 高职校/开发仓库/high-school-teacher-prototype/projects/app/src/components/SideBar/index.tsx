import React, { useState, useEffect, useRef } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import type { BoxProps } from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';

interface Props extends BoxProps {
  externalTrigger?: Boolean;
  onFoldChange?: (isFolded: boolean) => void;
}

const SideBar = (e?: Props) => {
  // '0 0 250px', '0 0 270px', '0 0 290px'
  const { w = ['100%', '0 0 215px'], children, externalTrigger, onFoldChange, ...props } = e || {};

  const [isFolded, setIsFolded] = useState(false);

  // 保存上一次折叠状态
  const preFoledStatus = useRef<Boolean>(false);

  useEffect(() => {
    if (externalTrigger) {
      setIsFolded(true);
      preFoledStatus.current = isFolded;
    } else {
      // @ts-ignore
      setIsFolded(preFoledStatus.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalTrigger]);

  const handleFoldChange = (newIsFolded: boolean) => {
    setIsFolded(newIsFolded);
    if (onFoldChange) {
      onFoldChange(newIsFolded);
    }
  };

  return (
    <Box
      position={'relative'}
      flex={isFolded ? '0 0 0' : w}
      w={['100%', 0]}
      h={'100%'}
      zIndex={1}
      transition={'0.2s'}
      _hover={{
        '& > div': { visibility: 'visible', opacity: 1 }
      }}
      {...props}
    >
      <Flex
        position={'absolute'}
        right={0}
        top={'22px'}
        transform={isFolded ? 'translateX(calc(100% + 16px))' : 'translateX(50%)'}
        alignItems={'center'}
        justifyContent={'center'}
        // pr={1}
        w={'28px'}
        h={'28px'}
        borderRadius={'8px'}
        bg={isFolded ? '#fff' : '#fcfcfc'}
        cursor={'pointer'}
        transition={'0.2s'}
        border={'1px solid #e6e6e6'}
        zIndex={2}
        {...(isFolded
          ? {
              opacity: 1
            }
          : {
              visibility: 'hidden',
              opacity: 0
            })}
        onClick={() => handleFoldChange(!isFolded)}
      >
        <MyIcon name={isFolded ? 'menu_open' : 'arrowLeft'} w={'20px'} color={'primary.500'} />
      </Flex>
      <Box position={'relative'} h={'100%'} overflow={isFolded ? 'hidden' : 'visible'}>
        {children}
      </Box>
    </Box>
  );
};

export default SideBar;
