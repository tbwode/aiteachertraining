import React, { forwardRef } from 'react';
import { Flex, Input, type InputProps } from '@chakra-ui/react';

interface Props extends InputProps {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const MyInput = forwardRef<HTMLInputElement, Props>(({ leftIcon, rightIcon, ...props }, ref) => {
  return (
    <Flex h={'100%'} position={'relative'} alignItems={'center'}>
      <Input
        ref={ref}
        w={'100%'}
        pl={leftIcon ? '34px !important' : 3}
        pr={rightIcon ? '34px !important' : 3}
        borderRadius={'12px'}
        border={
          'var(--form-field-border-width, 1px) solid var(--form-field-border, rgba(0, 0, 0, 0.00))'
        }
        bg={'var(--form-field-bg, #FFF)'}
        boxShadow={
          '0 var(--depth, 0) var(--depth, 0) 0 rgba(255, 255, 255, 0.10) inset, 0 2px 4px 0 var(--form-field-shadow, rgba(0, 0, 0, 0.04)), 0 1px 2px 0 var(--form-field-shadow-2, rgba(0, 0, 0, 0.06)), 0 0 1px 0 var(--form-field-shadow-2, rgba(0, 0, 0, 0.06))'
        }
        fontSize={'14px'}
        _focus={{
          borderColor: 'primary.500',
          boxShadow: '0px 0px 0px 2.4px rgba(51, 112, 255, 0.15)',
          bg: 'white'
        }}
        style={{
          backdropFilter: 'blur(calc(var(--blur, 0) / 2))'
        }}
        _placeholder={{
          color: 'var(--form-field-placeholder, rgba(0, 0, 0, 0.20))',
          fontSize: '14px'
        }}
        {...props}
      />
      {leftIcon && (
        <Flex alignItems={'center'} position={'absolute'} left={3} w={'20px'} zIndex={10}>
          {leftIcon}
        </Flex>
      )}
      {rightIcon && (
        <Flex alignItems={'center'} position={'absolute'} right={3} w={'20px'} zIndex={10}>
          {rightIcon}
        </Flex>
      )}
    </Flex>
  );
});

MyInput.displayName = 'MyInput';

export default MyInput;
