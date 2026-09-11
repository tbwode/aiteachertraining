'use client';

import type { ReactNode } from 'react';
import { CheckIcon, ChevronDownIcon } from '@chakra-ui/icons';
import {
  Box,
  Flex,
  HStack,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text
} from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';

type HeaderUserMenuItem = {
  key: string;
  label: ReactNode;
  icon: ReactNode;
  isCurrent?: boolean;
  onClick?: () => void;
};

type HeaderUserMenuProps = {
  accentColor: string;
  accentSoftBg: string;
  userName: ReactNode;
  userRoleLabel: ReactNode;
  userAccount: ReactNode;
  roleBadges: ReactNode[];
  actionItems?: HeaderUserMenuItem[];
  roleSwitchLabel: ReactNode;
  roleSwitchItems: HeaderUserMenuItem[];
  logoutLabel: ReactNode;
  onLogout: () => void;
  avatarUrl?: string;
  avatar: ReactNode;
  logoutIcon: ReactNode;
};

export default function HeaderUserMenu({
  accentColor,
  accentSoftBg,
  userName,
  userRoleLabel,
  userAccount,
  roleBadges,
  actionItems = [],
  roleSwitchLabel,
  roleSwitchItems,
  logoutLabel,
  onLogout,
  avatarUrl,
  avatar,
  logoutIcon
}: HeaderUserMenuProps) {
  return (
    <Menu autoSelect={false} placement="bottom-end">
      {({ isOpen }) => (
        <>
          <MenuButton
            as={Button}
            variant="ghost"
            h="auto"
            px={3}
            py={2}
            rounded="lg"
            _hover={{ bg: 'gray.100' }}
            _active={{ bg: 'gray.100' }}
            rightIcon={
              <ChevronDownIcon
                boxSize={4}
                color="gray.400"
                transform={isOpen ? 'rotate(180deg)' : undefined}
                transition="transform 0.2s ease"
              />
            }
          >
            <HStack spacing={3}>
              <Flex
                w="32px"
                h="32px"
                rounded="full"
                bg={accentColor}
                color="white"
                align="center"
                justify="center"
                overflow="hidden"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={typeof userName === 'string' ? userName : 'avatar'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  avatar
                )}
              </Flex>
              <Box display={{ base: 'none', md: 'block' }} textAlign="left">
                <Text fontSize="sm" fontWeight="medium" color="gray.900" lineHeight="short">
                  {userName}
                </Text>
                <Text fontSize="xs" color="gray.500" lineHeight="short">
                  {userRoleLabel}
                </Text>
              </Box>
            </HStack>
          </MenuButton>

          <MenuList
            minW="180px"
            maxW="calc(100vw - 32px)"
            p={0}
            rounded="xl"
            boxShadow="0 10px 40px rgba(0,0,0,0.1)"
            overflow="hidden"
          >
            <Box px={4} py={4}>
              <Text fontSize="sm" fontWeight="semibold" color="gray.900">
                {userName}
              </Text>
              <Text mt={1} fontSize="sm" color="gray.500">
                {userAccount}
              </Text>
              <Flex mt={3} gap={2} wrap="wrap">
                {roleBadges.map((badge, index) => (
                  <Box
                    key={typeof badge === 'string' ? badge : index}
                    px={2}
                    py={1}
                    bg={accentSoftBg}
                    color={accentColor}
                    fontSize="xs"
                    fontWeight="medium"
                    rounded="md"
                  >
                    {badge}
                  </Box>
                ))}
              </Flex>
            </Box>

            {actionItems.map((item) => (
              <MenuItem
                key={item.key}
                icon={item.icon}
                color="gray.700"
                onClick={item.onClick}
                _hover={{ bg: accentSoftBg, color: accentColor }}
              >
                <Flex w="full" align="center" justify="space-between" gap={3}>
                  <Text fontSize="sm">{item.label}</Text>
                  {item.isCurrent ? <CheckIcon color={accentColor} /> : null}
                </Flex>
              </MenuItem>
            ))}
            <Box px={4} py={2}>
              <Text fontSize="xs" color="gray.400">
                {roleSwitchLabel}
              </Text>
            </Box>

            {roleSwitchItems.map((item) => (
              <MenuItem
                key={item.key}
                icon={item.icon}
                color="gray.700"
                onClick={item.onClick}
                _hover={{ bg: accentSoftBg, color: accentColor }}
              >
                <Flex w="full" align="center" justify="space-between" gap={3}>
                  <Text fontSize="sm">{item.label}</Text>
                  {item.isCurrent ? <CheckIcon color={accentColor} /> : null}
                </Flex>
              </MenuItem>
            ))}

            <MenuItem
              icon={logoutIcon}
              color={accentColor}
              onClick={onLogout}
              _hover={{ bg: accentSoftBg, color: accentColor }}
            >
              {logoutLabel}
            </MenuItem>
          </MenuList>
        </>
      )}
    </Menu>
  );
}
