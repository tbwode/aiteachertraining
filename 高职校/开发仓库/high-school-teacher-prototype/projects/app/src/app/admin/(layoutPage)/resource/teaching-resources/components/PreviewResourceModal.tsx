'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Flex,
  Text,
  IconButton,
  Box,
  Spinner,
  Divider
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { previewResource, getResourceDetail } from '@/api/admin/resource-center/teaching-resource';
import { decompressionFile, type DecompressionFileItem } from '@/teacher/api/file';
import { FileIcon } from '@/app/teacher/(layoutPage)/profile/components/FileIcon';

type PreviewResourceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  resourceId: number | null;
  resourceName: string;
  fileFormat: string;
};

function getExtFromFileName(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

function isZipFile(fileName: string, fileFormat: string): boolean {
  const ext = getExtFromFileName(fileName);
  return ext === 'zip' || fileFormat === 'zip';
}

export default function PreviewResourceModal({
  isOpen,
  onClose,
  resourceId,
  resourceName,
  fileFormat
}: PreviewResourceModalProps) {
  const { t } = useTranslation('admin');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 压缩包相关状态
  const [isZip, setIsZip] = useState(false);
  const [zipFiles, setZipFiles] = useState<DecompressionFileItem[]>([]);
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState('');
  const [selectedZipFile, setSelectedZipFile] = useState<DecompressionFileItem | null>(null);

  const ext = getExtFromFileName(resourceName);

  const resetState = useCallback(() => {
    setPreviewUrl('');
    setLoading(false);
    setError('');
    setIsZip(false);
    setZipFiles([]);
    setZipLoading(false);
    setZipError('');
    setSelectedZipFile(null);
  }, []);

  useEffect(() => {
    if (!isOpen || !resourceId) {
      resetState();
      return;
    }

    const zip = isZipFile(resourceName, fileFormat);
    setIsZip(zip);

    if (zip) {
      // 压缩包：先获取详情拿到 fileKey，然后调用解压接口
      setZipLoading(true);
      setZipError('');
      setZipFiles([]);
      setSelectedZipFile(null);

      getResourceDetail(resourceId)
        .then((detail) => {
          const objectKey = detail.fileKey;
          if (!objectKey) {
            setZipError(t('resource.previewModal.zipNoFileKey'));
            setZipLoading(false);
            return;
          }
          return decompressionFile(objectKey).then((files) => {
            if (!files || files.length === 0) {
              setZipError(t('resource.previewModal.zipEmpty'));
              setZipLoading(false);
              return;
            }
            // 解压成功后调用预览接口
            previewResource(resourceId).catch(() => {});
            setZipFiles(files);
            setSelectedZipFile(files[0]);
            setZipLoading(false);
          });
        })
        .catch(() => {
          setZipError(t('resource.previewModal.zipDecompressError'));
          setZipLoading(false);
        });
    } else {
      // 非压缩包：走原有预览逻辑
      setLoading(true);
      setError('');
      setPreviewUrl('');
      previewResource(resourceId)
        .then((data) => {
          setPreviewUrl(data.fileUrl);
        })
        .catch(() => {
          setError(t('resource.previewModal.fetchFailed'));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, resourceId, fileFormat, resourceName, t, resetState]);

  const isVideo =
    ext === 'mp4' || ext === 'avi' || ext === 'mov' || ext === 'wmv' || fileFormat === 'video';
  const isAudio =
    ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma'].includes(ext) || fileFormat === 'audio';
  const isPpt = ext === 'ppt' || ext === 'pptx';
  const isWord = ext === 'doc' || ext === 'docx';

  const iframeSrc =
    (isPpt || isWord) && previewUrl
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`
      : previewUrl;

  // 压缩包内选中文件的预览类型
  const selectedZipExt = selectedZipFile ? getExtFromFileName(selectedZipFile.fileName) : '';
  const selectedIsVideo = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(
    selectedZipExt
  );
  const selectedIsAudio = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma'].includes(
    selectedZipExt
  );
  const selectedIsPpt = selectedZipExt === 'ppt' || selectedZipExt === 'pptx';
  const selectedIsWord = selectedZipExt === 'doc' || selectedZipExt === 'docx';
  const selectedIframeSrc =
    (selectedIsPpt || selectedIsWord) && selectedZipFile?.fileUrl
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedZipFile.fileUrl)}`
      : selectedZipFile?.fileUrl || '';

  const modalMaxW = isZip ? '1200px' : '1100px';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      isCentered
      closeOnOverlayClick={!loading && !zipLoading}
    >
      <ModalOverlay bg="rgba(15, 23, 42, 0.22)" backdropFilter="blur(4px)" />
      <ModalContent
        borderRadius="12px"
        maxW={modalMaxW}
        h="80vh"
        display="flex"
        flexDirection="column"
      >
        <ModalHeader py={4} px={5} borderBottom="1px solid" borderColor="#F0F0F0">
          <Flex justify="space-between" align="center">
            <Flex align="center" gap={3}>
              <FileIcon fileName={resourceName} />
              <Box>
                <Text fontSize="16px" fontWeight="500" color="#1D2129">
                  {resourceName}
                </Text>
                <Text fontSize="12px" color="#86909C">
                  {isZip
                    ? t('resource.previewModal.zipPreview')
                    : isVideo
                      ? t('resource.previewModal.videoPreview')
                      : isAudio
                        ? t('resource.previewModal.audioPreview')
                        : isPpt
                          ? t('resource.previewModal.pptPreview')
                          : t('resource.previewModal.docPreview')}
                </Text>
              </Box>
            </Flex>
            <IconButton
              aria-label={t('resource.actions.close')}
              icon={<CloseIcon w={3} h={3} />}
              variant="ghost"
              size="sm"
              onClick={onClose}
              color="#86909C"
              _hover={{ bg: 'transparent', color: '#4E5969' }}
            />
          </Flex>
        </ModalHeader>

        <ModalBody p={0} flex="1" overflow="hidden" bg="#F7F8FA" minH="0" w="100%">
          {isZip ? (
            // 压缩包预览布局：左侧文件列表 + 右侧预览
            <Flex h="100%" w="100%">
              {/* 左侧文件列表 */}
              <Box
                w="260px"
                h="100%"
                bg="white"
                borderRight="1px solid"
                borderColor="#F0F0F0"
                display="flex"
                flexDirection="column"
              >
                <Box px={4} py={3} borderBottom="1px solid" borderColor="#F0F0F0">
                  <Text fontSize="14px" fontWeight="500" color="#1D2129">
                    {t('resource.previewModal.zipFileList')}
                  </Text>
                  <Text fontSize="12px" color="#86909C" mt={0.5}>
                    {t('resource.previewModal.zipFileCount', { count: zipFiles.length })}
                  </Text>
                </Box>
                <Box flex="1" overflowY="auto">
                  {zipLoading ? (
                    <Flex justify="center" align="center" h="100%" direction="column" gap={3}>
                      <Spinner size="md" color="#C8000B" thickness="3px" />
                      <Text color="#86909C" fontSize="13px">
                        {t('resource.previewModal.zipDecompressing')}
                      </Text>
                    </Flex>
                  ) : zipError ? (
                    <Flex
                      justify="center"
                      align="center"
                      h="100%"
                      direction="column"
                      gap={2}
                      px={4}
                    >
                      <Text color="#F53F3F" fontSize="14px" fontWeight="500" textAlign="center">
                        {zipError}
                      </Text>
                    </Flex>
                  ) : (
                    zipFiles.map((file, index) => (
                      <Flex
                        key={index}
                        px={4}
                        py={2.5}
                        align="center"
                        gap={2}
                        cursor="pointer"
                        bg={selectedZipFile?.fileName === file.fileName ? '#FFF5F5' : 'white'}
                        _hover={{
                          bg: selectedZipFile?.fileName === file.fileName ? '#FFF5F5' : '#F7F8FA'
                        }}
                        onClick={() => setSelectedZipFile(file)}
                        borderBottom="1px solid"
                        borderColor="#F7F8FA"
                      >
                        <Box flexShrink={0} w="28px" h="28px">
                          <FileIcon fileName={file.fileName} />
                        </Box>
                        <Box flex="1" minW={0}>
                          <Text
                            fontSize="13px"
                            color={
                              selectedZipFile?.fileName === file.fileName ? '#C8000B' : '#1D2129'
                            }
                            noOfLines={1}
                            title={file.fileName}
                          >
                            {file.fileName}
                          </Text>
                        </Box>
                      </Flex>
                    ))
                  )}
                </Box>
              </Box>

              <Divider orientation="vertical" borderColor="#F0F0F0" />

              {/* 右侧预览区域 */}
              <Box flex="1" h="100%" overflow="hidden" bg="#F7F8FA">
                {zipLoading || !selectedZipFile ? (
                  <Flex justify="center" align="center" h="100%" direction="column" gap={2}>
                    <Text color="#86909C" fontSize="16px" fontWeight="500">
                      {zipLoading
                        ? t('resource.previewModal.loading')
                        : t('resource.previewModal.selectFileToPreview')}
                    </Text>
                  </Flex>
                ) : selectedIsVideo ? (
                  <Flex w="100%" h="100%" justify="center" align="center" bg="black">
                    <video
                      src={selectedIframeSrc}
                      controls
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: '100%',
                        height: '100%'
                      }}
                    >
                      {t('resource.previewModal.videoNotSupported')}
                    </video>
                  </Flex>
                ) : selectedIsAudio ? (
                  <Flex
                    w="100%"
                    h="100%"
                    justify="center"
                    align="center"
                    bg="#F7F8FA"
                    direction="column"
                    gap={4}
                  >
                    <Text fontSize="16px" color="#1D2129" fontWeight="500">
                      {selectedZipFile.fileName}
                    </Text>
                    <audio
                      src={selectedIframeSrc}
                      controls
                      style={{ width: '80%', maxWidth: '600px' }}
                    >
                      {t('resource.previewModal.audioNotSupported')}
                    </audio>
                  </Flex>
                ) : (
                  <Box w="100%" h="100%" overflow="hidden" bg="white">
                    <iframe
                      src={selectedIframeSrc}
                      frameBorder="0"
                      width="100%"
                      height="100%"
                      style={{
                        border: 'none',
                        background: 'white',
                        width: '100%',
                        height: '100%'
                      }}
                      title={selectedZipFile.fileName}
                      allowFullScreen
                    />
                  </Box>
                )}
              </Box>
            </Flex>
          ) : loading ? (
            <Flex justify="center" align="center" h="100%" direction="column" gap={3}>
              <Spinner size="xl" color="#C8000B" thickness="3px" />
              <Text color="#86909C" fontSize="14px">
                {t('resource.previewModal.loading')}
              </Text>
            </Flex>
          ) : error ? (
            <Flex justify="center" align="center" h="100%" direction="column" gap={2}>
              <Text color="#F53F3F" fontSize="16px" fontWeight="500">
                {error}
              </Text>
              <Text color="#86909C" fontSize="14px">
                {t('resource.previewModal.retryLater')}
              </Text>
            </Flex>
          ) : iframeSrc ? (
            isVideo ? (
              <Flex w="100%" h="100%" justify="center" align="center" bg="black">
                <video
                  src={iframeSrc}
                  controls
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: '100%',
                    height: '100%'
                  }}
                >
                  {t('resource.previewModal.videoNotSupported')}
                </video>
              </Flex>
            ) : isAudio ? (
              <Flex w="100%" h="100%" justify="center" align="center" bg="#F7F8FA">
                <audio src={iframeSrc} controls style={{ width: '80%', maxWidth: '600px' }}>
                  {t('resource.previewModal.audioNotSupported')}
                </audio>
              </Flex>
            ) : (
              <Box w="100%" h="100%" overflow="hidden" bg="white">
                <iframe
                  src={iframeSrc}
                  frameBorder="0"
                  width="100%"
                  height="100%"
                  style={{
                    border: 'none',
                    background: 'white',
                    width: '100%',
                    height: '100%'
                  }}
                  title={resourceName}
                  allowFullScreen
                />
              </Box>
            )
          ) : (
            <Flex justify="center" align="center" h="100%" direction="column" gap={2}>
              <Text color="#86909C" fontSize="16px" fontWeight="500">
                {t('resource.previewModal.noPreview')}
              </Text>
              <Text color="#86909C" fontSize="14px">
                {t('resource.previewModal.noPreviewText')}
              </Text>
            </Flex>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
