import { StudentDetailModal as LearningRiskStudentDetailModal } from '@/app/teacher/(layoutPage)/home/components/StudentDetailModal';
import {
  initialStudents,
  type LearningRiskLevel,
  type StudentTodo
} from '@/app/teacher/(layoutPage)/home/constants';
import type { StudentData } from '../constants';

type StudentDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  student: StudentData | null;
  detailTitle: string;
  avatarId: number;
  onRemind: () => void;
};

const learningProfiles = [
  {
    riskType: '知识薄弱',
    riskSignalList: [
      '同类题连续 3 次出错',
      '关键步骤追问频率高于班级均值',
      '课后巩固任务完成不稳定'
    ],
    weakKnowledgePoints: ['BMS 均衡策略', '单体一致性判定', 'SOC 估算'],
    recommendedActions: [
      '推送 10 分钟均衡策略微课',
      '安排 5 道分层诊断题',
      '下次实训重点观察数据流判读'
    ],
    lagReasonList: ['概念辨析停留在记忆层面', '未形成“现象—参数—结论”的完整分析链']
  },
  {
    riskType: '实训表现',
    riskSignalList: ['实训流程存在漏项', '故障复核步骤用时较长', '报告证据记录不完整'],
    weakKnowledgePoints: ['高压互锁逻辑', '线束通断检测', '故障树分析'],
    recommendedActions: ['指派高压互锁分步实训', '开放 1 次错题针对性重测', '提供标准作业记录模板'],
    lagReasonList: ['操作熟练度不足', '理论判断尚未稳定迁移到实训场景']
  },
  {
    riskType: '学习状态良好',
    riskSignalList: ['近 7 天保持稳定学习', '课程任务按时完成', '测验成绩稳定于班级均值之上'],
    weakKnowledgePoints: ['热失控分级响应', '绝缘故障复核'],
    recommendedActions: ['推送 1 个综合迁移案例', '引导完成小组协作诊断', '保持当前学习节奏'],
    lagReasonList: ['当前无明显滞后', '综合故障场景的解释深度仍可继续提升']
  }
] as const;

function getRiskLevel(student: StudentData): LearningRiskLevel {
  if (student.status === 'completed' || (student.status === 'normal' && student.progress >= 60)) {
    return 'low';
  }
  if (student.status === 'not-started' || student.progress < 40) return 'critical';
  if (student.status === 'lagging' || student.progress < 60) return 'high';
  return 'medium';
}

function toLearningRiskStudent(
  student: StudentData,
  detailTitle: string,
  avatarId: number
): StudentTodo {
  const knownStudent = initialStudents.find((item) => item.studentId === student.studentId);
  if (knownStudent) {
    return {
      ...knownStudent,
      name: student.name,
      className: student.className,
      progress: student.progress,
      studyHours: student.studyHours,
      lastStudyTimeDesc: student.lastStudy,
      reminded: Boolean(student.reminded)
    };
  }

  const parsedId = Number(student.id.replace(/\D/g, ''));
  const profileSeed = student.studentId ?? (Number.isFinite(parsedId) ? parsedId : 0);
  const profile = learningProfiles[profileSeed % learningProfiles.length];
  const riskLevel = getRiskLevel(student);
  const isHealthy = riskLevel === 'low';

  return {
    id: `${student.id}-${avatarId}`,
    studentId: student.studentId,
    name: student.name,
    className: student.className,
    course: detailTitle,
    avatarId,
    progress: student.progress,
    delayDays: isHealthy ? 0 : Math.max(1, Math.ceil((65 - student.progress) / 8)),
    reminded: Boolean(student.reminded),
    studyHours: student.studyHours,
    lastStudyTimeDesc: student.lastStudy,
    lagReasonList: profile.lagReasonList.slice(),
    riskLevel,
    riskType: isHealthy ? '学习正常' : profile.riskType,
    riskScore: isHealthy
      ? Math.max(12, 52 - Math.round(student.progress / 2))
      : Math.min(95, 112 - student.progress),
    progressGap: isHealthy ? 0 : Math.max(5, 68 - student.progress),
    uncompletedTaskCount: isHealthy ? 0 : Math.max(1, Math.ceil((70 - student.progress) / 14)),
    riskSignalList: profile.riskSignalList.slice(),
    weakKnowledgePoints: profile.weakKnowledgePoints.slice(),
    recommendedActions: profile.recommendedActions.slice()
  };
}

export function StudentDetailModal({
  isOpen,
  onClose,
  student,
  detailTitle,
  avatarId,
  onRemind
}: StudentDetailModalProps) {
  if (!student) return null;

  return (
    <LearningRiskStudentDetailModal
      isOpen={isOpen}
      onClose={onClose}
      student={toLearningRiskStudent(student, detailTitle, avatarId)}
      onOpenRemindModal={onRemind}
    />
  );
}
