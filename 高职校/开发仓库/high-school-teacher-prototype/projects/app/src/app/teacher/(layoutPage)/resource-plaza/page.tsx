'use client';

import { useCallback, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  Skeleton,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react';
import {
  ArrowRight,
  BookMarked,
  Bookmark,
  Building2,
  CalendarDays,
  ChevronRight,
  Flame,
  Search,
  Sparkles
} from 'lucide-react';
import {
  getResourcePlazaHome,
  toggleResourceFavorite,
  type PlazaResourceVO,
  type ResourcePlazaHomeVO,
  type ResourceRankingVO,
  type ResourceSort
} from '@/api/teacher/resource/resource-plaza';
import PlazaScaffold from './components/PlazaScaffold';
import { getCategoryStyle } from './components/resourceVisuals';

const emptyHome: ResourcePlazaHomeVO = {
  categories: [],
  rankings: [],
  stats: { resourceCount: 0, categoryCount: 0, newThisWeek: 0, referenceCount: 0 }
};

const compactNumber = (value: number) =>
  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);

function CategoryRankingCard({
  ranking,
  onToggleFavorite
}: {
  ranking: ResourceRankingVO;
  onToggleFavorite: (resource: PlazaResourceVO) => Promise<void>;
}) {
  const [sort, setSort] = useState<ResourceSort>('hot');
  const resources = sort === 'hot' ? ranking.hotResources : ranking.latestResources;
  const style = getCategoryStyle(ranking.category.id);
  const Icon = style.icon;

  return (
    <Box
      overflow="hidden"
      bg="white"
      border="1px solid"
      borderColor="#E4E7EC"
      borderRadius="18px"
      boxShadow="0 8px 26px rgba(16,24,40,.045)"
      transition="border-color .2s ease, box-shadow .2s ease"
      _hover={{ borderColor: style.glow, boxShadow: '0 14px 34px rgba(16,24,40,.075)' }}
    >
      <Flex
        align="center"
        justify="space-between"
        gap={3}
        px={{ base: 4, md: 5 }}
        py={4}
        bg={`linear-gradient(135deg, ${style.bg} 0%, #FFFFFF 72%)`}
        borderBottom="1px solid"
        borderColor="#EEF0F3"
      >
        <HStack spacing={3} minW={0}>
          <Flex
            w="40px"
            h="40px"
            flexShrink={0}
            align="center"
            justify="center"
            color={style.color}
            bg="white"
            border="1px solid"
            borderColor={style.glow}
            borderRadius="12px"
            boxShadow="0 5px 14px rgba(16,24,40,.06)"
          >
            <Icon size={20} aria-hidden="true" />
          </Flex>
          <Box minW={0}>
            <Text color="#182230" fontSize="16px" fontWeight={700} noOfLines={1}>
              {ranking.category.name}
            </Text>
            <Text mt={0.5} color="#98A2B3" fontSize="11px">
              {ranking.category.resourceCount ?? resources.length} 份校内共享资源
            </Text>
          </Box>
        </HStack>

        <HStack
          role="tablist"
          aria-label={`${ranking.category.name}排行榜排序`}
          flexShrink={0}
          spacing={0.5}
          p="3px"
          bg="rgba(255,255,255,.78)"
          border="1px solid"
          borderColor="#E4E7EC"
          borderRadius="10px"
        >
          {[
            { value: 'latest' as const, label: '最新' },
            { value: 'hot' as const, label: '最热' }
          ].map((option) => {
            const selected = sort === option.value;
            return (
              <Button
                key={option.value}
                role="tab"
                aria-selected={selected}
                h="28px"
                minW="50px"
                px={2.5}
                borderRadius="7px"
                bg={selected ? style.color : 'transparent'}
                color={selected ? 'white' : '#667085'}
                fontSize="12px"
                fontWeight={600}
                onClick={() => setSort(option.value)}
                _hover={{
                  bg: selected ? style.color : style.bg,
                  color: selected ? 'white' : style.color
                }}
                _focusVisible={{ boxShadow: `0 0 0 3px ${style.glow}` }}
              >
                {option.label}
              </Button>
            );
          })}
        </HStack>
      </Flex>

      <Stack spacing={0} px={{ base: 3, md: 4 }} py={2}>
        {resources.slice(0, 5).map((resource, index) => (
          <Flex
            key={resource.id}
            align="center"
            gap={3}
            minH="64px"
            py={2.5}
            borderBottom={index < Math.min(resources.length, 5) - 1 ? '1px solid' : 'none'}
            borderColor="#F0F2F5"
          >
            <Flex
              w="28px"
              h="28px"
              flexShrink={0}
              align="center"
              justify="center"
              color={index < 3 ? style.color : '#98A2B3'}
              bg={index < 3 ? style.bg : '#F8F9FB'}
              borderRadius="9px"
              fontSize="12px"
              fontWeight={800}
            >
              {String(index + 1).padStart(2, '0')}
            </Flex>
            <Box minW={0} flex="1">
              <Link
                as={NextLink}
                href={`/teacher/resource-plaza/detail?id=${resource.id}`}
                display="block"
                color="#344054"
                fontSize="13px"
                fontWeight={650}
                noOfLines={1}
                _hover={{ color: style.color, textDecoration: 'none' }}
                _focusVisible={{ boxShadow: `0 0 0 3px ${style.glow}` }}
              >
                {resource.title}
              </Link>
              <HStack mt={1} spacing={2} color="#98A2B3" fontSize="11px">
                <Text noOfLines={1}>{resource.uploaderName}</Text>
                <Text>·</Text>
                <Text>{resource.fileFormat}</Text>
              </HStack>
            </Box>
            <HStack flexShrink={0} spacing={1.5} color={sort === 'hot' ? '#B4232D' : '#667085'}>
              {sort === 'hot' ? (
                <Flame size={14} aria-hidden="true" />
              ) : (
                <CalendarDays size={14} aria-hidden="true" />
              )}
              <Text minW="42px" fontSize="11px" fontWeight={600} textAlign="right">
                {sort === 'hot'
                  ? compactNumber(resource.hotScore)
                  : resource.publishTime.slice(5, 10)}
              </Text>
              <Button
                aria-label={`${resource.isFavorite ? '取消收藏' : '收藏'}${resource.title}`}
                title={resource.isFavorite ? '取消收藏' : '收藏'}
                minW="30px"
                h="30px"
                p={0}
                borderRadius="8px"
                variant="ghost"
                color={resource.isFavorite ? '#B4232D' : '#98A2B3'}
                onClick={() => void onToggleFavorite(resource)}
                _hover={{ color: '#B4232D', bg: '#FFF1F0' }}
                _focusVisible={{ boxShadow: '0 0 0 3px rgba(180,35,45,.18)' }}
              >
                <Bookmark size={15} fill={resource.isFavorite ? 'currentColor' : 'none'} />
              </Button>
            </HStack>
          </Flex>
        ))}
      </Stack>

      <Link
        as={NextLink}
        href={`/teacher/resource-plaza/all?categoryId=${ranking.category.id}&sort=${sort}`}
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap={1}
        minH="42px"
        color={style.color}
        bg="#FCFCFD"
        borderTop="1px solid"
        borderColor="#EEF0F3"
        fontSize="12px"
        fontWeight={650}
        _hover={{ bg: style.bg, textDecoration: 'none' }}
        _focusVisible={{ boxShadow: `inset 0 0 0 3px ${style.glow}` }}
      >
        查看全部{ranking.category.name}
        <ChevronRight size={14} aria-hidden="true" />
      </Link>
    </Box>
  );
}

export default function ResourcePlazaHomePage() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<ResourcePlazaHomeVO>(emptyHome);
  const [loading, setLoading] = useState(true);
  const [searchKey, setSearchKey] = useState('');

  const loadHome = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getResourcePlazaHome();
      setData(response);
    } catch {
      toast({ title: '资源广场加载失败', status: 'error', position: 'top' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  const handleSearch = () => {
    const query = searchKey.trim();
    router.push(
      `/teacher/resource-plaza/all${query ? `?searchKey=${encodeURIComponent(query)}` : ''}`
    );
  };

  const handleToggleFavorite = async (resource: PlazaResourceVO) => {
    const response = await toggleResourceFavorite(resource.id);
    setData((current) => ({
      ...current,
      rankings: current.rankings.map((ranking) => ({
        ...ranking,
        hotResources: ranking.hotResources.map((item) =>
          item.id === resource.id
            ? {
                ...item,
                isFavorite: response.isFavorite,
                favoriteCount: Math.max(0, item.favoriteCount + (response.isFavorite ? 1 : -1))
              }
            : item
        ),
        latestResources: ranking.latestResources.map((item) =>
          item.id === resource.id
            ? {
                ...item,
                isFavorite: response.isFavorite,
                favoriteCount: Math.max(0, item.favoriteCount + (response.isFavorite ? 1 : -1))
              }
            : item
        )
      }))
    }));
    toast({
      title: response.isFavorite ? '已收藏' : '已取消收藏',
      status: 'success',
      duration: 1200,
      position: 'top'
    });
  };

  return (
    <PlazaScaffold
      title="资源广场"
      description="发现学校共享的优质资源，快速应用到课程和 AI 教师分身"
    >
      <Box
        position="relative"
        overflow="hidden"
        borderRadius={{ base: '18px', md: '22px' }}
        px={{ base: 5, md: 8 }}
        py={{ base: 7, md: 9 }}
        bg="linear-gradient(120deg, #46151A 0%, #861F29 52%, #B4232D 100%)"
        color="white"
        boxShadow="0 18px 48px rgba(95,22,30,.20)"
      >
        <Box
          position="absolute"
          right="-60px"
          top="-100px"
          w="300px"
          h="300px"
          borderRadius="50%"
          bg="rgba(255,255,255,.09)"
        />
        <Box
          position="absolute"
          left="38%"
          bottom="-150px"
          w="260px"
          h="260px"
          borderRadius="50%"
          bg="rgba(255,204,188,.10)"
        />
        <Flex
          position="relative"
          direction={{ base: 'column', lg: 'row' }}
          align={{ lg: 'center' }}
          justify="space-between"
          gap={6}
        >
          <Box maxW="590px">
            <HStack spacing={2} color="#FFD8D2">
              <Sparkles size={16} aria-hidden="true" />
              <Text fontSize="12px" fontWeight={700} letterSpacing=".08em">
                校本优质资源共享
              </Text>
            </HStack>
            <Text mt={3} fontSize={{ base: '25px', md: '34px' }} lineHeight="1.25" fontWeight={800}>
              找到好资源，让备课更高效
            </Text>
            <Text
              mt={3}
              color="whiteAlpha.800"
              fontSize={{ base: '13px', md: '14px' }}
              lineHeight="1.8"
            >
              聚合校本资源、教师共享与 AI 生成内容，支持在线预览、收藏、下载和教学引用。
            </Text>
          </Box>
          <Box w={{ base: '100%', lg: '430px' }}>
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none">
                <Search size={19} color="#667085" aria-hidden="true" />
              </InputLeftElement>
              <Input
                aria-label="搜索资源"
                value={searchKey}
                onChange={(event) => setSearchKey(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                placeholder="搜索资源、课程、知识点或上传人"
                h="52px"
                pr="92px"
                bg="white"
                color="#182230"
                border="none"
                borderRadius="14px"
                _placeholder={{ color: '#98A2B3', fontSize: '13px' }}
                _focusVisible={{ boxShadow: '0 0 0 4px rgba(255,255,255,.25)' }}
              />
              <Button
                position="absolute"
                zIndex={2}
                right="5px"
                top="5px"
                h="42px"
                px={5}
                borderRadius="10px"
                bg="#182230"
                color="white"
                onClick={handleSearch}
                _hover={{ bg: '#101828' }}
              >
                搜索
              </Button>
            </InputGroup>
          </Box>
        </Flex>

        <Grid
          position="relative"
          mt={7}
          templateColumns={{ base: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }}
          gap={3}
        >
          {[
            { label: '共享资源', value: data.stats.resourceCount, suffix: '份', icon: Building2 },
            { label: '资源类型', value: data.stats.categoryCount, suffix: '类', icon: BookMarked },
            { label: '本周新增', value: data.stats.newThisWeek, suffix: '份', icon: Sparkles },
            { label: '我的引用', value: data.stats.referenceCount, suffix: '次', icon: ArrowRight }
          ].map((item) => (
            <Flex
              key={item.label}
              p={3}
              borderRadius="12px"
              bg="rgba(255,255,255,.10)"
              align="center"
              gap={3}
            >
              <item.icon size={18} color="#FFD8D2" aria-hidden="true" />
              <Box>
                <Text fontSize="11px" color="whiteAlpha.700">
                  {item.label}
                </Text>
                <Text mt={0.5} fontSize="17px" fontWeight={800}>
                  {loading ? '--' : item.value}
                  <Text as="span" ml={1} fontSize="11px" fontWeight={500}>
                    {item.suffix}
                  </Text>
                </Text>
              </Box>
            </Flex>
          ))}
        </Grid>
      </Box>

      <Box mt={8}>
        <Flex align="center" justify="space-between" gap={4} mb={4}>
          <Box>
            <Text as="h2" fontSize="20px" fontWeight={700} color="#182230">
              按资源类型浏览
            </Text>
            <Text mt={1} fontSize="13px" color="#667085">
              类型由学校统一配置，选择频道快速进入
            </Text>
          </Box>
          <Link
            as={NextLink}
            href="/teacher/resource-plaza/all"
            color="#B4232D"
            fontSize="13px"
            fontWeight={600}
          >
            全部资源
          </Link>
        </Flex>
        <Grid
          templateColumns={{ base: 'repeat(2,1fr)', md: 'repeat(3,1fr)', lg: 'repeat(6,1fr)' }}
          gap={3}
        >
          {(loading ? Array.from({ length: 6 }) : data.categories).map((category, index) => {
            if (loading) return <Skeleton key={index} h="118px" borderRadius="14px" />;
            const style = getCategoryStyle(category.id);
            const Icon = style.icon;
            return (
              <Link
                key={category.id}
                as={NextLink}
                href={`/teacher/resource-plaza/all?categoryId=${category.id}`}
                p={4}
                minH="118px"
                bg="white"
                border="1px solid"
                borderColor="#E4E7EC"
                borderRadius="14px"
                _hover={{
                  textDecoration: 'none',
                  borderColor: style.color,
                  boxShadow: '0 10px 24px rgba(15,23,42,.08)',
                  transform: 'translateY(-2px)'
                }}
                _focusVisible={{ boxShadow: `0 0 0 3px ${style.glow}` }}
                transition="all .2s ease"
              >
                <Flex
                  w="38px"
                  h="38px"
                  borderRadius="11px"
                  bg={style.bg}
                  color={style.color}
                  align="center"
                  justify="center"
                >
                  <Icon size={20} aria-hidden="true" />
                </Flex>
                <Text mt={3} color="#182230" fontSize="14px" fontWeight={700}>
                  {category.name}
                </Text>
                <Text mt={0.5} color="#98A2B3" fontSize="11px">
                  {category.resourceCount ?? 0} 份资源
                </Text>
              </Link>
            );
          })}
        </Grid>
      </Box>

      <Box mt={10}>
        <Flex
          align={{ base: 'flex-start', md: 'center' }}
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          gap={3}
          mb={5}
        >
          <Box>
            <HStack spacing={2}>
              <Flame size={20} color="#B4232D" aria-hidden="true" />
              <Text as="h2" fontSize="20px" fontWeight={700} color="#182230">
                分类资源排行榜
              </Text>
            </HStack>
            <Text mt={1} color="#667085" fontSize="13px">
              每种资源均可独立查看最新发布与近 7 天热门排行
            </Text>
          </Box>
          <HStack spacing={3} color="#667085" fontSize="11px">
            <HStack spacing={1}>
              <CalendarDays size={14} aria-hidden="true" />
              <Text>最新按发布时间排序</Text>
            </HStack>
            <HStack spacing={1}>
              <Flame size={14} color="#B4232D" aria-hidden="true" />
              <Text>最热按行为热度排序</Text>
            </HStack>
          </HStack>
        </Flex>

        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }} gap={5}>
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} h="390px" borderRadius="18px" />
              ))
            : data.rankings.map((ranking) => (
                <CategoryRankingCard
                  key={ranking.category.id}
                  ranking={ranking}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
        </Grid>
      </Box>
    </PlazaScaffold>
  );
}
