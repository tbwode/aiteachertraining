/**
 * 租户配置 API 类型定义
 */

/**
 * 租户详情
 */
export interface TenantType {
  id: string;
  name: string;
  fullName: string;
  domain: string;
  industry: number;
  avatar?: string;
  avatarUrl?: string;
  backgroundImg?: string;
  backgroundImgUrl?: string;
  functionBackgroundImg?: string;
  functionBackgroundImgUrl?: string;
  fullNameImg?: string;
  fullNameImgUrl?: string;
  sidebarImg?: string;
  sidebarImgUrl?: string;
  homepageBackgroundImg?: string;
  homepageBackgroundImgUrl?: string;
}

/**
 * 更新租户详情参数
 */
export interface UpdateTenantDetailParams {
  id: string;
  name: string;
  fullName: string;
  domain: string;
  industry: number;
  avatar?: string;
  avatarUrl?: string;
  backgroundImg?: string;
  backgroundImgUrl?: string;
  functionBackgroundImg?: string;
  functionBackgroundImgUrl?: string;
  fullNameImg?: string;
  fullNameImgUrl?: string;
  sidebarImg?: string;
  sidebarImgUrl?: string;
  homepageBackgroundImg?: string;
  homepageBackgroundImgUrl?: string;
}
