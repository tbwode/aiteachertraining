'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Box, Flex, Textarea, Image, Progress, Text, Spinner } from '@chakra-ui/react';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { customAlphabet } from 'nanoid';
import { uploadFilePublic } from '@/teacher/api/file';
import { useVoiceInput } from '@/web/common/hooks/useVoiceInput';
import type { MessageFileType } from '../types';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', 12);

enum UploadStatusEnum {
  waiting = 'waiting',
  uploading = 'uploading',
  success = 'success',
  error = 'error'
}

type UploadImageItem = {
  key: string;
  name: string;
  rawFile: File;
  previewUrl: string;
  fileUrl?: string;
  fileKey?: string;
  uploadStatus: UploadStatusEnum;
};

type UploadFileItem = {
  key: string;
  name: string;
  rawFile: File;
  type: string;
  sizeText: string;
  fileUrl?: string;
  fileKey?: string;
  uploadStatus: UploadStatusEnum;
  percent: number;
};

interface MessageInputProps {
  onSendMessage: (text: string, files: MessageFileType[], images: MessageFileType[]) => void;
  isChatting: boolean;
  onStop?: () => void;
  placeholder?: string;
}

const imageUploadLimit = 5;
const fileUploadLimit = 5;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name);
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MessageInput({
  onSendMessage,
  isChatting,
  onStop,
  placeholder = '输入消息...'
}: MessageInputProps) {
  const { isPc } = useSystem();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSendingRef = useRef(false);
  const [inputValue, setInputValue] = useState('');
  const [images, setImages] = useState<UploadImageItem[]>([]);
  const [files, setFiles] = useState<UploadFileItem[]>([]);

  const { startSpeak, stopSpeak, isSpeaking, isTransCription, speakingTimeString } =
    useVoiceInput();

  const uploadingCount =
    images.filter((it) => it.uploadStatus === UploadStatusEnum.uploading).length +
    files.filter((it) => it.uploadStatus === UploadStatusEnum.uploading).length;

  const hasError =
    images.some((it) => it.uploadStatus === UploadStatusEnum.error) ||
    files.some((it) => it.uploadStatus === UploadStatusEnum.error);

  const allReady =
    images.every((it) => it.uploadStatus === UploadStatusEnum.success) &&
    files.every((it) => it.uploadStatus === UploadStatusEnum.success);

  const sendable =
    (!!inputValue.trim() || images.length > 0 || files.length > 0) && allReady && !hasError;

  const doUploadImage = useCallback(async (image: UploadImageItem) => {
    try {
      setImages((prev) =>
        prev.map((it) =>
          it.key === image.key ? { ...it, uploadStatus: UploadStatusEnum.uploading } : it
        )
      );

      const formData = new FormData();
      formData.append('file', image.rawFile, image.rawFile.name);
      const res = await uploadFilePublic(formData);

      setImages((prev) =>
        prev.map((it) =>
          it.key === image.key
            ? {
                ...it,
                fileUrl: res.fileUrl || res.fileKey,
                fileKey: res.fileKey,
                uploadStatus: UploadStatusEnum.success
              }
            : it
        )
      );
    } catch (error) {
      setImages((prev) => prev.filter((it) => it.key !== image.key));
    }
  }, []);

  const doUploadFile = useCallback(async (file: UploadFileItem) => {
    try {
      setFiles((prev) =>
        prev.map((it) =>
          it.key === file.key ? { ...it, uploadStatus: UploadStatusEnum.uploading } : it
        )
      );

      const formData = new FormData();
      formData.append('file', file.rawFile, file.rawFile.name);
      const res = await uploadFilePublic(formData, {
        onUploadProgress: (e) => {
          const percent = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
          setFiles((prev) => prev.map((it) => (it.key === file.key ? { ...it, percent } : it)));
        }
      });

      setFiles((prev) =>
        prev.map((it) =>
          it.key === file.key
            ? {
                ...it,
                fileUrl: res.fileUrl || res.fileKey,
                fileKey: res.fileKey,
                uploadStatus: UploadStatusEnum.success
              }
            : it
        )
      );
    } catch (error) {
      setFiles((prev) =>
        prev.map((it) =>
          it.key === file.key ? { ...it, uploadStatus: UploadStatusEnum.error, percent: 0 } : it
        )
      );
    }
  }, []);

  useEffect(() => {
    const uploading = images.filter((it) => it.uploadStatus === UploadStatusEnum.uploading).length;
    if (uploading >= imageUploadLimit) return;
    const waiting = images.find((it) => it.uploadStatus === UploadStatusEnum.waiting);
    if (waiting) doUploadImage(waiting);
  }, [images, doUploadImage]);

  useEffect(() => {
    const uploading = files.filter((it) => it.uploadStatus === UploadStatusEnum.uploading).length;
    if (uploading >= fileUploadLimit) return;
    const waiting = files.find((it) => it.uploadStatus === UploadStatusEnum.waiting);
    if (waiting) doUploadFile(waiting);
  }, [files, doUploadFile]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    const newImages: UploadImageItem[] = [];
    const newFiles: UploadFileItem[] = [];

    for (const rawFile of rawFiles) {
      if (isImageFile(rawFile)) {
        try {
          const previewUrl = await readFileAsBase64(rawFile);
          newImages.push({
            key: nanoid(),
            name: rawFile.name,
            rawFile,
            previewUrl,
            uploadStatus: UploadStatusEnum.waiting
          });
        } catch {
          // skip files that can't be previewed
        }
      } else {
        newFiles.push({
          key: nanoid(),
          name: rawFile.name,
          rawFile,
          type: rawFile.name.split('.').pop() || '',
          sizeText: formatFileSize(rawFile.size),
          uploadStatus: UploadStatusEnum.waiting,
          percent: 0
        });
      }
    }

    if (newImages.length > 0) setImages((prev) => [...prev, ...newImages]);
    if (newFiles.length > 0) setFiles((prev) => [...prev, ...newFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const removeImage = useCallback((key: string) => {
    setImages((prev) => prev.filter((it) => it.key !== key));
  }, []);

  const removeFile = useCallback((key: string) => {
    setFiles((prev) => prev.filter((it) => it.key !== key));
  }, []);

  const handleSend = useCallback(() => {
    if (isSendingRef.current || !sendable) return;
    isSendingRef.current = true;

    const text = inputValue.trim();
    const messageImages: MessageFileType[] = images.map((it) => ({
      name: it.name,
      fileKey: it.fileKey,
      fileUrl: it.fileUrl || it.previewUrl
    }));

    const messageFiles: MessageFileType[] = files.map((it) => ({
      name: it.name,
      fileKey: it.fileKey,
      fileUrl: it.fileUrl || ''
    }));

    onSendMessage(text, messageFiles, messageImages);
    setInputValue('');
    setImages([]);
    setFiles([]);
    isSendingRef.current = false;
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [inputValue, images, files, sendable, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const rawFiles = Array.from(clipboardData.items)
      .map((item) => (item.kind === 'file' ? item.getAsFile() : undefined))
      .filter(Boolean) as File[];

    if (rawFiles.length === 0) return;

    const newImages: UploadImageItem[] = [];
    const newFiles: UploadFileItem[] = [];

    for (const rawFile of rawFiles) {
      if (isImageFile(rawFile)) {
        try {
          const previewUrl = await readFileAsBase64(rawFile);
          newImages.push({
            key: nanoid(),
            name: rawFile.name,
            rawFile,
            previewUrl,
            uploadStatus: UploadStatusEnum.waiting
          });
        } catch {
          // skip
        }
      } else {
        newFiles.push({
          key: nanoid(),
          name: rawFile.name,
          rawFile,
          type: rawFile.name.split('.').pop() || '',
          sizeText: formatFileSize(rawFile.size),
          uploadStatus: UploadStatusEnum.waiting,
          percent: 0
        });
      }
    }

    if (newImages.length > 0) setImages((prev) => [...prev, ...newImages]);
    if (newFiles.length > 0) setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  return (
    <Box w="100%" py={3}>
      <Box maxW="800px" mx="auto" px={isPc ? 4 : 2}>
        {/* Preview area */}
        {(images.length > 0 || files.length > 0) && (
          <Flex gap={2} mb={3} flexWrap="wrap">
            {images.map((image) => (
              <Box
                key={image.key}
                position="relative"
                w="72px"
                h="72px"
                borderRadius="12px"
                overflow="hidden"
                boxShadow="0 2px 8px rgba(0,0,0,0.08)"
                flexShrink={0}
              >
                <Image
                  src={image.previewUrl}
                  alt={image.name}
                  w="100%"
                  h="100%"
                  objectFit="cover"
                />
                {image.uploadStatus === UploadStatusEnum.uploading && (
                  <Box
                    position="absolute"
                    inset={0}
                    bg="rgba(0,0,0,0.35)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Spinner size="xs" color="white" />
                  </Box>
                )}
                <Box
                  position="absolute"
                  top="4px"
                  right="4px"
                  w="16px"
                  h="16px"
                  bg="rgba(0,0,0,0.45)"
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  color="white"
                  fontSize="10px"
                  lineHeight="1"
                  _hover={{ bg: 'rgba(0,0,0,0.6)' }}
                  onClick={() => removeImage(image.key)}
                >
                  ×
                </Box>
              </Box>
            ))}
            {files.map((file) => (
              <Flex
                key={file.key}
                alignItems="center"
                bg="#F7F8FA"
                px={3}
                py={2}
                borderRadius="10px"
                gap={2}
                flexShrink={0}
                maxW="240px"
                border="1px solid"
                borderColor="gray.200"
              >
                <Box
                  w="32px"
                  h="32px"
                  borderRadius="8px"
                  bg="primary.50"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Text fontSize="12px" color="primary.600" fontWeight="bold">
                    {file.type?.slice(0, 3).toUpperCase() || 'FILE'}
                  </Text>
                </Box>
                <Box flex={1} minW={0}>
                  <Text fontSize="12px" fontWeight="500" color="gray.700" isTruncated>
                    {file.name}
                  </Text>
                  {file.uploadStatus === UploadStatusEnum.uploading ? (
                    <Progress
                      value={file.percent}
                      size="xs"
                      colorScheme="primary"
                      mt={1}
                      borderRadius="full"
                    />
                  ) : file.uploadStatus === UploadStatusEnum.error ? (
                    <Text fontSize="11px" color="red.400">
                      上传失败
                    </Text>
                  ) : (
                    <Text fontSize="11px" color="gray.400">
                      {file.sizeText}
                    </Text>
                  )}
                </Box>
                <Box
                  cursor="pointer"
                  color="gray.400"
                  _hover={{ color: 'red.400' }}
                  fontSize="14px"
                  lineHeight="1"
                  onClick={() => removeFile(file.key)}
                >
                  ×
                </Box>
              </Flex>
            ))}
          </Flex>
        )}

        {/* Input card */}
        <Box
          borderRadius="16px"
          bg="white"
          boxShadow="0px 0px 18px -4px rgba(0,0,0,0.08)"
          p="1px"
          transition="all 0.2s ease"
          _focusWithin={{
            bgImage: 'linear-gradient(270deg, #C8000B 0%, #EF4444 100%)'
          }}
        >
          <Box bg="white" borderRadius="15px" p={isPc ? '16px 20px' : '12px 14px'}>
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder}
              resize="none"
              rows={1}
              minH="50px"
              maxH="140px"
              w="100%"
              border="none"
              boxShadow="none"
              _focus={{ boxShadow: 'none', outline: 'none' }}
              _placeholder={{ fontSize: '14px' }}
              px={0}
              fontSize="14px"
              lineHeight="1.6"
              color="gray.800"
            />

            <Flex alignItems="center" justifyContent="space-between" mt={2}>
              <Flex alignItems="center" gap={1}>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  multiple
                  onChange={handleFileSelect}
                />

                <Flex
                  as="button"
                  type="button"
                  alignItems="center"
                  justifyContent="center"
                  w="32px"
                  h="32px"
                  borderRadius="8px"
                  cursor="pointer"
                  transition="background-color 0.2s"
                  bg="transparent"
                  _hover={{ bg: 'rgba(0,0,0,0.06)' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    color="#6B7280"
                  >
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </Flex>

                {isTransCription ? (
                  <Flex alignItems="center" gap={1} ml={1}>
                    <Spinner size="xs" color="primary.500" />
                    <Text fontSize="13px" color="primary.500">
                      解析中...
                    </Text>
                  </Flex>
                ) : isSpeaking ? (
                  <Flex alignItems="center" gap={1} ml={1}>
                    <Flex
                      as="button"
                      type="button"
                      alignItems="center"
                      justifyContent="center"
                      w="32px"
                      h="32px"
                      borderRadius="8px"
                      cursor="pointer"
                      transition="background-color 0.2s"
                      bg="primary.50"
                      border="1px solid"
                      borderColor="primary.200"
                      _hover={{ bg: 'primary.100' }}
                      onClick={() => stopSpeak()}
                    >
                      <Box w="10px" h="10px" bg="primary.500" borderRadius="2px" />
                    </Flex>
                    <Text fontSize="12px" color="primary.500" fontWeight="500">
                      {speakingTimeString}
                    </Text>
                  </Flex>
                ) : (
                  <Flex
                    as="button"
                    type="button"
                    alignItems="center"
                    justifyContent="center"
                    w="32px"
                    h="32px"
                    borderRadius="8px"
                    cursor="pointer"
                    transition="background-color 0.2s"
                    bg="transparent"
                    _hover={{ bg: 'rgba(0,0,0,0.06)' }}
                    onClick={() =>
                      startSpeak((val) => {
                        setInputValue((prev) => prev + val);
                        setTimeout(() => {
                          if (textareaRef.current) {
                            textareaRef.current.style.height = 'auto';
                            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
                          }
                        }, 0);
                      })
                    }
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      color="#6B7280"
                    >
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </Flex>
                )}
              </Flex>

              {isChatting ? (
                <Flex
                  alignItems="center"
                  justifyContent="center"
                  w="32px"
                  h="32px"
                  borderRadius="50%"
                  bg="#F3F4F6"
                  cursor="pointer"
                  _hover={{ bg: '#FEE2E2' }}
                  onClick={onStop}
                >
                  <Box w="10px" h="10px" bg="#EF4444" borderRadius="2px" />
                </Flex>
              ) : (
                <Flex
                  alignItems="center"
                  justifyContent="center"
                  w="32px"
                  h="32px"
                  borderRadius="50%"
                  cursor="pointer"
                  transition="all 0.2s"
                  bg={sendable ? 'primary.500' : '#E5E7EB'}
                  _hover={{
                    bg: sendable ? 'primary.600' : '#E5E7EB',
                    transform: sendable ? 'scale(1.05)' : 'none'
                  }}
                  onClick={handleSend}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    color={sendable ? 'white' : '#9CA3AF'}
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </Flex>
              )}
            </Flex>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
