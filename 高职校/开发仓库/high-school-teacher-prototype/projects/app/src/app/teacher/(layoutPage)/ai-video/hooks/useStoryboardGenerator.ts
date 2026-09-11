'use client';

/**
 * 分镜逐步生成：当 project.storyboardPending 为 true 时，
 * 顺序调用 appendNextShot 逐条追加分镜，直到全部生成完毕。
 */
import { useEffect } from 'react';
import type { AiVideoProject } from '@/teacher/types/aiVideo';
import { appendNextShot } from '@/teacher/api/aiVideo';

export function useStoryboardGenerator(
  project: AiVideoProject,
  onProjectChange: (project: AiVideoProject) => void
) {
  const pending = Boolean(project.storyboardPending);
  const projectId = project.id;

  useEffect(() => {
    if (!pending) return;
    let cancelled = false;

    const run = async () => {
      while (!cancelled) {
        const result = await appendNextShot(projectId);
        if (!result || cancelled) break;
        onProjectChange(result.project);
        if (result.done) break;
      }
    };
    void run();

    return () => {
      cancelled = true;
    };
  }, [pending, projectId, onProjectChange]);

  return pending;
}
