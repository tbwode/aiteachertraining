'use client';

import Link from 'next/link';
import { Box, Flex, Heading, Link as ChakraLink, SimpleGrid, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { AdminIcon } from '@/app/admin/components/AdminIcon';
import { useAdminPageI18n } from '@/app/admin/components/AdminI18nProvider';
import { getTeachingModuleBySlug } from '@/app/admin/_config/adminConfig';

export default function TeachingModulePageClient({ moduleSlug }: { moduleSlug: string }) {
  const isI18nReady = useAdminPageI18n(['teaching']);
  const { t } = useTranslation('admin');
  const currentModule = getTeachingModuleBySlug(moduleSlug);

  if (!isI18nReady || !currentModule) {
    return null;
  }

  return (
    <Box className="TeachingModulePageClient">
      <Box
        className="teaching-module-hero"
        px={{ base: 5, md: 8 }}
        py={{ base: 6, md: 8 }}
        rounded="28px"
        borderWidth="1px"
        borderColor="blackAlpha.100"
        bg="rgba(255,255,255,0.88)"
        boxShadow="0 24px 60px rgba(15, 23, 42, 0.08)"
      >
        <Flex align="center" gap={2} color="#C83E3E" fontSize="13px" fontWeight="700">
          <span>{t('teaching.common.breadcrumbRoot')}</span>
          <span>/</span>
          <span>{t(currentModule.titleKey)}</span>
        </Flex>
        <Heading mt={3} size="2xl" lineHeight="1.1">
          {t(currentModule.titleKey)}
        </Heading>
        <Text mt={4} color="gray.500" fontSize="15px" lineHeight="1.8">
          {t(currentModule.descriptionKey)}
          {t('teaching.modulePage.heroSuffix')}
        </Text>
        <Flex mt={7} gap={3.5} wrap="wrap">
          <ChakraLink
            as={Link}
            href="/admin"
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
            {t('teaching.modulePage.backHome')}
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
            {t('teaching.modulePage.toTeacher')}
          </ChakraLink>
        </Flex>
      </Box>

      <SimpleGrid mt={5} columns={{ base: 1, xl: 2 }} spacing={5}>
        <Box
          px={6}
          py={6}
          rounded="24px"
          borderWidth="1px"
          borderColor="blackAlpha.100"
          bg="rgba(255,255,255,0.88)"
          boxShadow="0 24px 60px rgba(15, 23, 42, 0.08)"
        >
          <Heading size="md">{t('teaching.modulePage.structure.title')}</Heading>
          <Box as="ul" mt={4.5} pl={4.5} color="gray.500">
            <li>{t('teaching.modulePage.structure.filters')}</li>
            <li>{t('teaching.modulePage.structure.list')}</li>
            <li>{t('teaching.modulePage.structure.editor')}</li>
            <li>{t('teaching.modulePage.structure.bulk')}</li>
          </Box>
        </Box>

        <Box
          px={6}
          py={6}
          rounded="24px"
          borderWidth="1px"
          borderColor="blackAlpha.100"
          bg="rgba(255,255,255,0.88)"
          boxShadow="0 24px 60px rgba(15, 23, 42, 0.08)"
        >
          <Heading size="md">{t('teaching.modulePage.positioning.title')}</Heading>
          <Text mt={3} color="gray.500">
            {t('teaching.modulePage.positioning.category', { value: t(currentModule.categoryKey) })}
          </Text>
          <Text mt={2} color="gray.500">
            {t('teaching.modulePage.positioning.route', { value: currentModule.href })}
          </Text>
          <Text mt={2} color="gray.500">
            {t('teaching.modulePage.positioning.status')}
          </Text>
          <Flex
            mt={4.5}
            w="42px"
            h="42px"
            align="center"
            justify="center"
            rounded="14px"
            color="#C83E3E"
            bg="#FEF2F2"
          >
            <AdminIcon name={currentModule.icon} />
          </Flex>
        </Box>
      </SimpleGrid>
    </Box>
  );
}
