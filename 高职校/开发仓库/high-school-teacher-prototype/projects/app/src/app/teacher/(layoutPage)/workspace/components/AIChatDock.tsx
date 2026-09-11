'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Image,
  Spinner,
  Text,
  Textarea,
  useToast
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useVoiceInput } from '@/web/common/hooks/useVoiceInput';
import { uploadPrivateFile, createMineruParseTask } from '@/teacher/api/file';
import type { FileMetaType } from '@/teacher/api/file';
import { getFileIconByName } from '@/utils/fileIcon';
import { TEXT_PRIMARY, TEXT_SECONDARY } from '../constants';

export type AttachmentFile = FileMetaType & { taskId?: string };

type AIChatDockProps = {
  onQuickAction: (key: QuickActionKey) => void;
  onSend: (text: string, attachments?: AttachmentFile[]) => void;
  onUpload?: (file: AttachmentFile) => void;
  onContainerClick?: () => void;
  attachments?: AttachmentFile[];
  onRemoveAttachment?: (fileKey: string) => void;
};

export type QuickActionKey =
  | 'chat'
  | 'open_course'
  | 'make_courseware'
  | 'make_ai_main'
  | 'ask_progress';

type QuickAction = {
  key: QuickActionKey;
  prefixKey?: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { key: 'chat' },
  { key: 'make_ai_main', prefixKey: 'before_class' },
  { key: 'make_courseware', prefixKey: 'before_class' },
  { key: 'open_course', prefixKey: 'before_class' },
  { key: 'ask_progress' }
];

const MAX_FILE_COUNT = 5;
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/markdown',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml'
];

const ALLOWED_FILE_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.md',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.svg'
];

export function AIChatDock({
  onQuickAction,
  onSend,
  onUpload,
  onContainerClick,
  attachments,
  onRemoveAttachment
}: AIChatDockProps) {
  const { t } = useTranslation('teacher');
  const toast = useToast();
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);
  const compositionEndLockRef = useRef(false);
  const { startSpeak, stopSpeak, isSpeaking, isTransCription, speakingTimeString } =
    useVoiceInput();

  const isRecordingMode = isSpeaking || isTransCription;

  const handleSend = () => {
    if (isUploading) return;
    if (!text.trim() && (!attachments || attachments.length === 0)) {
      onSend('');
      return;
    }
    onSend(text, attachments);
    setText('');
  };

  const handleStartVoice = () => {
    startSpeak((result) => {
      setText((prev) => (prev ? prev + result : result));
    });
  };

  const handleUploadClick = useCallback(() => {
    if (attachments && attachments.length >= MAX_FILE_COUNT) {
      toast({
        title: t('workspace.chat_dock.upload_limit_count'),
        status: 'warning',
        duration: 3000,
        position: 'top',
        isClosable: true
      });
      return;
    }
    fileInputRef.current?.click();
  }, [attachments, toast, t]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (attachments && attachments.length >= MAX_FILE_COUNT) {
        toast({
          title: t('workspace.chat_dock.upload_limit_count'),
          status: 'warning',
          duration: 3000,
          position: 'top',
          isClosable: true
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      const hasAllowedType =
        ALLOWED_FILE_TYPES.includes(file.type) ||
        ALLOWED_FILE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
      if (!hasAllowedType) {
        toast({
          title: t('workspace.chat_dock.upload_limit_type'),
          status: 'warning',
          duration: 3000,
          position: 'top',
          isClosable: true
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: t('workspace.chat_dock.upload_limit_size', { fileName: file.name }),
          status: 'warning',
          duration: 3000,
          position: 'top',
          isClosable: true
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await uploadPrivateFile(formData);
        const taskId = await createMineruParseTask({
          fileKey: res.fileKey,
          fileUrl: res.fileUrl || ''
        });
        const attachment: AttachmentFile = { ...res, taskId };
        onUpload?.(attachment);
      } catch (error) {
        console.error('文件上传或解析任务创建失败:', error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [attachments, onUpload, toast, t]
  );

  return (
    <Box
      maxW="880px"
      mx="auto"
      w="100%"
      cursor={onContainerClick ? 'pointer' : undefined}
      onClick={onContainerClick}
    >
      <HStack spacing={3} mb={3} flexWrap="wrap">
        {QUICK_ACTIONS.map((action) => (
          <Box
            key={action.key}
            as="button"
            onClick={(e: React.MouseEvent) => {
              if (isUploading) return;
              e.stopPropagation();
              onQuickAction(action.key);
            }}
            px={4}
            py={2}
            borderRadius="full"
            bg="white"
            border="1px solid"
            borderColor="#F2F3F5"
            fontSize="13px"
            color={TEXT_PRIMARY}
            transition="all 0.15s ease"
            _hover={{ bg: '#F9FAFB' }}
          >
            {action.prefixKey && (
              <Text as="span" color={TEXT_SECONDARY} mr={1}>
                {t(`workspace.chat_dock.quick_actions.${action.prefixKey}`)}
              </Text>
            )}
            <Text as="span" fontWeight="normal">
              {t(`workspace.chat_dock.quick_actions.${action.key}`)}
            </Text>
          </Box>
        ))}
      </HStack>

      <Box
        position="relative"
        bg="white"
        border="1px solid"
        borderColor="#F2F3F5"
        borderRadius="14px"
        boxShadow="0 4px 20px 0 rgba(39, 40, 45, 0.06)"
      >
        {/* 附件预览 */}
        {attachments && attachments.length > 0 && (
          <HStack spacing="12px" px={4} pt={3} pb={0} flexWrap="wrap">
            {attachments.map((file) => (
              <Box
                key={file.fileKey}
                position="relative"
                borderRadius="8px"
                border="1px solid #E5E6EB"
                bg="#F7F8FA"
                p="6px"
                display="flex"
                alignItems="center"
                gap="8px"
                maxW="200px"
              >
                <Box
                  position="relative"
                  w="40px"
                  h="40px"
                  flexShrink={0}
                  borderRadius="4px"
                  bg="#E5E6EB"
                  overflow="hidden"
                >
                  {file.fileUrl && (
                    <Image
                      src={file.fileUrl}
                      alt={file.fileName}
                      w="40px"
                      h="40px"
                      objectFit="cover"
                      position="absolute"
                      top={0}
                      left={0}
                      zIndex={1}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <Flex
                    position="absolute"
                    top={0}
                    left={0}
                    w="40px"
                    h="40px"
                    alignItems="center"
                    justifyContent="center"
                    zIndex={0}
                  >
                    {getFileIconByName(file.fileName, { size: '24px' })}
                  </Flex>
                </Box>
                <Text fontSize="12px" color="#333" noOfLines={1} maxW="100px">
                  {file.fileName}
                </Text>
                <Box
                  as="button"
                  position="absolute"
                  top="-6px"
                  right="-6px"
                  w="16px"
                  h="16px"
                  borderRadius="50%"
                  bg="#999"
                  color="#fff"
                  fontSize="10px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  onClick={() => onRemoveAttachment?.(file.fileKey)}
                >
                  ×
                </Box>
              </Box>
            ))}
          </HStack>
        )}

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('workspace.chat_dock.placeholder')}
          resize="none"
          rows={2}
          minH="130px"
          maxH="180px"
          border="none"
          px={4}
          pt={attachments && attachments.length > 0 ? 2 : 3}
          pb={12}
          borderRadius="14px"
          _focus={{ boxShadow: 'none' }}
          _placeholder={{ fontSize: '14px' }}
          fontSize="14px"
          color={TEXT_PRIMARY}
          isDisabled={isRecordingMode}
          sx={{
            '&::placeholder': {
              color: TEXT_SECONDARY
            }
          }}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
            compositionEndLockRef.current = true;
            setTimeout(() => {
              compositionEndLockRef.current = false;
            }, 0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              if (isComposingRef.current || compositionEndLockRef.current) {
                e.preventDefault();
                return;
              }
              if (isUploading) return;
              e.preventDefault();
              handleSend();
            }
          }}
        />

        {isRecordingMode ? (
          <Flex position="absolute" bottom="12px" right="16px" align="center" gap={2} zIndex={1}>
            <IconButton
              aria-label={t('workspace.chat_dock.voice_cancel')}
              variant="ghost"
              w="28px"
              h="28px"
              minW="28px"
              minH="unset"
              lineHeight="28px"
              color="red.500"
              icon={<CloseIcon />}
              onClick={() => stopSpeak('cancel')}
              isDisabled={isTransCription}
              _hover={{ color: 'red.600', bg: 'red.50' }}
            />
            <Flex
              align="center"
              gap={1.5}
              px={2.5}
              h="28px"
              bg={isTransCription ? 'gray.100' : 'red.50'}
              borderRadius="full"
              fontSize="13px"
              color={isTransCription ? TEXT_SECONDARY : 'red.500'}
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {isTransCription ? (
                <>
                  <Spinner size="xs" />
                  <Text>{t('workspace.chat_dock.voice_transcribing')}</Text>
                </>
              ) : (
                <>
                  <Box
                    w="6px"
                    h="6px"
                    borderRadius="full"
                    bg="red.500"
                    sx={{
                      animation: 'pulse 1.2s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.3 }
                      }
                    }}
                  />
                  <Text>{speakingTimeString}</Text>
                </>
              )}
            </Flex>
            <IconButton
              aria-label={t('workspace.chat_dock.voice_finish')}
              w="28px"
              h="28px"
              minW="28px"
              minH="unset"
              lineHeight="28px"
              bg="#1F1F1F"
              color="white"
              borderRadius="full"
              icon={<CheckIcon />}
              onClick={() => stopSpeak('finish')}
              isDisabled={isTransCription}
              _hover={{ bg: '#000' }}
            />
          </Flex>
        ) : (
          <Flex position="absolute" bottom="12px" right="16px" align="center" gap={2} zIndex={1}>
            <IconButton
              aria-label={t('workspace.chat_dock.voice')}
              variant="ghost"
              w="28px"
              h="28px"
              minW="28px"
              minH="unset"
              lineHeight="28px"
              color={TEXT_SECONDARY}
              icon={<MicIcon />}
              onClick={handleStartVoice}
              _hover={{ color: TEXT_PRIMARY, bg: 'gray.100' }}
            />
            <IconButton
              aria-label={t('workspace.chat_dock.upload')}
              variant="ghost"
              w="28px"
              h="28px"
              minW="28px"
              minH="unset"
              lineHeight="28px"
              color={TEXT_SECONDARY}
              icon={isUploading ? <Spinner size="xs" /> : <LinkIcon />}
              onClick={handleUploadClick}
              isDisabled={isUploading || (attachments?.length ?? 0) >= MAX_FILE_COUNT}
              _hover={{ color: TEXT_PRIMARY, bg: 'gray.100' }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_FILE_EXTENSIONS.join(',')}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <IconButton
              aria-label={t('workspace.chat_dock.send')}
              w="28px"
              h="28px"
              minW="28px"
              minH="unset"
              lineHeight="28px"
              bg="#1F1F1F"
              color="white"
              borderRadius="full"
              icon={<SendIcon />}
              onClick={handleSend}
              isDisabled={isUploading}
              _hover={{ bg: '#000' }}
            />
          </Flex>
        )}
      </Box>
    </Box>
  );
}

function LinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 21 21" fill="none">
      <path
        d="M10.874 14.2643C9.69311 15.3752 8.64405 16.5071 7.51064 17.6074C6.29024 18.8106 4.33182 18.8106 3.10879 17.6074C2.51045 17.0006 2.18888 16.1747 2.22051 15.3224C2.25214 14.4701 2.6317 13.6706 3.27221 13.1086C4.36872 11.9872 5.49159 10.9001 6.58809 9.7892C6.86486 9.60186 7.03882 9.29842 7.06518 8.96331C7.09154 8.63085 6.96238 8.30366 6.71725 8.07674C6.48002 7.86037 6.16372 7.74955 5.84215 7.7733C5.52058 7.7944 5.22273 7.94744 5.01713 8.19547C3.83628 9.37758 2.65806 10.4858 1.55891 11.6573C0.322705 12.9001 -0.225549 14.6707 0.0854799 16.3963C0.399145 18.122 1.53519 19.5864 3.12724 20.3147C4.96705 21.2329 7.18116 20.911 8.68359 19.5125C10.0173 18.3304 11.243 17.0322 12.4713 15.7446C12.7059 15.4517 12.8087 15.077 12.7533 14.705C12.6637 14.3012 12.35 13.9846 11.9468 13.8896C11.5514 13.792 11.1323 13.9398 10.874 14.2643ZM20.3366 3.20848C19.5933 1.32451 17.793 0.0685229 15.7714 0.0183891C14.5246 -0.0897944 13.2858 0.282251 12.3026 1.05801C10.8871 2.33246 9.55341 3.69135 8.23286 5.06079C8.09866 5.20793 8.00886 5.39014 7.97387 5.58628C7.93888 5.78242 7.96014 5.98447 8.03517 6.16901C8.18805 6.54634 8.54652 6.79964 8.95244 6.82075C9.32673 6.80756 9.6852 6.65716 9.95406 6.39594C11.1349 5.21383 12.3131 4.03437 13.494 2.94726C14.2109 2.27705 15.2336 2.04221 16.172 2.33246C17.258 2.59632 18.112 3.43013 18.4072 4.50668C18.7024 5.58588 18.3887 6.73896 17.5875 7.51735L14.1319 10.9792C13.6416 11.3988 13.5783 12.1349 13.9895 12.6336C14.4798 13.1165 15.2679 13.1165 15.7582 12.6336C16.939 11.4515 18.1173 10.3433 19.2981 9.08997C20.8585 7.54901 21.275 5.19009 20.3366 3.20848Z"
        fill="#333333"
      />
      <path
        d="M5.84354 13.9103C6.07238 14.1296 6.39276 14.2545 6.72744 14.2545C7.06213 14.2545 7.3825 14.1296 7.61135 13.9103C10.0771 11.7199 12.5315 9.51925 14.9744 7.31352C15.1317 7.13503 15.2576 6.93358 15.3462 6.71938C15.392 6.23489 15.0888 5.77589 14.591 5.577C14.1076 5.38065 13.5355 5.49795 13.1951 5.86259L5.90647 12.3599C5.64902 12.5486 5.49455 12.8266 5.48311 13.1224C5.47167 13.4181 5.60325 13.7063 5.84354 13.9103Z"
        fill="#333333"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 19 23" fill="none">
      <path
        d="M15.3599 10.4726C15.3599 10.2893 15.396 10.1077 15.4661 9.93822C15.5363 9.76878 15.6391 9.61482 15.7688 9.48514C15.8985 9.35545 16.0524 9.25258 16.2218 9.18239C16.3913 9.11221 16.5728 9.07608 16.7562 9.07608C16.9396 9.07608 17.1212 9.11221 17.2906 9.18239C17.4601 9.25258 17.614 9.35545 17.7437 9.48514C17.8733 9.61482 17.9762 9.76878 18.0464 9.93822C18.1165 10.1077 18.1526 10.2893 18.1526 10.4726C18.1526 15.0108 14.8223 18.7705 10.4726 19.4421V20.9453C10.4726 21.3156 10.3255 21.6708 10.0637 21.9327C9.8018 22.1945 9.44663 22.3416 9.0763 22.3416C8.70596 22.3416 8.35079 22.1945 8.08892 21.9327C7.82706 21.6708 7.67994 21.3156 7.67994 20.9453V19.4421C3.3303 18.7705 1.63651e-08 15.0108 1.63651e-08 10.4726C-2.80593e-05 10.2893 0.0360688 10.1077 0.10623 9.93822C0.17639 9.76878 0.27924 9.61482 0.408907 9.48514C0.538573 9.35545 0.692515 9.25258 0.861942 9.18239C1.03137 9.11221 1.21296 9.07608 1.39635 9.07608C1.57974 9.07608 1.76134 9.11221 1.93076 9.18239C2.10019 9.25258 2.25413 9.35545 2.3838 9.48514C2.51347 9.61482 2.61632 9.76878 2.68648 9.93822C2.75664 10.1077 2.79273 10.2893 2.79271 10.4726C2.79271 12.1392 3.45473 13.7374 4.63313 14.9158C5.81153 16.0942 7.40978 16.7562 9.0763 16.7562C10.7428 16.7562 12.3411 16.0942 13.5195 14.9158C14.6979 13.7374 15.3599 12.1392 15.3599 10.4726ZM9.0763 0C9.7181 0 10.3536 0.126412 10.9466 0.372019C11.5395 0.617625 12.0783 0.977616 12.5321 1.43144C12.9859 1.88526 13.3459 2.42402 13.5915 3.01697C13.8371 3.60992 13.9635 4.24543 13.9635 4.88724V10.4726C13.9635 11.7688 13.4486 13.0119 12.5321 13.9284C11.6156 14.845 10.3725 15.3599 9.0763 15.3599C7.78012 15.3599 6.53703 14.845 5.6205 13.9284C4.70396 13.0119 4.18906 11.7688 4.18906 10.4726V4.88724C4.18906 3.59106 4.70396 2.34797 5.6205 1.43144C6.53703 0.514903 7.78012 0 9.0763 0Z"
        fill="#333333"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M3.60526 3.735C4.03818 3.26867 4.71888 3.09328 5.36895 3.03064C6.05103 2.96521 6.86954 3.00837 7.7493 3.1239C9.51437 3.35498 11.6469 3.89091 13.6974 4.55072C15.7478 5.21054 17.7468 6.00538 19.2432 6.76542C19.9879 7.14405 20.6352 7.52825 21.1043 7.89574C21.3303 8.06653 21.5342 8.26479 21.7112 8.48595C21.8643 8.6864 22.0258 8.97316 22.023 9.3156C22.0175 10.2176 21.4036 10.8552 20.7493 11.2825C20.0812 11.7196 19.2112 12.0481 18.3467 12.307C17.4739 12.5673 16.5538 12.7692 15.7645 12.9334L15.4819 12.9919C15.0045 13.0894 14.7665 13.1395 14.5409 13.0726C14.3182 13.0044 14.1442 12.8318 13.799 12.488L10.383 9.07199C10.2063 8.91278 9.97515 8.82747 9.73736 8.83367C9.49957 8.83987 9.27322 8.9371 9.10502 9.1053C8.93681 9.2735 8.83959 9.49985 8.83339 9.73764C8.82719 9.97544 8.9125 10.2065 9.07171 10.3833L12.2566 13.5696C12.6088 13.9218 12.7856 14.0972 12.851 14.3255C12.9179 14.5538 12.865 14.796 12.7564 15.2804C12.3402 17.1596 11.9782 18.7117 11.6177 19.7571C11.4089 20.3668 11.1709 20.8958 10.8702 21.2842C10.5584 21.6906 10.1324 21.9983 9.57144 22.0219C9.22344 22.0386 8.93112 21.8785 8.73345 21.731C8.52326 21.5751 8.32559 21.3663 8.14324 21.138C7.77574 20.6786 7.39015 20.0439 7.00596 19.3089C6.23339 17.8333 5.41628 15.8553 4.72305 13.8202C4.03261 11.785 3.45632 9.6636 3.17791 7.89992C3.0401 7.02016 2.97189 6.20305 3.01087 5.51957C3.04567 4.86949 3.18348 4.1888 3.60526 3.735Z"
        fill="white"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M2.5 7.5L5.5 10.5L11.5 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
