'use client';

/**
 * AI视频课 项目工作台 - 成片预览 & 二次编辑工作台（编辑器版式）
 * 版式参考课件帮：顶栏 / 左侧分镜栏 / 中央预览画布 / 右侧工具栏 / 底部多轨时间轴
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Flex, IconButton } from '@chakra-ui/react';
import { Redo2, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AiVideoProject, DigitalHumanSnapshot } from '@/teacher/types/aiVideo';
import {
  DEFAULT_DIGITAL_HUMAN_CONFIG,
  restoreDigitalHumanState,
  setDigitalHumanEnabled,
  syncDigitalHumanPlacement,
  totalDuration,
  updateProject,
  updateProjectConfig,
  updateShotDigitalHuman
} from '@/teacher/api/aiVideo';
import { useStoryboardGenerator } from '../hooks/useStoryboardGenerator';
import { StudioTopBar } from './studio/StudioTopBar';
import { ShotSidebar } from './studio/ShotSidebar';
import { StudioPlayer, computeCues, type DhBar, type DhBarAskPayload } from './studio/StudioPlayer';
import { ToolRail, type RailKey } from './studio/ToolRail';
import { TimelinePanel } from './studio/TimelinePanel';
import { ExportModal } from './studio/ExportModal';
import { SubtitlePanel } from './studio/SubtitlePanel';
import { VoicePanel } from './studio/VoicePanel';
import { MusicPanel } from './studio/MusicPanel';
import { AiEditPanel } from './studio/AiEditPanel';
import { DigitalHumanPanel } from './studio/DigitalHumanPanel';
import { DigitalHumanStatusBar } from './studio/DigitalHumanStatusBar';
import { DigitalHumanCanvasBar } from './studio/DigitalHumanCanvasBar';
import { CanvasOverlayToggles } from './studio/CanvasOverlayToggles';
import { AI_VIDEO_PRIMARY, CARD_SHADOW } from '../constants';

type VideoResultProps = {
  project: AiVideoProject;
  onProjectChange: (project: AiVideoProject) => void;
};

type WorkbenchPatch = Partial<
  Pick<
    AiVideoProject,
    'subtitle' | 'audio' | 'trim' | 'intro' | 'outro' | 'aiBadge' | 'digitalHuman'
  >
>;

export function VideoResult({ project, onProjectChange }: VideoResultProps) {
  const { t } = useTranslation('teacher');
  const router = useRouter();

  /* 播放状态（父组件统一管理，供播放器与时间轴共享） */
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [businessTime, setBusinessTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  /* 界面状态 */
  const [activeRail, setActiveRail] = useState<RailKey | null>(null);
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  /* 编辑历史：撤销 / 恢复（保存工作台内每次项目变更前的快照） */
  const historyPastRef = useRef<AiVideoProject[]>([]);
  const historyFutureRef = useRef<AiVideoProject[]>([]);
  const [, setHistoryTick] = useState(0);

  // AI编辑「全部重生成脚本」后逐步重建分镜
  useStoryboardGenerator(project, onProjectChange);

  /* 切换项目时清空编辑历史 */
  const projectId = project.id;
  useEffect(() => {
    historyPastRef.current = [];
    historyFutureRef.current = [];
  }, [projectId]);

  const total = useMemo(() => totalDuration(project), [project]);
  const cues = useMemo(() => computeCues(project), [project]);
  /* 防御：非法裁剪区间（end<=start）时按全区间播放 */
  const trim = useMemo(() => {
    const raw = project.trim;
    return raw && raw.end > raw.start ? raw : { start: 0, end: total };
  }, [project.trim, total]);

  /* 播放联动：播放时左侧分镜栏同步选中当前播放位置对应的分镜 */
  useEffect(() => {
    if (!isPlaying) return;
    const active = cues.find((cue) => businessTime >= cue.start && businessTime < cue.end);
    if (active && active.id !== selectedShotId) {
      setSelectedShotId(active.id);
    }
  }, [businessTime, isPlaying, cues, selectedShotId]);

  /** 业务时间 → 占位视频时间（按比例映射） */
  const toVideoTime = useCallback(
    (t: number) => (total > 0 && videoDuration > 0 ? (t / total) * videoDuration : 0),
    [total, videoDuration]
  );
  /** 占位视频时间 → 业务时间 */
  const toBusinessTime = useCallback(
    (t: number) => (videoDuration > 0 ? (t / videoDuration) * total : 0),
    [total, videoDuration]
  );

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || videoDuration === 0) return;
    const t = toBusinessTime(video.currentTime);
    setBusinessTime(t);
    if (t >= trim.end) video.pause();
  };

  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      const current = toBusinessTime(video.currentTime);
      if (current < trim.start || current >= trim.end) {
        video.currentTime = toVideoTime(trim.start);
        setBusinessTime(trim.start);
      }
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  };

  const handleSeek = (businessSeconds: number) => {
    const video = videoRef.current;
    if (!video || videoDuration === 0) return;
    video.currentTime = toVideoTime(businessSeconds);
    setBusinessTime(businessSeconds);
  };

  /** 工作台变更统一入口：记录撤销快照后上报（分镜批量重建期间不记录） */
  const applyProjectChange = (next: AiVideoProject) => {
    if (!project.storyboardPending) {
      historyPastRef.current.push(project);
      if (historyPastRef.current.length > 50) historyPastRef.current.shift();
      historyFutureRef.current = [];
      setHistoryTick((tick) => tick + 1);
    }
    onProjectChange(next);
  };

  /** 撤销：恢复最近一次变更前的项目快照并落库 */
  const handleUndo = () => {
    const prev = historyPastRef.current.pop();
    if (!prev) return;
    historyFutureRef.current.push(project);
    setHistoryTick((tick) => tick + 1);
    void updateProject(project.id, () => prev).then(
      (updated) => updated && onProjectChange(updated)
    );
  };

  /** 恢复：重做最近一次被撤销的变更并落库 */
  const handleRedo = () => {
    const next = historyFutureRef.current.pop();
    if (!next) return;
    historyPastRef.current.push(project);
    setHistoryTick((tick) => tick + 1);
    void updateProject(project.id, () => next).then(
      (updated) => updated && onProjectChange(updated)
    );
  };

  const canUndo = historyPastRef.current.length > 0;
  const canRedo = historyFutureRef.current.length > 0;

  const handleSelectShot = (shotId: string, cueStart: number) => {
    setSelectedShotId(shotId);
    handleSeek(cueStart);
  };

  /* ---- 数字人状态条：ask 悬浮在画面上，applied 悬浮在数字人弹框 ---- */
  const activeCue = cues.find((cue) => businessTime >= cue.start && businessTime < cue.end);
  const [dhBar, setDhBar] = useState<DhBar | null>(null);
  /** 最近一次数字人调整前的状态快照（用于「撤销」） */
  const dhUndoRef = useRef<DigitalHumanSnapshot | null>(null);

  /** 构建数字人状态快照（切换形象前调用，用于「撤销」整体还原） */
  const buildDhSnapshot = (): DigitalHumanSnapshot => {
    const dhConfig = project.digitalHuman ?? DEFAULT_DIGITAL_HUMAN_CONFIG;
    return {
      config: { ...dhConfig, placement: { ...dhConfig.placement } },
      overrides: project.storyboard.map((shot) => ({
        shotId: shot.id,
        override: shot.digitalHumanOverride
          ? {
              ...shot.digitalHumanOverride,
              placement: shot.digitalHumanOverride.placement
                ? { ...shot.digitalHumanOverride.placement }
                : undefined
            }
          : undefined
      }))
    };
  };

  /** 工作台配置统一入口：即时保存（切换数字人形象时记录快照并提示应用范围） */
  const handleConfigChange = (patch: WorkbenchPatch) => {
    const prevAvatar = (project.digitalHuman ?? DEFAULT_DIGITAL_HUMAN_CONFIG).avatar;
    if (patch.digitalHuman && patch.digitalHuman.avatar !== prevAvatar) {
      dhUndoRef.current = buildDhSnapshot();
      setDhBar({
        stage: 'applied',
        scope: 'all',
        kind: 'avatar',
        avatar: patch.digitalHuman.avatar
      });
    }
    void updateProjectConfig(project.id, patch).then((next) => next && applyProjectChange(next));
  };

  /** 选中/取消选中数字人：仅记录状态条，不自动展开数字人设置栏（可从右侧工具栏手动打开） */
  const handleDhSelect = (selected: boolean) => {
    if (!selected) return;
    setDhBar((prev) => {
      if (prev) return prev;
      const shotOverride = activeCue
        ? project.storyboard.find((shot) => shot.id === activeCue.id)?.digitalHumanOverride
        : undefined;
      return { stage: 'applied', scope: shotOverride?.placement ? 'shot' : 'all' };
    });
  };

  /** 画布调整完成：记录快照并弹出询问条（不展开数字人设置栏） */
  const handleDhRequestSync = (payload: DhBarAskPayload) => {
    dhUndoRef.current = payload.snapshot;
    setDhBar({ stage: 'ask', kind: payload.kind, placement: payload.placement });
  };

  /* ask 阶段 8 秒未选择：按「仅此片段」应用并转为已应用状态 */
  useEffect(() => {
    if (dhBar?.stage !== 'ask') return;
    const timer = setTimeout(() => setDhBar({ stage: 'applied', scope: 'shot' }), 8000);
    return () => clearTimeout(timer);
  }, [dhBar]);

  /* applied 阶段 6 秒后自动收起（同时失效撤销快照） */
  useEffect(() => {
    if (dhBar?.stage !== 'applied') return;
    const timer = setTimeout(() => {
      setDhBar(null);
      dhUndoRef.current = null;
    }, 6000);
    return () => clearTimeout(timer);
  }, [dhBar]);

  /* 数字人停用时收起状态条 */
  const digitalHumanOn = Boolean(project.digitalHuman?.enabled);
  useEffect(() => {
    if (!digitalHumanOn) setDhBar(null);
  }, [digitalHumanOn]);

  /** ask 阶段：同步到所有片段（删除-全局停用；位置/大小-全局同步摆放） */
  const handleDhSyncAll = () => {
    if (dhBar?.stage !== 'ask') return;
    const action =
      dhBar.kind === 'remove'
        ? setDigitalHumanEnabled(project.id, false)
        : syncDigitalHumanPlacement(project.id, dhBar.placement!);
    void action.then((updated) => {
      if (updated) applyProjectChange(updated);
    });
    setDhBar({ stage: 'applied', scope: 'all' });
  };

  /** ask 阶段：仅此片段（覆盖已在调整时写入，直接转为已应用状态） */
  const handleDhThisShot = () => {
    if (dhBar?.stage !== 'ask') return;
    setDhBar({ stage: 'applied', scope: 'shot' });
  };

  /** applied 阶段：切换应用范围（所有页面 ⇄ 仅当前页） */
  const handleDhSwitchScope = () => {
    if (dhBar?.stage !== 'applied') return;
    const dhConfig = project.digitalHuman ?? DEFAULT_DIGITAL_HUMAN_CONFIG;

    /* 形象切换的作用域变更（分镜级 avatar 覆盖） */
    if (dhBar.kind === 'avatar') {
      if (dhBar.scope === 'all') {
        /* 改为仅当前页：当前分镜应用新形象，全局回退为切换前形象 */
        if (!activeCue) return;
        const shotId = activeCue.id;
        const prevAvatar = dhUndoRef.current?.config.avatar ?? dhConfig.avatar;
        void (async () => {
          const withOverride = await updateShotDigitalHuman(project.id, shotId, {
            avatar: dhBar.avatar ?? dhConfig.avatar
          });
          if (withOverride) applyProjectChange(withOverride);
          const reverted = await updateProjectConfig(project.id, {
            digitalHuman: { ...dhConfig, avatar: prevAvatar }
          });
          if (reverted) applyProjectChange(reverted);
        })();
        setDhBar({ stage: 'applied', scope: 'shot', kind: 'avatar', avatar: dhBar.avatar });
      } else {
        /* 改回所有页面：全局使用新形象，并清除当前分镜的形象覆盖 */
        const shotAvatar = activeCue
          ? project.storyboard.find((shot) => shot.id === activeCue.id)?.digitalHumanOverride
              ?.avatar
          : undefined;
        const shotId = activeCue?.id;
        void (async () => {
          const synced = await updateProjectConfig(project.id, {
            digitalHuman: { ...dhConfig, avatar: shotAvatar ?? dhBar.avatar ?? dhConfig.avatar }
          });
          if (synced) applyProjectChange(synced);
          if (shotId) {
            const cleared = await updateShotDigitalHuman(project.id, shotId, {
              avatar: undefined
            });
            if (cleared) applyProjectChange(cleared);
          }
        })();
        setDhBar({ stage: 'applied', scope: 'all', kind: 'avatar', avatar: dhBar.avatar });
      }
      return;
    }

    /* 位置/大小调整的作用域变更 */
    if (dhBar.scope === 'all') {
      if (!activeCue) return;
      void updateShotDigitalHuman(project.id, activeCue.id, {
        placement: dhConfig.placement
      }).then((updated) => updated && applyProjectChange(updated));
      setDhBar({ stage: 'applied', scope: 'shot' });
    } else {
      const shotOverride = activeCue
        ? project.storyboard.find((shot) => shot.id === activeCue.id)?.digitalHumanOverride
        : undefined;
      void syncDigitalHumanPlacement(
        project.id,
        shotOverride?.placement ?? dhConfig.placement
      ).then((updated) => updated && applyProjectChange(updated));
      setDhBar({ stage: 'applied', scope: 'all' });
    }
  };

  /** applied 阶段：撤销（优先恢复快照；无快照时清除当前分镜覆盖回退全局） */
  const handleDhUndo = () => {
    const snapshot = dhUndoRef.current;
    if (snapshot) {
      dhUndoRef.current = null;
      void restoreDigitalHumanState(project.id, snapshot).then(
        (updated) => updated && applyProjectChange(updated)
      );
    } else if (dhBar?.stage === 'applied' && dhBar.scope === 'shot' && activeCue) {
      void updateShotDigitalHuman(project.id, activeCue.id, null).then(
        (updated) => updated && applyProjectChange(updated)
      );
    }
    setDhBar(null);
  };

  /** 「撤销」是否可用：有调整快照，或当前分镜存在可清除的覆盖 */
  const dhCanUndo =
    dhBar?.stage === 'applied' &&
    (dhUndoRef.current !== null || (dhBar.scope === 'shot' && activeCue != null));

  /** 当前分镜已删除数字人（画面无占位，在设置栏底部提供恢复入口） */
  const dhShotHidden = activeCue
    ? Boolean(
        project.storyboard.find((shot) => shot.id === activeCue.id)?.digitalHumanOverride?.hidden
      )
    : false;

  /** 恢复当前分镜被删除的数字人 */
  const handleDhRestoreShot = () => {
    if (!activeCue) return;
    void updateShotDigitalHuman(project.id, activeCue.id, { hidden: false }).then(
      (updated) => updated && applyProjectChange(updated)
    );
  };

  return (
    <Flex direction="column" h="calc(100vh - 64px)" bg="#F5F6FA">
      <StudioTopBar
        title={project.title}
        onBack={() => router.push('/teacher/ai-video')}
        onExport={() => setIsExportOpen(true)}
      />

      {/* 主区：分镜栏 / 画布 / 面板 / 工具栏 */}
      <Flex flex="1" minH={0} px={4} pt={4} gap={4} align="stretch">
        <ShotSidebar
          project={project}
          cues={cues}
          selectedShotId={selectedShotId}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          onSelectShot={handleSelectShot}
          onProjectChange={applyProjectChange}
        />

        {/* 中央画布：点阵背景 */}
        <Flex
          flex="1"
          minW={0}
          minH={0}
          borderRadius="16px"
          bg="#FAFBFD"
          sx={{
            backgroundImage: 'radial-gradient(#DDE2EC 1px, transparent 1px)',
            backgroundSize: '18px 18px'
          }}
          align="center"
          justify="center"
          p={4}
          position="relative"
        >
          <CanvasOverlayToggles project={project} onConfigChange={handleConfigChange} />
          {/* 撤销 / 恢复：画布右上角 */}
          <Flex position="absolute" top={3} right={3} gap={2} zIndex={3}>
            <IconButton
              aria-label={t('aiVideo.studio.undo')}
              title={t('aiVideo.studio.undo')}
              icon={<Undo2 size={16} />}
              size="sm"
              borderRadius="full"
              bg="white"
              border="1px solid"
              borderColor="#E7E7E7"
              boxShadow="sm"
              color={canUndo ? 'gray.700' : 'gray.300'}
              isDisabled={!canUndo}
              _disabled={{ opacity: 1, cursor: 'default' }}
              _hover={canUndo ? { color: AI_VIDEO_PRIMARY, borderColor: AI_VIDEO_PRIMARY } : undefined}
              onClick={handleUndo}
            />
            <IconButton
              aria-label={t('aiVideo.studio.redo')}
              title={t('aiVideo.studio.redo')}
              icon={<Redo2 size={16} />}
              size="sm"
              borderRadius="full"
              bg="white"
              border="1px solid"
              borderColor="#E7E7E7"
              boxShadow="sm"
              color={canRedo ? 'gray.700' : 'gray.300'}
              isDisabled={!canRedo}
              _disabled={{ opacity: 1, cursor: 'default' }}
              _hover={canRedo ? { color: AI_VIDEO_PRIMARY, borderColor: AI_VIDEO_PRIMARY } : undefined}
              onClick={handleRedo}
            />
          </Flex>
          {/* 数字人调整询问条：悬浮在画面正上方（关闭/拖动/缩放后询问作用域） */}
          {dhBar?.stage === 'ask' && (
            <DigitalHumanCanvasBar
              kind={dhBar.kind}
              onSyncAll={handleDhSyncAll}
              onThisShot={handleDhThisShot}
            />
          )}
          <Box w="100%" maxW={project.params.ratio === '9:16' ? '420px' : '760px'}>
            <StudioPlayer
              project={project}
              videoRef={videoRef}
              businessTime={businessTime}
              isPlaying={isPlaying}
              onLoadedMeta={setVideoDuration}
              onTimeUpdate={handleTimeUpdate}
              onPlayStateChange={setIsPlaying}
              onConfigChange={handleConfigChange}
              onProjectChange={applyProjectChange}
              onRequestSync={handleDhRequestSync}
              onSelect={handleDhSelect}
            />
          </Box>
        </Flex>

        {/* 工具面板（选中时展开） */}
        {activeRail && (
          <Box
            w="340px"
            flexShrink={0}
            bg="white"
            borderRadius="16px"
            boxShadow={CARD_SHADOW}
            p={5}
            overflowY="auto"
            minH={0}
            display="flex"
            flexDirection="column"
          >
            {activeRail === 'aiEdit' && (
              <AiEditPanel
                project={project}
                selectedShotId={selectedShotId}
                onProjectChange={applyProjectChange}
                onClose={() => setActiveRail(null)}
              />
            )}
            {activeRail === 'script' && (
              <SubtitlePanel
                project={project}
                cues={cues}
                selectedShotId={selectedShotId}
                onProjectChange={applyProjectChange}
                onConfigChange={handleConfigChange}
              />
            )}
            {activeRail === 'digitalHuman' && (
              <>
                <DigitalHumanPanel
                  project={project}
                  onConfigChange={handleConfigChange}
                  onClose={() => setActiveRail(null)}
                />
                {/* 数字人应用状态条：悬浮在数字人弹框底部（选中/ask 确认后展示） */}
                <DigitalHumanStatusBar
                  bar={dhBar}
                  canUndo={dhCanUndo}
                  shotHidden={dhShotHidden}
                  onRestoreShot={handleDhRestoreShot}
                  onSwitchScope={handleDhSwitchScope}
                  onUndo={handleDhUndo}
                />
              </>
            )}
            {activeRail === 'voice' && (
              <VoicePanel project={project} onConfigChange={handleConfigChange} />
            )}
            {activeRail === 'music' && (
              <MusicPanel project={project} onConfigChange={handleConfigChange} />
            )}
          </Box>
        )}

        <ToolRail active={activeRail} onSelect={setActiveRail} />
      </Flex>

      {/* 底部时间轴 */}
      <Box px={4} py={3}>
        <TimelinePanel
          project={project}
          total={total}
          businessTime={businessTime}
          isPlaying={isPlaying}
          selectedShotId={selectedShotId}
          onTogglePlay={handleTogglePlay}
          onSeek={handleSeek}
          onSelectShot={handleSelectShot}
        />
      </Box>

      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} project={project} />
    </Flex>
  );
}
