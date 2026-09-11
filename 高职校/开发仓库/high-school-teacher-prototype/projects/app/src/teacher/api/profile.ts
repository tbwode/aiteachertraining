import { POST as teacherPOST, GET as teacherGET } from '@/web/common/api/requestTeacher';
import type {
  FileMetaType,
  PublicUploadConfig,
  TeacherAvatarUpdateRequest,
  TeacherDetailRequest,
  TeacherDetailResponse,
  TeacherPasswordUpdateRequest,
  TeacherProfileUpdateRequest,
  WechatBindQRResponse,
  WechatScanResultResponse
} from '../types/profile';

export const postTeacherDetail = (data: TeacherDetailRequest) =>
  teacherPOST<TeacherDetailResponse>('/client/teacher/detail', data, {
    baseURL: '/ai-university'
  });

export const postTeacherProfileUpdate = (data: TeacherProfileUpdateRequest) =>
  teacherPOST<boolean>('/client/teacher/update', data, {
    baseURL: '/ai-university'
  });

export const postTeacherAvatarUpdate = (data: TeacherAvatarUpdateRequest) =>
  teacherPOST<boolean>('/client/user/update', data);

export const postTeacherPasswordUpdate = (data: TeacherPasswordUpdateRequest) =>
  teacherPOST<boolean>('/client/auth/updatePassword', data, {
    baseURL: '/huayun-ai'
  });

export const uploadFilePublic = (data: FormData, config?: PublicUploadConfig) =>
  teacherPOST<FileMetaType>('/system/file/public/upload', data, {
    timeout: 480000,
    ...config,
    headers: {
      'Content-Type': 'multipart/form-data; charset=utf-8'
    }
  });

export const getWechatBindQR = () => teacherGET<WechatBindQRResponse>('/wx/getBindQRCode');

export const getWechatBindResult = (ticket: string) =>
  teacherGET<WechatScanResultResponse | null>('/wx/getLoginQRCodeResult', { ticket });

export const getWechatIsBindWx = () => teacherGET<boolean>('/wx/isBindWx');

export const postWechatBind = (unionId: string) => {
  const params = new URLSearchParams({ unionId });
  return teacherPOST<{}>(`/wx/wxBind?${params.toString()}`, {});
};

export const postWechatUnbind = () => teacherPOST<{}>('/wx/wxUnBind', {});
