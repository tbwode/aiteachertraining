'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AiVideoProject } from '@/teacher/types/aiVideo';
import { getProject } from '@/teacher/api/aiVideo';

/**
 * 单项目详情：
 * - 初次加载一次
 * - 每当状态处于 queued/generating 时开启每秒轮询（API 层按时间戳推导物化），
 *   到达终态（draft/success/failed）自动停止
 * - 状态在页面内被操作改变（如提交生成）时轮询随之启停
 */
export function useProjectDetail(projectId: string) {
  const [project, setProject] = useState<AiVideoProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    void getProject(projectId).then((data) => {
      if (!active) return;
      if (!data) {
        setNotFound(true);
        setProject(null);
      } else {
        setProject(data);
      }
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [projectId]);

  const isRunning = project?.status === 'queued' || project?.status === 'generating';

  useEffect(() => {
    if (!isRunning || !projectId) return;
    const timer = setInterval(() => {
      void getProject(projectId).then((next) => {
        if (next) setProject(next);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, projectId]);

  return { project, isLoading, notFound, setProject };
}
