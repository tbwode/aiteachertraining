import { GET, POST } from '@/web/common/api/requestStudent';
import type { AxiosProgressEvent } from 'axios';

const aiUniversityBaseURL = '/ai-university';
const huayunAiBaseURL = '/huayun-ai';

export type StudentDetailRequest = {
  id: string;
};

export type StudentDetailResponse = {
  id?: string | number;
  studentId?: string | number;
  userId?: string | number;
  code?: string | number;
  nickName?: string;
  nickname?: string;
  realName?: string;
  studentName?: string;
  name?: string;
  avatar?: string;
  avatarUrl?: string;
  phone?: string;
  loginPhone?: string;
  email?: string;
  institution?: string;
  schoolName?: string;
  collegeName?: string;
  department?: string;
  departmentName?: string;
  major?: string;
  majorName?: string;
  className?: string;
  classsName?: string;
  clazzName?: string;
};

export type StudentUpdatePhoneRequest = {
  phone: string;
};

export type StudentUpdateAvatarRequest = {
  avatar: string;
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

export const getStudentDetail = (data: StudentDetailRequest) =>
  POST<StudentDetailResponse>('/client/student/detail', data, {
    baseURL: aiUniversityBaseURL
  });

export const updateStudentPhone = (data: StudentUpdatePhoneRequest) =>
  POST<boolean>('/client/student/update', data, {
    baseURL: aiUniversityBaseURL
  });

export const updateStudentAvatar = (data: StudentUpdateAvatarRequest) =>
  POST<boolean>('/client/user/update', data, {
    baseURL: huayunAiBaseURL
  });

export const uploadStudentAvatarPublic = (data: FormData, config?: PublicUploadConfig) =>
  POST<FileMetaType>('/system/file/public/upload', data, {
    timeout: 480000,
    ...config,
    headers: {
      'Content-Type': 'multipart/form-data; charset=utf-8'
    }
  });

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

export const getWechatBindQR = () => GET<WechatBindQRResponse>('/wx/getBindQRCode');

export const getWechatBindResult = (ticket: string) =>
  GET<WechatScanResultResponse | null>('/wx/getLoginQRCodeResult', { ticket });

export const getWechatIsBindWx = () => GET<boolean>('/wx/isBindWx');

export const postWechatBind = (unionId: string) => {
  const params = new URLSearchParams({ unionId });
  return POST<{}>(`/wx/wxBind?${params.toString()}`, {});
};

export const postWechatUnbind = () => POST<{}>('/wx/wxUnBind', {});
