'use client';

/**
 * PPT/文档转视频 - 第三步：预览编辑
 * 进入即逐页生成视频口播稿（生成中 x/N，可停止/继续）；
 * 布局：顶栏（返回/自动保存/预览/生成视频）+ 左侧片段栏 + 中间分镜画布
 * （字幕/智能进度条/AI标识开关 + 播放片段）+ 右侧工具栏 + 底部口播稿编辑区
 * 口播稿可编辑（自动保存），确认后提交渲染任务
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Flex, IconButton, Image, Spinner, Text, useToast } from '@chakra-ui/react';
import {
  ChevronLeft,
  Highlighter,
  Clapperboard,
  Download,
  Eye,
  FileText,
  Music,
  Pause,
  Play,
  Redo2,
  Undo2,
  SquarePen,
  Wand2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import {
  buildPptNarration,
  generateId,
  shotImageUrl,
  submitGenerateTask,
  updateProject,
  updateProjectConfig,
  updateShotDigitalHuman,
  updateStoryboard
} from '@/teacher/api/aiVideo';
import type {
  AiVideoProject,
  AiVideoStyle,
  PptLayoutId,
  PptMaterialItem,
  PptMediaOverlay,
  PptPageInfo,
  PptProgressChapter,
  PptVideoConfig,
  PptTextOverlay,
  StoryboardShot
} from '@/teacher/types/aiVideo';
import {
  AI_VIDEO_PRIMARY,
  AI_VIDEO_PRIMARY_BG,
  AI_VIDEO_PRIMARY_HOVER,
  CARD_SHADOW,
  DIGITAL_HUMAN_AVATARS
} from '../../../constants';
import { CanvasOverlayToggles } from '../../studio/CanvasOverlayToggles';
import { EditorRail, type RailKey } from './EditorRail';
import { HighlightTextarea } from './HighlightTextarea';
import { ProgressEditor } from './ProgressEditor';
import { RenderSettingsModal, type RenderSettings } from './RenderSettingsModal';
import { generateProgressChapters, resolveProgressChapters } from './progressUtils';
import { PreviewModal } from './PreviewModal';
import { SegmentList } from './SegmentList';
import { ShotCanvas } from './ShotCanvas';

/** 口播稿字数上限 */
const SCRIPT_MAX_LENGTH = 2000;
/** 口播稿逐页生成间隔（毫秒） */
const SCRIPT_GENERATE_INTERVAL = 550;
/** 语速基准：约 4.5 字/秒 */
const CHARS_PER_SECOND = 4.5;

/** 非 PPT 项目进入统一编辑器时补齐的画布能力默认值。 */
const DEFAULT_STUDIO_CONFIG: PptVideoConfig = {
  scriptMode: 'concise',
  pageDuration: 'auto',
  customDuration: 5,
  transition: 'smooth',
  transitionGap: 1,
  resolution: '1080p',
  quality: 'medium',
  frameRate: 25,
  watermark: false,
  emotion: 'warm',
  smartAvoid: true,
  layout: 'leftDh'
};

type GenState = 'running' | 'stopped' | 'done';
type SaveState = 'idle' | 'saving' | 'saved';

export function PreviewEditStep({
  project: initialProject,
  pages,
  onBack,
  startReady = false,
  onSubmitted
}: {
  /** 已创建的草稿项目（父组件在进入本步前创建） */
  project: AiVideoProject;
  /** 有效页面（与 storyboard 顺序一致） */
  pages: PptPageInfo[];
  onBack: () => void;
  /** 直接就绪（从列表返回编辑：跳过口播稿逐页生成动画，展示已有内容） */
  startReady?: boolean;
  /** 项目详情页内提交后就地切换到生成进度；创建向导不传时返回项目列表。 */
  onSubmitted?: (project: AiVideoProject) => void;
}) {
  const { t } = useTranslation('teacher');
  const router = useRouter();
  const toast = useToast();

  const [project, setProject] = useState(initialProject);
  const [scripts, setScripts] = useState<Record<string, string>>(() =>
    startReady
      ? Object.fromEntries(initialProject.storyboard.map((shot) => [shot.id, shot.narration]))
      : {}
  );
  const [revealedCount, setRevealedCount] = useState(
    startReady ? initialProject.storyboard.length : 0
  );
  const [genState, setGenState] = useState<GenState>(startReady ? 'done' : 'running');
  const [selectedId, setSelectedId] = useState<string | null>(
    initialProject.storyboard[0]?.id ?? null
  );
  const [railKey, setRailKey] = useState<RailKey | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  /** 智能进度条编辑器开关（进度条本身跟随 pptConfig.progressBar 持久化） */
  const [progressEditorOpen, setProgressEditorOpen] = useState(false);
  const [playPhase, setPlayPhase] = useState<'synthesizing' | 'playing' | null>(null);
  const [playPercent, setPlayPercent] = useState<number | undefined>(undefined);
  /** 文稿选区（设置为字幕高亮的候选） */
  const [scriptSelection, setScriptSelection] = useState<{
    start: number;
    end: number;
    text: string;
  } | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [auditioning, setAuditioning] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [renderModalOpen, setRenderModalOpen] = useState(false);
  /** 撤销/恢复历史栈（最多 30 步） */
  const undoStackRef = useRef<AiVideoProject[]>([]);
  const redoStackRef = useRef<AiVideoProject[]>([]);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);

  const shots = project.storyboard;
  const audio = project.audio!;
  const subtitle = project.subtitle!;
  const totalShots = shots.length;
  const selectedIndex = Math.max(
    0,
    shots.findIndex((shot) => shot.id === selectedId)
  );
  const selectedShot: StoryboardShot | null = shots[selectedIndex] ?? null;
  const selectedScript = selectedShot ? scripts[selectedShot.id] ?? '' : '';
  const selectedRevealed = selectedIndex < revealedCount;
  const revealedIds = useMemo(
    () => new Set(shots.slice(0, revealedCount).map((shot) => shot.id)),
    [shots, revealedCount]
  );

  const playTimerRef = useRef<number | null>(null);
  const synthTimerRef = useRef<number | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const dirtyRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /* ---------------- 口播稿逐页生成（可停止/继续） ---------------- */
  useEffect(() => {
    if (genState !== 'running' || revealedCount >= totalShots) return undefined;
    const timer = window.setTimeout(() => {
      const shot = shots[revealedCount];
      if (shot) {
        setScripts((prev) => ({ ...prev, [shot.id]: prev[shot.id] ?? shot.narration }));
      }
      const next = revealedCount + 1;
      setRevealedCount(next);
      if (next >= totalShots) setGenState('done');
    }, SCRIPT_GENERATE_INTERVAL);
    return () => window.clearTimeout(timer);
  }, [genState, revealedCount, totalShots, shots]);

  /* ---------------- 口播稿编辑自动保存（防抖 800ms） ---------------- */
  useEffect(() => {
    if (!dirtyRef.current) return undefined;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    setSaveState('saving');
    saveTimerRef.current = window.setTimeout(() => {
      dirtyRef.current = false;
      const nextShots = project.storyboard.map((shot) => ({
        ...shot,
        narration: scripts[shot.id] !== undefined ? scripts[shot.id] : shot.narration
      }));
      void updateStoryboard(project.id, nextShots).then((updated) => {
        if (updated) setProject(updated);
        setSaveState('saved');
        window.setTimeout(() => setSaveState('idle'), 2000);
      });
    }, 800);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scripts]);

  /* ---------------- 卸载清理：播放计时 / 试听语音 ---------------- */
  useEffect(() => {
    return () => {
      if (playTimerRef.current) window.clearInterval(playTimerRef.current);
      if (synthTimerRef.current) window.clearTimeout(synthTimerRef.current);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /** 语音合成朗读（浏览器 TTS） */
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text.trim()) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = audio.speed;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const stopPlay = useCallback(() => {
    if (synthTimerRef.current) window.clearTimeout(synthTimerRef.current);
    synthTimerRef.current = null;
    if (playTimerRef.current) window.clearInterval(playTimerRef.current);
    playTimerRef.current = null;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlayPhase(null);
    setPlayPercent(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 切换片段时停止播放与试听 */
  const handleSelectShot = (shotId: string) => {
    stopPlay();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setAuditioning(false);
    setSelectedId(shotId);
    setSelectedTextId(null);
    setSelectedMediaId(null);
  };

  /* ---------------- 画布片段播放：先展示音频合成中，合成完成播放语音 ---------------- */
  const handlePlayToggle = () => {
    if (playPhase) {
      stopPlay();
      return;
    }
    if (!selectedShot) return;
    // 音频合成阶段（~1.8s）
    setPlayPhase('synthesizing');
    synthTimerRef.current = window.setTimeout(() => {
      synthTimerRef.current = null;
      setPlayPhase('playing');
      // 合成完成播放语音（TTS 朗读当前口播稿）
      speakText(selectedScript);
      // 播放进度按分镜时长推进
      const durationMs = Math.max(1, selectedShot.duration) * 1000;
      const startedAt = Date.now();
      setPlayPercent(0);
      playTimerRef.current = window.setInterval(() => {
        const percent = Math.min(100, ((Date.now() - startedAt) / durationMs) * 100);
        setPlayPercent(percent);
        if (percent >= 100) stopPlay();
      }, 100);
    }, 1800);
  };

  /* ---------------- 口播稿编辑 ---------------- */
  const handleScriptChange = (value: string) => {
    if (!selectedShot) return;
    if (!dirtyRef.current) pushHistory();
    dirtyRef.current = true;
    setScripts((prev) => ({ ...prev, [selectedShot.id]: value }));
  };

  /** 文稿选区变化（用于「设置为字幕高亮」） */
  const handleScriptSelect = () => {
    const el = textareaRef.current;
    if (!el) {
      setScriptSelection(null);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value.slice(start, end).trim();
    setScriptSelection(text.length > 0 ? { start, end, text } : null);
  };

  /** 选中文稿文字设置/取消字幕高亮（画布字幕条标黄展示） */
  const handleToggleHighlight = () => {
    if (!selectedShot || !scriptSelection) return;
    const text = scriptSelection.text;
    const current = selectedShot.subtitleHighlights ?? [];
    const exists = current.includes(text);
    pushHistory();
    void updateProject(project.id, (project) => ({
      ...project,
      storyboard: project.storyboard.map((shot) =>
        shot.id === selectedShot.id
          ? {
              ...shot,
              subtitleHighlights: exists
                ? current.filter((item) => item !== text)
                : [...current, text]
            }
          : shot
      )
    })).then((updated) => {
      if (updated) setProject(updated);
      toast({
        title: t(
          exists ? 'aiVideo.ppt.editor.highlightRemoveTip' : 'aiVideo.ppt.editor.highlightSetTip'
        ),
        status: 'success',
        duration: 1500,
        position: 'top'
      });
    });
  };

  /** 优化文稿：按当前脚本模式重新生成并做基础润色 */
  const handleOptimize = () => {
    if (!selectedShot || !selectedRevealed || optimizing) return;
    setOptimizing(true);
    window.setTimeout(() => {
      const page = pages[selectedIndex];
      const mode = project.pptConfig?.scriptMode ?? 'concise';
      let next = page ? buildPptNarration(page, mode) : selectedScript;
      next = next.replace(/\s+/g, ' ').trim();
      if (next && !/[。！？]$/.test(next)) next += '。';
      handleScriptChange(next);
      setOptimizing(false);
      toast({
        title: t('aiVideo.ppt.editor.optimizedTip', {
          mode: t(`aiVideo.ppt.params.scriptModeOption.${mode}`)
        }),
        status: 'success',
        duration: 2000,
        position: 'top'
      });
    }, 700);
  };

  /* ---------------- 试听（浏览器语音合成） ---------------- */
  const handleAudition = () => {
    if (auditioning) {
      window.speechSynthesis?.cancel();
      setAuditioning(false);
      return;
    }
    if (!selectedScript.trim()) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast({
        title: t('aiVideo.ppt.editor.auditionUnsupported'),
        status: 'info',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    speakText(selectedScript);
    setAuditioning(true);
    window.setTimeout(() => setAuditioning(false), Math.max(1500, selectedScript.length * 220));
  };

  /* ---------------- 配置变更（自动保存到项目） ---------------- */
  const handleTemplateChange = (style: AiVideoStyle) => {
    pushHistory();
    void updateProject(project.id, (current) => ({
      ...current,
      params: { ...current.params, style }
    })).then((updated) => {
      if (updated) setProject(updated);
      toast({ title: t('aiVideo.ppt.editor.templateApplied'), status: 'success', duration: 1500 });
    });
  };

  /* ---------------- 文本框（文字面板 + 画布交互） ---------------- */

  /** 更新当前片段的文本框列表并持久化（基于存储中的最新项目，避免连续修改相互覆盖） */
  const patchShotTexts = (
    shotId: string,
    updater: (overlays: PptTextOverlay[]) => PptTextOverlay[]
  ) => {
    pushHistory();
    void updateProject(project.id, (current) => ({
      ...current,
      storyboard: current.storyboard.map((shot) =>
        shot.id === shotId ? { ...shot, textOverlays: updater(shot.textOverlays ?? []) } : shot
      )
    })).then((updated) => {
      if (updated) setProject(updated);
    });
  };

  /** 添加文本框（默认居中，添加即选中） */
  const handleTextAdd = () => {
    if (!selectedShot) return;
    const overlay: PptTextOverlay = {
      id: generateId('text'),
      content: t('aiVideo.ppt.editor.text.defaultText'),
      x: 50,
      y: 50,
      fontFamily: 'sans',
      fontSize: 26,
      color: '#FFFFFF',
      align: 'center',
      vAlign: 'middle',
      opacity: 100,
      enterAnimation: 'none',
      exitAnimation: 'none',
      width: 40,
      height: 18
    };
    patchShotTexts(selectedShot.id, (overlays) => [...overlays, overlay]);
    setSelectedTextId(overlay.id);
  };

  const handleTextChange = (id: string, patch: Partial<PptTextOverlay>) => {
    if (!selectedShot) return;
    patchShotTexts(selectedShot.id, (overlays) =>
      overlays.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const handleTextDelete = (id: string) => {
    if (!selectedShot) return;
    patchShotTexts(selectedShot.id, (overlays) => overlays.filter((item) => item.id !== id));
    if (selectedTextId === id) setSelectedTextId(null);
  };

  /** 画布拖拽/缩放：操作中仅本地更新，结束后持久化 */
  const handleTextGeometry = (
    id: string,
    patch: Partial<Pick<PptTextOverlay, 'x' | 'y' | 'width' | 'height'>>,
    persist: boolean
  ) => {
    if (!selectedShot) return;
    const apply = (overlays: PptTextOverlay[]) =>
      overlays.map((item) => (item.id === id ? { ...item, ...patch } : item));
    if (persist) {
      patchShotTexts(selectedShot.id, apply);
    } else {
      setProject((current) => ({
        ...current,
        storyboard: current.storyboard.map((shot) =>
          shot.id === selectedShot.id
            ? { ...shot, textOverlays: apply(shot.textOverlays ?? []) }
            : shot
        )
      }));
    }
  };

  /* ---------------- 智能进度条（章节） ---------------- */

  const progressBarOn = project.pptConfig?.progressBar === true;
  const progressChapters = resolveProgressChapters(project);

  /** 更新章节配置（含开关） */
  const patchProgressConfig = (patch: {
    progressBar?: boolean;
    progressChapters?: PptProgressChapter[];
  }) => {
    pushHistory();
    void updateProject(project.id, (current) => ({
      ...current,
      pptConfig: { ...DEFAULT_STUDIO_CONFIG, ...current.pptConfig, ...patch }
    })).then((updated) => {
      if (updated) setProject(updated);
    });
  };

  /** 开关切换：首次开启时若无章节配置则智能生成 */
  const handleProgressToggle = (enabled: boolean) => {
    if (enabled && !project.pptConfig?.progressChapters?.length) {
      patchProgressConfig({
        progressBar: true,
        progressChapters: generateProgressChapters(project)
      });
    } else {
      patchProgressConfig({ progressBar: enabled });
    }
  };

  /** 智能生成进度（按片段内容重新划分章节） */
  const handleProgressGenerate = () => {
    patchProgressConfig({ progressChapters: generateProgressChapters(project) });
    toast({
      title: t('aiVideo.ppt.editor.progress.generateTip'),
      status: 'success',
      duration: 1500,
      position: 'top'
    });
  };

  const handleChapterRename = (id: string, title: string) => {
    patchProgressConfig({
      progressChapters: progressChapters.map((chapter) =>
        chapter.id === id ? { ...chapter, title } : chapter
      )
    });
  };

  /** 删除标题：对应分段标题置空（分段与包含片段保留），可再次编辑或添加标题 */
  const handleChapterDelete = (id: string) => {
    patchProgressConfig({
      progressChapters: progressChapters.map((chapter) =>
        chapter.id === id ? { ...chapter, title: '' } : chapter
      )
    });
  };

  /** 拖动章节边界调整包含片段数（与下一章互补；拖到 0 时该分段被吸收合并；persist=true 时入历史并落库） */
  const handleChapterResize = (id: string, count: number, persist: boolean) => {
    const index = progressChapters.findIndex((chapter) => chapter.id === id);
    if (index < 0 || index >= progressChapters.length - 1) return;
    const pairTotal = progressChapters[index].count + progressChapters[index + 1].count;
    const clamped = Math.min(pairTotal, Math.max(0, count));
    let next: PptProgressChapter[];
    if (clamped === 0) {
      // 本分段收缩到 0：被下一分段（或未设置标题的分段）完全吸收
      next = progressChapters
        .filter((_, i) => i !== index)
        .map((chapter, i) => (i === index ? { ...chapter, count: pairTotal } : chapter));
    } else if (clamped === pairTotal) {
      // 下一分段收缩到 0：被本分段完全吸收（已命名分段可覆盖未设置标题的分段）
      next = progressChapters
        .filter((_, i) => i !== index + 1)
        .map((chapter, i) => (i === index ? { ...chapter, count: pairTotal } : chapter));
    } else {
      next = progressChapters.map((chapter, i) =>
        i === index
          ? { ...chapter, count: clamped }
          : i === index + 1
            ? { ...chapter, count: pairTotal - clamped }
            : chapter
      );
    }
    if (persist) {
      patchProgressConfig({ progressChapters: next });
    } else {
      setProject((current) => ({
        ...current,
        pptConfig: { ...current.pptConfig!, progressChapters: next }
      }));
    }
  };

  /* ---------------- 素材（媒体叠加层）与背景 ---------------- */

  /** 上传素材入库（图片/视频，dataURL） */
  const handleMaterialUpload = (item: PptMaterialItem) => {
    pushHistory();
    void updateProject(project.id, (current) => ({
      ...current,
      materials: [...(current.materials ?? []), item]
    })).then((updated) => {
      if (updated) setProject(updated);
      toast({
        title: t('aiVideo.ppt.editor.material.uploadedTip'),
        status: 'success',
        duration: 1500,
        position: 'top'
      });
    });
  };

  /** 从素材库删除（不清理已添加到画面的叠加层） */
  const handleMaterialDelete = (id: string) => {
    pushHistory();
    void updateProject(project.id, (current) => ({
      ...current,
      materials: (current.materials ?? []).filter((item) => item.id !== id)
    })).then((updated) => {
      if (updated) setProject(updated);
    });
  };

  /** 素材添加到画布（当前片段），读取原始宽高比后落位画面中央 */
  const handleMaterialAddToCanvas = (item: PptMaterialItem) => {
    if (!selectedShot) return;
    const finalize = (aspect: number) => {
      const overlay: PptMediaOverlay = {
        id: generateId('media'),
        type: item.type,
        url: item.url,
        x: 50,
        y: 42,
        width: 24,
        aspect: aspect > 0 ? aspect : 16 / 9
      };
      pushHistory();
      void updateProject(project.id, (current) => ({
        ...current,
        storyboard: current.storyboard.map((shot) =>
          shot.id === selectedShot.id
            ? { ...shot, mediaOverlays: [...(shot.mediaOverlays ?? []), overlay] }
            : shot
        )
      })).then((updated) => {
        if (updated) setProject(updated);
        setSelectedMediaId(overlay.id);
        toast({
          title: t('aiVideo.ppt.editor.material.addedTip'),
          status: 'success',
          duration: 1500,
          position: 'top'
        });
      });
    };
    if (item.type === 'image') {
      const img = new window.Image();
      img.onload = () => finalize(img.naturalWidth / Math.max(1, img.naturalHeight));
      img.onerror = () => finalize(16 / 9);
      img.src = item.url;
    } else {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => finalize(video.videoWidth / Math.max(1, video.videoHeight));
      video.onerror = () => finalize(16 / 9);
      video.src = item.url;
    }
  };

  /** 媒体叠加层删除 */
  const handleMediaDelete = (id: string) => {
    if (!selectedShot) return;
    pushHistory();
    void updateProject(project.id, (current) => ({
      ...current,
      storyboard: current.storyboard.map((shot) =>
        shot.id === selectedShot.id
          ? { ...shot, mediaOverlays: (shot.mediaOverlays ?? []).filter((item) => item.id !== id) }
          : shot
      )
    })).then((updated) => {
      if (updated) setProject(updated);
      if (selectedMediaId === id) setSelectedMediaId(null);
    });
  };

  /** 媒体叠加层拖拽/缩放：操作中仅本地更新，结束后持久化 */
  const handleMediaGeometry = (
    id: string,
    patch: Partial<Pick<PptMediaOverlay, 'x' | 'y' | 'width'>>,
    persist: boolean
  ) => {
    if (!selectedShot) return;
    const apply = (overlays: PptMediaOverlay[]) =>
      overlays.map((item) => (item.id === id ? { ...item, ...patch } : item));
    if (persist) {
      pushHistory();
      void updateProject(project.id, (current) => ({
        ...current,
        storyboard: current.storyboard.map((shot) =>
          shot.id === selectedShot.id
            ? { ...shot, mediaOverlays: apply(shot.mediaOverlays ?? []) }
            : shot
        )
      })).then((updated) => {
        if (updated) setProject(updated);
      });
    } else {
      setProject((current) => ({
        ...current,
        storyboard: current.storyboard.map((shot) =>
          shot.id === selectedShot.id
            ? { ...shot, mediaOverlays: apply(shot.mediaOverlays ?? []) }
            : shot
        )
      }));
    }
  };

  /** 背景变更（系统预设替换 / 本地上传 / 恢复跟随模板） */
  const handleBackgroundChange = (background: string | undefined) => {
    pushHistory();
    void updateProject(project.id, (current) => ({
      ...current,
      pptConfig: { ...DEFAULT_STUDIO_CONFIG, ...current.pptConfig, background }
    })).then((updated) => {
      if (updated) setProject(updated);
    });
  };

  /** 数字人画布交互（拖拽/缩放/关闭/作用域同步）变更前入栈 */
  const handleDhBeforeChange = () => pushHistory();

  /** 布局变更（课件版式 × 数字人形态，作用于画布与片段缩略图） */
  const handleLayoutChange = (layout: PptLayoutId) => {
    pushHistory();
    void updateProject(project.id, (current) => ({
      ...current,
      pptConfig: { ...DEFAULT_STUDIO_CONFIG, ...current.pptConfig, layout }
    })).then((updated) => {
      if (updated) setProject(updated);
    });
  };

  /* ---------------- 撤销 / 恢复 ---------------- */

  /** 变更前入栈（撤销点） */
  const pushHistory = () => {
    undoStackRef.current.push(project);
    if (undoStackRef.current.length > 30) undoStackRef.current.shift();
    redoStackRef.current = [];
    setUndoCount(undoStackRef.current.length);
    setRedoCount(0);
  };

  /** 应用历史快照（持久化并同步编辑区状态） */
  const applyHistorySnapshot = (snapshot: AiVideoProject) => {
    void updateProject(project.id, () => snapshot).then((updated) => {
      const next = updated ?? snapshot;
      setProject(next);
      setScripts((prev) => {
        const nextScripts = { ...prev };
        next.storyboard.forEach((shot) => {
          nextScripts[shot.id] = shot.narration;
        });
        return nextScripts;
      });
      if (!next.storyboard.some((shot) => shot.id === selectedId)) {
        setSelectedId(next.storyboard[0]?.id ?? null);
      }
      setSelectedTextId(null);
    });
  };

  const handleUndo = () => {
    const prev = undoStackRef.current.pop();
    if (!prev) return;
    redoStackRef.current.push(project);
    setUndoCount(undoStackRef.current.length);
    setRedoCount(redoStackRef.current.length);
    applyHistorySnapshot(prev);
  };

  const handleRedo = () => {
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current.push(project);
    setUndoCount(undoStackRef.current.length);
    setRedoCount(redoStackRef.current.length);
    applyHistorySnapshot(next);
  };

  /** 音频/数字人/字幕/AI标识配置变更（与成片工作台 handleConfigChange 同一约定） */
  const handleConfigChange = (
    patch: Partial<Pick<AiVideoProject, 'audio' | 'digitalHuman' | 'subtitle' | 'aiBadge'>>
  ) => {
    pushHistory();
    void updateProjectConfig(project.id, patch).then((updated) => {
      if (updated) setProject(updated);
    });
  };

  /** PPT 专属：智能避让开关联动——含视觉素材页缩小数字人贴右下角，关闭则还原默认缩放 */
  const handleSmartAvoidChange = (smartAvoid: boolean) => {
    pushHistory();
    void updateProject(project.id, (current) => ({
      ...current,
      pptConfig: { ...DEFAULT_STUDIO_CONFIG, ...current.pptConfig, smartAvoid },
      storyboard: current.storyboard.map((shot, index) => {
        const page = pages[index];
        if (!page?.hasVisual) return shot;
        const override = { ...shot.digitalHumanOverride };
        if (smartAvoid) {
          override.placement = { x: 86, y: 78, scale: 0.8 };
        } else if (override.placement) {
          override.placement = { ...override.placement, scale: 1 };
        }
        return { ...shot, digitalHumanOverride: override };
      })
    })).then((updated) => {
      if (updated) setProject(updated);
    });
  };

  const handleShotDigitalHumanToggle = (enabled: boolean) => {
    if (!selectedShot) return;
    pushHistory();
    void updateShotDigitalHuman(project.id, selectedShot.id, {
      ...selectedShot.digitalHumanOverride,
      hidden: !enabled
    }).then((updated) => {
      if (updated) setProject(updated);
    });
  };

  /** 新增片段（口播稿生成完成后可新增，直接可编辑） */
  const handleAddShot = () => {
    if (genState !== 'done') return;
    pushHistory();
    const newShot: StoryboardShot = {
      id: generateId('shot'),
      title: `${t('aiVideo.ppt.editor.newSegmentTitle')} ${project.storyboard.length + 1}`,
      sceneDescription: '',
      narration: '',
      productionNotes: '',
      duration: 5,
      imageUrl: shotImageUrl(project.storyboard.length)
    };
    void updateStoryboard(project.id, [...project.storyboard, newShot]).then((updated) => {
      if (!updated) return;
      setProject(updated);
      setScripts((prev) => ({ ...prev, [newShot.id]: '' }));
      setRevealedCount((count) => count + 1);
      setSelectedId(newShot.id);
      toast({
        title: t('aiVideo.ppt.editor.segmentAdded'),
        status: 'success',
        duration: 1500,
        position: 'top'
      });
    });
  };

  /** 删除片段（至少保留 1 个），删除后选中相邻片段 */
  const handleDeleteShot = (shotId: string) => {
    pushHistory();
    if (project.storyboard.length <= 1) {
      toast({
        title: t('aiVideo.ppt.editor.lastSegmentTip'),
        status: 'info',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    const removedIndex = project.storyboard.findIndex((shot) => shot.id === shotId);
    const nextShots = project.storyboard.filter((shot) => shot.id !== shotId);
    void updateStoryboard(project.id, nextShots).then((updated) => {
      if (!updated) return;
      setProject(updated);
      setScripts((prev) => {
        const next = { ...prev };
        delete next[shotId];
        return next;
      });
      setRevealedCount((count) => Math.max(0, count - (removedIndex < count ? 1 : 0)));
      if (selectedId === shotId) {
        const fallback = nextShots[Math.min(removedIndex, nextShots.length - 1)];
        setSelectedId(fallback?.id ?? null);
      }
      toast({
        title: t('aiVideo.ppt.editor.segmentDeleted'),
        status: 'success',
        duration: 1500,
        position: 'top'
      });
    });
  };

  /* ---------------- 提交生成视频（先弹合成设置） ---------------- */
  const handleConfirmRender = async (settings: RenderSettings) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const nextShots = project.storyboard.map((shot) => ({
        ...shot,
        narration: scripts[shot.id] || shot.narration
      }));
      await updateStoryboard(project.id, nextShots);
      // 保存视频名称与合成参数
      await updateProject(project.id, (current) => ({
        ...current,
        title: settings.title,
        pptConfig: {
          ...DEFAULT_STUDIO_CONFIG,
          ...current.pptConfig,
          resolution: settings.resolution,
          quality: settings.quality,
          frameRate: settings.frameRate
        }
      }));
      const submitted = await submitGenerateTask(project.id);
      if (!submitted) throw new Error('submit failed');
      if (onSubmitted) onSubmitted(submitted);
      else router.push('/teacher/ai-video');
    } catch {
      toast({
        title: t('aiVideo.ppt.editor.submitFailed'),
        status: 'error',
        duration: 3000,
        position: 'top'
      });
      setIsSubmitting(false);
    }
  };

  /* ---------------- 渲染 ---------------- */
  const subtitleOn = subtitle.visible;
  const aiBadgeOn = project.aiBadge !== false;
  const dhAvatar =
    DIGITAL_HUMAN_AVATARS.find((item) => item.id === project.digitalHuman?.avatar) ??
    DIGITAL_HUMAN_AVATARS[0];
  const estimatedSeconds = Math.max(
    1,
    Math.round(selectedScript.length / (CHARS_PER_SECOND * audio.speed))
  );
  /** 生成期间在画面上展示口播稿生成进度（已生成/总数），与左侧片段逐步加载对应 */
  const showGeneratingOverlay = genState !== 'done' && selectedShot !== null;
  const playing = playPhase !== null;

  return (
    <Flex direction="column" h="calc(100vh - 64px)" bg="gray.50">
      {/* 顶栏 */}
      <Flex
        h="56px"
        flexShrink={0}
        align="center"
        gap={3}
        px={4}
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.100"
      >
        <Button
          size="sm"
          variant="ghost"
          color="gray.600"
          leftIcon={<ChevronLeft size={15} />}
          onClick={onBack}
          px={2}
        >
          {startReady ? t('aiVideo.ppt.editor.backToList') : t('aiVideo.ppt.editor.back')}
        </Button>
        <Flex align="center" gap={1.5} minW={0}>
          <Box color={AI_VIDEO_PRIMARY} flexShrink={0}>
            <FileText size={15} />
          </Box>
          <Text fontSize="14px" fontWeight={600} color="gray.800" noOfLines={1}>
            {project.title}
          </Text>
        </Flex>
        <Box flex="1" />
        <Flex align="center" gap={1.5} color={saveState === 'saved' ? 'green.500' : 'gray.400'}>
          {saveState === 'saving' ? (
            <Spinner size="xs" />
          ) : (
            <Box w="8px" h="8px" borderRadius="full" bg="currentColor" opacity={0.6} />
          )}
          <Text fontSize="12px">
            {saveState === 'saving'
              ? t('aiVideo.ppt.editor.saving')
              : saveState === 'saved'
                ? t('aiVideo.ppt.editor.saved')
                : t('aiVideo.ppt.editor.autosave')}
          </Text>
        </Flex>
        <Button
          size="sm"
          variant="outline"
          bg="white"
          color="gray.700"
          leftIcon={<Eye size={14} />}
          onClick={() => setPreviewOpen(true)}
        >
          {t('aiVideo.ppt.editor.preview')}
        </Button>
        <Button
          size="sm"
          variant="primary"
          bg={AI_VIDEO_PRIMARY}
          borderColor={AI_VIDEO_PRIMARY}
          _hover={{ bg: AI_VIDEO_PRIMARY_HOVER, borderColor: AI_VIDEO_PRIMARY_HOVER }}
          leftIcon={<Download size={14} />}
          isDisabled={isSubmitting}
          onClick={() => setRenderModalOpen(true)}
        >
          {t('aiVideo.ppt.editor.generateVideo')}
        </Button>
      </Flex>

      {/* 中部：片段栏 + 画布 + 工具栏 */}
      <Flex flex="1" minH={0} px={4} py={3} gap={3}>
        <SegmentList
          project={project}
          scripts={scripts}
          revealedIds={revealedIds}
          selectedId={selectedId}
          addDisabled={genState !== 'done'}
          onSelect={handleSelectShot}
          onAdd={handleAddShot}
          onDelete={handleDeleteShot}
        />

        {/* 画布区 */}
        <Flex flex="1" minW={0} direction="column" gap={2} overflowY="auto">
          {/* 画布上方工具行 */}
          <Flex align="center" gap={2} flexWrap="wrap">
            {/* 字幕/AI 标识开关（与文字生成视频编辑预览页一致，与智能进度条同行展示） */}
            <Box sx={{ '& > div': { position: 'static' } }}>
              <CanvasOverlayToggles project={project} onConfigChange={handleConfigChange} />
            </Box>
            {(
              [
                {
                  key: 'progress',
                  icon: <Clapperboard size={13} />,
                  on: progressBarOn,
                  action: () => {
                    const next = !progressBarOn;
                    handleProgressToggle(next);
                    setProgressEditorOpen(next);
                  },
                  label: t('aiVideo.ppt.editor.toggleProgress')
                }
              ] as const
            ).map((item) => (
              <Flex
                key={item.key}
                as="button"
                type="button"
                align="center"
                gap={1}
                px={2.5}
                py={1}
                borderRadius="full"
                fontSize="12px"
                border="1px solid"
                borderColor={item.on ? AI_VIDEO_PRIMARY : '#E7E7E7'}
                bg={item.on ? AI_VIDEO_PRIMARY_BG : 'white'}
                color={item.on ? AI_VIDEO_PRIMARY : 'gray.500'}
                transition="all 0.15s"
                onClick={item.action}
              >
                {item.icon}
                {item.label}
              </Flex>
            ))}
            <Box flex="1" />
            {/* 撤销 / 恢复 */}
            <IconButton
              aria-label={t('aiVideo.ppt.editor.undo')}
              icon={<Undo2 size={14} />}
              size="sm"
              variant="outline"
              bg="white"
              color="gray.700"
              isDisabled={undoCount === 0 || genState !== 'done'}
              onClick={handleUndo}
            />
            <IconButton
              aria-label={t('aiVideo.ppt.editor.redo')}
              icon={<Redo2 size={14} />}
              size="sm"
              variant="outline"
              bg="white"
              color="gray.700"
              isDisabled={redoCount === 0 || genState !== 'done'}
              onClick={handleRedo}
            />
            <Button
              size="sm"
              variant="outline"
              bg="white"
              color="gray.700"
              leftIcon={playing ? <Pause size={13} /> : <Play size={13} />}
              onClick={handlePlayToggle}
            >
              {t('aiVideo.ppt.editor.playSegment')}
            </Button>
          </Flex>

          {/* 画布 */}
          {selectedShot && (
            <ShotCanvas
              project={project}
              shot={selectedShot}
              script={selectedRevealed ? selectedScript : ''}
              subtitleOn={subtitleOn}
              aiBadgeOn={aiBadgeOn}
              shotIndex={selectedIndex}
              onSelectShot={(index) => {
                const target = shots[Math.min(Math.max(0, index), shots.length - 1)];
                if (target) handleSelectShot(target.id);
              }}
              playPercent={playPercent}
              selectedTextId={selectedTextId}
              onSelectText={(id) => setSelectedTextId(id)}
              onDeleteText={handleTextDelete}
              onTextGeometry={handleTextGeometry}
              onProjectChange={setProject}
              onConfigChange={handleConfigChange}
              onBeforeChange={handleDhBeforeChange}
              selectedMediaId={selectedMediaId}
              onSelectMedia={setSelectedMediaId}
              onDeleteMedia={handleMediaDelete}
              onMediaGeometry={handleMediaGeometry}
            >
              {/* 音频合成中覆盖层（播放片段：合成完成播放语音） */}
              {playPhase === 'synthesizing' && (
                <Flex
                  position="absolute"
                  inset={0}
                  bg="blackAlpha.400"
                  align="center"
                  justify="center"
                  zIndex={5}
                >
                  <Flex
                    direction="column"
                    align="center"
                    gap={3}
                    bg="blackAlpha.700"
                    borderRadius="16px"
                    px={8}
                    py={6}
                  >
                    <Spinner size="lg" color="white" />
                    <Text fontSize="14px" fontWeight={600} color="white">
                      {t('aiVideo.ppt.editor.audioSynthesizing')}
                    </Text>
                  </Flex>
                </Flex>
              )}

              {/* 口播稿生成中覆盖层 */}
              {showGeneratingOverlay && (
                <Flex
                  position="absolute"
                  inset={0}
                  bg="blackAlpha.400"
                  align="center"
                  justify="center"
                >
                  <Flex
                    direction="column"
                    align="center"
                    gap={3}
                    bg="blackAlpha.700"
                    borderRadius="16px"
                    px={8}
                    py={6}
                  >
                    <Spinner size="lg" color="white" />
                    <Text fontSize="14px" fontWeight={600} color="white">
                      {t('aiVideo.ppt.editor.generating', {
                        done: revealedCount,
                        total: totalShots
                      })}
                    </Text>
                    <Button
                      size="sm"
                      variant="outline"
                      bg="white"
                      color="gray.700"
                      onClick={() => setGenState(genState === 'running' ? 'stopped' : 'running')}
                    >
                      {genState === 'running'
                        ? t('aiVideo.ppt.editor.stopGenerate')
                        : t('aiVideo.ppt.editor.resumeGenerate')}
                    </Button>
                  </Flex>
                </Flex>
              )}
            </ShotCanvas>
          )}
          {/* 智能进度条编辑器（显示在画布下方） */}
          {progressEditorOpen && (
            <ProgressEditor
              project={project}
              chapters={progressChapters}
              enabled={progressBarOn}
              onToggleEnabled={handleProgressToggle}
              onGenerate={handleProgressGenerate}
              onRename={handleChapterRename}
              onDelete={handleChapterDelete}
              onResize={handleChapterResize}
              onClose={() => setProgressEditorOpen(false)}
            />
          )}
        </Flex>

        {/* 右侧工具栏 */}
        <EditorRail
          project={project}
          selectedShot={selectedShot}
          active={railKey}
          onSelect={setRailKey}
          onTemplateChange={handleTemplateChange}
          onLayoutChange={handleLayoutChange}
          onConfigChange={handleConfigChange}
          onSmartAvoidChange={handleSmartAvoidChange}
          onShotDigitalHumanToggle={handleShotDigitalHumanToggle}
          selectedTextId={selectedTextId}
          onSelectText={setSelectedTextId}
          onTextAdd={handleTextAdd}
          onTextChange={handleTextChange}
          onTextDelete={handleTextDelete}
          onMaterialUpload={handleMaterialUpload}
          onMaterialDelete={handleMaterialDelete}
          onMaterialAddToCanvas={handleMaterialAddToCanvas}
          onBackgroundChange={handleBackgroundChange}
        />
      </Flex>

      {/* 底部口播稿编辑区（智能进度条编辑器显示时不展示） */}
      {!progressEditorOpen && (
        <Box flexShrink={0} bg="white" borderTop="1px solid" borderColor="gray.100" px={4} py={3}>
          <Flex align="center" gap={3} mb={2}>
            <Image
              src={dhAvatar.src}
              alt=""
              w="28px"
              h="28px"
              borderRadius="full"
              objectFit="cover"
              bg="gray.100"
            />
            <Text fontSize="13px" fontWeight={600} color="gray.700">
              {t(`aiVideo.create.voiceOption.${audio.voice}`)}
            </Text>
            <Flex align="center" gap={1} color="gray.400">
              <Music size={13} />
              <Text fontSize="12px">
                {t('aiVideo.ppt.editor.bgm')} · {t(`aiVideo.create.bgmOption.${audio.bgm}`)}
              </Text>
            </Flex>
            <Box flex="1" />
            {(
              [
                {
                  key: 'optimize',
                  icon: <Wand2 size={13} />,
                  on: false,
                  label: t('aiVideo.ppt.editor.optimize'),
                  action: handleOptimize
                }
              ] as const
            ).map((item) => (
              <Flex
                key={item.key}
                as="button"
                type="button"
                align="center"
                gap={1}
                px={2.5}
                py={1}
                borderRadius="full"
                fontSize="12px"
                border="1px solid"
                borderColor={item.on ? AI_VIDEO_PRIMARY : '#E7E7E7'}
                bg={item.on ? AI_VIDEO_PRIMARY_BG : 'white'}
                color={item.on ? AI_VIDEO_PRIMARY : 'gray.500'}
                transition="all 0.15s"
                onClick={item.action}
              >
                {optimizing && item.key === 'optimize' ? <Spinner size="xs" /> : item.icon}
                {item.label}
              </Flex>
            ))}
          </Flex>

          <HighlightTextarea
            textareaRef={textareaRef}
            value={selectedRevealed ? selectedScript : ''}
            highlights={selectedShot?.subtitleHighlights ?? []}
            onChange={handleScriptChange}
            onSelect={handleScriptSelect}
            placeholder={
              selectedRevealed
                ? t('aiVideo.ppt.editor.scriptPlaceholder')
                : t('aiVideo.ppt.editor.generating', { done: revealedCount, total: totalShots })
            }
            isDisabled={!selectedRevealed}
            maxLength={SCRIPT_MAX_LENGTH}
            rows={3}
          />

          <Flex align="center" gap={2} mt={2} flexWrap="wrap">
            {/* 选中文稿文字设置/取消字幕高亮 */}
            <Flex
              as="button"
              type="button"
              align="center"
              gap={1}
              px={2.5}
              py={1}
              borderRadius="full"
              fontSize="12px"
              border="1px solid"
              borderColor={
                scriptSelection &&
                (selectedShot?.subtitleHighlights ?? []).includes(scriptSelection.text)
                  ? AI_VIDEO_PRIMARY
                  : '#E7E7E7'
              }
              bg={
                scriptSelection &&
                (selectedShot?.subtitleHighlights ?? []).includes(scriptSelection.text)
                  ? AI_VIDEO_PRIMARY_BG
                  : 'white'
              }
              color={
                scriptSelection &&
                (selectedShot?.subtitleHighlights ?? []).includes(scriptSelection.text)
                  ? AI_VIDEO_PRIMARY
                  : 'gray.500'
              }
              opacity={scriptSelection ? 1 : 0.5}
              cursor={scriptSelection ? 'pointer' : 'not-allowed'}
              transition="all 0.15s"
              onClick={() => {
                if (scriptSelection) handleToggleHighlight();
              }}
            >
              <Highlighter size={12} />
              {t('aiVideo.ppt.editor.highlightSelection')}
            </Flex>
            <Box flex="1" />
            <Text fontSize="12px" color="gray.400">
              {t('aiVideo.ppt.editor.charCount', { count: selectedScript.length })}
            </Text>
            <Text fontSize="12px" color="gray.400">
              {t('aiVideo.ppt.editor.estimated', { seconds: estimatedSeconds })}
            </Text>
            <Button
              size="sm"
              variant="primary"
              bg={AI_VIDEO_PRIMARY}
              borderColor={AI_VIDEO_PRIMARY}
              _hover={{ bg: AI_VIDEO_PRIMARY_HOVER, borderColor: AI_VIDEO_PRIMARY_HOVER }}
              leftIcon={auditioning ? <SquarePen size={13} /> : <Play size={13} />}
              isDisabled={!selectedRevealed || !selectedScript.trim()}
              onClick={handleAudition}
              minW="88px"
            >
              {auditioning
                ? t('aiVideo.ppt.editor.auditionStop')
                : t('aiVideo.ppt.editor.audition')}
            </Button>
          </Flex>
        </Box>
      )}

      {/* 生成视频合成设置 */}
      <RenderSettingsModal
        project={project}
        totalDuration={shots.reduce((acc, shot) => acc + Math.max(1, shot.duration), 0)}
        isOpen={renderModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => setRenderModalOpen(false)}
        onConfirm={(settings) => void handleConfirmRender(settings)}
      />

      {/* 全片预览 */}
      <PreviewModal
        project={project}
        scripts={scripts}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </Flex>
  );
}
