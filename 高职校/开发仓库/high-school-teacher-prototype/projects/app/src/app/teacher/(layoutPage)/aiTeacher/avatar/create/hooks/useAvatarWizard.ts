import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/components/auth/AuthProvider';
import { useTeacherI18n } from '@/app/teacher/components/TeacherI18nProvider';
import type { AvatarWizardDraft, CourseOption } from '../../avatarStorage';
import {
  buildRecordFromDraft,
  clearStoredWizardDraft,
  createEmptyWizardDraft,
  createStoredFileMeta,
  getCourseOptionById,
  getStoredWizardDraft,
  getUnavailableClasses,
  saveStoredWizardDraft,
  upsertStoredAvatarRecord,
  setCourseOptions,
  getAllCourseOptions
} from '../../avatarStorage';
import type { WizardStep } from '../constants';
import {
  missingChapters,
  COURSEWARE_ALLOWED_EXTENSIONS,
  COURSEWARE_DOCUMENT_MAX_SIZE,
  COURSEWARE_VIDEO_MAX_SIZE
} from '../constants';
import {
  getTeachingTaskCourses,
  triggerFileParseAfterUpload,
  getAiAvatarList,
  createAiAvatar
} from '@/teacher/api/aiTeacher';
import { convertTeachingTaskCoursesToOptions } from '../../apiConverter';
import { uploadPrivateFile, uploadFilePublic } from '@/teacher/api/file';
import { useSimpleChat } from '@/web/common/hooks/useSimpleChat';

function ensureValidDraft(rawDraft: AvatarWizardDraft | null) {
  const fallback = createEmptyWizardDraft();

  if (!rawDraft) {
    return fallback;
  }

  // 清除旧的测试数据
  const cleanedSelectedResourceIds = (rawDraft.selectedResourceIds || []).filter(
    (id) => !['doc-1', 'doc-2', 'video-1', 'ai-1', 'ai-2'].includes(id)
  );

  // 迁移旧的中文值到新的键名
  const migrateQuizMethods = (methods: string[]) => {
    const mapping: Record<string, string> = {
      课后习题: 'afterClassExercise',
      章节测试: 'chapterTest',
      随机抽题测验: 'randomQuestionQuiz',
      AI智能问答测评: 'aiQaAssessment'
    };
    return methods.map((m) => mapping[m] || m);
  };

  const migrateReportDimensions = (dimensions: string[]) => {
    const mapping: Record<string, string> = {
      学习进度追踪: 'learningProgress',
      知识点掌握分析: 'knowledgeMastery',
      能力成长曲线: 'abilityGrowth',
      学习行为分析: 'learningBehavior',
      同伴对比分析: 'peerComparison'
    };
    return dimensions.map((d) => mapping[d] || d);
  };

  return {
    ...fallback,
    ...rawDraft,
    weights: {
      ...fallback.weights,
      ...rawDraft.weights
    },
    quizMethods: rawDraft.quizMethods?.length
      ? migrateQuizMethods(rawDraft.quizMethods)
      : fallback.quizMethods,
    reportDimensions: rawDraft.reportDimensions?.length
      ? migrateReportDimensions(rawDraft.reportDimensions)
      : fallback.reportDimensions,
    coursewareFiles: rawDraft.coursewareFiles ?? [],
    selectedResourceIds: cleanedSelectedResourceIds, // 使用清理后的数据
    digitalTextbooks: rawDraft.digitalTextbooks ?? fallback.digitalTextbooks,
    syllabusFile: rawDraft.syllabusFile ?? null
  };
}

function syncCourseMeta(
  course: CourseOption | null,
  currentDraft: AvatarWizardDraft,
  userId?: string
) {
  if (!course) {
    return {
      ...currentDraft,
      courseId: '',
      title: '',
      courseType: 'required' as const,
      semester: '',
      hours: 0,
      coverageClasses: []
    };
  }

  const available =
    course.type === 'optional'
      ? []
      : course.classes.filter(
          (className) => !getUnavailableClasses(course.id, userId).includes(className)
        );

  return {
    ...currentDraft,
    courseId: course.id,
    title: course.title,
    courseType: course.type,
    semester: course.semester,
    hours: course.hours,
    coverageClasses:
      course.type === 'optional'
        ? []
        : currentDraft.coverageClasses.filter((className) => available.includes(className)),
    updatedAt: new Date().toISOString()
  };
}

export function useAvatarWizard({ courseIdFromUrl }: { courseIdFromUrl?: string } = {}) {
  const { t } = useTranslation('teacher');
  const toast = useToast();
  const { user } = useAuth();
  const { sendMessage: analyzeSyllabus, loading: isAnalyzing } = useSimpleChat();
  const { ensureSections, locale } = useTeacherI18n();

  // 确保 aiTeacher 资源已加载，当语言切换时重新加载
  useEffect(() => {
    ensureSections(['aiTeacher']);
  }, [ensureSections, locale]);

  // 如果从 /common-chat 跳转过来（URL 带有 courseId），清空草稿数据
  const [draft, setDraft] = useState<AvatarWizardDraft>(() => {
    if (courseIdFromUrl) {
      console.log('useAvatarWizard - 检测到 URL courseId 参数，清空草稿数据:', courseIdFromUrl);
      clearStoredWizardDraft(user?.id);
      return createEmptyWizardDraft();
    }
    return ensureValidDraft(getStoredWizardDraft(user?.id));
  });
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isMatching, setIsMatching] = useState(false);
  const [isLoadingResources, setIsLoadingResources] = useState(false); // 资源推荐加载中
  const [isUploadingSyllabus, setIsUploadingSyllabus] = useState(false); // 大纲上传中
  const [isUploadingCourseware, setIsUploadingCourseware] = useState(false); // 课件上传中
  const [isParsingCourseware, setIsParsingCourseware] = useState(false); // 课件解析中
  const [courseOptions, setCourseOptionsList] = useState<CourseOption[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [editingTextbookId, setEditingTextbookId] = useState<string | null>(null); // 正在编辑的数字教材章节ID
  const [textbookInput, setTextbookInput] = useState(''); // 数字教材名称输入
  const hasSyncedCourseRef = useRef(false); // 标记是否已经同步过课程元数据
  const [createdAvatars, setCreatedAvatars] = useState<
    Array<{ courseName: string; classes: string[] }>
  >([]); // 已创建的AI分身列表（只包含运行中的）

  // 加载课程列表
  useEffect(() => {
    const loadCourses = async () => {
      // 从 store 中获取 teacherId
      const teacherId = user?.teacherId;

      if (!teacherId) {
        console.error('useAvatarWizard - teacherId 不存在');
        // 失败时使用静态数据
        const fallbackOptions = getAllCourseOptions();
        setCourseOptionsList(fallbackOptions);
        return;
      }

      setIsLoadingCourses(true);
      try {
        console.log('useAvatarWizard - 调用课程列表API, teacherId:', teacherId);
        const result = await getTeachingTaskCourses({ teacherId });
        // 后端返回 null(无教学任务)时兜底为空数组；非数组时包装为数组
        const semesterGroups = !result ? [] : Array.isArray(result) ? result : [result];
        const options = convertTeachingTaskCoursesToOptions(semesterGroups);
        console.log('useAvatarWizard - 课程列表加载成功, 课程数:', options.length);
        console.log(
          'useAvatarWizard - 课程详情:',
          options.map((c) => ({
            id: c.id,
            title: c.title,
            type: c.type,
            classesCount: c.classes.length,
            classes: c.classes
          }))
        );
        setCourseOptions(options); // 更新全局缓存
        setCourseOptionsList(options); // 更新本地状态
      } catch (error) {
        console.error('useAvatarWizard - 加载课程列表失败:', error);
        // 失败时使用静态数据
        const fallbackOptions = getAllCourseOptions();
        setCourseOptionsList(fallbackOptions);
        toast({
          title: t('aiTeacher.avatar.create.toasts.loadCourseListFailed'),
          description: t('aiTeacher.avatar.create.toasts.loadCourseListFailedDesc'),
          status: 'warning',
          duration: 3000,
          isClosable: true,
          position: 'top'
        });
      } finally {
        setIsLoadingCourses(false);
      }
    };

    loadCourses();
  }, [toast, user?.teacherId]);

  // 加载已创建的AI分身列表（只统计运行中的）
  useEffect(() => {
    const loadCreatedAvatars = async () => {
      // 从 store 中获取 teacherId
      const teacherId = user?.teacherId;

      if (!teacherId) {
        console.error('useAvatarWizard - teacherId 不存在，无法加载已创建的AI分身');
        setCreatedAvatars([]);
        return;
      }

      try {
        console.log('useAvatarWizard - 加载已创建的AI分身列表');
        const avatarList = await getAiAvatarList({ teacherId });

        // 只统计 status === 1（运行中）的AI分身
        // 注意：由于API返回的数据中没有teachingTaskId，我们需要通过课程名称来匹配
        // 这里先保存所有运行中的AI分身的班级信息
        const runningAvatars = avatarList
          .filter((avatar) => avatar.status === 1)
          .map((avatar) => {
            // 提取班级名称列表（兼容新旧字段名）
            const classes = avatar.classList
              ? avatar.classList.map((c) => c.className)
              : avatar.classNameList || [];

            return {
              courseName: avatar.courseName, // 使用课程名称作为标识
              classes
            };
          });

        console.log('useAvatarWizard - 运行中的AI分身:', runningAvatars);
        setCreatedAvatars(runningAvatars);
      } catch (error) {
        console.error('useAvatarWizard - 加载已创建的AI分身失败:', error);
        // 失败时使用空数组
        setCreatedAvatars([]);
      }
    };

    loadCreatedAvatars();
  }, [user?.teacherId]);

  // 当课程列表加载完成后，如果draft中有courseId，重新同步课程元数据（只执行一次）
  useEffect(() => {
    if (
      courseOptions.length > 0 &&
      draft.courseId &&
      !isLoadingCourses &&
      !hasSyncedCourseRef.current
    ) {
      const course = courseOptions.find((c) => c.id === draft.courseId);
      if (course) {
        console.log('useAvatarWizard - 课程加载完成，重新同步元数据:', {
          courseId: draft.courseId,
          courseName: course.title,
          courseType: course.type,
          classes: course.classes,
          classesLength: course.classes?.length || 0
        });
        const syncedDraft = syncCourseMeta(course, draft, user?.id);
        persistDraft(syncedDraft);
        hasSyncedCourseRef.current = true; // 标记已同步
      } else {
        console.error('useAvatarWizard - 未找到对应的课程！', {
          draftCourseId: draft.courseId,
          availableCourseIds: courseOptions.map((c) => c.id)
        });
      }
    }
  }, [courseOptions, isLoadingCourses, draft.courseId]);

  const selectedCourse = useMemo(
    () => courseOptions.find((course) => course.id === draft.courseId) ?? null,
    [draft.courseId, courseOptions]
  );

  // 计算不可用的班级（只从API加载的运行中的AI分身）
  const unavailableClasses = useMemo(() => {
    if (!draft.courseId || !selectedCourse) {
      return [];
    }

    // 只使用API数据，不再依赖localStorage（localStorage可能有旧数据）
    const apiOccupiedClasses = createdAvatars
      .filter((avatar) => avatar.courseName === selectedCourse.title)
      .flatMap((avatar) => avatar.classes);

    // 去重
    const allOccupied = Array.from(new Set(apiOccupiedClasses));

    console.log('unavailableClasses - 计算结果:', {
      courseId: draft.courseId,
      courseName: selectedCourse.title,
      apiOccupiedClasses,
      allOccupied,
      note: '只使用API数据，不再依赖localStorage'
    });

    return allOccupied;
  }, [draft.courseId, selectedCourse, createdAvatars]);

  const availableClasses = useMemo(() => {
    console.log('availableClasses - 开始计算:', {
      hasSelectedCourse: !!selectedCourse,
      courseType: selectedCourse?.type,
      courseTitle: selectedCourse?.title,
      courseId: selectedCourse?.id,
      allClasses: selectedCourse?.classes,
      allClassesLength: selectedCourse?.classes?.length || 0,
      unavailableClasses,
      unavailableClassesLength: unavailableClasses.length
    });

    if (!selectedCourse) {
      console.log('availableClasses - 返回空数组（未选择课程）');
      return [];
    }

    if (selectedCourse.type === 'optional') {
      console.log('availableClasses - 返回空数组（选修课不需要选择班级）');
      return [];
    }

    // 检查课程是否有班级数据
    if (!selectedCourse.classes || selectedCourse.classes.length === 0) {
      console.error('availableClasses - 课程没有班级数据！', {
        courseId: selectedCourse.id,
        courseName: selectedCourse.title,
        courseType: selectedCourse.type,
        classes: selectedCourse.classes
      });
      return [];
    }

    const result = selectedCourse.classes.filter(
      (className) => !unavailableClasses.includes(className)
    );

    console.log('availableClasses - 计算完成:', {
      courseName: selectedCourse.title,
      allClasses: selectedCourse.classes,
      unavailableClasses,
      result,
      resultLength: result.length
    });

    return result;
  }, [selectedCourse, unavailableClasses]);

  const isStep1Valid = useMemo(() => {
    if (!selectedCourse) {
      return false;
    }

    // 必修课：必须勾选至少一个班级
    // 选修课：不需要勾选班级
    const hasCoverage =
      selectedCourse.type === 'optional'
        ? true // 选修课不需要选择班级
        : draft.coverageClasses.length > 0; // 必修课必须勾选至少一个班级

    return (
      Boolean(draft.courseId) &&
      Boolean(draft.courseImagePreview) &&
      hasCoverage &&
      Boolean(draft.startDate) &&
      Boolean(draft.endDate)
    );
  }, [selectedCourse, draft]);

  const isStep2Valid = useMemo(
    () =>
      Boolean(draft.syllabusFile) &&
      draft.coursewareFiles.length > 0 &&
      draft.coursewareFiles.every((f) => f.parseStatus === 'parsed'),
    [draft]
  );

  const isStep3Valid = useMemo(() => {
    return missingChapters.every((chapter) =>
      draft.selectedResourceIds.includes(chapter.selectedAiResourceId)
        ? draft.digitalTextbooks.some((item) => item.chapterId === chapter.id)
        : true
    );
  }, [draft.digitalTextbooks, draft.selectedResourceIds]);

  useEffect(() => {
    // 只在初始加载时根据草稿状态恢复步骤，不自动跳转
    if (draft.syllabusFile || draft.coursewareFiles.length > 0) {
      // 如果已经在 Step3，保持在 Step3
      if (currentStep === 3) {
        return;
      }
      // 否则跳转到 Step2
      setCurrentStep(2);
    }
  }, [draft.coursewareFiles.length, draft.syllabusFile]);

  const persistDraft = (nextDraft: AvatarWizardDraft) => {
    setDraft(nextDraft);
    saveStoredWizardDraft(nextDraft, user?.id);
  };

  const updateDraft = (updater: (current: AvatarWizardDraft) => AvatarWizardDraft) => {
    const nextDraft = updater(draft);
    persistDraft(nextDraft);
  };

  const handleCourseChange = useCallback(
    (courseId: string) => {
      const course = getCourseOptionById(courseId) ?? null;
      const nextDraft = syncCourseMeta(
        course,
        {
          ...draft,
          analysisCompleted: false,
          syllabusFile: null,
          coursewareFiles: [],
          selectedResourceIds: ['doc-1', 'doc-2', 'video-1', 'ai-1', 'ai-2']
        },
        user?.id
      );

      persistDraft(nextDraft);
    },
    [draft, user?.id]
  );

  // 从 /common-chat 跳转过来时（URL 带有 courseId），课程列表加载完成后自动选中对应课程
  const hasAutoSelectedCourseRef = useRef(false);
  useEffect(() => {
    if (
      courseIdFromUrl &&
      courseOptions.length > 0 &&
      !isLoadingCourses &&
      !hasAutoSelectedCourseRef.current
    ) {
      const course = courseOptions.find((c) => c.id === courseIdFromUrl);
      if (course) {
        console.log('useAvatarWizard - 从 URL courseId 自动匹配课程:', {
          courseId: courseIdFromUrl,
          courseName: course.title
        });
        handleCourseChange(courseIdFromUrl);
        hasAutoSelectedCourseRef.current = true;
      } else {
        console.error('useAvatarWizard - URL 中的 courseId 未找到对应课程！', {
          courseIdFromUrl,
          availableCourseIds: courseOptions.map((c) => c.id)
        });
      }
    }
  }, [courseIdFromUrl, courseOptions, isLoadingCourses, handleCourseChange]);

  const handleImageUpload = async (file?: File) => {
    if (!file) {
      return;
    }

    try {
      // 创建 FormData
      const formData = new FormData();
      formData.append('file', file);

      // 上传公开文件
      const result = await uploadFilePublic(formData);

      // 读取文件预览
      const reader = new FileReader();
      reader.onload = () => {
        updateDraft((current) => ({
          ...current,
          courseImagePreview: String(reader.result),
          courseImageName: file.name,
          courseImageUrl: result.fileUrl, // 保存文件 URL
          courseImageKey: result.fileKey, // 保存文件 Key
          updatedAt: new Date().toISOString()
        }));
      };
      reader.readAsDataURL(file);

      toast({
        title: t('aiTeacher.avatar.create.toasts.imageUploadSuccess'),
        description: t('aiTeacher.avatar.create.toasts.imageUploadSuccessDesc', {
          name: file.name
        }),
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
    } catch (error) {
      console.error('上传课程图片失败:', error);
      toast({
        title: t('aiTeacher.avatar.create.toasts.uploadFailed'),
        description: t('aiTeacher.avatar.create.toasts.imageUploadFailedDesc'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    }
  };

  const handleClassToggle = (className: string) => {
    updateDraft((current) => ({
      ...current,
      coverageClasses: current.coverageClasses.includes(className)
        ? current.coverageClasses.filter((item) => item !== className)
        : [...current.coverageClasses, className],
      updatedAt: new Date().toISOString()
    }));
  };

  const handleMultiCheckboxToggle = (key: 'quizMethods' | 'reportDimensions', value: string) => {
    updateDraft((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
      updatedAt: new Date().toISOString()
    }));
  };

  const saveDraftAndExit = () => {
    const normalized = syncCourseMeta(selectedCourse, draft, user?.id);
    // 保存草稿时排除推荐资源勾选状态（推荐资源仅在第三步发布时使用，不持久化）
    const draftToSave = {
      ...normalized,
      selectedResourceIds: [],
      selectedRecommendedResources: []
    };
    persistDraft(draftToSave);
    toast({
      title: t('aiTeacher.avatar.create.toasts.draftSavedAndExit'),
      description: t('aiTeacher.avatar.create.toasts.draftSavedAndExitDesc'),
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top'
    });
    setTimeout(() => {
      window.location.href = '/teacher/ai-teacher';
    }, 500);
  };

  const proceedToNextStep = async () => {
    if (currentStep === 1) {
      if (!isStep1Valid) {
        toast({
          title: t('aiTeacher.avatar.create.toasts.fillClassConfig'),
          description: t('aiTeacher.avatar.create.toasts.fillClassConfigDesc'),
          status: 'warning',
          duration: 2200,
          isClosable: true,
          position: 'top'
        });
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!isStep2Valid) {
        toast({
          title: t('aiTeacher.avatar.create.toasts.completeTeachingPath'),
          description: t('aiTeacher.avatar.create.toasts.completeTeachingPathDesc'),
          status: 'warning',
          duration: 2200,
          isClosable: true,
          position: 'top'
        });
        return;
      }

      // 先跳转到 Step3，然后异步加载资源推荐
      setCurrentStep(3);
      // 异步加载资源推荐，不阻塞页面跳转
      loadResourceRecommendations();
    }
  };

  const handleSyllabusUpload = async (file?: File) => {
    if (!file) {
      return;
    }

    setIsUploadingSyllabus(true);

    try {
      // 创建 FormData
      const formData = new FormData();
      formData.append('file', file);

      // 上传文件
      const result = await uploadPrivateFile(formData);

      // 使用 AI 分析教学大纲（isAnalyzing 会自动变为 true）
      try {
        const analysisResult = await analyzeSyllabus({
          type: 29, // AI 教师类型
          input: '请分析这份教学大纲',
          files: [result.fileUrl || ''] as string[],
          stream: false,
          jsonFormat: true,
          onFinish: (fullText) => {
            console.log('教学大纲分析完成:', fullText);
          },
          onError: (error) => {
            console.error('AI 分析失败:', error);
          }
        });

        console.log('AI 分析结果 (tree):', analysisResult);

        // 更新草稿，保存 fileKey 和 AI 返回的 tree
        updateDraft((current) => ({
          ...current,
          syllabusFile: {
            ...createStoredFileMeta(file),
            fileKey: result.fileKey
          },
          syllabusTree: analysisResult.responseJson, // 保存 AI 返回的 tree
          analysisCompleted: false,
          updatedAt: new Date().toISOString()
        }));

        toast({
          title: t('aiTeacher.avatar.create.toasts.syllabusAnalysisComplete'),
          description: t('aiTeacher.avatar.create.toasts.syllabusAnalysisCompleteDesc'),
          status: 'success',
          duration: 2000,
          isClosable: true,
          position: 'top'
        });
      } catch (analysisError) {
        console.error('AI 分析教学大纲失败:', analysisError);

        // AI 分析失败也要保存文件信息
        updateDraft((current) => ({
          ...current,
          syllabusFile: {
            ...createStoredFileMeta(file),
            fileKey: result.fileKey
          },
          analysisCompleted: false,
          updatedAt: new Date().toISOString()
        }));

        toast({
          title: t('aiTeacher.avatar.create.toasts.syllabusAnalysisFailed'),
          description: t('aiTeacher.avatar.create.toasts.syllabusAnalysisFailedDesc'),
          status: 'warning',
          duration: 3000,
          isClosable: true,
          position: 'top'
        });
      }
    } catch (error) {
      console.error('上传教学大纲失败:', error);
      toast({
        title: t('aiTeacher.avatar.create.toasts.uploadFailed'),
        description: t('aiTeacher.avatar.create.toasts.syllabusUploadFailedDesc'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsUploadingSyllabus(false);
    }
  };

  const handleCoursewareUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    // 检查是否已上传大纲
    if (!draft.syllabusFile) {
      toast({
        title: t('aiTeacher.avatar.create.toasts.uploadSyllabusFirst'),
        status: 'warning',
        duration: 1800,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    // 检查大纲是否已完成 AI 分析
    if (!draft.syllabusTree) {
      toast({
        title: t('aiTeacher.avatar.create.toasts.waitForSyllabusAnalysis'),
        description: t('aiTeacher.avatar.create.toasts.waitForSyllabusAnalysisDesc'),
        status: 'warning',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    const filesArray = Array.from(files);

    // 数量限制
    if (draft.coursewareFiles.length + filesArray.length > 20) {
      toast({
        title: t('aiTeacher.avatar.create.toasts.maxFilesReached', { count: 20 }),
        status: 'warning',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    // 文件类型与大小校验
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'flv'];
    for (const file of filesArray) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!COURSEWARE_ALLOWED_EXTENSIONS.includes(ext as any)) {
        toast({
          title: t('aiTeacher.avatar.create.toasts.fileTypeNotSupported'),
          description: t('aiTeacher.avatar.create.toasts.fileTypeNotSupportedDesc'),
          status: 'warning',
          duration: 3000,
          isClosable: true,
          position: 'top'
        });
        return;
      }

      const isVideo = videoExtensions.includes(ext);
      const maxSize = isVideo ? COURSEWARE_VIDEO_MAX_SIZE : COURSEWARE_DOCUMENT_MAX_SIZE;
      if (file.size > maxSize) {
        toast({
          title: t('aiTeacher.avatar.create.toasts.fileSizeExceeded'),
          description: isVideo
            ? t('aiTeacher.avatar.create.toasts.fileSizeExceededVideo')
            : t('aiTeacher.avatar.create.toasts.fileSizeExceededDoc'),
          status: 'warning',
          duration: 3000,
          isClosable: true,
          position: 'top'
        });
        return;
      }
    }

    setIsUploadingCourseware(true);

    try {
      // 逐个上传文件（因为接口只支持单文件上传）
      const uploadPromises = filesArray.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file); // 使用 'file' 字段名
        return uploadPrivateFile(formData);
      });

      // 等待所有文件上传完成
      const results = await Promise.all(uploadPromises);

      // 将上传结果与文件信息合并，初始化解析状态为 parsing
      const nextFiles = results.map((result, index) => ({
        ...createStoredFileMeta(filesArray[index]),
        fileKey: result.fileKey,
        parseStatus: 'parsing' as const,
        parseProgress: 0
      }));

      // 保存文件列表（解析中状态）
      updateDraft((current) => ({
        ...current,
        coursewareFiles: [...current.coursewareFiles, ...nextFiles],
        analysisCompleted: false,
        updatedAt: new Date().toISOString()
      }));

      toast({
        title: t('aiTeacher.avatar.create.toasts.parseInProgress'),
        description: t('aiTeacher.avatar.create.toasts.parseInProgressDesc'),
        status: 'info',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });

      // ========== 假数据：前端模拟文件解析进度 ==========
      setIsParsingCourseware(true);
      const fileIds = nextFiles.map((f) => f.id);

      // 为每个文件启动独立的定时器模拟解析进度
      fileIds.forEach((fileId, index) => {
        let progress = 0;
        // 每个文件解析耗时 3~6 秒不等， stagger 启动
        const interval = setInterval(() => {
          progress += Math.random() * 15 + 5; // 每次增加 5~20%
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
          }

          setDraft((current) => {
            const updatedFiles = current.coursewareFiles.map((f) => {
              if (f.id !== fileId) return f;
              return {
                ...f,
                parseProgress: Math.round(progress),
                parseStatus: progress >= 100 ? ('parsed' as const) : ('parsing' as const)
              };
            });

            // 检查是否全部解析完成
            const allParsed = updatedFiles.every(
              (f) => f.parseStatus === 'parsed' || f.parseStatus === 'error'
            );

            if (allParsed) {
              setIsParsingCourseware(false);
            }

            return {
              ...current,
              coursewareFiles: updatedFiles,
              analysisCompleted: allParsed,
              updatedAt: new Date().toISOString()
            };
          });
        }, 300 + index * 200); // 每 300ms 更新一次，文件间错开 200ms
      });
      // ========== 假数据结束 ==========

    } catch (error) {
      console.error('上传课件失败:', error);
      toast({
        title: t('aiTeacher.avatar.create.toasts.uploadFailed'),
        description: t('aiTeacher.avatar.create.toasts.coursewareUploadFailedDesc'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsUploadingCourseware(false);
    }
  };

  const handleRemoveCourseware = (fileId: string) => {
    updateDraft((current) => {
      // 找到要删除的文件
      const fileToRemove = current.coursewareFiles.find((item) => item.id === fileId);

      // 过滤掉该文件及其解析结果
      return {
        ...current,
        coursewareFiles: current.coursewareFiles.filter((item) => item.id !== fileId),
        coursewareParseResult: fileToRemove?.fileKey
          ? (current.coursewareParseResult || []).filter(
              (parseItem) => parseItem.fileKey !== fileToRemove.fileKey
            )
          : current.coursewareParseResult,
        analysisCompleted: false,
        updatedAt: new Date().toISOString()
      };
    });
  };

  const startMatching = async () => {
    // 注释掉拦截逻辑，直接展示模拟匹配结果
    if (!draft.syllabusFile || draft.coursewareFiles.length === 0) {
      toast({
        title: t('aiTeacher.avatar.create.toasts.addMaterialsFirst'),
        description: t('aiTeacher.avatar.create.toasts.addMaterialsFirstDesc'),
        status: 'warning',
        duration: 1800,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    if (!draft.syllabusTree) {
      toast({
        title: t('aiTeacher.avatar.create.toasts.missingSyllabusTree'),
        description: t('aiTeacher.avatar.create.toasts.missingSyllabusTreeDesc'),
        status: 'warning',
        duration: 1800,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    // 前端假数据：只要有已解析的文件即可开始匹配
    const parsedFiles = draft.coursewareFiles.filter((f) => f.parseStatus === 'parsed');
    if (parsedFiles.length === 0) {
      toast({
        title: t('aiTeacher.avatar.create.toasts.missingCoursewareParse'),
        description: t('aiTeacher.avatar.create.toasts.missingCoursewareParseDesc'),
        status: 'warning',
        duration: 1800,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    setIsMatching(true);

    try {
      toast({
        title: t('aiTeacher.avatar.create.toasts.matchingInProgress'),
        description: t('aiTeacher.avatar.create.toasts.matchingInProgressDesc'),
        status: 'info',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });

      // 模拟异步延迟，展示加载状态
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 使用真实数据：从课件解析结果和大纲构建匹配结果
      const syllabusTree =
        typeof draft.syllabusTree === 'string'
          ? JSON.parse(draft.syllabusTree)
          : draft.syllabusTree;

      // 前端假数据：构建 content 数组（使用已解析的文件列表模拟）
      const content = parsedFiles.map((file) => ({
        content: `模拟解析内容: ${file.name}`,
        fileKey: file.fileKey || '',
        fileName: file.name
      }));

      const analysisResult = await analyzeSyllabus({
        type: 28, // 知识匹配分析
        input: '请进行知识匹配分析',
        variables: {
          tree: syllabusTree,
          content
        },
        jsonFormat: true,
        stream: false,
        onFinish: (fullText) => {
          console.log('知识匹配分析完成:', fullText);
        },
        onError: (error) => {
          console.error('AI 分析失败:', error);
        }
      });

      console.log('知识匹配分析结果:', analysisResult.responseJson);

      // 解析AI返回的结果
      const matchResult = analysisResult.responseJson;

      // 计算整体匹配度（基于 status 字段）
      let totalSections = 0;
      let coveredSections = 0; // 已覆盖
      let partialSections = 0; // 部分覆盖

      if (matchResult.chapters && Array.isArray(matchResult.chapters)) {
        matchResult.chapters.forEach((chapter: any) => {
          // 新数据结构：sections 直接在 chapter 下
          if (chapter.sections && Array.isArray(chapter.sections)) {
            chapter.sections.forEach((section: any) => {
              totalSections++;
              if (section.status === '已覆盖') {
                coveredSections++;
              } else if (section.status === '部分覆盖') {
                partialSections++;
              }
            });
          }
        });
      }

      // 匹配度计算：已覆盖 100%，部分覆盖 50%
      const matchScore =
        totalSections > 0
          ? Math.round(((coveredSections + partialSections * 0.5) / totalSections) * 100)
          : 0;

      console.log('匹配度计算:', {
        totalSections,
        coveredSections,
        partialSections,
        matchScore
      });

      // 保存分析结果到草稿
      updateDraft((current) => ({
        ...current,
        analysisCompleted: true,
        matchScore,
        matchAnalysisResult: matchResult,
        updatedAt: new Date().toISOString()
      }));

      toast({
        title: t('aiTeacher.avatar.create.toasts.matchingComplete'),
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
    } catch (error) {
      console.error('知识匹配分析失败:', error);
      toast({
        title: t('aiTeacher.avatar.create.toasts.matchingFailed'),
        description: t('aiTeacher.avatar.create.toasts.matchingFailedDesc'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsMatching(false);
    }
  };

  // 加载资源推荐（进入 Step3 时调用 type:30）
  const loadResourceRecommendations = async () => {
    if (!draft.matchAnalysisResult) {
      toast({
        title: t('aiTeacher.avatar.create.toasts.missingMatchResult'),
        description: t('aiTeacher.avatar.create.toasts.missingMatchResultDesc'),
        status: 'warning',
        duration: 1800,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    if (!draft.syllabusTree) {
      toast({
        title: t('aiTeacher.avatar.create.toasts.missingSyllabusTree'),
        description: t('aiTeacher.avatar.create.toasts.missingSyllabusTreeDesc'),
        status: 'warning',
        duration: 1800,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    setIsLoadingResources(true);

    try {
      // ========== 假数据：前端模拟资源推荐结果 ==========
      // 模拟短暂延迟后返回假数据，避免真实 API 调用阻塞开发验证
      await new Promise((resolve) => setTimeout(resolve, 800));

      const syllabusTree =
        typeof draft.syllabusTree === 'string'
          ? JSON.parse(draft.syllabusTree)
          : draft.syllabusTree;

      const fakeData = (syllabusTree?.chapters || []).map((chapter: any, chapterIndex: number) => {
        const chapterId = `C${String(chapterIndex + 1).padStart(2, '0')}`;
        return {
          chapterId,
          chapterName: chapter.chapter_name,
          sections: (chapter.sections || []).map((section: any, sectionIndex: number) => ({
            sectionId: `${chapterId}_S${String(sectionIndex + 1).padStart(2, '0')}`,
            sectionName: section.section_name,
            resources:
              sectionIndex % 2 === 0
                ? [
                    {
                      fileKey: `fake-${chapterId}-S${sectionIndex + 1}-01`,
                      fileName: `${section.section_name} - 推荐课件.pptx`,
                      knowledgePoints: ['知识点1', '知识点2'],
                      category: 'doc'
                    },
                    {
                      fileKey: `fake-${chapterId}-S${sectionIndex + 1}-02`,
                      fileName: `${section.section_name} - 教学视频.mp4`,
                      knowledgePoints: ['实操演示'],
                      category: 'video'
                    }
                  ]
                : []
          }))
        };
      });

      const fakeResult = {
        code: 200,
        message: 'success',
        data: fakeData
      };

      updateDraft((current) => ({
        ...current,
        resourceRecommendations: fakeResult,
        updatedAt: new Date().toISOString()
      }));

      toast({
        title: '资源推荐完成',
        description: `已为 ${fakeData.length} 个章节生成推荐资源`,
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });

      setIsLoadingResources(false);
      return;
      // ========== 假数据结束 ==========
    } catch (error) {
      console.error('资源推荐失败:', error);
      toast({
        title: t('aiTeacher.avatar.create.toasts.resourceRecommendFailed'),
        description: t('aiTeacher.avatar.create.toasts.resourceRecommendFailedDesc'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsLoadingResources(false);
    }
  };

  const handleToggleResource = (
    resourceId: string,
    resourceInfo?: {
      fileKey: string;
      fileName: string;
      category: string;
      chapterIndex: number;
      sectionIndex: number;
      chapterName: string;
      sectionName: string;
    }
  ) => {
    // 仅更新内存状态，不持久化到缓存（推荐资源勾选仅用于发布时使用）
    setDraft((current) => {
      const isCurrentlySelected = current.selectedResourceIds.includes(resourceId);
      const newSelectedIds = isCurrentlySelected
        ? current.selectedResourceIds.filter((id) => id !== resourceId)
        : [...current.selectedResourceIds, resourceId];

      // 同步更新 selectedRecommendedResources
      let newSelectedResources = current.selectedRecommendedResources || [];
      if (isCurrentlySelected) {
        // 取消勾选：移除对应资源（必须同时匹配 fileKey、chapterIndex、sectionIndex，
        // 避免同一章不同节出现相同 fileKey 时误删其他节的资源）
        newSelectedResources = newSelectedResources.filter(
          (r) =>
            !(
              r.fileKey === resourceInfo?.fileKey &&
              r.chapterName === resourceInfo?.chapterName &&
              r.sectionName === resourceInfo?.sectionName
            )
        );
      } else if (resourceInfo) {
        // 勾选：添加资源信息
        const alreadyExists = newSelectedResources.some(
          (r) =>
            r.fileKey === resourceInfo.fileKey &&
            r.chapterName === resourceInfo.chapterName &&
            r.sectionName === resourceInfo.sectionName
        );
        if (!alreadyExists) {
          newSelectedResources = [...newSelectedResources, resourceInfo];
        }
      }

      return {
        ...current,
        selectedResourceIds: newSelectedIds,
        selectedRecommendedResources: newSelectedResources,
        updatedAt: new Date().toISOString()
      };
    });
  };

  const handleStartCreateTextbook = (chapterId: string, currentName?: string) => {
    setEditingTextbookId(chapterId);
    setTextbookInput(currentName || '');
  };

  const handleSubmitTextbook = (chapterId: string) => {
    const name = textbookInput.trim();
    if (!name) {
      toast({
        title: t('aiTeacher.avatar.create.toasts.enterTextbookName'),
        status: 'warning',
        duration: 1800,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    const existing = draft.digitalTextbooks.find((item) => item.chapterId === chapterId);

    updateDraft((current) => {
      const existingInCurrent = current.digitalTextbooks.find(
        (item) => item.chapterId === chapterId
      );

      if (existingInCurrent) {
        // 编辑现有教材
        return {
          ...current,
          digitalTextbooks: current.digitalTextbooks.map((item) =>
            item.chapterId === chapterId ? { ...item, name } : item
          ),
          updatedAt: new Date().toISOString()
        };
      } else {
        // 创建新教材
        return {
          ...current,
          digitalTextbooks: [
            ...current.digitalTextbooks,
            {
              id: `textbook-${Date.now()}`,
              chapterId,
              name,
              createdAt: new Date().toISOString().split('T')[0]
            }
          ],
          updatedAt: new Date().toISOString()
        };
      }
    });

    setEditingTextbookId(null);
    setTextbookInput('');

    toast({
      title: existing
        ? t('aiTeacher.avatar.create.toasts.textbookUpdated')
        : t('aiTeacher.avatar.create.toasts.textbookCreated'),
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top'
    });
  };

  const handleDeleteTextbook = (chapterId: string) => {
    updateDraft((current) => ({
      ...current,
      digitalTextbooks: current.digitalTextbooks.filter((item) => item.chapterId !== chapterId),
      updatedAt: new Date().toISOString()
    }));

    toast({
      title: t('aiTeacher.avatar.create.toasts.textbookDeleted'),
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top'
    });
  };

  const handleCancelEdit = () => {
    setEditingTextbookId(null);
    setTextbookInput('');
  };

  const handleTextbookInputChange = (value: string) => {
    setTextbookInput(value);
  };

  const publishAvatar = async () => {
    // 从 store 中获取 teacherId
    const teacherId = user?.teacherId;

    if (!teacherId) {
      toast({
        title: t('aiTeacher.avatar.create.toasts.userInfoError'),
        description: t('aiTeacher.avatar.create.toasts.userInfoErrorDesc'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    if (!selectedCourse) {
      toast({
        title: t('aiTeacher.avatar.create.toasts.selectCourse'),
        status: 'warning',
        duration: 2200,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    if (!draft.analysisCompleted) {
      toast({
        title: t('aiTeacher.avatar.create.toasts.completeAnalysisFirst'),
        status: 'warning',
        duration: 2200,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    try {
      toast({
        title: t('aiTeacher.avatar.create.toasts.creatingAvatar'),
        status: 'info',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });

      // 解析大纲数据
      const syllabusTree =
        typeof draft.syllabusTree === 'string'
          ? JSON.parse(draft.syllabusTree)
          : draft.syllabusTree;

      // 解析资源推荐数据
      const resourceData =
        typeof draft.resourceRecommendations === 'string'
          ? JSON.parse(draft.resourceRecommendations)
          : draft.resourceRecommendations;

      // 解析匹配分析结果（用于获取 covered_files）
      const matchAnalysisResult = draft.matchAnalysisResult;
      const matchChapters = matchAnalysisResult?.chapters || [];

      console.log('匹配分析结果:', matchAnalysisResult);
      console.log('匹配章节数量:', matchChapters.length);

      // 构建章节列表（从大纲数据转换，并添加勾选的资源）
      const chapterList = syllabusTree.chapters.map((chapter: any, chapterIndex: number) => {
        // 查找对应的资源推荐章节（使用宽松匹配，忽略空格差异）
        // 标准化章节名称：去除多余空格，统一格式
        const normalizeChapterName = (name: string) => {
          return name
            .replace(/\s+/g, ' ') // 将多个空格替换为单个空格
            .replace(/\.\s+/g, '.') // 将 ". " 替换为 "."
            .replace(/\s+\./g, '.') // 将 " ." 替换为 "."
            .trim();
        };

        const normalizedChapterName = normalizeChapterName(chapter.chapter_name);

        const resourceChapter = resourceData?.data?.find((rc: any) => {
          const normalizedResourceChapterName = normalizeChapterName(rc.chapterName);
          return normalizedChapterName === normalizedResourceChapterName;
        });

        return {
          title: chapter.chapter_name,
          sortOrder: chapterIndex + 1,
          openMode: chapter.openMode,
          openTime: chapter.openTime,
          knowledgePoints:
            chapter.sections
              ?.flatMap((section: any) => section.topics || [])
              .map((topic: string, index: number) => ({
                name: topic,
                sortOrder: index + 1
              })) || [],
          materials: [], // 章节级别暂不添加资源
          children:
            chapter.sections?.map((section: any, sectionIndex: number) => {
              console.log(`\n  ========== 处理节: ${section.section_name} ==========`);
              console.log('  节完整数据:', section);

              // 查找对应的资源推荐节（使用宽松匹配，忽略空格差异）
              console.log('  开始查找资源推荐节...');
              console.log(
                '  resourceChapter?.sections:',
                resourceChapter?.sections?.map((rs: any) => rs.sectionName)
              );

              // 标准化节名称：去除多余空格，统一格式
              const normalizeSectionName = (name: string) => {
                return name
                  .replace(/\s+/g, ' ') // 将多个空格替换为单个空格
                  .replace(/\.\s+/g, '.') // 将 ". " 替换为 "."
                  .replace(/\s+\./g, '.') // 将 " ." 替换为 "."
                  .replace(/\(/g, '(') // 统一括号
                  .replace(/\)/g, ')')
                  .replace(/（/g, '(') // 将中文括号替换为英文括号
                  .replace(/）/g, ')')
                  .trim();
              };

              const normalizedSectionName = normalizeSectionName(section.section_name);
              console.log('  标准化后的节名:', normalizedSectionName);

              const resourceSection = resourceChapter?.sections?.find((rs: any) => {
                const normalizedResourceSectionName = normalizeSectionName(rs.sectionName);
                console.log(
                  `    比较: "${normalizedSectionName}" === "${normalizedResourceSectionName}"`,
                  normalizedSectionName === normalizedResourceSectionName
                );
                return normalizedSectionName === normalizedResourceSectionName;
              });

              console.log(`  资源推荐节匹配结果:`, resourceSection ? '✓ 找到' : '✗ 未找到');
              if (resourceSection) {
                console.log('  资源推荐节详情:', resourceSection);
                console.log('  资源推荐节的资源数量:', resourceSection.resources?.length || 0);
              } else {
                console.warn(`  ✗ 未找到资源推荐节！节名称: "${section.section_name}"`);
              }

              // 查找对应的匹配分析节（用于获取 covered_files）
              const matchChapter = matchChapters.find((mc: any) => {
                const normalizedMatchChapterName = normalizeChapterName(mc.chapter_name);
                return normalizedChapterName === normalizedMatchChapterName;
              });

              const matchSection = matchChapter?.sections?.find((ms: any) => {
                const normalizedMatchSectionName = normalizeSectionName(ms.section_name);
                return normalizedSectionName === normalizedMatchSectionName;
              });

              console.log('  匹配分析节:', matchSection ? '✓ 找到' : '✗ 未找到');
              if (matchSection) {
                console.log('  匹配分析节的 covered_files:', (matchSection as any).covered_files);
              }

              // 构建该节的 materials 列表
              const materials: any[] = [];

              // 1. 首先添加匹配分析结果中的 covered_files（Step2 的课件文件）
              if (
                (matchSection as any)?.covered_files &&
                Array.isArray((matchSection as any).covered_files)
              ) {
                (matchSection as any).covered_files.forEach((file: any) => {
                  // 注意：匹配结果中的字段名是 filekey（全小写），不是 fileKey
                  const fileKey = file.fileKey ?? file.filekey ?? null;
                  const fileName = file.fileName;
                  const fileUrl = file.fileUrl || '';

                  if (fileName) {
                    // 推断文件类型和格式
                    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                    let fileType = file.fileType || 'document';
                    let fileFormat = fileExtension;

                    // 兼容openmaic/digital类型的文件
                    if (file.fileType !== 'openmaic' && file.fileType !== 'digital') {
                      if (['mp4', 'avi', 'mov', 'wmv'].includes(fileExtension)) {
                        fileType = 'video';
                      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension)) {
                        fileType = 'image';
                      } else if (['mp3', 'wav', 'flac', 'aac'].includes(fileExtension)) {
                        fileType = 'audio';
                      }
                    }

                    const material = {
                      fileName: fileName,
                      fileKey: fileKey,
                      fileUrl: fileUrl,
                      fileSize: 0,
                      fileType,
                      fileFormat,
                      sortOrder: materials.length + 1
                    };

                    console.log(`      ✓ 添加匹配分析的课件文件:`, material);
                    materials.push(material);
                  }
                });
              }

              // 2. 然后添加用户在 Step3 勾选的资源推荐文件
              // 构建该节的 materials 列表（只包含用户勾选的资源）

              if (resourceSection?.resources) {
                console.log(
                  `  节 ${resourceSection.sectionId} 有 ${resourceSection.resources.length} 个资源`
                );

                resourceSection.resources.forEach((resource: any, resourceIndex: number) => {
                  // 使用 chapterName + sectionName + fileKey 匹配勾选的资源
                  const isSelected = draft.selectedRecommendedResources.some(
                    (r) =>
                      r.chapterName === chapter.chapter_name &&
                      r.sectionName === section.section_name &&
                      r.fileKey === resource.fileKey
                  );

                  console.log(`    资源 ${resourceIndex}:`, {
                    fileName: resource.fileName,
                    fileKey: resource.fileKey,
                    isSelected,
                    selectedRecommendedResources: draft.selectedRecommendedResources
                  });

                  // 检查用户是否勾选了该资源
                  if (isSelected) {
                    console.log(`      ✓ 资源已勾选，直接使用资源推荐的 fileKey`);

                    // 推断文件类型和格式
                    const fileExtension = resource.fileName.split('.').pop()?.toLowerCase() || '';
                    let fileType = resource.fileType || 'document';
                    let fileFormat = fileExtension;

                    // 兼容openmaic/digital类型的文件
                    if (resource.fileType !== 'openmaic' && resource.fileType !== 'digital') {
                      if (['mp4', 'avi', 'mov', 'wmv'].includes(fileExtension)) {
                        fileType = 'video';
                      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension)) {
                        fileType = 'image';
                      } else if (['mp3', 'wav', 'flac', 'aac'].includes(fileExtension)) {
                        fileType = 'audio';
                      }
                    }

                    const material = {
                      fileName: resource.fileName,
                      fileKey: resource.fileKey, // 直接使用资源推荐返回的 fileKey
                      fileUrl: '', // 后端会根据 fileKey 生成 URL
                      fileSize: 0, // 暂时没有文件大小信息
                      fileType,
                      fileFormat,
                      sortOrder: materials.length + 1
                    };

                    console.log(`      ✓ 添加到 materials:`, material);
                    materials.push(material);
                  } else {
                    console.log(`      ✗ 资源未勾选，跳过`);
                  }
                });
              }

              console.log(`  节 ${section.section_name} 的 materials:`, {
                count: materials.length,
                materials: materials.map((m) => ({
                  fileName: m.fileName,
                  fileKey: m.fileKey
                }))
              });

              return {
                title: section.section_name,
                sortOrder: sectionIndex + 1,
                openMode: section.openMode,
                openTime: section.openTime,
                knowledgePoints: (section.topics || []).map((topic: string, index: number) => ({
                  name: topic,
                  sortOrder: index + 1
                })),
                materials,
                children: []
              };
            }) || []
        };
      });

      console.log('构建的章节列表（包含勾选的资源）:', JSON.stringify(chapterList, null, 2));

      // 构建教学配置
      const teachingConfig = {
        knowledgeLevel: draft.weights.knowledge, // 滑块值已经是 0-3，直接使用
        skillLevel: draft.weights.ability,
        innovationLevel: draft.weights.quality,
        enableAfterClassQuiz: draft.quizMethods.includes('afterClassExercise'),
        enableChapterTest: draft.quizMethods.includes('chapterTest'),
        enableRandomQuiz: draft.quizMethods.includes('randomQuestionQuiz'),
        enableAIEvaluation: draft.quizMethods.includes('aiQaAssessment'),
        enableProgressTracking: draft.reportDimensions.includes('learningProgress'),
        enableKnowledgeAnalysis: draft.reportDimensions.includes('knowledgeMastery'),
        enableAbilityGrowth: draft.reportDimensions.includes('abilityGrowth'),
        enableBehaviorAnalysis: draft.reportDimensions.includes('learningBehavior'),
        enablePeerComparison: draft.reportDimensions.includes('peerComparison')
      };

      // 构建请求数据
      const requestData = {
        teacherId,
        teachingTaskId: parseInt(draft.courseId), // 教学任务ID
        coverUrl: draft.courseImageUrl || '', // 课程封面URL（只使用上传后的 URL，不使用 base64 预览）
        description: draft.title || selectedCourse.title, // 课程描述
        startTime: draft.startDate ? `${draft.startDate} 00:00:00` : '', // 开始时间（补全时分秒）
        endTime: draft.endDate ? `${draft.endDate} 23:59:59` : '', // 结束时间（补全时分秒）
        status: 1, // 状态：1-发布（运行中）
        teachingConfig,
        classIds: draft.coverageClasses
          .map((className) => {
            // 根据班级名称查找对应的班级ID
            const classIndex = selectedCourse.classes.indexOf(className);
            if (classIndex !== -1 && selectedCourse.classIds) {
              return selectedCourse.classIds[classIndex];
            }
            console.warn(`未找到班级 "${className}" 的ID`);
            return null;
          })
          .filter((id): id is number => id !== null), // 过滤掉 null 值
        chapterList
      };

      // console.log('创建AI分身请求数据:', requestData);
      // console.log('课程封面 URL:', draft.courseImageUrl);
      // 调用创建AI分身接口
      const result = await createAiAvatar(requestData);

      console.log('创建AI分身成功:', result);

      // 清除草稿
      clearStoredWizardDraft(user?.id);

      toast({
        title: t('aiTeacher.avatar.create.toasts.createSuccess'),
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });

      // 跳转到 AI 教师列表
      setTimeout(() => {
        window.location.href = '/teacher/ai-teacher';
      }, 500);
    } catch (error) {
      console.error('创建AI分身失败:', error);
      toast({
        title: t('aiTeacher.avatar.create.toasts.createFailed'),
        description:
          error instanceof Error
            ? error.message
            : t('aiTeacher.avatar.create.toasts.createFailedDesc'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    }
  };

  const saveAsPending = () => {
    const normalized = syncCourseMeta(selectedCourse, draft, user?.id);
    // 保存草稿时排除推荐资源勾选状态（推荐资源仅在第三步发布时使用，不持久化）
    const draftToSave = {
      ...normalized,
      selectedResourceIds: [],
      selectedRecommendedResources: []
    };
    // 直接保存到草稿，而不是保存到记录数组
    persistDraft(draftToSave);
    toast({
      title: t('aiTeacher.avatar.create.toasts.pendingSaved'),
      description: t('aiTeacher.avatar.create.toasts.pendingSavedDesc'),
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top'
    });
    setTimeout(() => {
      window.location.href = '/teacher/ai-teacher';
    }, 500);
  };

  return {
    draft,
    currentStep,
    setCurrentStep,
    isMatching,
    isAnalyzing,
    isLoadingResources,
    isUploadingSyllabus,
    isUploadingCourseware,
    isParsingCourseware,
    selectedCourse,
    availableClasses,
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    courseOptions,
    isLoadingCourses,
    editingTextbookId,
    textbookInput,
    updateDraft,
    handleCourseChange,
    handleImageUpload,
    handleClassToggle,
    handleMultiCheckboxToggle,
    saveDraftAndExit,
    proceedToNextStep,
    handleSyllabusUpload,
    handleCoursewareUpload,
    handleRemoveCourseware,
    startMatching,
    handleToggleResource,
    handleStartCreateTextbook,
    handleSubmitTextbook,
    handleDeleteTextbook,
    handleCancelEdit,
    handleTextbookInputChange,
    publishAvatar,
    saveAsPending
  };
}
