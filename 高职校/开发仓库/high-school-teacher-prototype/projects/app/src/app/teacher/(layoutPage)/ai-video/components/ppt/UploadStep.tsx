'use client';

/**
 * PPT/文档转视频 - 第一步：文件上传 + 智能解析（PRD 5.2 / 5.3）
 * 点击/拖拽上传，单次仅 1 个文件；实时进度 0%-100%
 * 前置校验链：格式 → 大小（超限弹窗展示权限差异与升级入口）→ 完整性（文件头签名嗅探）→ 内容安全
 * 上传成功后自动执行智能解析（页面结构/文本/视觉/动画/版式 五段进度），
 * 解析完成仅展示结果摘要（有效页数 + 空白页过滤数），不展示解析明细
 */
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Tag,
  Text,
  useToast,
  VStack
} from '@chakra-ui/react';
import {
  Crown,
  FileCheck2,
  FileSearch,
  FileUp,
  Filter,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import {
  findSensitiveWord,
  isPptFileNameAccepted,
  PPT_MAX_SIZE_BYTES,
  sniffPptFileIntegrity
} from '@/teacher/api/aiVideo';
import type { PptPageInfo } from '@/teacher/types/aiVideo';
import {
  AI_VIDEO_PRIMARY,
  AI_VIDEO_PRIMARY_BG,
  AI_VIDEO_PRIMARY_HOVER,
  CARD_SHADOW
} from '../../constants';

export type UploadedPptFile = { name: string; size: number };

type UploadState =
  | { phase: 'idle' }
  | { phase: 'uploading'; progress: number; file: UploadedPptFile }
  | { phase: 'validating'; file: UploadedPptFile }
  | { phase: 'parsing'; progress: number; file: UploadedPptFile }
  | { phase: 'parsed'; file: UploadedPptFile }
  | {
      phase: 'error';
      kind: 'format' | 'integrity' | 'moderation' | 'failed';
      file?: UploadedPptFile;
    };

/** 示例课件（无真实文件时的体验入口） */
const DEMO_FILE: UploadedPptFile = { name: '示例课件·勾股定理.pptx', size: 8.6 * 1024 * 1024 };

/** 智能解析五段进度（5.3.1 解析内容维度） */
const PARSE_STAGES = [
  'stageStructure',
  'stageText',
  'stageVisual',
  'stageAnimation',
  'stageLayout'
] as const;

function formatSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function UploadStep({
  pages,
  onSuccess,
  onParseDone
}: {
  /** 解析得到的页面结构（onSuccess 后由父组件提供，用于完成摘要统计） */
  pages: PptPageInfo[];
  onSuccess: (file: UploadedPptFile) => void;
  onParseDone: () => void;
}) {
  const { t } = useTranslation('teacher');
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timersRef = useRef<number[]>([]);
  const [state, setState] = useState<UploadState>({ phase: 'idle' });
  const [isDragOver, setIsDragOver] = useState(false);
  const [oversizeFile, setOversizeFile] = useState<UploadedPptFile | null>(null);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);

  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };

  const reset = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setState({ phase: 'idle' });
    if (inputRef.current) inputRef.current.value = '';
  };

  /** 智能解析（5.3）：五段进度匀速推进，完成后仅展示结果摘要 */
  const runParsing = (file: UploadedPptFile) => {
    const startedAt = Date.now();
    const tick = () => {
      const progress = Math.min(100, Math.round(((Date.now() - startedAt) / 2200) * 100));
      if (progress < 100) {
        setState({ phase: 'parsing', progress, file });
        later(tick, 80);
      } else {
        setState({ phase: 'parsed', file });
        onParseDone();
      }
    };
    tick();
  };

  /** 校验链（5.2.2）：完整性 → 内容安全，全部通过进入解析阶段 */
  const runValidation = (file: UploadedPptFile, head?: Uint8Array) => {
    setState({ phase: 'validating', file });
    later(() => {
      // 文件完整性校验：损坏 / 加密 / 无法解析
      if (head && !sniffPptFileIntegrity(head, file.name)) {
        setState({ phase: 'error', kind: 'integrity', file });
        return;
      }
      // 内容安全前置校验：违规直接拦截，禁止进入下一步
      if (findSensitiveWord(file.name)) {
        setState({ phase: 'error', kind: 'moderation', file });
        return;
      }
      onSuccess(file);
      runParsing(file);
    }, 900);
  };

  /** 上传（模拟匀速进度；真实文件仅读取文件头 8 字节用于完整性嗅探） */
  const startUpload = (file: UploadedPptFile, head?: Uint8Array) => {
    const startedAt = Date.now();
    const tick = () => {
      const progress = Math.min(100, Math.round(((Date.now() - startedAt) / 1200) * 100));
      if (progress < 100) {
        setState({ phase: 'uploading', progress, file });
        later(tick, 60);
      } else {
        setState({ phase: 'uploading', progress: 100, file });
        runValidation(file, head);
      }
    };
    tick();
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    // 单次仅支持上传 1 个文件（5.2.1）
    if (files.length > 1) {
      toast({
        title: t('aiVideo.ppt.upload.multiTip'),
        status: 'info',
        duration: 2500,
        position: 'top'
      });
    }
    const raw = files[0];
    const file: UploadedPptFile = { name: raw.name, size: raw.size };

    // 格式校验（实时拦截）
    if (!isPptFileNameAccepted(raw.name)) {
      setState({ phase: 'error', kind: 'format', file });
      return;
    }
    // 大小校验：超出权限限制 → 弹窗展示权限差异与升级入口
    if (raw.size > PPT_MAX_SIZE_BYTES) {
      setOversizeFile(file);
      return;
    }
    const head = new Uint8Array(await raw.slice(0, 8).arrayBuffer());
    startUpload(file, head);
  };

  const errorText = (kind: 'format' | 'integrity' | 'moderation' | 'failed') => {
    if (kind === 'format') return t('aiVideo.ppt.upload.errorFormat');
    if (kind === 'integrity') return t('aiVideo.ppt.upload.errorIntegrity');
    if (kind === 'moderation') return t('aiVideo.ppt.upload.errorModeration');
    return t('aiVideo.ppt.upload.stateFailed');
  };

  const busyFile = state.phase === 'uploading' || state.phase === 'validating' ? state.file : null;
  const parseFile = state.phase === 'parsing' || state.phase === 'parsed' ? state.file : null;
  const validCount = pages.filter((page) => !page.blank).length;
  const blankCount = pages.length - validCount;
  const parseProgress = state.phase === 'parsing' ? state.progress : 100;
  const stageIndex = Math.min(
    PARSE_STAGES.length - 1,
    Math.floor(parseProgress / (100 / PARSE_STAGES.length))
  );

  return (
    <Box>
      {state.phase === 'idle' && (
        <VStack spacing={4} align="stretch">
          <Flex
            as="button"
            type="button"
            direction="column"
            align="center"
            justify="center"
            gap={3}
            py={12}
            px={6}
            borderRadius="16px"
            border="2px dashed"
            borderColor={isDragOver ? AI_VIDEO_PRIMARY : '#D9DEE7'}
            bg={isDragOver ? AI_VIDEO_PRIMARY_BG : 'white'}
            cursor="pointer"
            transition="all 0.15s"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event: React.DragEvent) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(event: React.DragEvent) => {
              event.preventDefault();
              setIsDragOver(false);
              void handleFiles(event.dataTransfer.files);
            }}
          >
            <Flex
              w="56px"
              h="56px"
              borderRadius="16px"
              bg={AI_VIDEO_PRIMARY_BG}
              color={AI_VIDEO_PRIMARY}
              align="center"
              justify="center"
            >
              <FileUp size={26} />
            </Flex>
            <Text fontSize="15px" fontWeight={600} color="gray.700">
              {t('aiVideo.ppt.upload.dropTitle')}
            </Text>
            <Text fontSize="12px" color="gray.400" textAlign="center">
              {t('aiVideo.ppt.upload.hint')}
            </Text>
          </Flex>
          <Text
            as="button"
            type="button"
            fontSize="12px"
            color={AI_VIDEO_PRIMARY}
            textAlign="center"
            _hover={{ textDecoration: 'underline' }}
            onClick={() => startUpload(DEMO_FILE)}
          >
            {t('aiVideo.ppt.upload.demoLink')}
          </Text>
        </VStack>
      )}

      {/* 上传中 / 校验中 */}
      {busyFile && (
        <Box bg="white" borderRadius="16px" boxShadow={CARD_SHADOW} p={6}>
          <Flex align="center" gap={3} mb={4}>
            <Flex
              w="40px"
              h="40px"
              borderRadius="12px"
              bg={AI_VIDEO_PRIMARY_BG}
              color={AI_VIDEO_PRIMARY}
              align="center"
              justify="center"
              flexShrink={0}
            >
              <FileUp size={20} />
            </Flex>
            <Box flex="1" minW={0}>
              <Text fontSize="14px" fontWeight={500} color="gray.700" noOfLines={1}>
                {busyFile.name}
              </Text>
              <Text fontSize="12px" color="gray.400">
                {t('aiVideo.ppt.upload.fileSize')}: {formatSize(busyFile.size)}
              </Text>
            </Box>
            <Tag
              borderRadius="full"
              bg={AI_VIDEO_PRIMARY_BG}
              color={AI_VIDEO_PRIMARY}
              flexShrink={0}
            >
              {state.phase === 'uploading'
                ? `${t('aiVideo.ppt.upload.stateUploading')} ${state.progress}%`
                : t('aiVideo.ppt.upload.stateValidating')}
            </Tag>
          </Flex>
          <Progress
            value={state.phase === 'uploading' ? state.progress : 100}
            size="sm"
            borderRadius="full"
            colorScheme="red"
            bg="gray.100"
            hasStripe
            isAnimated
          />
        </Box>
      )}

      {/* 智能解析中 / 解析完成 */}
      {parseFile && (
        <Box bg="white" borderRadius="16px" boxShadow={CARD_SHADOW} p={6}>
          <Flex align="center" gap={3} mb={4}>
            <Flex
              w="40px"
              h="40px"
              borderRadius="12px"
              bg={state.phase === 'parsed' ? 'green.50' : AI_VIDEO_PRIMARY_BG}
              color={state.phase === 'parsed' ? 'green.500' : AI_VIDEO_PRIMARY}
              align="center"
              justify="center"
              flexShrink={0}
            >
              {state.phase === 'parsed' ? <FileCheck2 size={20} /> : <FileSearch size={20} />}
            </Flex>
            <Box flex="1" minW={0}>
              <Text fontSize="14px" fontWeight={500} color="gray.700" noOfLines={1}>
                {parseFile.name}
              </Text>
              <Text fontSize="12px" color="gray.400">
                {t('aiVideo.ppt.upload.fileSize')}: {formatSize(parseFile.size)}
              </Text>
            </Box>
            {state.phase === 'parsing' ? (
              <Tag
                borderRadius="full"
                bg={AI_VIDEO_PRIMARY_BG}
                color={AI_VIDEO_PRIMARY}
                flexShrink={0}
              >
                {t(`aiVideo.ppt.parse.${PARSE_STAGES[stageIndex]}`)} {parseProgress}%
              </Tag>
            ) : (
              <Tag borderRadius="full" colorScheme="green" flexShrink={0}>
                {t('aiVideo.ppt.upload.stateSuccess')}
              </Tag>
            )}
            <Button
              size="sm"
              variant="outline"
              bg="white"
              color="gray.600"
              leftIcon={<RefreshCw size={13} />}
              onClick={reset}
              flexShrink={0}
            >
              {t('aiVideo.ppt.upload.reupload')}
            </Button>
          </Flex>
          {state.phase === 'parsing' ? (
            <Progress
              value={parseProgress}
              size="sm"
              borderRadius="full"
              colorScheme="red"
              bg="gray.100"
              hasStripe
              isAnimated
            />
          ) : (
            <Flex align="center" gap={2} flexWrap="wrap">
              <Tag borderRadius="full" colorScheme="green">
                {t('aiVideo.ppt.parse.done', { count: validCount })}
              </Tag>
              {blankCount > 0 && (
                <Tag borderRadius="full" colorScheme="gray" variant="subtle">
                  <Flex align="center" gap={1}>
                    <Filter size={11} />
                    {t('aiVideo.ppt.parse.blankFiltered', { count: blankCount })}
                  </Flex>
                </Tag>
              )}
            </Flex>
          )}
        </Box>
      )}

      {/* 失败/拦截 */}
      {state.phase === 'error' && (
        <VStack align="stretch" spacing={4}>
          <Alert status="error" borderRadius="12px" bg="red.50">
            <AlertIcon as={ShieldAlert} />
            <Text fontSize="13px" color="red.600">
              {errorText(state.kind)}
            </Text>
          </Alert>
          <Flex justify="center">
            <Button
              size="sm"
              variant="outline"
              bg="white"
              color="gray.600"
              leftIcon={<RefreshCw size={13} />}
              onClick={reset}
            >
              {t('aiVideo.ppt.upload.reupload')}
            </Button>
          </Flex>
        </VStack>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".ppt,.pptx,.doc,.docx,.pdf"
        style={{ display: 'none' }}
        onChange={(event) => void handleFiles(event.target.files)}
      />

      {/* 超限弹窗：权限差异与升级入口（5.2.2 大小校验） */}
      <Modal isOpen={Boolean(oversizeFile)} onClose={() => setOversizeFile(null)} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="16px" mx={4}>
          <ModalHeader fontSize="16px">{t('aiVideo.ppt.upload.oversizeTitle')}</ModalHeader>
          <ModalBody>
            <Text fontSize="13px" color="gray.600" mb={4}>
              {t('aiVideo.ppt.upload.oversizeDesc', {
                size: oversizeFile ? formatSize(oversizeFile.size).replace('MB', '') : ''
              })}
            </Text>
            <VStack align="stretch" spacing={2}>
              <Flex
                justify="space-between"
                align="center"
                bg="gray.50"
                borderRadius="10px"
                px={4}
                py={3}
              >
                <Text fontSize="13px" color="gray.600">
                  {t('aiVideo.ppt.upload.oversizeFree')}
                </Text>
                <Tag borderRadius="full" colorScheme="gray">
                  {t('aiVideo.ppt.params.vipTag') === '会员' ? '当前' : 'Current'}
                </Tag>
              </Flex>
              <Flex
                justify="space-between"
                align="center"
                bg={AI_VIDEO_PRIMARY_BG}
                borderRadius="10px"
                px={4}
                py={3}
              >
                <Text fontSize="13px" color={AI_VIDEO_PRIMARY} fontWeight={500}>
                  {t('aiVideo.ppt.upload.oversizeVip')}
                </Text>
                <Tag borderRadius="full" bg={AI_VIDEO_PRIMARY} color="white">
                  {t('aiVideo.ppt.params.vipTag')}
                </Tag>
              </Flex>
            </VStack>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button
              variant="outline"
              bg="white"
              color="gray.600"
              onClick={() => setOversizeFile(null)}
            >
              {t('aiVideo.ppt.upload.oversizeCancel')}
            </Button>
            <Button
              variant="primary"
              bg={AI_VIDEO_PRIMARY}
              borderColor={AI_VIDEO_PRIMARY}
              _hover={{ bg: AI_VIDEO_PRIMARY_HOVER, borderColor: AI_VIDEO_PRIMARY_HOVER }}
              leftIcon={<Crown size={14} />}
              onClick={() => {
                setOversizeFile(null);
                toast({
                  title: t('aiVideo.ppt.upload.upgradeTip'),
                  status: 'info',
                  duration: 2000,
                  position: 'top'
                });
              }}
            >
              {t('aiVideo.ppt.upload.oversizeUpgrade')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
