import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTeacherI18n } from '@/app/teacher/components/TeacherI18nProvider';
import type { AvatarEditFormData, ChapterData } from '../constants';
import {
  getCourseOptionById,
  getStoredAvatarRecordById,
  upsertStoredAvatarRecord
} from '../../avatarStorage';
import { getAiAvatarDetail, updateAiAvatar } from '@/teacher/api/aiTeacher';
import type { AiAvatarDetailVO, AiAvatarChapterVO, MaterialWithRecordVO } from '@/teacher/types/aiTeacher';

/**
 * 格式化文件大小（字节转换为可读格式）
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * 根据 fileType 字符串和文件名转换为前端使用的类型
 */
function getFileType(fileType: string, fileName?: string): 'video' | 'pdf' | 'doc' | 'ppt' | 'image' | 'audio' | 'iframe' {
  const type = fileType.toLowerCase();
  const name = (fileName || '').toLowerCase();

  // 优先根据文件名后缀判断（更可靠）
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.doc') || name.endsWith('.docx')) return 'doc';
  if (name.endsWith('.ppt') || name.endsWith('.pptx')) return 'ppt';

  // 根据 fileType 判断
  if (type === 'openmaic' || type === 'digital') return 'iframe';
  if (type.includes('video')) return 'video';
  if (type.includes('pdf')) return 'pdf';
  if (type.includes('doc') || type.includes('word')) return 'doc';
  if (type.includes('ppt') || type.includes('powerpoint') || type.includes('presentation'))
    return 'ppt';
  if (type.includes('image')) return 'image';
  if (type.includes('audio')) return 'audio';
  return 'pdf'; // 默认返回 pdf
}

/**
 * 从文件 URL 中提取 fileKey（临时方案，等后端返回 fileKey 字段后可删除）
 * URL 格式: https://domain/fileKey.ext?params
 * 例如: https://huayun-ai-tos-pre.zhique.me/8979f3f315fc8356aa936eab875871d1.pdf?X-Tos-Algorithm=...
 * 提取结果: 8979f3f315fc8356aa936eab875871d1.pdf（包含扩展名）
 */
function extractFileKeyFromUrl(fileUrl: string): string {
  try {
    const url = new URL(fileUrl);
    const pathname = url.pathname; // 例如: /8979f3f315fc8356aa936eab875871d1.pdf
    const filename = pathname.split('/').pop() || ''; // 例如: 8979f3f315fc8356aa936eab875871d1.pdf
    return filename; // 返回完整的文件名（包含扩展名）
  } catch (error) {
    console.error('提取 fileKey 失败:', error);
    return '';
  }
}

/**
 * 将API返回的章节数据转换为前端ChapterData格式
 */
function convertApiChaptersToChapterData(apiChapters: AiAvatarChapterVO[]): ChapterData[] {
  return apiChapters.map((chapter) => ({
    id: String(chapter.id),
    title: chapter.title,
    openMode: chapter.openMode,
    openTime: chapter.openTime,
    coursewareCount: chapter.materialList?.length || 0,
    hasStudents: chapter.hasLearned === 1,
    coursewareList:
      chapter.materialList?.map((material) => ({
        id: String(material.id),
        sectionId: String(chapter.id),
        name: material.fileName,
        size: material.fileSize ? formatFileSize(material.fileSize) : '未知',
        date: new Date().toISOString().split('T')[0],
        type: getFileType(material.fileType, material.fileName),
        hasStudyRecord: false,
        fileUrl: material.fileUrl,
        fileKey:
          material.fileType === 'openmaic' || material.fileType === 'digital'
            ? ''
            : material.fileKey || extractFileKeyFromUrl(material.fileUrl),
        fileType: material.fileType || 'other'
      })) || [],
    sections: chapter.children.map((section) => ({
      id: String(section.id),
      title: section.title,
      openMode: section.openMode,
      openTime: section.openTime,
      knowledgeCount: section.knowledgePoints?.length || 0,
      coursewareCount: section.materialList?.length || 0,
      hasStudents: section.hasLearned === 1,
      coursewareList:
        section.materialList?.map((material) => ({
          id: String(material.id),
          sectionId: String(section.id),
          name: material.fileName,
          size: material.fileSize ? formatFileSize(material.fileSize) : '未知',
          date: new Date().toISOString().split('T')[0],
          type: getFileType(material.fileType, material.fileName),
          hasStudyRecord: false,
          fileUrl: material.fileUrl,
          fileKey:
            material.fileType === 'openmaic' || material.fileType === 'digital'
              ? ''
              : material.fileKey || extractFileKeyFromUrl(material.fileUrl),
          fileType: material.fileType || 'other'
        })) || []
    }))
  }));
}

export function useAvatarEdit() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation('teacher');
  const { ensureSections, locale } = useTeacherI18n();

  // 确保 aiTeacher 资源已加载，当语言切换时重新加载
  useEffect(() => {
    ensureSections(['aiTeacher']);
  }, [ensureSections, locale]);

  const tabParam = searchParams?.get('tab') || 'base';
  const avatarId = searchParams?.get('id') || '';

  const storedRecord = useMemo(
    () => (avatarId ? getStoredAvatarRecordById(avatarId) : null),
    [avatarId]
  );

  const storedCourse = useMemo(
    () => (storedRecord ? getCourseOptionById(storedRecord.courseId) : null),
    [storedRecord]
  );

  const tabIndex = tabParam === 'chapters' ? 1 : tabParam === 'graph' ? 2 : 0;

  // 从API加载的详情数据
  const [avatarDetail, setAvatarDetail] = useState<AiAvatarDetailVO | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<AvatarEditFormData>({
    name: '',
    description: '',
    coverageClasses: [],
    startDate: '',
    endDate: ''
  });

  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // 二次确认弹窗状态
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmMaterials, setConfirmMaterials] = useState<MaterialWithRecordVO[]>([]);

  // 加载AI分身详情数据
  useEffect(() => {
    if (!avatarId) {
      console.log('useAvatarEdit: avatarId 为空，跳过加载');
      return;
    }

    console.log('useAvatarEdit: 开始加载 AI 分身详情, avatarId:', avatarId);

    const loadAvatarDetail = async () => {
      setIsLoading(true);
      try {
        console.log('useAvatarEdit: 调用 getAiAvatarDetail, 参数:', { id: Number(avatarId) });
        const detail = await getAiAvatarDetail({ id: Number(avatarId) });
        console.log('useAvatarEdit: API 返回数据:', detail);
        setAvatarDetail(detail);

        // 更新基础信息表单
        // coverageClasses 应该包含当前已选中的班级（isSelected: true）
        setFormData({
          name: detail.courseName,
          description: detail.description || '',
          coverageClasses:
            detail.classList
              ?.filter((c) => c.isSelected === true) // 初始选中的是 isSelected 为 true 的班级
              .map((c) => c.className) ||
            detail.majorList?.map((m) => m.majorName) ||
            [],
          startDate: detail.startTime ? detail.startTime.split(' ')[0] : '',
          endDate: detail.endTime ? detail.endTime.split(' ')[0] : ''
        });

        // 更新章节数据
        if (detail.chapterList && detail.chapterList.length > 0) {
          const convertedChapters = convertApiChaptersToChapterData(detail.chapterList);
          setChapters(convertedChapters);
          // 默认选中第一个小节
          if (convertedChapters.length > 0 && convertedChapters[0].sections.length > 0) {
            setSelectedSection(convertedChapters[0].sections[0].id);
          }
        } else {
          setChapters([]);
          setSelectedSection(null);
        }

        console.log('useAvatarEdit: 数据加载完成');
      } catch (error) {
        console.error('useAvatarEdit: 加载AI分身详情失败:', error);
        toast({
          title: t('aiTeacher.avatar.edit.toasts.loadFailed'),
          description: t('aiTeacher.avatar.edit.toasts.loadFailedDesc'),
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAvatarDetail();
  }, [avatarId, toast]);

  // 构建更新请求数据（供首次保存和二次确认复用）
  const buildUpdateData = (forceDelete?: boolean) => {
    if (!avatarDetail) return null;

    const chapterList = chapters.map((chapter, chapterIndex) => ({
      title: chapter.title,
      sortOrder: chapterIndex + 1,
      openMode: chapter.openMode,
      openTime: chapter.openTime,
      knowledgePoints: chapter.sections.flatMap((section, sectionIndex) => {
        const apiChapter = avatarDetail.chapterList.find((c) => c.title === chapter.title);
        const apiSection = apiChapter?.children.find((s) => s.id === parseInt(section.id));
        if (!apiSection?.knowledgePoints) return [];
        return apiSection.knowledgePoints.map((kp, kpIndex) => {
          if (typeof kp === 'string') {
            return {
              name: kp,
              sortOrder: sectionIndex * 1000 + kpIndex + 1
            };
          } else {
            return {
              id: kp.id,
              name: kp.name,
              sortOrder: kp.sortOrder || sectionIndex * 1000 + kpIndex + 1
            };
          }
        });
      }),
      materials: (chapter.coursewareList || []).map((courseware) => ({
        id: courseware.id ? Number(courseware.id) : undefined,
        fileKey: courseware.fileKey || '',
        fileName: courseware.name,
        fileUrl: courseware.fileUrl || undefined,
        fileType: courseware.fileType || 'other'
      })),
      children: chapter.sections.map((section, sectionIndex) => {
        const apiChapter = avatarDetail.chapterList.find((c) => c.title === chapter.title);
        const apiSection = apiChapter?.children.find((s) => s.id === parseInt(section.id));
        const currentSection = chapter.sections.find((s) => s.id === section.id);
        const coursewareList = currentSection?.coursewareList || [];

        return {
          title: section.title,
          sortOrder: sectionIndex + 1,
          openMode: section.openMode,
          openTime: section.openTime,
          knowledgePoints:
            apiSection?.knowledgePoints?.map((kp, kpIndex) => {
              if (typeof kp === 'string') {
                return {
                  name: kp,
                  sortOrder: kpIndex + 1
                };
              } else {
                return {
                  id: kp.id,
                  name: kp.name,
                  sortOrder: kp.sortOrder || kpIndex + 1
                };
              }
            }) || [],
          materials: coursewareList.map((courseware) => ({
            id: courseware.id ? Number(courseware.id) : undefined,
            fileKey: courseware.fileKey || '',
            fileName: courseware.name,
            fileUrl: courseware.fileUrl || undefined,
            fileType: courseware.fileType || 'other'
          })),
          children: []
        };
      })
    }));

    const originalSelectedClasses = avatarDetail.classList.filter(
      (cls) => cls.isSelected === true
    );
    const classIds = originalSelectedClasses
      .filter((cls) => formData.coverageClasses.includes(cls.className))
      .map((cls) => cls.classId);

    const tenantMajorIds = avatarDetail.majorList
      .filter((major) => formData.coverageClasses.includes(major.majorName))
      .map((major) => major.majorId);

    return {
      id: avatarDetail.id,
      courseName: formData.name,
      coverUrl: avatarDetail.coverUrl,
      description: formData.description,
      startTime: `${formData.startDate} 00:00:00`,
      endTime: `${formData.endDate} 23:59:59`,
      teachingConfig: avatarDetail.teachingConfig,
      classIds: classIds.length > 0 ? classIds : undefined,
      tenantMajorIds: tenantMajorIds.length > 0 ? tenantMajorIds : undefined,
      chapterList,
      forceDelete
    };
  };

  // 执行保存
  const doSave = async (forceDelete?: boolean) => {
    if (!avatarDetail) {
      toast({
        title: t('aiTeacher.avatar.edit.toasts.noData'),
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    // 验证必填字段
    if (!formData.startDate || !formData.endDate) {
      toast({
        title: t('aiTeacher.avatar.edit.toasts.fillRequired'),
        description: t('aiTeacher.avatar.edit.toasts.fillRequiredDesc'),
        status: 'warning',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    // 验证日期范围
    if (formData.startDate > formData.endDate) {
      toast({
        title: t('aiTeacher.avatar.edit.toasts.invalidDateRange'),
        description: t('aiTeacher.avatar.edit.toasts.invalidDateRangeDesc'),
        status: 'warning',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    const updateData = buildUpdateData(forceDelete);
    if (!updateData) return;

    console.log('更新AI分身请求数据:', updateData);

    const result = await updateAiAvatar(updateData);

    // 需要二次确认
    if (result.needsConfirm && result.materialsWithRecords && result.materialsWithRecords.length > 0) {
      setConfirmMaterials(result.materialsWithRecords);
      setConfirmModalOpen(true);
      return;
    }

    // 保存成功
    if (storedRecord) {
      upsertStoredAvatarRecord({
        ...storedRecord,
        title: formData.name,
        description: formData.description,
        coverageClasses: formData.coverageClasses,
        startDate: formData.startDate,
        endDate: formData.endDate,
        updatedAt: new Date().toISOString()
      });
    }

    toast({
      title: t('aiTeacher.avatar.edit.toasts.saveSuccess'),
      description: t('aiTeacher.avatar.edit.toasts.saveSuccessDesc'),
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top'
    });

    router.push('/teacher/ai-teacher');
  };

  const handleSave = async () => {
    try {
      await doSave();
    } catch (error) {
      console.error('保存AI分身失败:', error);
      toast({
        title: t('aiTeacher.avatar.edit.toasts.saveFailed'),
        description:
          error instanceof Error ? error.message : t('aiTeacher.avatar.edit.toasts.saveFailedDesc'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    }
  };

  // 二次确认后强制保存
  const handleConfirmSave = async () => {
    setConfirmModalOpen(false);
    try {
      await doSave(true);
    } catch (error) {
      console.error('强制保存AI分身失败:', error);
      toast({
        title: t('aiTeacher.avatar.edit.toasts.saveFailed'),
        description:
          error instanceof Error ? error.message : t('aiTeacher.avatar.edit.toasts.saveFailedDesc'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    }
  };

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false);
    setConfirmMaterials([]);
  };

  const handleClassToggle = (className: string) => {
    setFormData((prev) => ({
      ...prev,
      coverageClasses: prev.coverageClasses.includes(className)
        ? prev.coverageClasses.filter((c) => c !== className)
        : [...prev.coverageClasses, className]
    }));
  };

  const handleCoverUrlChange = (coverUrl: string) => {
    if (avatarDetail) {
      setAvatarDetail({
        ...avatarDetail,
        coverUrl
      });
    }
  };

  return {
    avatarId,
    tabIndex,
    storedRecord,
    storedCourse,
    avatarDetail,
    isLoading,
    formData,
    setFormData,
    chapters,
    setChapters,
    selectedSection,
    setSelectedSection,
    handleSave,
    handleClassToggle,
    handleCoverUrlChange,
    confirmModalOpen,
    confirmMaterials,
    handleConfirmSave,
    handleCloseConfirmModal
  };
}
