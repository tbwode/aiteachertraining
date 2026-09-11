import React, { useState } from 'react';
import { Input, type InputProps, InputGroup, InputLeftElement } from '@chakra-ui/react';
import MyIcon from '../../Icon';

const SearchInput = (props: InputProps) => {
  return (
    <InputGroup position={'relative'} maxW={props.maxW}>
      <Input
        fontSize="sm"
        bg={'#fff'}
        pr={8}
        {...props}
        borderRadius={'var(--form-field-radius, 12px)'}
        border={
          'var(--form-field-border-width, 1px) solid var(--form-field-border, rgba(0, 0, 0, 0.00))'
        }
        background={'var(--form-field-bg, #FFF)'}
        /* shadow-field */
        shadow={
          '0 var(--depth, 0) var(--depth, 0) 0 rgba(255, 255, 255, 0.10) inset, 0 2px 4px 0 var(--form-field-shadow, rgba(0, 0, 0, 0.04)), 0 1px 2px 0 var(--form-field-shadow-2, rgba(0, 0, 0, 0.06)), 0 0 1px 0 var(--form-field-shadow-2, rgba(0, 0, 0, 0.06))'
        }
        backdrop-filter={'calc(var(--blur, 0) / 2)'}
        _focus={{
          borderColor: 'var(--form-field-border-focus, rgba(0, 0, 0, 0.10))',
          boxShadow: '0 0 0 1px var(--form-field-shadow-focus, rgba(0, 0, 0, 0.10))'
        }}
        _hover={{
          borderColor: 'var(--form-field-border-focus, rgba(0, 0, 0, 0.10))',
          boxShadow: '0 0 0 1px var(--form-field-shadow-focus, rgba(0, 0, 0, 0.10))'
        }}
      />
      <MyIcon
        position={'absolute'}
        zIndex={10}
        right={2.5}
        name={'common/searchLight'}
        w={4}
        top={'50%'}
        transform={'translateY(-50%)'}
        color={'myGray.600'}
      />
    </InputGroup>
  );
};

export default React.memo(SearchInput);
