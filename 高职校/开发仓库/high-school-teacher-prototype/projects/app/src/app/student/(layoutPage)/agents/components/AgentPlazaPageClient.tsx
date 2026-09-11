'use client';

import { useDeferredValue, useEffect, useMemo, useState, type SVGProps } from 'react';
import NextLink from 'next/link';
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Link,
  Text,
  Image,
  Spinner,
  Tooltip
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTenantSceneNavbar, useAgentFilterList } from '@/student/hooks/agentPlaza';
import type { TenantAppResp } from '@/teacher/types/agentPlaza';
import { designTokens } from '@/theme/designTokens';

const PAGE_SIZE = 8;

const AVATAR_COLORS = [
  '#3B82F6',
  '#22C55E',
  '#6366F1',
  '#06B6D4',
  '#8B5CF6',
  '#EC4899',
  '#F43F5E',
  '#F59E0B',
  '#10B981',
  '#EF4444'
];

function getAvatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

const cardStyle = {
  bg: designTokens.colors.bgPrimary,
  border: `1px solid #F2F3F5`,
  borderRadius: '16px',
  boxShadow: '0 5px 8.8px 0 rgba(0, 0, 0, 0.05)'
} as const;

export function AgentPlazaPageClient() {
  const { t } = useTranslation('student');

  const { getSceneNavbar, isLoading: isSceneLoading, sceneList } = useTenantSceneNavbar();
  const { getAgentList, isLoading: isAgentLoading, agentList } = useAgentFilterList();

  const [keyword, setKeyword] = useState('');
  const [sceneId, setSceneId] = useState<number | 'all'>('all');
  const [labelId, setLabelId] = useState<number | 'all'>('all');
  const [page, setPage] = useState(1);
  const deferredKeyword = useDeferredValue(keyword);

  useEffect(() => {
    getSceneNavbar({ endpointType: '2' });
    getAgentList({ type: 2 });
  }, [getSceneNavbar, getAgentList]);

  useEffect(() => {
    const params: {
      type: number;
      tenantSceneId?: number;
      tenantLabelId?: number;
      searchKey?: string;
    } = { type: 2 };
    if (sceneId !== 'all') params.tenantSceneId = sceneId;
    if (labelId !== 'all') params.tenantLabelId = labelId;
    if (deferredKeyword.trim()) params.searchKey = deferredKeyword.trim();
    getAgentList(params);
    setPage(1);
  }, [sceneId, labelId, deferredKeyword, getAgentList]);

  const currentScene = useMemo(() => {
    if (sceneId === 'all') return undefined;
    return sceneList?.find((s) => s.id === sceneId);
  }, [sceneList, sceneId]);

  const currentLabels = useMemo(() => {
    if (sceneId === 'all') return [];
    return currentScene?.labels || [];
  }, [currentScene, sceneId]);

  const filteredAgentCount = agentList?.length ?? 0;
  const sceneCount = sceneList?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(filteredAgentCount / PAGE_SIZE));
  const pagedAgentList = useMemo(() => {
    return (agentList ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [agentList, page]);

  const currentFilterText = useMemo(() => {
    if (sceneId === 'all') return t('agents.sceneLabels.all');
    const sceneName = currentScene?.name || '';
    const labelName =
      labelId === 'all'
        ? t('agents.sceneLabels.all')
        : currentLabels.find((l) => l.id === labelId)?.name || '';
    return labelId === 'all' ? sceneName : `${sceneName} / ${labelName}`;
  }, [sceneId, labelId, currentScene, currentLabels, t]);

  const isLoading = isSceneLoading || isAgentLoading;

  return (
    <Box>
      {/* Hero */}
      <Flex gap="16px" mb={designTokens.spacing.lg} direction={{ base: 'column', md: 'row' }}>
        <HeroLeftCard title={t('agents.title')} description={t('agents.description')} />
        <HeroRightCard
          agentValue={String(filteredAgentCount)}
          agentLabel={t('agents.statLabels.agents')}
          sceneValue={String(sceneCount)}
          sceneLabel={t('agents.statLabels.scenes')}
        />
      </Flex>

      {/* Search */}
      <Box position="relative" mb="30px" w="50%">
        <Input
          placeholder={t('agents.searchPlaceholder')}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          h="40px"
          pl="20px"
          pr="76px"
          borderRadius="999px"
          bg="white"
          borderColor="#EEB2B5"
          fontSize="14px"
          color={designTokens.colors.textPrimary}
          _placeholder={{ color: '#86909C' }}
          _hover={{ borderColor: designTokens.colors.primary }}
          _focusVisible={{
            borderColor: designTokens.colors.primary,
            boxShadow: `0 0 0 1px ${designTokens.colors.primary}`
          }}
        />
        <Flex
          position="absolute"
          right="4px"
          top="50%"
          transform="translateY(-50%)"
          w="60px"
          h="32px"
          bg="#1D2129"
          borderRadius="999px"
          align="center"
          justify="center"
          color="white"
          cursor="pointer"
          _hover={{ bg: '#000' }}
          transition={designTokens.transitions.fast}
        >
          <SearchIcon width="16px" height="16px" />
        </Flex>
      </Box>

      {/* Category chips */}
      <Flex wrap="wrap" gap="8px" mb={designTokens.spacing.md}>
        <CategoryChip
          active={sceneId === 'all'}
          onClick={() => {
            setSceneId('all');
            setLabelId('all');
          }}
        >
          {t('agents.sceneLabels.all')}
        </CategoryChip>
        {sceneList?.map((scene) => (
          <CategoryChip
            key={scene.id}
            active={sceneId === scene.id}
            onClick={() => {
              setSceneId(scene.id);
              setLabelId('all');
            }}
          >
            {scene.name}
          </CategoryChip>
        ))}
      </Flex>

      {/* Sub-category tabs */}
      {sceneId === 'all' ? (
        <Box borderBottom="1px solid #E7E7E7" mb={designTokens.spacing.sm} />
      ) : currentLabels.length > 0 ? (
        <Flex
          align="center"
          gap="24px"
          py="12px"
          mb={designTokens.spacing.sm}
          borderTop="1px solid #E7E7E7"
          borderBottom="1px solid #E7E7E7"
        >
          <Text fontSize="14px" color={designTokens.colors.textTertiary}>
            {t('agents.subSceneLabel')}
          </Text>
          <SubTab active={labelId === 'all'} onClick={() => setLabelId('all')}>
            {t('agents.sceneLabels.all')}
          </SubTab>
          {currentLabels.map((label) => (
            <SubTab
              key={label.id}
              active={labelId === label.id}
              onClick={() => setLabelId(label.id)}
            >
              {label.name}
            </SubTab>
          ))}
        </Flex>
      ) : null}

      {/* Filter result row */}
      <Flex
        justify="space-between"
        align="center"
        py="12px"
        mb={designTokens.spacing.md}
        direction={{ base: 'column', md: 'row' }}
        gap="12px"
      >
        <Flex wrap="wrap" align="center" gap="6px" fontSize="14px">
          <Text color={designTokens.colors.textTertiary}>{t('agents.currentFilterLabel')}</Text>
          <Text
            color={designTokens.colors.primary}
            fontWeight={designTokens.typography.weight.medium}
          >
            {currentFilterText}
          </Text>
          <Text color={designTokens.colors.textTertiary}>
            （
            {(() => {
              const text = t('agents.resultCount', { count: filteredAgentCount });
              const num = String(filteredAgentCount);
              const i = text.indexOf(num);
              if (i === -1) return text;
              return (
                <>
                  {text.slice(0, i)}
                  <Text as="span" color={designTokens.colors.primary}>
                    {num}
                  </Text>
                  {text.slice(i + num.length)}
                </>
              );
            })()}
            ）
          </Text>
        </Flex>
        <Button
          variant="unstyled"
          h="32px"
          px="14px"
          bg="#F2F3F5"
          borderRadius="10px"
          fontSize="13px"
          color={designTokens.colors.textSecondary}
          display="inline-flex"
          alignItems="center"
          gap="4px"
          _hover={{ bg: '#E7E9EC', color: designTokens.colors.primary }}
          onClick={() => {
            setKeyword('');
            setSceneId('all');
            setLabelId('all');
            setPage(1);
          }}
          flexShrink={0}
        >
          <RefreshIcon width="14px" height="14px" />
          {t('agents.reset')}
        </Button>
      </Flex>

      {/* Loading */}
      {isLoading && (
        <Flex justify="center" py={10}>
          <Spinner size="lg" color={designTokens.colors.primary} />
        </Flex>
      )}

      {/* Grid */}
      {!isLoading && pagedAgentList.length > 0 && (
        <Box
          display="grid"
          gridTemplateColumns={{
            base: 'repeat(2, minmax(0, 1fr))',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(4, minmax(0, 1fr))',
            xl: 'repeat(4, minmax(0, 1fr))'
          }}
          gap="20px"
        >
          {pagedAgentList.map((item) => (
            <AgentCard key={item.id} item={item} sceneName={currentScene?.name} />
          ))}
        </Box>
      )}

      {/* Empty */}
      {!isLoading && filteredAgentCount === 0 && (
        <Flex justify="center" py={20}>
          <Text color={designTokens.colors.textTertiary} fontSize="16px">
            {t('agents.empty')}
          </Text>
        </Flex>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}
    </Box>
  );
}

function HeroLeftCard({ title, description }: { title: string; description: string }) {
  return (
    <Box
      flex="1"
      minH="120px"
      borderRadius="20px"
      position="relative"
      overflow="hidden"
      px="32px"
      py="24px"
    >
      <Image
        src="/imgs/agent-plaza-hero.png"
        alt="agent plaza hero"
        position="absolute"
        left="24px"
        top="50%"
        transform="translateY(-50%)"
        w="120px"
        h="120px"
        objectFit="contain"
        display={{ base: 'none', md: 'block' }}
      />
      <Box position="relative" pl={{ base: 0, md: '140px' }} zIndex={1}>
        <Text
          fontSize="22px"
          fontWeight={designTokens.typography.weight.semibold}
          color={designTokens.colors.primary}
          mb="6px"
        >
          {title}
        </Text>
        <Text fontSize="14px" color={designTokens.colors.textSecondary} lineHeight="1.6">
          {description}
        </Text>
      </Box>
    </Box>
  );
}

function HeroRightCard({
  agentValue,
  agentLabel,
  sceneValue,
  sceneLabel
}: {
  agentValue: string;
  agentLabel: string;
  sceneValue: string;
  sceneLabel: string;
}) {
  return (
    <Flex
      w={{ base: '100%', md: '400px' }}
      minH="120px"
      borderRadius="20px"
      bg="gray.50"
      border="1px solid #F2F3F5"
      align="center"
      justify="space-around"
      px="24px"
      py="20px"
      gap="16px"
    >
      <StatBlock icon="/imgs/agent-plaza-stat1.png" value={agentValue} label={agentLabel} />
      <Box w="1px" h="40px" bg="#ECECF6" />
      <StatBlock icon="/imgs/agent-plaza-stat2.png" value={sceneValue} label={sceneLabel} />
    </Flex>
  );
}

function StatBlock({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <Flex align="center" gap="12px" flex="1" justify="center">
      <Image src={icon} alt={label} w="44px" h="44px" objectFit="contain" />
      <Box textAlign="center">
        <Text
          fontSize="26px"
          fontWeight={designTokens.typography.weight.bold}
          color={designTokens.colors.textPrimary}
          lineHeight="1.1"
        >
          {value}
        </Text>
        <Text fontSize="13px" color={designTokens.colors.textTertiary} mt="2px">
          {label}
        </Text>
      </Box>
    </Flex>
  );
}

function CategoryChip({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      onClick={onClick}
      h="32px"
      px="16px"
      variant="unstyled"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      borderRadius="12px"
      fontSize="16px"
      fontWeight={
        active ? designTokens.typography.weight.semibold : designTokens.typography.weight.regular
      }
      bg={active ? '#FFECED' : 'white'}
      color={active ? designTokens.colors.primary : designTokens.colors.textSecondary}
      transition={designTokens.transitions.fast}
      _hover={{
        color: designTokens.colors.primary,
        bg: active ? '#FFECED' : '#FFF5F5'
      }}
    >
      {children}
    </Button>
  );
}

function SubTab({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      position="relative"
      py="4px"
      fontSize="14px"
      fontWeight={
        active ? designTokens.typography.weight.medium : designTokens.typography.weight.regular
      }
      color={active ? designTokens.colors.textPrimary : designTokens.colors.textSecondary}
      cursor="pointer"
      transition="color 0.15s ease"
      _hover={{ color: designTokens.colors.textPrimary }}
    >
      <Box as="span" position="relative" display="inline-block">
        {children}
        {active && (
          <Box as="span" position="absolute" right="-10px" bottom="-4px">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
            >
              <path
                d="M7.93107 1.25V1.66757C7.93107 5.35742 4.93985 8.34863 1.25 8.34863"
                stroke="#C8000B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function AgentCard({ item, sceneName }: { item: TenantAppResp; sceneName?: string }) {
  const { t } = useTranslation('student');
  const color = getAvatarColor(item.id);
  const hasAvatar = Boolean(item.avatarUrl);

  const tags = useMemo(() => {
    const result: string[] = [];
    if (item.labelList && item.labelList.length > 0) {
      item.labelList.forEach((labelItem) => {
        if (labelItem.tenantSceneName && !result.includes(labelItem.tenantSceneName)) {
          result.push(labelItem.tenantSceneName);
        }
        if (labelItem.tenantLabelName && !result.includes(labelItem.tenantLabelName)) {
          result.push(labelItem.tenantLabelName);
        }
      });
    }
    if (result.length === 0 && sceneName) {
      result.push(sceneName);
    }
    return result;
  }, [item, sceneName]);

  return (
    <Flex
      {...cardStyle}
      direction="column"
      align="center"
      textAlign="center"
      p="24px 20px"
      transition={designTokens.transitions.normal}
      _hover={{
        transform: 'translateY(-3px)',
        boxShadow: '0 12px 24px 0 rgba(0, 0, 0, 0.08)'
      }}
    >
      <Flex
        w="80px"
        h="80px"
        borderRadius="full"
        border="1px solid #E5E5E5"
        align="center"
        justify="center"
        flexShrink={0}
        bg={hasAvatar ? 'white' : color}
        color="white"
        overflow="hidden"
        mb="12px"
      >
        {hasAvatar ? (
          <Image src={item.avatarUrl} alt={item.name} w="full" h="full" objectFit="cover" />
        ) : (
          <Text fontSize="28px" fontWeight="bold">
            {item.name?.charAt(0) || '?'}
          </Text>
        )}
      </Flex>

      <Text
        fontSize="18px"
        fontWeight={designTokens.typography.weight.medium}
        color={designTokens.colors.textPrimary}
        mb="4px"
        noOfLines={1}
        w="full"
      >
        {item.name}
      </Text>

      {item.useUserCount != null && (
        <Flex align="center" gap="4px" mb="10px" color="#86909C">
          <UsersIcon width="12px" height="12px" />
          <Text fontSize="12px">
            {item.useUserCount}
            {t('agents.useUserCount')}
          </Text>
        </Flex>
      )}

      <Tooltip
        label={item.intro || ''}
        hasArrow
        placement="top"
        bg={designTokens.colors.complementary}
        color="white"
        borderRadius={designTokens.borderRadius.lg}
        fontSize="13px"
        fontFamily={designTokens.typography.fontFamily}
        px="12px"
        py="8px"
        lineHeight="1.5"
        maxW="280px"
        boxShadow={designTokens.shadows.lg}
        isDisabled={!item.intro}
      >
        <Text
          fontSize="13px"
          color="#4E5969"
          lineHeight="1.6"
          display="-webkit-box"
          mb="12px"
          minH="42px"
          sx={{
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {item.intro || ''}
        </Text>
      </Tooltip>

      {tags.length > 0 && (
        <HStack spacing="8px" mb="16px" wrap="wrap" justify="center">
          {tags.slice(0, 3).map((text) => (
            <Tag key={text} text={text} />
          ))}
        </HStack>
      )}

      <Link
        as={NextLink}
        href={item.id ? `/chat?appId=${item.id}` : '#'}
        _hover={{ textDecoration: 'none' }}
        w="full"
        mt="auto"
      >
        <Button
          w="full"
          h="40px"
          bg="#1D2129"
          color="white"
          borderRadius="12px"
          fontSize="14px"
          fontWeight={designTokens.typography.weight.medium}
          _hover={{ bg: '#000' }}
          _active={{ bg: '#000' }}
        >
          {t('agents.actions.use')}
        </Button>
      </Link>
    </Flex>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <Flex
      align="center"
      px="8px"
      py="3px"
      borderRadius="6px"
      bg="#F2F3F5"
      color={designTokens.colors.textSecondary}
      fontSize="12px"
    >
      <Text>{text}</Text>
    </Flex>
  );
}

function Pagination({
  page,
  totalPages,
  onChange
}: {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
}) {
  const pages = useMemo(() => buildPageList(page, totalPages), [page, totalPages]);

  return (
    <Flex justify="center" align="center" gap="8px" mt="32px">
      <PageButton
        disabled={page <= 1}
        onClick={() => onChange(Math.max(1, page - 1))}
        aria-label="prev"
      >
        <ChevronIcon width="14px" height="14px" />
      </PageButton>
      {pages.map((p, idx) =>
        p === '…' ? (
          <Text key={`gap-${idx}`} color="#86909C" px="4px">
            ···
          </Text>
        ) : (
          <PageButton key={p} active={p === page} onClick={() => onChange(p)}>
            {p}
          </PageButton>
        )
      )}
      <PageButton
        disabled={page >= totalPages}
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        aria-label="next"
      >
        <ChevronIcon width="14px" height="14px" style={{ transform: 'rotate(180deg)' }} />
      </PageButton>
    </Flex>
  );
}

function buildPageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const result: (number | '…')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) result.push('…');
  for (let i = start; i <= end; i++) result.push(i);
  if (end < total - 1) result.push('…');
  result.push(total);
  return result;
}

function PageButton({
  children,
  active,
  disabled,
  onClick,
  ...rest
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  ['aria-label']?: string;
}) {
  return (
    <Button
      onClick={onClick}
      isDisabled={disabled}
      variant="unstyled"
      w="36px"
      h="36px"
      minW="36px"
      borderRadius="8px"
      fontSize="14px"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      bg={active ? '#1D2129' : 'transparent'}
      color={active ? 'white' : designTokens.colors.textSecondary}
      _hover={{
        bg: active ? '#1D2129' : '#F2F3F5'
      }}
      transition={designTokens.transitions.fast}
      {...rest}
    >
      {children}
    </Button>
  );
}

function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <path d="M9.5 12v-1a2 2 0 0 0-2-2h-3a2 2 0 0 0-2 2v1" />
      <circle cx="6" cy="5" r="2" />
      <path d="M11.5 12v-1a2 2 0 0 0-1.5-1.9" />
      <path d="M9 3a2 2 0 0 1 0 4" />
    </svg>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function RefreshIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 12a9 9 0 0 0 15.3 6.4L21 16" />
      <path d="M21 12A9 9 0 0 0 5.7 5.6L3 8" />
      <path d="M8 8H3V3" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

function ChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
