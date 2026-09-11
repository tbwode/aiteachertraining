'use client';

import { Flex, HStack, VStack, Box, Text, Image, Spinner, Button } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { Message, AttachmentFile } from '@/types/common-chat';
import { getFileIconByName } from '@/utils/fileIcon';
import Markdown from '@/components/Markdown';
import CourseSelectCard, { type CourseOption } from './CourseSelectCard';
import MaterialCreateCard from './MaterialCreateCard';
import AICourseCreateCard from './AICourseCreateCard';
import StudentStatsCard from './StudentStatsCard';
import StudentLearningDetailCard from './StudentLearningDetailCard';
import InterruptCard from './InterruptCard';

export default function MessageItem({
  message,
  onCourseSelect,
  onAICourseGenerate,
  onInterruptSubmit,
  onNavigate
}: {
  message: Message;
  onCourseSelect?: (course: CourseOption) => void;
  onAICourseGenerate?: () => void;
  onInterruptSubmit?: (answers: any[]) => void;
  onNavigate?: (path: string) => void;
}) {
  const { t } = useTranslation();
  const isUser = message.role === 'user';

  if (message.type === 'loading') {
    return (
      <Flex justify="flex-start">
        <HStack spacing="12px" align="flex-start" maxW="80%">
          <Box
            w="32px"
            h="32px"
            borderRadius="50%"
            bg="#FFF0F0"
            border="2px solid #fff"
            overflow="hidden"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Image
              src="/imgs/app/chatAI.png"
              w="100%"
              h="100%"
              objectFit="cover"
              borderRadius="50%"
            />
          </Box>
          <Box bg="#FFFFFF" borderRadius="3px 24px 24px 24px" px="20px" py="16px">
            <Flex align="center" gap="8px">
              <Spinner size="sm" color="#C8000B" />
              <Text fontSize="14px" color="#999">
                {message.content}
              </Text>
            </Flex>
          </Box>
        </HStack>
      </Flex>
    );
  }

  if (isUser) {
    return (
      <Flex justify="flex-end">
        <HStack spacing="12px" align="flex-start" maxW="70%">
          <VStack spacing="8px" align="flex-end">
            {message.content && (
              <Box
                bg="#FFF0F0"
                color="#333"
                px="20px"
                py="14px"
                borderRadius="24px 3px 24px 24px"
                fontSize="16px"
                lineHeight="1.6"
                fontWeight="500"
              >
                {message.content}
              </Box>
            )}
            {message.attachments && message.attachments.length > 0 && (
              <HStack spacing="8px" flexWrap="wrap" justify="flex-end">
                {message.attachments.map((file: AttachmentFile) => {
                  const isImage =
                    /^image\//i.test(file.fileType || '') ||
                    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.fileType || '') ||
                    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.fileName || '');
                  return (
                    <HStack
                      key={file.fileKey}
                      spacing="8px"
                      bg="#fff"
                      border="1px solid #E5E6EB"
                      borderRadius="8px"
                      p="8px 12px"
                      maxW={isImage ? '120px' : '200px'}
                    >
                      {isImage && file.fileUrl ? (
                        <>
                          <Image
                            src={file.fileUrl}
                            alt={file.fileName}
                            w="80px"
                            h="80px"
                            objectFit="cover"
                            borderRadius="4px"
                            flexShrink={0}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <Box w="32px" h="32px" flexShrink={0}>
                            {getFileIconByName(file.fileName, { size: '32px' })}
                          </Box>
                          <Box overflow="hidden">
                            <Text fontSize="13px" color="#333" fontWeight="500" noOfLines={1}>
                              {file.fileName}
                            </Text>
                            <Text fontSize="11px" color="#999">
                              {file.fileName?.split('.').pop()?.toLowerCase() || 'file'}
                            </Text>
                          </Box>
                        </>
                      )}
                    </HStack>
                  );
                })}
              </HStack>
            )}
          </VStack>
          <Image
            src="/imgs/app/chatUser.png"
            w="32px"
            h="32px"
            borderRadius="full"
            objectFit="cover"
          />
        </HStack>
      </Flex>
    );
  }

  return (
    <Flex justify="flex-start">
      <HStack spacing="12px" align="flex-start" maxW="80%">
        <Box
          w="32px"
          h="32px"
          borderRadius="50%"
          bg="#FFF0F0"
          border="2px solid #fff"
          overflow="hidden"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Image
            src="/imgs/app/chatAI.png"
            w="100%"
            h="100%"
            objectFit="cover"
            borderRadius="50%"
          />
        </Box>
        <Box bg="#FFFFFF" borderRadius="3px 24px 24px 24px" px="20px" py="16px" maxW="650px">
          {message.type === 'courseList' && message.data?.courses ? (
            <CourseSelectCard
              title={message.content}
              courses={message.data.courses}
              footer={message.data.footer}
              onSelect={(course) => onCourseSelect?.(course)}
            />
          ) : message.type === 'materialCreate' ? (
            <MaterialCreateCard
              content={message.content}
              redirectUrl={message.data?.redirectUrl}
              coursewareId={message.data?.coursewareId}
            />
          ) : message.type === 'aiCourseCreate' ? (
            <AICourseCreateCard
              title={message.data?.title}
              subtitle={message.data?.subtitle}
              courseName={message.data?.courseName}
              courseType={message.data?.courseType}
              onGenerate={onAICourseGenerate}
            />
          ) : message.type === 'studentStats' && message.data?.stats ? (
            <StudentStatsCard data={message.data.stats} />
          ) : message.type === 'studentLearningDetail' && message.data ? (
            <StudentLearningDetailCard data={message.data as any} />
          ) : message.type === 'actionButton' && message.data?.actionUrl ? (
            <Box>
              {message.data.title && (
                <Text fontSize="16px" color="#333" fontWeight="600" lineHeight="1.5" mb="10px">
                  {message.data.title}
                </Text>
              )}
              {message.content && (
                <Box fontSize="14px" color="#666" lineHeight="1.6" mb="10px">
                  <Markdown source={message.content} />
                </Box>
              )}
              {message.data.actionUrl && (
                <Button
                  size="sm"
                  bg="#C8000B"
                  color="#fff"
                  borderRadius="8px"
                  _hover={{ bg: '#a00008' }}
                  onClick={() => {
                    const url = message.data?.actionUrl;
                    if (url?.startsWith('http')) {
                      window.open(url, '_blank');
                    } else {
                      onNavigate?.(url ?? '');
                    }
                  }}
                >
                  {message.data.actionLabel || t('commonChat.action.go')}
                </Button>
              )}
            </Box>
          ) : message.type === 'interrupt' && message.data?.interrupt ? (
            <InterruptCard
              data={{ ...message.data.interrupt, answers: message.data?.answers }}
              onSubmit={(answers) => onInterruptSubmit?.(answers)}
              readOnly={message.data?.readOnly === true}
            />
          ) : (
            <Box
              fontSize="16px"
              color="#333"
              lineHeight="1.6"
              px="8px"
              sx={{ '& .markdown': { fontSize: '16px' } }}
            >
              {message.content ? (
                <Markdown source={message.content} />
              ) : (
                <Flex align="center" gap="8px">
                  <Spinner size="sm" color="#C8000B" />
                  <Text fontSize="14px" color="#999">
                    {t('commonChat.loading.thinking')}
                  </Text>
                </Flex>
              )}
            </Box>
          )}
        </Box>
      </HStack>
    </Flex>
  );
}
