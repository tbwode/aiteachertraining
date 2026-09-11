import type { AxiosProgressEvent } from 'axios';

export type TeacherDetailRequest = {
  id: number;
};

export type TeacherDetailResponse = {
  id: string;
  createTime: string;
  updateTime: string;
  isDeleted: number;
  tenantId: number;
  tmbId: number;
  name: string;
  code: string;
  gender: number;
  phone: string;
  loginPhone?: string;
  type: number;
  professionalTitle: number;
  status: number;
  email: string;
  roleId: string;
  deptIds: number[];
  roleIds: number[];
  wechatBound?: boolean;
};

export type TeacherProfileUpdateRequest = {
  id: number;
  phone: string;
  email: string;
};

export type TeacherAvatarUpdateRequest = {
  avatar: string;
};

export type TeacherPasswordUpdateRequest = {
  originalPassword: string;
  newPassword: string;
};

export type PublicUploadConfig = {
  signal?: AbortSignal;
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
};

export type FileMetaType = {
  url?: string;
  fileUrl?: string;
  previewUrl?: string;
  name?: string;
};

export type WechatBindQRResponse = {
  ticket: string;
  expire_seconds: number;
  url: string;
};

export type WechatScanResultResponse = {
  id: string;
  createTime: string;
  updateTime: string;
  isDeleted: number;
  ticket: string;
  unionid: string;
  senceid: string;
  nickName: string;
  status: string;
  openid: string;
};
