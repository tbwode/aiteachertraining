/**
 * 学员学情详情 - 纯函数工具
 */
import type { ConversationGroupVO, AiAvatarVO, AvatarStudentVO } from '@/teacher/types/aiTeacher';
import type {
  StudentLearningConversationSummary,
  StudentLearningCourseProgress
} from '@/types/common-chat';

/** 按分身 id 从列表中取课程名 */
export const avatarCourseName = (avatarId: number, avatars: AiAvatarVO[]): string => {
  return avatars.find((a) => a.id === avatarId)?.courseName ?? '';
};

/** 将 AvatarStudentVO + avatarId 转为课程进度项 */
export const toCourseProgress = (
  avatarId: number,
  avatarName: string,
  s: AvatarStudentVO
): StudentLearningCourseProgress => ({
  avatarId,
  courseName: avatarName,
  progress: s.progress,
  studyHours: s.studyHours,
  status: s.status,
  lagDays: s.lagDays,
  lastLearnTime: s.lastLearnTime
});

/** 简体中文停用词 */
const STOP_WORDS = new Set([
  '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '那', '怎么', '什么', '为什么', '可以', '能', '不能', '这个', '那个',
  'the', 'a', 'an', 'is', 'are', 'to', 'of', 'and', 'in', 'on', 'for', 'with'
]);

/**
 * 从对话文本提取高频词（简易中文分词：按标点/空格切分，取 2-4 字片段）
 * 返回前 12 个高频词
 */
export const extractKeywords = (groups: ConversationGroupVO[]): Array<{ word: string; count: number }> => {
  const text = groups
    .flatMap((g) => g.messages ?? [])
    .map((m) => m.content ?? '')
    .join(' ');

  // 按非中英文数字字符切分
  const segments = text.split(/[^a-zA-Z0-9一-龥]+/).filter(Boolean);
  const counts = new Map<string, number>();

  for (const seg of segments) {
    // 中文：取 2-4 字滑窗
    if (/[一-龥]/.test(seg)) {
      const maxLen = Math.min(seg.length, 4);
      for (let len = 2; len <= maxLen; len++) {
        for (let i = 0; i <= seg.length - len; i++) {
          const word = seg.slice(i, i + len);
          if (STOP_WORDS.has(word)) continue;
          // 过滤纯数字
          if (/^\d+$/.test(word)) continue;
          counts.set(word, (counts.get(word) ?? 0) + 1);
        }
      }
    } else if (seg.length >= 2) {
      // 英文/数字片段
      const lower = seg.toLowerCase();
      if (!STOP_WORDS.has(lower)) counts.set(lower, (counts.get(lower) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .filter(([, c]) => c >= 2) // 至少出现 2 次
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word, count]) => ({ word, count }));
};

/**
 * 将多个分身的对话话题汇总为 AI 问答情况摘要
 * - totalSessions: 会话次数 = groups.length
 * - totalMessages: 对话轮数 = Σ messageCount
 * - lastActiveTime: 最近 lastMessageTime
 * - keywords: 高频词云
 */
export const summarizeConversations = (
  groups: ConversationGroupVO[]
): StudentLearningConversationSummary => {
  const totalSessions = groups.length;
  const totalMessages = groups.reduce((sum, g) => sum + (g.messageCount ?? 0), 0);

  const lastActiveTime = groups
    .map((g) => g.lastMessageTime)
    .filter(Boolean)
    .sort()
    .pop();

  const keywords = extractKeywords(groups);

  return { totalSessions, totalMessages, lastActiveTime, keywords };
};
