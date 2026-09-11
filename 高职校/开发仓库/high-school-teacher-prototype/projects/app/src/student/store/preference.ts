import type { StudentPreferenceVO } from '@/types/api/student/student';
import { queryStudentPreference } from '@/api/student/student';
import { create } from 'zustand';

/**
 * 学生偏好设置状态类型
 */
type StudentPreferenceState = {
  /** 偏好设置原始数据 */
  preferenceResult: StudentPreferenceVO | null;
  /** JSON 字符串格式的学生设置 */
  studentSetting: string;
  /** 是否已加载 */
  isLoaded: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 设置偏好数据 */
  setPreference: (preference: StudentPreferenceVO | null) => void;
  /** 清空偏好数据 */
  clearPreference: () => void;
  /** 如果未加载则加载偏好数据 */
  loadPreferenceIfNeeded: () => Promise<void>;
};

/**
 * 学生偏好设置全局状态管理
 * 使用 zustand 实现，供多个页面共享 preferenceResult 和 studentSetting
 */
export const useStudentPreferenceStore = create<StudentPreferenceState>()((set, get) => ({
  preferenceResult: null,
  studentSetting: '{}',
  isLoaded: false,
  isLoading: false,

  setPreference: (preference: StudentPreferenceVO | null) =>
    set(() => ({
      preferenceResult: preference,
      studentSetting: preference ? JSON.stringify(preference) : '{}',
      isLoaded: true,
      isLoading: false
    })),

  clearPreference: () =>
    set(() => ({
      preferenceResult: null,
      studentSetting: '{}',
      isLoaded: false,
      isLoading: false
    })),

  loadPreferenceIfNeeded: async () => {
    const { isLoaded, isLoading } = get();
    if (isLoaded || isLoading) return;

    set({ isLoading: true });
    try {
      const preference = await queryStudentPreference({});
      set({
        preferenceResult: preference,
        studentSetting: preference ? JSON.stringify(preference) : '{}',
        isLoaded: true,
        isLoading: false
      });
    } catch {
      set({
        preferenceResult: null,
        studentSetting: '{}',
        isLoaded: true,
        isLoading: false
      });
    }
  }
}));

/**
 * 获取当前偏好设置状态（非 hook 方式，用于非组件场景）
 */
export const getStudentPreferenceState = () => useStudentPreferenceStore.getState();
