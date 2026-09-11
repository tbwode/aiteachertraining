'use client';

import {
  Box,
  Flex,
  Text,
  Button,
  Textarea,
  Image,
  HStack,
  IconButton,
  Spinner
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';
import { useRef, useCallback, useState } from 'react';
import { useVoiceInput } from '@/web/common/hooks/useVoiceInput';
import { uploadPrivateFile, createMineruParseTask } from '@/teacher/api/file';
import type { AttachmentFile } from '@/types/common-chat';
import { getFileIconByName } from '@/utils/fileIcon';

export type QuickAction = { key: string; value: string };

export type { AttachmentFile };

const SendIcon: () => JSX.Element = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M3.60526 3.735C4.03818 3.26867 4.71888 3.09328 5.36895 3.03064C6.05103 2.96521 6.86954 3.00837 7.7493 3.1239C9.51437 3.35498 11.6469 3.89091 13.6974 4.55072C15.7478 5.21054 17.7468 6.00538 19.2432 6.76542C19.9879 7.14405 20.6352 7.52825 21.1043 7.89574C21.3303 8.06653 21.5342 8.26479 21.7112 8.48595C21.8643 8.6864 22.0258 8.97316 22.023 9.3156C22.0175 10.2176 21.4036 10.8552 20.7493 11.2825C20.0812 11.7196 19.2112 12.0481 18.3467 12.307C17.4739 12.5673 16.5538 12.7692 15.7645 12.9334L15.4819 12.9919C15.0045 13.0894 14.7665 13.1395 14.5409 13.0726C14.3182 13.0044 14.1442 12.8318 13.799 12.488L10.383 9.07199C10.2063 8.91278 9.97515 8.82747 9.73736 8.83367C9.49957 8.83987 9.27322 8.9371 9.10502 9.1053C8.93681 9.2735 8.83959 9.49985 8.83339 9.73764C8.82719 9.97544 8.9125 10.2065 9.07171 10.3833L12.2566 13.5696C12.6088 13.9218 12.7856 14.0972 12.851 14.3255C12.9179 14.5538 12.865 14.796 12.7564 15.2804C12.3402 17.1596 11.9782 18.7117 11.6177 19.7571C11.4089 20.3668 11.1709 20.8958 10.8702 21.2842C10.5584 21.6906 10.1324 21.9983 9.57144 22.0219C9.22344 22.0386 8.93112 21.8785 8.73345 21.731C8.52326 21.5751 8.32559 21.3663 8.14324 21.138C7.77574 20.6786 7.39015 20.0439 7.00596 19.3089C6.23339 17.8333 5.41628 15.8553 4.72305 13.8202C4.03261 11.785 3.45632 9.6636 3.17791 7.89992C3.0401 7.02016 2.97189 6.20305 3.01087 5.51957C3.04567 4.86949 3.18348 4.1888 3.60526 3.735Z"
        fill="white"
      />
    </svg>
  );
};

const LinkIcon: () => JSX.Element = () => {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default function ChatInput({
  inputValue,
  onInputChange,
  onSend,
  onQuickAction,
  isLoading,
  onFileUpload,
  attachments,
  onRemoveAttachment,
  quickActions,
  showPrefix = true,
  activeQuickAction
}: {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onQuickAction: (action: string) => void;
  isLoading?: boolean;
  onFileUpload?: (file: AttachmentFile) => void;
  attachments?: AttachmentFile[];
  onRemoveAttachment?: (fileKey: string) => void;
  quickActions?: QuickAction[];
  showPrefix?: boolean;
  activeQuickAction?: string;
}) {
  const { t } = useTranslation('teacher');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);
  const inputValueRef = useRef(inputValue);
  inputValueRef.current = inputValue;
  const [isUploading, setIsUploading] = useState(false);

  const { startSpeak, stopSpeak, isSpeaking, isTransCription } = useVoiceInput();

  const handleVoiceClick = useCallback(() => {
    if (isSpeaking) {
      stopSpeak('finish');
      return;
    }
    startSpeak((text) => {
      onInputChange(inputValueRef.current + text);
    });
  }, [isSpeaking, stopSpeak, startSpeak, onInputChange]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await uploadPrivateFile(formData);
        if (!res?.fileKey) return;
        const taskId = await createMineruParseTask({
          fileKey: res.fileKey,
          fileUrl: res.fileUrl || ''
        });
        onFileUpload?.({ ...res, taskId });
      } catch (error) {
        console.error('文件上传或解析任务创建失败:', error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [onFileUpload]
  );

  return (
    <Box p="16px 24px 24px" w="100%" maxW="1000px">
      {/* 快捷指令栏 */}
      <Flex gap="12px" mb="12px" justify="left" flexWrap="wrap">
        <Button
          h="auto"
          bg="#fff"
          border="1px solid #F2F3F5"
          borderRadius="20px"
          px="14px"
          py="14px"
          color="#333333"
          fontSize="16px"
          fontWeight="400"
          lineHeight="24px"
          _hover={{ color: '#C8000B', bg: '#FFF0F0', borderColor: '#C8000B' }}
          _disabled={{
            color: '#999',
            bg: '#F2F3F5',
            borderColor: '#F2F3F5',
            cursor: 'not-allowed',
            opacity: 1
          }}
          onClick={() => onQuickAction('home')}
          isDisabled={isLoading}
        >
          {t(`commonChat.quick_actions.home`)}
        </Button>
        {(quickActions ?? []).map((action, index) => {
          const prefix = showPrefix && index < 3 ? t('commonChat.quick_actions.before_class') : '';
          const label = prefix + t(`commonChat.quick_actions.${action.key}`);
          const isActive = activeQuickAction === action.value;
          return (
            <Button
              key={action.value}
              h="auto"
              bg={isLoading ? '#F2F3F5' : isActive ? '#FFF0F0' : '#fff'}
              border="1px solid"
              borderColor={isActive ? '#C8000B' : '#F2F3F5'}
              borderRadius="20px"
              px="14px"
              py="14px"
              color={isActive ? '#C8000B' : '#333333'}
              fontSize="16px"
              fontWeight={isActive ? '600' : '400'}
              lineHeight="24px"
              _hover={{ color: '#C8000B', bg: '#FFF0F0', borderColor: '#C8000B' }}
              _disabled={{
                color: isActive ? '#C8000B' : '#999',
                bg: isActive ? '#FFF0F0' : '#F2F3F5',
                borderColor: isActive ? '#C8000B' : '#F2F3F5',
                cursor: 'not-allowed',
                opacity: 1
              }}
              onClick={() => onQuickAction(action.value)}
              isDisabled={isLoading}
            >
              {prefix && <Box as="span">{prefix}</Box>}
              <Box as="span" color={prefix ? '#86909C' : 'inherit'} pl={prefix ? '8px' : '0px'}>
                {t(`commonChat.quick_actions.${action.key}`)}
              </Box>
            </Button>
          );
        })}
      </Flex>

      {/* 输入框 */}
      <Flex
        align="flex-start"
        bg="#fff"
        border="1px solid #F2F3F5"
        borderRadius="20px"
        px="18px"
        pt="10px"
        pb="18px"
        gap="24px"
        h="auto"
        flexDirection="column"
      >
        {/* 附件预览 */}
        {attachments && attachments.length > 0 && (
          <HStack spacing="12px" flexWrap="wrap">
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

        <Flex w="100%" gap="24px" h="85px" align="flex-start" flexDirection="column">
          <Textarea
            flex={1}
            h="100%"
            px="0"
            py="8px"
            variant="unstyled"
            placeholder={
              activeQuickAction === 'create_ai_lecture'
                ? t('commonChat.input.placeholder_ai_lecture')
                : t('commonChat.input.placeholder')
            }
            fontSize="14px"
            color="#333"
            _placeholder={{ fontSize: '14px' }}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            disabled={isLoading}
            resize="none"
            overflowY="auto"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current) {
                e.preventDefault();
                onSend();
              }
            }}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
          />
          <Flex gap="12px" align="center" mt="auto" ml="auto">
            <Box
              as="button"
              aria-label={t('commonChat.input.aria_voice')}
              w="26px"
              h="26px"
              borderRadius="50%"
              border={isSpeaking ? '1px solid #C8000B' : '1px solid #fff'}
              bg={isSpeaking ? '#FFF0F0' : 'transparent'}
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
              onClick={handleVoiceClick}
              disabled={isTransCription}
              style={{
                cursor: isTransCription ? 'not-allowed' : 'pointer',
                opacity: isTransCription ? 0.5 : 1
              }}
            >
              <svg width="15" height="15" viewBox="0 0 19 23" fill="none">
                <path
                  d="M15.3599 10.4726C15.3599 10.2893 15.396 10.1077 15.4661 9.93822C15.5363 9.76878 15.6391 9.61482 15.7688 9.48514C15.8985 9.35545 16.0524 9.25258 16.2218 9.18239C16.3913 9.11221 16.5728 9.07608 16.7562 9.07608C16.9396 9.07608 17.1212 9.11221 17.2906 9.18239C17.4601 9.25258 17.614 9.35545 17.7437 9.48514C17.8733 9.61482 17.9762 9.76878 18.0464 9.93822C18.1165 10.1077 18.1526 10.2893 18.1526 10.4726C18.1526 15.0108 14.8223 18.7705 10.4726 19.4421V20.9453C10.4726 21.3156 10.3255 21.6708 10.0637 21.9327C9.8018 22.1945 9.44663 22.3416 9.0763 22.3416C8.70596 22.3416 8.35079 22.1945 8.08892 21.9327C7.82706 21.6708 7.67994 21.3156 7.67994 20.9453V19.4421C3.3303 18.7705 1.63651e-08 15.0108 1.63651e-08 10.4726C-2.80593e-05 10.2893 0.0360688 10.1077 0.10623 9.93822C0.17639 9.76878 0.27924 9.61482 0.408907 9.48514C0.538573 9.35545 0.692515 9.25258 0.861942 9.18239C1.03137 9.11221 1.21296 9.07608 1.39635 9.07608C1.57974 9.07608 1.76134 9.11221 1.93076 9.18239C2.10019 9.25258 2.25413 9.35545 2.3838 9.48514C2.51347 9.61482 2.61632 9.76878 2.68648 9.93822C2.75664 10.1077 2.79273 10.2893 2.79271 10.4726C2.79271 12.1392 3.45473 13.7374 4.63313 14.9158C5.81153 16.0942 7.40978 16.7562 9.0763 16.7562C10.7428 16.7562 12.3411 16.0942 13.5195 14.9158C14.6979 13.7374 15.3599 12.1392 15.3599 10.4726ZM9.0763 0C9.7181 0 10.3536 0.126412 10.9466 0.372019C11.5395 0.617625 12.0783 0.977616 12.5321 1.43144C12.9859 1.88526 13.3459 2.42402 13.5915 3.01697C13.8371 3.60992 13.9635 4.24543 13.9635 4.88724V10.4726C13.9635 11.7688 13.4486 13.0119 12.5321 13.9284C11.6156 14.845 10.3725 15.3599 9.0763 15.3599C7.78012 15.3599 6.53703 14.845 5.6205 13.9284C4.70396 13.0119 4.18906 11.7688 4.18906 10.4726V4.88724C4.18906 3.59106 4.70396 2.34797 5.6205 1.43144C6.53703 0.514903 7.78012 0 9.0763 0Z"
                  fill={isSpeaking ? '#C8000B' : '#333333'}
                />
              </svg>
            </Box>
            <IconButton
              aria-label={t('workspace.chat_dock.upload')}
              variant="ghost"
              w="26px"
              h="26px"
              minW="26px"
              minH="26px"
              lineHeight="26px"
              color="#6B7280"
              icon={isUploading ? <Spinner size="sm" color="#C8000B" /> : <LinkIcon />}
              onClick={handleUploadClick}
              isDisabled={isUploading}
              _hover={{ color: '#C8000B', bg: 'gray.100' }}
            />
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <IconButton
              aria-label={t('commonChat.input.aria_send')}
              w="26px"
              h="26px"
              minW="26px"
              minH="26px"
              lineHeight="26px"
              bg="#1F1F1F"
              color="white"
              borderRadius="full"
              icon={<SendIcon />}
              onClick={onSend}
              _hover={{ bg: '#000' }}
            />
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}
