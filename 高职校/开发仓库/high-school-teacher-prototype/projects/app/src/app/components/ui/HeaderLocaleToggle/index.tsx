'use client';

import type { ReactNode } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import SvgIcon from '@/app/components/ui/SvgIcon';

type HeaderLocaleToggleProps = {
  label: ReactNode;
  ariaLabel: string;
  onClick: () => void;
  iconSrc?: string;
  iconAlt?: string;
};

export default function HeaderLocaleToggle({
  label,
  ariaLabel,
  onClick,
  iconSrc = '/imgs/teacher/login/change.svg',
  iconAlt = '切换语言'
}: HeaderLocaleToggleProps) {
  return (
    <Flex
      as="button"
      type="button"
      borderRadius="16px"
      bg="#F2F3F5"
      px="15px"
      py="6px"
      align="center"
      gap="4px"
      color="#333333"
      fontFamily="PingFang SC"
      fontSize="16px"
      fontStyle="normal"
      fontWeight={400}
      lineHeight="22px"
      transition="background-color 0.2s ease, color 0.2s ease"
      _hover={{ bg: '#E5E6EB' }}
      _active={{ bg: '#D9DADD' }}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <Text>{label}</Text>
      <SvgIcon src={iconSrc} alt={iconAlt} width="16px" height="16px" />
    </Flex>
  );
}
