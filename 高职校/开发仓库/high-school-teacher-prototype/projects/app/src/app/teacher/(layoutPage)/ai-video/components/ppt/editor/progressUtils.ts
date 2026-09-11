/**
 * 智能进度条工具：章节解析（容错片段总数变化）与智能生成（按片段内容划分）
 */
import { generateId } from '@/teacher/api/aiVideo';
import type { AiVideoProject, PptProgressChapter } from '@/teacher/types/aiVideo';

/** 解析章节配置：count 之和与片段总数一致时采用，否则回退为单个章节 */
export function resolveProgressChapters(project: AiVideoProject): PptProgressChapter[] {
  const total = project.storyboard.length;
  if (total === 0) return [];
  const stored = project.pptConfig?.progressChapters ?? [];
  const sum = stored.reduce((acc, chapter) => acc + chapter.count, 0);
  if (stored.length > 0 && sum === total && stored.every((chapter) => chapter.count >= 1)) {
    return stored;
  }
  return [{ id: 'ch_all', title: '', count: total }];
}

/** 当前片段所属章节下标（按累计片段数定位） */
export function chapterIndexOfShot(chapters: PptProgressChapter[], shotIndex: number): number {
  let cursor = 0;
  for (let i = 0; i < chapters.length; i += 1) {
    cursor += chapters[i].count;
    if (shotIndex < cursor) return i;
  }
  return Math.max(0, chapters.length - 1);
}

/** 智能生成进度：每 ~3 个片段划为一章，标题取首片段标题（截断 8 字） */
export function generateProgressChapters(project: AiVideoProject): PptProgressChapter[] {
  const shots = project.storyboard;
  const chapters: PptProgressChapter[] = [];
  const groupSize = 3;
  for (let start = 0; start < shots.length; start += groupSize) {
    const group = shots.slice(start, start + groupSize);
    const rawTitle = group[0]?.title?.trim() || `章节 ${chapters.length + 1}`;
    chapters.push({
      id: generateId('ch'),
      title: rawTitle.length > 8 ? `${rawTitle.slice(0, 8)}…` : rawTitle,
      count: group.length
    });
  }
  return chapters;
}
