'use client';

import type { ReactNode } from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Flex, HStack, Link, Text } from '@chakra-ui/react';
import { Bookmark, Compass, FolderSearch, LibraryBig, Link2 } from 'lucide-react';

const plazaTabs = [
  { label: '广场首页', href: '/teacher/resource-plaza', icon: Compass },
  { label: '全部资源', href: '/teacher/resource-plaza/all', icon: FolderSearch },
  { label: '我的收藏', href: '/teacher/resource-plaza/favorites', icon: Bookmark },
  { label: '我的引用', href: '/teacher/resource-plaza/references', icon: Link2 }
] as const;

type PlazaScaffoldProps = {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function PlazaScaffold({
  title,
  description,
  eyebrow = '校本教学资源中心',
  actions,
  children
}: PlazaScaffoldProps) {
  const pathname = usePathname();

  return (
    <Box bg="#F6F7F9" minH="calc(100vh - 64px)" pb={{ base: 8, md: 12 }}>
      <Box
        bg="linear-gradient(135deg, #FFFFFF 0%, #FFF9F8 100%)"
        borderBottom="1px solid"
        borderColor="#E9EAEE"
        boxShadow="0 4px 18px rgba(16,24,40,.035)"
      >
        <Box maxW="1200px" mx="auto" px={{ base: 4, md: 6, xl: 0 }} py={{ base: 4, md: 5 }}>
          <Flex
            align={{ base: 'flex-start', md: 'center' }}
            justify="space-between"
            direction={{ base: 'column', md: 'row' }}
            gap={{ base: 4, md: 6 }}
          >
            <Flex align="center" gap={{ base: 3, md: 4 }} minW={0}>
              <Flex
                display={{ base: 'none', sm: 'flex' }}
                w="46px"
                h="46px"
                flexShrink={0}
                align="center"
                justify="center"
                color="#B4232D"
                bg="#FFF1F0"
                border="1px solid"
                borderColor="#FFE0DD"
                borderRadius="14px"
                boxShadow="0 8px 20px rgba(180,35,45,.08)"
              >
                <LibraryBig size={22} aria-hidden="true" />
              </Flex>
              <Box minW={0}>
                <HStack spacing={2}>
                  <Text color="#B4232D" fontSize="11px" fontWeight={700} letterSpacing="0.08em">
                    {eyebrow}
                  </Text>
                  <Box w="22px" h="1px" bg="#E8A1A5" />
                </HStack>
                <Flex
                  mt={0.5}
                  align={{ base: 'flex-start', md: 'baseline' }}
                  direction={{ base: 'column', md: 'row' }}
                  gap={{ base: 0.5, md: 3 }}
                >
                  <Text
                    as="h1"
                    flexShrink={0}
                    color="#182230"
                    fontSize={{ base: '23px', md: '27px' }}
                    fontWeight={750}
                    lineHeight="1.25"
                  >
                    {title}
                  </Text>
                  <Text color="#667085" fontSize={{ base: '12px', md: '13px' }} noOfLines={1}>
                    {description}
                  </Text>
                </Flex>
              </Box>
            </Flex>

            <Flex
              w={{ base: '100%', md: 'auto' }}
              align={{ base: 'stretch', sm: 'center' }}
              justify={{ md: 'flex-end' }}
              direction={{ base: 'column', sm: 'row' }}
              gap={3}
            >
              {actions}
              <HStack
                as="nav"
                aria-label="资源广场导航"
                spacing={1}
                p="4px"
                overflowX="auto"
                bg="#F5F6F8"
                border="1px solid"
                borderColor="#EAECF0"
                borderRadius="12px"
                sx={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
              >
                {plazaTabs.map((tab) => {
                  const isActive =
                    pathname === tab.href ||
                    (tab.href !== '/teacher/resource-plaza' &&
                      pathname?.startsWith(`${tab.href}/`));
                  const Icon = tab.icon;
                  return (
                    <Link
                      key={tab.href}
                      as={NextLink}
                      href={tab.href}
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      gap={1.5}
                      flexShrink={0}
                      minH="36px"
                      px={{ base: 2.5, md: 3 }}
                      color={isActive ? 'white' : '#475467'}
                      bg={isActive ? '#B4232D' : 'transparent'}
                      fontSize="13px"
                      fontWeight={isActive ? 600 : 500}
                      borderRadius="9px"
                      boxShadow={isActive ? '0 5px 12px rgba(180,35,45,.16)' : 'none'}
                      _hover={{
                        color: isActive ? 'white' : '#B4232D',
                        textDecoration: 'none',
                        bg: isActive ? '#9B1C26' : '#FFFFFF'
                      }}
                      _focusVisible={{ boxShadow: '0 0 0 3px rgba(180,35,45,.18)' }}
                    >
                      <Icon size={15} aria-hidden="true" />
                      {tab.label}
                    </Link>
                  );
                })}
              </HStack>
            </Flex>
          </Flex>
        </Box>
      </Box>

      <Box as="main" maxW="1200px" mx="auto" px={{ base: 4, md: 6, xl: 0 }} pt={6}>
        {children}
      </Box>
    </Box>
  );
}
