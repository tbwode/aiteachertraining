import { POST } from '@/web/common/api/requestTeacher';
import { getProxyUrl } from '@/web/common/api/apiProxy';

const baseURL = getProxyUrl('/ai-university');

export type ResourceSourceType = 'teacher' | 'school' | 'ai';
export type ResourcePublishStatus = 'published' | 'offline';
export type ResourceSort = 'latest' | 'hot';
export type ResourceReferenceTarget = 'course' | 'avatar';
export type ResourceReferenceStatus = 'ready' | 'parsing' | 'unavailable';

export type ResourceCategoryVO = {
  id: number;
  code: number;
  name: string;
  status: number;
  sortOrder: number;
  resourceCount?: number;
};

export type PlazaResourceVO = {
  id: number;
  title: string;
  fileName: string;
  fileFormat: string;
  fileSize: number;
  categoryId: number;
  categoryName: string;
  coverUrl: string;
  description: string;
  tags: string[];
  majorName: string;
  courseName: string;
  uploaderName: string;
  sourceType: ResourceSourceType;
  publishTime: string;
  updateTime: string;
  previewCount: number;
  favoriteCount: number;
  downloadCount: number;
  referenceCount: number;
  hotScore: number;
  duration?: string;
  version: number;
  shareScope: number;
  publishStatus: ResourcePublishStatus;
  isFavorite: boolean;
};

export type ResourceRankingVO = {
  category: ResourceCategoryVO;
  hotResources: PlazaResourceVO[];
  latestResources: PlazaResourceVO[];
};

export type ResourcePlazaHomeVO = {
  categories: ResourceCategoryVO[];
  rankings: ResourceRankingVO[];
  stats: {
    resourceCount: number;
    categoryCount: number;
    newThisWeek: number;
    referenceCount: number;
  };
};

export type ResourcePageRequest = {
  current?: number;
  size?: number;
  searchKey?: string;
  categoryId?: number;
  majorName?: string;
  courseName?: string;
  fileFormat?: string;
  sourceType?: ResourceSourceType;
  uploaderName?: string;
  publishWindow?: number;
  sort?: ResourceSort;
};

export type ResourcePageVO = {
  records: PlazaResourceVO[];
  total: number;
  current: number;
  size: number;
  pages: number;
};

export type ResourceReferenceVO = {
  id: number;
  resourceId: number;
  resourceVersion: number;
  targetType: ResourceReferenceTarget;
  targetId: number;
  targetName: string;
  locationId: string;
  locationName: string;
  status: ResourceReferenceStatus;
  createTime: string;
  updateTime: string;
  resource: PlazaResourceVO | null;
  hasUpgrade: boolean;
};

export const getResourcePlazaHome = () =>
  POST<ResourcePlazaHomeVO>('/teacher/resource-plaza/home', {}, { baseURL });

export const getResourcePlazaCategories = () =>
  POST<ResourceCategoryVO[]>('/teacher/resource-plaza/categories', {}, { baseURL });

export const getResourcePlazaPage = (data: ResourcePageRequest) =>
  POST<ResourcePageVO>('/teacher/resource-plaza/page', data, { baseURL });

export const getFavoriteResourcePage = (data: ResourcePageRequest) =>
  POST<ResourcePageVO>('/teacher/resource-plaza/favorites/page', data, { baseURL });

export const getResourcePlazaDetail = (id: number) =>
  POST<PlazaResourceVO | null>('/teacher/resource-plaza/detail', { id }, { baseURL });

export const getRelatedResources = (id: number) =>
  POST<PlazaResourceVO[]>('/teacher/resource-plaza/related', { id }, { baseURL });

export const previewPlazaResource = (id: number) =>
  POST<{ success: boolean; reason?: string; resource?: PlazaResourceVO }>(
    '/teacher/resource-plaza/preview',
    { id },
    { baseURL }
  );

export const toggleResourceFavorite = (id: number) =>
  POST<{ isFavorite: boolean }>('/teacher/resource-plaza/favorite/toggle', { id }, { baseURL });

export const downloadPlazaResource = (id: number) =>
  POST<{ success: boolean; reason?: string; fileName?: string; fileUrl?: string }>(
    '/teacher/resource-plaza/download',
    { id },
    { baseURL }
  );

export type CreateResourceReferenceRequest = {
  resourceId: number;
  targetType: ResourceReferenceTarget;
  targetId: number;
  targetName: string;
  locationId: string;
  locationName: string;
};

export const createResourceReference = (data: CreateResourceReferenceRequest) =>
  POST<{ success: boolean; reason?: string; duplicated?: boolean }>(
    '/teacher/resource-plaza/reference/create',
    data,
    { baseURL }
  );

export const getResourceReferences = (data: {
  current?: number;
  size?: number;
  targetType?: ResourceReferenceTarget;
}) =>
  POST<{
    records: ResourceReferenceVO[];
    total: number;
    current: number;
    size: number;
    pages: number;
  }>('/teacher/resource-plaza/references/page', data, { baseURL });

export const upgradeResourceReference = (id: number) =>
  POST<{ success: boolean; reason?: string }>(
    '/teacher/resource-plaza/reference/upgrade',
    { id },
    { baseURL }
  );
