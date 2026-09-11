'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatHeader from '../components/ChatHeader';
import { Flex, useColorModeValue, Spinner, Center, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';
import { useAuth } from '@/app/components/auth/AuthProvider';
import { getStudentPortrait, generateStudentPortrait } from '@/student/api/portrait';
import { getStudentOverview } from '@/student/api/overview';
import { joinAvatarStudy } from '@/api/student/student';
import StudentPortraitCard from '../components/StudentPortraitCard';
import { useCareerDiagnosis } from '../hooks/useCareerDiagnosis';
import type { StudentPortraitRawData } from '@/types/common-chat';

export default function StudyProtrait() {
  const isReady = useTeacherPageI18n(['commonChat', 'workspace']);
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const studentId = user?.studentId;
  const bgSecondary = useColorModeValue('#F9FAFB', '#2a2a2a');

  const [portrait, setPortrait] = useState<StudentPortraitRawData | null>(null);
  const [portraitUpdatedToday, setPortraitUpdatedToday] = useState(false);
  const [loading, setLoading] = useState(false);
  const [portraitLoading, setPortraitLoading] = useState(false);
  const [activePositionId, setActivePositionId] = useState<string>('');
  const {
    careerDiagnosis,
    careerLoading,
    careerError,
    courseMatchMap,
    fetchCareerDiagnosis,
    invalidateCareer
  } = useCareerDiagnosis();

  /** 解析 overview 的 radarDimensions 为维度名数组 */
  const parseDimensions = (raw?: string): string[] => {
    try {
      return JSON.parse(raw ?? '[]');
    } catch {
      return [];
    }
  };

  /** 触发职业能力诊断（基于当前 portrait 数据） */
  const triggerCareerDiagnosis = (
    majorName: string,
    radarDimensionsRaw: string | undefined,
    radarItems: { dimension: string; value: number }[],
    studentName?: string,
    studentCode?: string
  ) => {
    if (!studentId || !majorName) return;
    const dimensions = parseDimensions(radarDimensionsRaw);
    if (dimensions.length === 0) return;
    const currentAbilities = radarItems.map((it) => ({ dimension: it.dimension, value: it.value }));
    void fetchCareerDiagnosis({
      studentId,
      studentName,
      studentCode,
      majorName,
      abilityDimensions: dimensions,
      currentAbilities
    });
  };

  /** 加入选修课程并跳转课程详情 */
  const handleJoinCourse = async (course: { avatarId?: number; courseId?: number; courseName?: string }) => {
    if (!course.avatarId) return;
    try {
      await joinAvatarStudy({ avatarId: course.avatarId });
    } catch {
      // 忽略已加入或其他错误，仍允许进入学习
    }
    const params = new URLSearchParams();
    params.set('avatarId', String(course.avatarId));
    if (course.courseId) params.set('courseId', String(course.courseId));
    router.push(`/student/course-detail?${params.toString()}`);
  };

  const fetchPortrait = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      // 1. 先调 overview 接口，数据先展示
      const overviewRes = await getStudentOverview({ studentId });
      console.log('[study-portrait] overviewRes:', overviewRes);
      const initialData = buildOverviewData(overviewRes);
      setPortrait(initialData);
      setPortraitUpdatedToday(false);
      setLoading(false);
      setPortraitLoading(true);

      // 2. 再调 portrait 接口，合并画像分析数据
      const portraitRes = await getStudentPortrait({ studentId });
      console.log('[study-portrait] portraitRes:', portraitRes);

      // 如果 portraitJson 中无学号数据，说明画像尚未生成，自动触发更新
      if (!portraitRes?.student_code) {
        console.log('[study-portrait] no student_code in portrait, auto generating...');
        await generateStudentPortrait({ studentId });
        const refreshedPortraitRes = await getStudentPortrait({ studentId });
        applyPortraitData(overviewRes, refreshedPortraitRes);
      } else {
        applyPortraitData(overviewRes, portraitRes);
      }
    } catch (err) {
      console.error('[study-portrait] fetchPortrait error:', err);
      setPortraitLoading(false);
    } finally {
      setLoading(false);
      setPortraitLoading(false);
    }
  };

  /** 仅用 overview 数据构建初始画像（先展示基础信息） */
  const buildOverviewData = (overviewRes: any): StudentPortraitRawData => {
    return {
      student_name: overviewRes?.studentName ?? '',
      student_code: overviewRes?.studentCode ?? '',
      major_name: overviewRes?.majorName ?? '',
      major_id: overviewRes?.majorId,
      studying_course_count: overviewRes?.studyingCourseCount ?? 0,
      completed_course_count: overviewRes?.completedCourseCount ?? 0,
      total_study_hours: overviewRes?.totalStudyHours ?? 0,
      radar_dimensions: overviewRes?.radarDimensions,
      course_progress_list: (overviewRes?.courseProgressList ?? []).map((item: any) => ({
        avatar_id: item.avatarId,
        course_id: item.courseId,
        course_name: item.courseName ?? '',
        progress: item.progress ?? 0,
      })),
      portrait_updated_today: false,
      radar_chart: { items: [] },
      career_analysis: '',
      major_analysis: '',
      improvement_plan: '',
    };
  };

  const applyPortraitData = (overviewRes: any, portraitRes: any) => {
    // 解析雷达图维度名称（新接口）
    let radarDimensions: string[] = [];
    if (overviewRes?.radarDimensions) {
      try {
        radarDimensions = JSON.parse(overviewRes.radarDimensions);
      } catch {
        radarDimensions = [];
      }
    }

    // 合并雷达图：维度名称用新接口，分值用原接口
    const mergedRadarItems = radarDimensions.map((dim, index) => ({
      dimension: dim,
      value: portraitRes?.radar_chart?.items?.[index]?.value ?? 0,
    }));

    const merged: StudentPortraitRawData = {
      // 新接口字段
      student_name: overviewRes?.studentName ?? '',
      student_code: overviewRes?.studentCode ?? '',
      major_name: overviewRes?.majorName ?? '',
      major_id: overviewRes?.majorId,
      studying_course_count: overviewRes?.studyingCourseCount ?? 0,
      completed_course_count: overviewRes?.completedCourseCount ?? 0,
      total_study_hours: overviewRes?.totalStudyHours ?? 0,
      radar_dimensions: overviewRes?.radarDimensions,
      course_progress_list: (overviewRes?.courseProgressList ?? []).map((item: any) => ({
        avatar_id: item.avatarId,
        course_id: item.courseId,
        course_name: item.courseName ?? '',
        progress: item.progress ?? 0,
      })),
      // 原接口字段
      portrait_updated_today: (portraitRes as any)?.portraitUpdatedToday ?? false,
      radar_chart: { items: mergedRadarItems },
      career_analysis: portraitRes?.career_analysis ?? '',
      major_analysis: portraitRes?.major_analysis ?? '',
      improvement_plan: portraitRes?.improvement_plan ?? '',
    };

    setPortrait(merged);
    setPortraitUpdatedToday(merged.portrait_updated_today);

    // 触发职业能力诊断
    triggerCareerDiagnosis(
      merged.major_name,
      merged.radar_dimensions,
      merged.radar_chart.items,
      merged.student_name,
      merged.student_code
    );
  };

  const handleRefresh = async () => {
    if (!studentId) return;
    setPortraitLoading(true);
    invalidateCareer(studentId);
    try {
      await generateStudentPortrait({ studentId });
      const portraitRes = await getStudentPortrait({ studentId });
      if (portrait) {
        // 用已有 overview 数据 + 新 portrait 数据合并
        applyPortraitDataFromState(portraitRes);
      }
    } catch {
      // ignore
    } finally {
      setPortraitLoading(false);
    }
  };

  /** 用当前 portrait 中的 overview 数据 + 新 portrait 数据合并更新 */
  const applyPortraitDataFromState = (portraitRes: any) => {
    if (!portrait) return;
    // 保留 overview 来源字段不变，仅更新 portrait 来源字段
    const radarDimensions: string[] = (() => {
      if (portrait.radar_dimensions) {
        try {
          return JSON.parse(portrait.radar_dimensions);
        } catch {
          return [];
        }
      }
      return [];
    })();

    const mergedRadarItems = radarDimensions.map((dim, index) => ({
      dimension: dim,
      value: portraitRes?.radar_chart?.items?.[index]?.value ?? 0,
    }));

    setPortrait({
      ...portrait,
      portrait_updated_today: !!(portraitRes as any)?.portraitUpdatedToday,
      radar_chart: { items: mergedRadarItems },
      career_analysis: portraitRes?.career_analysis ?? '',
      major_analysis: portraitRes?.major_analysis ?? '',
      improvement_plan: portraitRes?.improvement_plan ?? '',
    });
    setPortraitUpdatedToday(!!(portraitRes as any)?.portraitUpdatedToday);

    // 重新触发职业能力诊断（能力分值已更新）
    triggerCareerDiagnosis(
      portrait.major_name,
      portrait.radar_dimensions,
      mergedRadarItems,
      portrait.student_name,
      portrait.student_code
    );
  };

  useEffect(() => {
    if (studentId) {
      fetchPortrait();
    }
  }, [studentId]);

  useEffect(() => {
    console.log('[study-portrait] portrait changed:', portrait);
  }, [portrait]);

  if (!isReady) {
    return (
      <Center h="100vh" w="100%" bg={bgSecondary}>
        <Spinner size="lg" color="#C8000B" />
      </Center>
    );
  }

  if (!studentId) {
    return (
      <Center h="100vh" w="100%" bg={bgSecondary}>
        <Text color="#86909C">{t('commonChat.error.no_student_info')}</Text>
      </Center>
    );
  }

  return (
    <Flex h="100vh" w="100%" bg={bgSecondary} flexDirection="column">
      <ChatHeader />
      <Flex
        flex={1}
        overflow="hidden"
        bgImage="url('/imgs/app/chatbackground.png')"
        bgSize="cover"
        bgPosition="center"
        bgRepeat="no-repeat"
        justify="center"
        py="24px"
        px="16px"
        overflowY="auto"
      >
        {loading && !portrait ? (
          <Spinner size="lg" color="#C8000B" />
        ) : (
          <StudentPortraitCard
            data={portrait}
            portraitUpdatedToday={portraitUpdatedToday}
            portraitLoading={portraitLoading}
            onRefresh={handleRefresh}
            careerDiagnosis={careerDiagnosis}
            careerLoading={careerLoading}
            careerError={careerError}
            activePositionId={activePositionId}
            onPositionChange={setActivePositionId}
            courseMatchMap={courseMatchMap}
            onJoinCourse={handleJoinCourse}
            onCourseClick={(course) => {
              if (!course.avatar_id && !course.course_id) return;
              const params = new URLSearchParams();
              if (course.avatar_id) params.set('avatarId', String(course.avatar_id));
              if (course.course_id) params.set('courseId', String(course.course_id));
              router.push(`/student/course-detail?${params.toString()}`);
            }}
          />
        )}
      </Flex>
    </Flex>
  );
}
