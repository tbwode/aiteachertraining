'use client';

import type { ReactNode } from 'react';
import {
  Box,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  type BoxProps
} from '@chakra-ui/react';

export type SelectOption = {
  label: ReactNode;
  value: string;
  disabled?: boolean;
};

export interface SelectProps extends Omit<BoxProps, 'onChange'> {
  value?: string;
  options: SelectOption[];
  placeholder?: ReactNode;
  onChange?: (value: string) => void;
  isDisabled?: boolean;
  menuWidth?: string | number;
  menuMaxH?: string | number;
}

const triggerBaseStyle = {
  borderRadius: '10px',
  border: '1px solid #E7E7E7',
  background: '#FFF',
  color: '#4E5969',
  fontFamily: 'PingFang SC',
  fontSize: '14px',
  fontStyle: 'normal',
  fontWeight: 400,
  lineHeight: '20px'
} as const;

export default function Select({
  value,
  options,
  placeholder = '请选择',
  onChange,
  isDisabled = false,
  menuWidth,
  menuMaxH = '240px',
  w = '100%',
  minW,
  h = '40px',
  ...props
}: SelectProps) {
  const selectedOption = options.find((item) => item.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  return (
    <Menu autoSelect={false} placement="bottom-start" gutter={8} matchWidth={!menuWidth}>
      {({ isOpen }) => (
        <>
          <MenuButton
            as={Box}
            w={w}
            minW={minW}
            h={h}
            px="12px"
            cursor={isDisabled ? 'not-allowed' : 'pointer'}
            transition="all 0.2s ease"
            bg={isOpen ? '#F2F3F5' : '#FFF'}
            opacity={isDisabled ? 0.6 : 1}
            pointerEvents={isDisabled ? 'none' : 'auto'}
            _hover={{
              borderColor: isDisabled ? '#E7E7E7' : '#D9D9D9'
            }}
            _focusVisible={{
              boxShadow: '0 0 0 1px rgba(51, 51, 51, 0.12)'
            }}
            {...triggerBaseStyle}
            {...props}
          >
            <Flex h="100%" align="center" justify="space-between" gap="8px">
              <Text
                flex="1"
                minW={0}
                noOfLines={1}
                color={selectedOption ? '#333333' : '#4E5969'}
                fontFamily="PingFang SC"
                fontSize="14px"
                fontWeight={400}
                lineHeight="20px"
              >
                {displayLabel}
              </Text>
              <ChevronDownIcon isOpen={isOpen} />
            </Flex>
          </MenuButton>

          <MenuList
            minW={menuWidth ?? undefined}
            w={menuWidth ?? undefined}
            maxH={menuMaxH}
            p="8px 8px 0"
            borderRadius="12px"
            border="1px solid #E5E7EB"
            bg="#FFF"
            boxShadow="0 0 15.6px 0 rgba(92, 92, 92, 0.11)"
            display="flex"
            flexDirection="column"
            alignItems="stretch"
            gap="6px"
            overflowX="hidden"
            overflowY="auto"
          >
            {options.map((item) => {
              const active = item.value === value;

              return (
                <MenuItem
                  key={item.value || String(item.label)}
                  mb="8px"
                  px="10px"
                  py="8px"
                  borderRadius="8px"
                  bg={active ? '#F2F3F5' : '#FFF'}
                  color="#333"
                  fontFamily="PingFang SC"
                  fontSize="14px"
                  fontStyle="normal"
                  fontWeight={500}
                  lineHeight="20px"
                  letterSpacing="0.07px"
                  isDisabled={item.disabled}
                  _hover={{
                    bg: item.disabled ? '#FFF' : '#F7F8FA'
                  }}
                  _focus={{
                    bg: '#F7F8FA'
                  }}
                  onClick={() => {
                    if (item.disabled) return;
                    onChange?.(item.value);
                  }}
                >
                  {item.label}
                </MenuItem>
              );
            })}
          </MenuList>
        </>
      )}
    </Menu>
  );
}

function ChevronDownIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <Box
      as="svg"
      width="14px"
      height="14px"
      viewBox="0 0 24 24"
      fill="none"
      color="#4E5969"
      transform={isOpen ? 'rotate(180deg)' : undefined}
      transition="transform 0.2s ease"
      flexShrink={0}
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
}
