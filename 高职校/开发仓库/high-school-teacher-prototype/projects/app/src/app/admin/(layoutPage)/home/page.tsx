'use client';

import Link from 'next/link';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  Link as ChakraLink,
  SimpleGrid,
  Stack,
  Text
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { AdminIcon } from '@/app/admin/components/AdminIcon';
import { useAdminPageI18n } from '@/app/admin/components/AdminI18nProvider';
import {
  adminHighlights,
  adminOverviewStats,
  teachingModuleCards
} from '@/app/admin/_config/adminConfig';

const accentMap = {
  orange: ['#F59E0B', '#FB923C'],
  red: ['#C83E3E', '#E85A5A'],
  violet: ['#7C3AED', '#A855F7'],
  teal: ['#0F766E', '#14B8A6'],
  blue: ['#2563EB', '#38BDF8'],
  indigo: ['#4F46E5', '#6366F1'],
  pink: ['#DB2777', '#F472B6'],
  gold: ['#D97706', '#F59E0B']
} as const;

export default function AdminHomePage() {
  const isI18nReady = useAdminPageI18n(['home']);
  const { t } = useTranslation('admin');

  if (!isI18nReady) {
    return null;
  }

  return (
    <Stack spacing={7}>
      <Box
        position="relative"
        overflow="hidden"
        px={{ base: 5, md: 9 }}
        py={{ base: 6, md: 9 }}
        rounded="28px"
        borderWidth="1px"
        borderColor="blackAlpha.100"
        bg="rgba(255,255,255,0.88)"
        boxShadow="0 24px 60px rgba(15, 23, 42, 0.08)"
      >
        <Box
          position="absolute"
          right="-60px"
          top="-60px"
          w="220px"
          h="220px"
          rounded="full"
          bg="radial-gradient(circle, rgba(200, 62, 62, 0.18) 0%, transparent 70%)"
        />
        <Text
          color="#C83E3E"
          fontSize="12px"
          fontWeight="700"
          letterSpacing="0.08em"
          textTransform="uppercase"
        >
          {t('home.hero.eyebrow')}
        </Text>
        <Heading mt={3} size="2xl" lineHeight="1.1">
          {t('home.hero.title')}
        </Heading>
        <Text mt={4} maxW="760px" color="gray.500" fontSize="15px" lineHeight="1.8">
          {t('home.hero.description')}
        </Text>
        <Flex mt={7} gap={3.5} wrap="wrap">
          <ChakraLink
            as={Link}
            href="/admin/teaching/tasks"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            minH="46px"
            px={5}
            rounded="full"
            color="white"
            fontSize="14px"
            fontWeight="700"
            textDecoration="none"
            bgGradient="linear(to-br, #C83E3E, #E45A4F)"
            _hover={{ textDecoration: 'none' }}
          >
            {t('home.hero.primaryAction')}
          </ChakraLink>
          <ChakraLink
            as={Link}
            href="/teacher"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            minH="46px"
            px={5}
            rounded="full"
            color="gray.800"
            fontSize="14px"
            fontWeight="700"
            textDecoration="none"
            bg="white"
            borderWidth="1px"
            borderColor="blackAlpha.100"
            _hover={{ textDecoration: 'none' }}
          >
            {t('home.hero.secondaryAction')}
          </ChakraLink>
        </Flex>
      </Box>

      <Box>
        <Heading size="lg">{t('home.overview.title')}</Heading>
        <Text mt={2} color="gray.500">
          {t('home.overview.description')}
        </Text>
        <SimpleGrid mt={5} columns={{ base: 1, md: 2, xl: 4 }} spacing={4.5}>
          {adminOverviewStats.map((item) => (
            <Box
              key={item.key}
              px={5.5}
              py={5.5}
              rounded="22px"
              borderWidth="1px"
              borderColor="blackAlpha.100"
              bg="rgba(255,255,255,0.88)"
              boxShadow="0 24px 60px rgba(15, 23, 42, 0.08)"
            >
              <Text color="#C83E3E" fontSize="36px" fontWeight="800" lineHeight="1">
                {item.value}
              </Text>
              <Text mt={2.5} fontSize="14px" fontWeight="700">
                {t(item.labelKey)}
              </Text>
              <Text mt={2} color="gray.500" fontSize="13px" lineHeight="1.6">
                {t(item.hintKey)}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Box>
        <Heading size="lg">{t('home.highlights.title')}</Heading>
        <Text mt={2} color="gray.500">
          {t('home.highlights.description')}
        </Text>
        <SimpleGrid mt={5} columns={{ base: 1, md: 2, xl: 3 }} spacing={4.5}>
          {adminHighlights.map((item) => (
            <Box
              key={item.key}
              px={5.5}
              py={5.5}
              rounded="24px"
              borderWidth="1px"
              borderColor="blackAlpha.100"
              bg="rgba(255,255,255,0.88)"
              boxShadow="0 24px 60px rgba(15, 23, 42, 0.08)"
            >
              <Flex
                w="42px"
                h="42px"
                align="center"
                justify="center"
                rounded="14px"
                color="#C83E3E"
                bg="#FEF2F2"
              >
                <AdminIcon name={item.icon} />
              </Flex>
              <Heading mt={4} size="md">
                {t(item.titleKey)}
              </Heading>
              <Text mt={2.5} color="gray.500" fontSize="14px" lineHeight="1.7">
                {t(item.descriptionKey)}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Box>
        <Heading size="lg">{t('home.modules.title')}</Heading>
        <Text mt={2} color="gray.500">
          {t('home.modules.description')}
        </Text>
        <Grid
          mt={5}
          templateColumns={{
            base: '1fr',
            md: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(3, minmax(0, 1fr))'
          }}
          gap={4.5}
        >
          {teachingModuleCards.map((item) => (
            <GridItem
              key={item.href}
              colSpan={{ base: 1, md: item.featured ? 2 : 1, xl: item.featured ? 2 : 1 }}
            >
              <ChakraLink
                as={Link}
                href={item.href}
                display="flex"
                flexDirection="column"
                minH="100%"
                px={5.5}
                py={5.5}
                rounded="24px"
                borderWidth="1px"
                borderColor="blackAlpha.100"
                bg="rgba(255,255,255,0.88)"
                boxShadow="0 24px 60px rgba(15, 23, 42, 0.08)"
                textDecoration="none"
                color="inherit"
                transition="transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease"
                _hover={{
                  transform: 'translateY(-4px)',
                  borderColor: 'rgba(200, 62, 62, 0.22)',
                  boxShadow: '0 28px 56px rgba(15, 23, 42, 0.12)',
                  textDecoration: 'none'
                }}
              >
                <Flex align="flex-start" justify="space-between" gap={4}>
                  <Flex
                    w="52px"
                    h="52px"
                    align="center"
                    justify="center"
                    rounded="18px"
                    color="white"
                    bgGradient={`linear(to-br, ${accentMap[item.accent][0]}, ${accentMap[item.accent][1]})`}
                  >
                    <AdminIcon name={item.icon} />
                  </Flex>
                  <Text
                    display="inline-flex"
                    alignItems="center"
                    minH="28px"
                    px={2.5}
                    rounded="full"
                    bg="blackAlpha.50"
                    color="gray.600"
                    fontSize="12px"
                    fontWeight="700"
                  >
                    {t(item.categoryKey, item.categoryKey)}
                  </Text>
                </Flex>
                <Heading mt={4} size="md">
                  {t(item.titleKey, item.titleKey)}
                </Heading>
                <Text mt={2.5} color="gray.500" fontSize="14px" lineHeight="1.7">
                  {t(item.descriptionKey, item.descriptionKey)}
                </Text>
                <Flex
                  mt="auto"
                  pt={4.5}
                  align="center"
                  gap={2}
                  color="#C83E3E"
                  fontSize="14px"
                  fontWeight="700"
                >
                  {t('home.modules.viewModule')}
                  <AdminIcon name="arrow-right" />
                </Flex>
              </ChakraLink>
            </GridItem>
          ))}
        </Grid>
      </Box>
    </Stack>
  );
}
