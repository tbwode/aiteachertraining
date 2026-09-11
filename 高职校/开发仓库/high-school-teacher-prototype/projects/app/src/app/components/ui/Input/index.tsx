import React, { forwardRef } from 'react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { Flex, Input as ChakraInput, type InputProps as ChakraInputProps } from '@chakra-ui/react';

export interface InputProps extends ChakraInputProps {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ leftIcon, rightIcon, isDisabled, isPassword = false, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const resolvedRightIcon = isPassword ? (
      showPassword ? (
        <ViewOffIcon boxSize={4} />
      ) : (
        <ViewIcon boxSize={4} />
      )
    ) : (
      rightIcon
    );

    return (
      <Flex position={'relative'} alignItems={'center'} w={'100%'}>
        <ChakraInput
          ref={ref}
          w={'100%'}
          h={'34px'}
          minH={'34px'}
          px={'12px'}
          py={'5px'}
          pl={leftIcon ? '38px' : '12px'}
          pr={resolvedRightIcon ? '38px' : '12px'}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          borderRadius={'8px'}
          border={'1px solid'}
          borderColor={'#E7E7E7'}
          bg={'#FFF'}
          color={'#86909C'}
          fontFamily={'PingFang SC'}
          fontSize={'14px'}
          fontStyle={'normal'}
          fontWeight={400}
          lineHeight={'22px'}
          _placeholder={{
            color: '#86909C'
          }}
          _hover={{
            borderColor: '#D9D9D9'
          }}
          _focusVisible={{
            borderColor: '#333333',
            boxShadow: '0 0 0 3px rgba(51, 51, 51, 0.08)'
          }}
          _disabled={{
            bg: '#F7F8FA',
            color: '#C9CDD4',
            borderColor: '#E7E7E7',
            cursor: 'not-allowed',
            opacity: 1
          }}
          isDisabled={isDisabled}
          {...props}
        />
        {leftIcon && (
          <Flex
            position={'absolute'}
            left={'12px'}
            alignItems={'center'}
            justifyContent={'center'}
            color={'#86909C'}
            pointerEvents={'none'}
            zIndex={1}
          >
            {leftIcon}
          </Flex>
        )}
        {resolvedRightIcon && (
          <Flex
            position={'absolute'}
            right={'12px'}
            alignItems={'center'}
            justifyContent={'center'}
            color={'#86909C'}
            cursor={isPassword && !isDisabled ? 'pointer' : 'default'}
            pointerEvents={isPassword ? 'auto' : 'none'}
            zIndex={1}
            onClick={() => {
              if (!isPassword || isDisabled) return;
              setShowPassword((state) => !state);
            }}
          >
            {resolvedRightIcon}
          </Flex>
        )}
      </Flex>
    );
  }
);

Input.displayName = 'Input';

export default Input;
