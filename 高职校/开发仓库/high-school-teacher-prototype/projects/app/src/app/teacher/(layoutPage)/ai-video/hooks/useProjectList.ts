'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AiVideoProject } from '@/teacher/types/aiVideo';
import { listProjects } from '@/teacher/api/aiVideo';

/** 项目列表：加载 + 刷新；进行中的任务在列表页也按时间推导物化 */
export function useProjectList() {
  const [projects, setProjects] = useState<AiVideoProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await listProjects();
      setProjects(list);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /* 有进行中任务时轮询：列表页实时刷新「正在生成中」进度（listProjects 按时间自动物化） */
  const hasRunning = projects.some(
    (project) => project.status === 'queued' || project.status === 'generating'
  );
  useEffect(() => {
    if (!hasRunning) return;
    const timer = setInterval(() => {
      void refresh();
    }, 1500);
    return () => clearInterval(timer);
  }, [hasRunning, refresh]);

  return { projects, isLoading, refresh };
}
