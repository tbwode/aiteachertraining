'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Skeleton,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  SlidersHorizontal,
  X
} from 'lucide-react';
import {
  getFavoriteResourcePage,
  getResourcePlazaCategories,
  getResourcePlazaPage,
  toggleResourceFavorite,
  type PlazaResourceVO,
  type ResourceCategoryVO,
  type ResourcePageRequest,
  type ResourceSort,
  type ResourceSourceType
} from '@/api/teacher/resource/resource-plaza';
import PlazaScaffold from './PlazaScaffold';
import ResourceCard from './ResourceCard';

type ListMode = 'all' | 'favorites';

const initialFilters = {
  categoryId: '',
  majorName: '',
  courseName: '',
  fileFormat: '',
  sourceType: '',
  uploaderName: '',
  publishWindow: ''
};

const sourceOptions: Array<{ value: ResourceSourceType; label: string }> = [
  { value: 'teacher', label: '教师上传' },
  { value: 'school', label: '校本资源库' },
  { value: 'ai', label: 'AI 资源库' }
];

export default function ResourceListClient({ mode }: { mode: ListMode }) {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [categories, setCategories] = useState<ResourceCategoryVO[]>([]);
  const [resources, setResources] = useState<PlazaResourceVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKey, setSearchKey] = useState(() => searchParams?.get('searchKey') ?? '');
  const [appliedSearchKey, setAppliedSearchKey] = useState(
    () => searchParams?.get('searchKey') ?? ''
  );
  const [sort, setSort] = useState<ResourceSort>(() =>
    searchParams?.get('sort') === 'hot' ? 'hot' : 'latest'
  );
  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
    categoryId: searchParams?.get('categoryId') ?? ''
  }));
  const [pageIndex, setPageIndex] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 9;

  useEffect(() => {
    getResourcePlazaCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const request = useMemo<ResourcePageRequest>(
    () => ({
      current: pageIndex,
      size: pageSize,
      searchKey: appliedSearchKey || undefined,
      categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
      majorName: filters.majorName || undefined,
      courseName: filters.courseName || undefined,
      fileFormat: filters.fileFormat || undefined,
      sourceType: (filters.sourceType || undefined) as ResourceSourceType | undefined,
      uploaderName: filters.uploaderName || undefined,
      publishWindow: filters.publishWindow ? Number(filters.publishWindow) : undefined,
      sort
    }),
    [appliedSearchKey, filters, pageIndex, sort]
  );

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const response =
        mode === 'favorites'
          ? await getFavoriteResourcePage(request)
          : await getResourcePlazaPage(request);
      setResources(response.records);
      setTotal(response.total);
      setPageCount(response.pages);
    } catch {
      toast({ title: '资源列表加载失败', status: 'error', position: 'top' });
    } finally {
      setLoading(false);
    }
  }, [mode, request, toast]);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setPageIndex(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleSearch = () => {
    setPageIndex(1);
    setAppliedSearchKey(searchKey.trim());
  };

  const handleReset = () => {
    setSearchKey('');
    setAppliedSearchKey('');
    setFilters(initialFilters);
    setSort('latest');
    setPageIndex(1);
  };

  const handleToggleFavorite = async (resource: PlazaResourceVO) => {
    const response = await toggleResourceFavorite(resource.id);
    if (mode === 'favorites' && !response.isFavorite) {
      setResources((current) => current.filter((item) => item.id !== resource.id));
      setTotal((current) => Math.max(0, current - 1));
    } else {
      setResources((current) =>
        current.map((item) =>
          item.id === resource.id
            ? {
                ...item,
                isFavorite: response.isFavorite,
                favoriteCount: Math.max(0, item.favoriteCount + (response.isFavorite ? 1 : -1))
              }
            : item
        )
      );
    }
    toast({
      title: response.isFavorite ? '已收藏' : '已取消收藏',
      status: 'success',
      duration: 1200,
      position: 'top'
    });
  };

  const activeFilterCount =
    Object.values(filters).filter(Boolean).length + (appliedSearchKey ? 1 : 0);

  return (
    <PlazaScaffold
      title={mode === 'favorites' ? '我的收藏' : '全部资源'}
      description={
        mode === 'favorites'
          ? '管理已收藏的校本资源，随时返回预览或引用'
          : '按教学用途、专业课程和资源格式精准查找'
      }
    >
      <Box
        bg="white"
        p={{ base: 4, md: 5 }}
        border="1px solid"
        borderColor="#E4E7EC"
        borderRadius="16px"
      >
        <Flex direction={{ base: 'column', lg: 'row' }} gap={3} align={{ lg: 'center' }}>
          <InputGroup flex="1">
            <InputLeftElement pointerEvents="none">
              <Search size={17} color="#98A2B3" aria-hidden="true" />
            </InputLeftElement>
            <Input
              aria-label="搜索资源"
              value={searchKey}
              onChange={(event) => setSearchKey(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
              placeholder="搜索资源名称、简介、标签、课程或上传人"
              h="44px"
              borderRadius="10px"
              focusBorderColor="#B4232D"
            />
          </InputGroup>
          <HStack spacing={2}>
            <Button
              h="44px"
              px={5}
              bg="#B4232D"
              color="white"
              borderRadius="10px"
              onClick={handleSearch}
              _hover={{ bg: '#8F1D26' }}
            >
              搜索
            </Button>
            <Button
              h="44px"
              px={4}
              variant="outline"
              borderColor="#D0D5DD"
              borderRadius="10px"
              leftIcon={<X size={15} aria-hidden="true" />}
              onClick={handleReset}
            >
              重置
            </Button>
          </HStack>
        </Flex>

        <Flex mt={4} align="center" gap={2} color="#475467">
          <Filter size={16} aria-hidden="true" />
          <Text fontSize="13px" fontWeight={700}>
            组合筛选
          </Text>
          {activeFilterCount > 0 && (
            <Text px={2} py={0.5} bg="#FFF1F0" color="#B4232D" borderRadius="999px" fontSize="11px">
              已选 {activeFilterCount} 项
            </Text>
          )}
        </Flex>
        <Grid
          mt={3}
          templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }}
          gap={3}
        >
          <Select
            aria-label="资源类型"
            value={filters.categoryId}
            onChange={(event) => updateFilter('categoryId', event.target.value)}
            borderRadius="9px"
            focusBorderColor="#B4232D"
          >
            <option value="">全部类型</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="专业"
            value={filters.majorName}
            onChange={(event) => updateFilter('majorName', event.target.value)}
            borderRadius="9px"
            focusBorderColor="#B4232D"
          >
            <option value="">全部专业</option>
            <option value="新能源汽车技术">新能源汽车技术</option>
            <option value="机电一体化技术">机电一体化技术</option>
          </Select>
          <Select
            aria-label="课程"
            value={filters.courseName}
            onChange={(event) => updateFilter('courseName', event.target.value)}
            borderRadius="9px"
            focusBorderColor="#B4232D"
          >
            <option value="">全部课程</option>
            <option value="动力电池管理系统检修">动力电池管理系统检修</option>
            <option value="新能源汽车故障诊断">新能源汽车故障诊断</option>
            <option value="新能源汽车高压系统检修">新能源汽车高压系统检修</option>
          </Select>
          <Select
            aria-label="文件格式"
            value={filters.fileFormat}
            onChange={(event) => updateFilter('fileFormat', event.target.value)}
            borderRadius="9px"
            focusBorderColor="#B4232D"
          >
            <option value="">全部格式</option>
            {['pdf', 'pptx', 'docx', 'mp4', 'html'].map((format) => (
              <option key={format} value={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </Select>
          <Select
            aria-label="资源来源"
            value={filters.sourceType}
            onChange={(event) => updateFilter('sourceType', event.target.value)}
            borderRadius="9px"
            focusBorderColor="#B4232D"
          >
            <option value="">全部来源</option>
            {sourceOptions.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </Select>
          <Select
            aria-label="上传人"
            value={filters.uploaderName}
            onChange={(event) => updateFilter('uploaderName', event.target.value)}
            borderRadius="9px"
            focusBorderColor="#B4232D"
          >
            <option value="">全部上传人</option>
            {['李明远', '王建国', '陈静', '赵敏', '孙磊', '校本资源组'].map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="发布时间"
            value={filters.publishWindow}
            onChange={(event) => updateFilter('publishWindow', event.target.value)}
            borderRadius="9px"
            focusBorderColor="#B4232D"
          >
            <option value="">全部时间</option>
            <option value="7">近7天</option>
            <option value="30">近30天</option>
            <option value="180">本学期</option>
          </Select>
          <Select
            aria-label="排序方式"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as ResourceSort);
              setPageIndex(1);
            }}
            borderRadius="9px"
            focusBorderColor="#B4232D"
          >
            <option value="latest">最新发布</option>
            <option value="hot">热门程度</option>
          </Select>
        </Grid>
      </Box>

      <Flex mt={6} mb={4} align="center" justify="space-between" gap={4}>
        <HStack spacing={2} color="#344054">
          {mode === 'favorites' ? (
            <Bookmark size={18} aria-hidden="true" />
          ) : (
            <SlidersHorizontal size={18} aria-hidden="true" />
          )}
          <Text fontSize="14px" fontWeight={700}>
            {mode === 'favorites' ? '已收藏资源' : '资源列表'}
          </Text>
          <Text fontSize="12px" color="#98A2B3">
            共 {total} 份
          </Text>
        </HStack>
        <Text fontSize="12px" color="#98A2B3">
          当前按{sort === 'hot' ? '近7天热度' : '发布时间'}排序
        </Text>
      </Flex>

      {loading ? (
        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }} gap={4}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} h="330px" borderRadius="16px" />
          ))}
        </Grid>
      ) : resources.length > 0 ? (
        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }} gap={4}>
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </Grid>
      ) : (
        <Flex
          minH="300px"
          bg="white"
          border="1px dashed"
          borderColor="#D0D5DD"
          borderRadius="16px"
          align="center"
          justify="center"
          direction="column"
          textAlign="center"
          px={6}
        >
          <Flex
            w="52px"
            h="52px"
            bg="#F2F4F7"
            color="#667085"
            borderRadius="16px"
            align="center"
            justify="center"
          >
            {mode === 'favorites' ? (
              <Bookmark size={24} aria-hidden="true" />
            ) : (
              <Search size={24} aria-hidden="true" />
            )}
          </Flex>
          <Text mt={4} color="#182230" fontSize="16px" fontWeight={700}>
            {mode === 'favorites' ? '暂无收藏资源' : '未找到匹配资源'}
          </Text>
          <Text mt={1} color="#667085" fontSize="13px">
            {mode === 'favorites'
              ? '在资源卡片或详情页点击收藏后会出现在这里'
              : '请调整关键词或筛选条件后重试'}
          </Text>
          <Button
            mt={4}
            variant="outline"
            borderColor="#D0D5DD"
            borderRadius="10px"
            onClick={handleReset}
          >
            清空筛选
          </Button>
        </Flex>
      )}

      {pageCount > 1 && (
        <Flex mt={7} align="center" justify="center" gap={3}>
          <Button
            aria-label="上一页"
            leftIcon={<ChevronLeft size={16} aria-hidden="true" />}
            variant="outline"
            borderColor="#D0D5DD"
            borderRadius="9px"
            isDisabled={pageIndex <= 1}
            onClick={() => setPageIndex((value) => Math.max(1, value - 1))}
          >
            上一页
          </Button>
          <Text px={3} color="#475467" fontSize="13px">
            {pageIndex} / {pageCount}
          </Text>
          <Button
            aria-label="下一页"
            rightIcon={<ChevronRight size={16} aria-hidden="true" />}
            variant="outline"
            borderColor="#D0D5DD"
            borderRadius="9px"
            isDisabled={pageIndex >= pageCount}
            onClick={() => setPageIndex((value) => Math.min(pageCount, value + 1))}
          >
            下一页
          </Button>
        </Flex>
      )}
    </PlazaScaffold>
  );
}
