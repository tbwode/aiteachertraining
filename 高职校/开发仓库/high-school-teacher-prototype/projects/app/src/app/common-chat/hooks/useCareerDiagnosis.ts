'use client';

import { useCallback, useRef, useState } from 'react';
import { useSimpleChat } from '@/web/common/hooks/useSimpleChat';
import { AgentAppointedTypeEnum } from '@/student/types/agent';
import { postCourseSquarePage } from '@/api/student/student';
import type {
  CareerDiagnosisResult,
  CourseMatchMap,
  TargetPosition
} from '@/types/career-diagnosis';

/** 当前能力维度分值（与 radar_chart.items 结构一致） */
type CurrentAbility = { dimension: string; value: number };

/** fetchCareerDiagnosis 入参 */
type FetchCareerDiagnosisParams = {
  studentId: number;
  studentName?: string;
  studentCode?: string;
  majorName: string;
  abilityDimensions: string[];
  currentAbilities: CurrentAbility[];
};

const CACHE_PREFIX = 'career_diagnosis_';

/** 生成缓存 key：studentId + majorName + 能力分值指纹 */
const buildCacheKey = (
  studentId: number,
  majorName: string,
  currentAbilities: CurrentAbility[]
): string => {
  const abilityFingerprint = currentAbilities
    .map((a) => `${a.dimension}:${a.value}`)
    .sort()
    .join('|');
  return `${CACHE_PREFIX}${studentId}_${majorName}_${abilityFingerprint}`;
};

/** 读取 sessionStorage 缓存 */
const readCache = (key: string): CareerDiagnosisResult | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CareerDiagnosisResult) : null;
  } catch {
    return null;
  }
};

const writeCache = (key: string, data: CareerDiagnosisResult) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // 忽略 quota 超限
  }
};

export type UseCareerDiagnosisReturn = {
  careerDiagnosis: CareerDiagnosisResult | null;
  careerLoading: boolean;
  careerError: boolean;
  courseMatchMap: CourseMatchMap;
  fetchCareerDiagnosis: (params: FetchCareerDiagnosisParams) => Promise<void>;
  invalidateCareer: (studentId: number) => void;
};

/**
 * 职业能力诊断 Hook
 * 调用 AI agent（type=30, jsonFormat）生成目标岗位/能力差距/提升计划，
 * 并异步对推荐课程做课程广场模糊匹配。结果按 studentId+majorName+能力分值缓存。
 */
export function useCareerDiagnosis(): UseCareerDiagnosisReturn {
  const { sendMessage } = useSimpleChat();
  const [careerDiagnosis, setCareerDiagnosis] = useState<CareerDiagnosisResult | null>(null);
  const [careerLoading, setCareerLoading] = useState(false);
  const [careerError, setCareerError] = useState(false);
  const [courseMatchMap, setCourseMatchMap] = useState<CourseMatchMap>({});
  const abortRef = useRef(false);

  /** 对推荐课程做课程广场模糊匹配 */
  const matchCourses = useCallback(
    async (positions: TargetPosition[], studentId: number) => {
      const courseNames = Array.from(
        new Set(positions.flatMap((p) => p.recommendedCourses?.map((c) => c.name) ?? []))
      ).filter(Boolean);

      if (courseNames.length === 0) return;

      const entries = await Promise.all(
        courseNames.map(async (name) => {
          try {
            const res = await postCourseSquarePage({
              studentId,
              searchKey: name,
              current: 1,
              size: 1
            });
            const hit = res?.records?.[0];
            return [
              name,
              hit
                ? {
                    avatarId: hit.avatarId,
                    courseId: hit.courseId,
                    courseName: hit.courseName,
                    coverUrl: hit.coverUrl,
                    majorName: hit.majorName,
                    teacherName: hit.teacherName,
                    isEnrolled: hit.isEnrolled
                  }
                : null
            ] as const;
          } catch {
            return [name, null] as const;
          }
        })
      );
      setCourseMatchMap(Object.fromEntries(entries));
    },
    []
  );

  const fetchCareerDiagnosis = useCallback(
    async (params: FetchCareerDiagnosisParams) => {
      const { studentId, majorName, abilityDimensions, currentAbilities } = params;
      if (!majorName || abilityDimensions.length === 0) {
        setCareerError(true);
        return;
      }

      // 1. 读缓存
      const cacheKey = buildCacheKey(studentId, majorName, currentAbilities);
      const cached = readCache(cacheKey);
      if (cached && cached.targetPositions?.length > 0) {
        setCareerDiagnosis(cached);
        setCareerError(false);
        void matchCourses(cached.targetPositions, studentId);
        return;
      }

      // ⚠️ MOCK 数据：type=30 智能体未配置时使用，配置后可删除
      const dims = abilityDimensions.length >= 5 ? abilityDimensions : ['知识掌握', '学习效率', '学习毅力', '创新思维', '实践能力'];
      const mockData: CareerDiagnosisResult = {
        targetPositions: [
          {
            id: 'pos-1',
            name: '机械设计工程师',
            summary: '负责机械产品结构与传动设计，需扎实制图与力学基础，掌握 CAD/CAE 工具。',
            abilities: [
              { dimension: dims[0], target: 85 },
              { dimension: dims[1], target: 70 },
              { dimension: dims[2], target: 75 },
              { dimension: dims[3], target: 80 },
              { dimension: dims[4], target: 85 }
            ],
            gaps: [
              { dimension: dims[0], current: 60, target: 85, gap: 25, suggestion: '加强机械原理与制图基础，建议复习教材并多做习题' },
              { dimension: dims[3], current: 45, target: 80, gap: 35, suggestion: '多参与创新设计竞赛与项目实践' },
              { dimension: dims[4], current: 50, target: 85, gap: 35, suggestion: '增加实训项目练习，提升动手能力' },
              { dimension: dims[1], current: 50, target: 70, gap: 20, suggestion: '提升学习规划与方法，使用番茄工作法' },
              { dimension: dims[2], current: 55, target: 75, gap: 20, suggestion: '制定长期学习计划并坚持执行' }
            ],
            recommendedCourses: [
              { name: '机械制图', reason: '机械设计基础，提升制图与识图能力', estimatedHours: 48 },
              { name: '机械原理', reason: '掌握机构分析与设计核心方法', estimatedHours: 64 },
              { name: '单片机原理及应用', reason: '机电一体化必备，已选修可继续深入学习', estimatedHours: 32 }
            ],
            recommendedBooks: [
              { title: '机械设计手册', author: '成大先', reason: '机械设计权威工具书，查阅常用机构与标准件', category: '进阶' },
              { title: '机械制图与识图入门', reason: '制图入门基础，适合零基础起步', category: '入门' },
              { title: '机械创新设计实例', reason: '启发创新思维，积累设计案例', category: '实战' }
            ]
          },
          {
            id: 'pos-2',
            name: '机械制造工程师',
            summary: '负责制造工艺与产线规划，侧重工艺规程编制与质量控制。',
            abilities: [
              { dimension: dims[0], target: 80 },
              { dimension: dims[1], target: 75 },
              { dimension: dims[2], target: 80 },
              { dimension: dims[3], target: 65 },
              { dimension: dims[4], target: 90 }
            ],
            gaps: [
              { dimension: dims[4], current: 50, target: 90, gap: 40, suggestion: '加强工艺实训，深入车间了解加工流程' },
              { dimension: dims[2], current: 55, target: 80, gap: 25, suggestion: '坚持工艺规程编制练习' },
              { dimension: dims[1], current: 50, target: 75, gap: 25, suggestion: '系统学习工艺学知识体系' },
              { dimension: dims[0], current: 60, target: 80, gap: 20, suggestion: '巩固制造工艺理论基础' },
              { dimension: dims[3], current: 45, target: 65, gap: 20, suggestion: '关注智能制造新趋势' }
            ],
            recommendedCourses: [
              { name: '机械制造技术', reason: '制造工艺核心课程，覆盖车铣刨磨', estimatedHours: 56 },
              { name: '公差配合与测量', reason: '质量控制基础，掌握几何公差标准', estimatedHours: 32 }
            ],
            recommendedBooks: [
              { title: '机械制造工艺学', author: '王先逵', reason: '制造工艺经典教材，系统全面', category: '进阶' },
              { title: '几何量公差与测量', reason: '质检入门，理解互换性原则', category: '入门' }
            ]
          },
          {
            id: 'pos-3',
            name: '设备运维工程师',
            summary: '负责生产设备安装调试与维护保养，需机电综合能力。',
            abilities: [
              { dimension: dims[0], target: 70 },
              { dimension: dims[1], target: 80 },
              { dimension: dims[2], target: 85 },
              { dimension: dims[3], target: 60 },
              { dimension: dims[4], target: 88 }
            ],
            gaps: [
              { dimension: dims[4], current: 50, target: 88, gap: 38, suggestion: '多参与设备拆装与故障排查实训' },
              { dimension: dims[2], current: 55, target: 85, gap: 30, suggestion: '运维岗位需高度耐心，培养严谨习惯' },
              { dimension: dims[1], current: 50, target: 80, gap: 30, suggestion: '快速定位故障需要高效学习方法' },
              { dimension: dims[0], current: 60, target: 70, gap: 10, suggestion: '掌握机电设备原理' },
              { dimension: dims[3], current: 45, target: 60, gap: 15, suggestion: '了解智能化运维方案' }
            ],
            recommendedCourses: [
              { name: '机电设备维修', reason: '运维核心技能，覆盖常见故障处理', estimatedHours: 40 },
              { name: '液压与气动技术', reason: '设备动力系统基础', estimatedHours: 36 }
            ],
            recommendedBooks: [
              { title: '机电设备故障诊断与维修', reason: '实战案例丰富，贴合岗位', category: '实战' },
              { title: '机械维修手册', reason: '工具书，查阅零部件维修规范', category: '进阶' }
            ]
          }
        ],
        trainingPlanAbilities: [
          { dimension: dims[0], training: 75 },
          { dimension: dims[1], training: 65 },
          { dimension: dims[2], training: 70 },
          { dimension: dims[3], training: 70 },
          { dimension: dims[4], training: 80 }
        ]
      };
      setCareerDiagnosis(mockData);
      setCareerError(false);
      writeCache(cacheKey, mockData);
      void matchCourses(mockData.targetPositions, studentId);
      return;

      // 2. 调 AI agent（type=30 智能体配置后启用，当前被上方 mock 拦截）
      setCareerLoading(true);
      setCareerError(false);
      abortRef.current = false;
      try {
        const result = await sendMessage({
          type: AgentAppointedTypeEnum.CAREER_DIAGNOSIS,
          input: '请根据学生专业与当前能力生成职业诊断与提升计划',
          stream: false,
          jsonFormat: true,
          variables: {
            majorName,
            abilityDimensions,
            currentAbilities,
            studentName: params.studentName ?? '',
            studentCode: params.studentCode ?? ''
          }
        });

        if (abortRef.current) return;

        const data = result?.responseJson as CareerDiagnosisResult | undefined;
        if (data && Array.isArray(data.targetPositions) && data.targetPositions.length > 0) {
          setCareerDiagnosis(data);
          writeCache(cacheKey, data);
          void matchCourses(data.targetPositions, studentId);
        } else {
          setCareerError(true);
        }
      } catch (err) {
        console.error('[useCareerDiagnosis] AI 诊断失败:', err);
        if (!abortRef.current) setCareerError(true);
      } finally {
        if (!abortRef.current) setCareerLoading(false);
      }
    },
    [sendMessage, matchCourses]
  );

  /** 失效缓存（更新画像后调用） */
  const invalidateCareer = useCallback((studentId: number) => {
    if (typeof window === 'undefined') return;
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith(`${CACHE_PREFIX}${studentId}_`))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch {
      // ignore
    }
    setCareerDiagnosis(null);
    setCourseMatchMap({});
  }, []);

  return {
    careerDiagnosis,
    careerLoading,
    careerError,
    courseMatchMap,
    fetchCareerDiagnosis,
    invalidateCareer
  };
}

export default useCareerDiagnosis;
