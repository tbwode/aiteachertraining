'use client';

import React from 'react';
import { Box, VStack, Text, type BoxProps } from '@chakra-ui/react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

export type EmptyProps = {
  /** 空状态标题 */
  title?: string;
  /** 空状态描述文案 */
  description?: string;
  /** 图片路径，默认使用 empty.svg */
  imageSrc?: string;
  /** 图片尺寸（宽高相同），默认 160px */
  imageSize?: number;
  /** 自定义操作区域，如按钮 */
  action?: React.ReactNode;
  /** 是否显示图片，默认 true */
  showImage?: boolean;
  /** 容器最小高度，默认 400px */
  minHeight?: string | number;
  /** 内容垂直间距，默认 4 */
  spacing?: number;
} & BoxProps;

const Empty: React.FC<EmptyProps> = ({
  title,
  description,
  imageSrc = '/imgs/app/student/empty.svg',
  imageSize = 160,
  action,
  showImage = true,
  minHeight = '400px',
  spacing = 4,
  ...boxProps
}) => {
  const { t } = useTranslation('common');
  const defaultTitle = title ?? t('empty.no_data');

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH={minHeight}
      py={8}
      {...boxProps}
    >
      <VStack spacing={spacing}>
        {showImage && (
          <Box position="relative" width={`${imageSize}px`} height={`${imageSize}px`}>
            <Image src={imageSrc} alt="empty" fill style={{ objectFit: 'contain' }} priority />
          </Box>
        )}
        {defaultTitle && (
          <Text
            fontSize="16px"
            fontWeight={500}
            color="#4E5969"
            lineHeight="24px"
            textAlign="center"
          >
            {defaultTitle}
          </Text>
        )}
        {description && (
          <Text
            fontSize="14px"
            fontWeight={400}
            color="#86909C"
            lineHeight="22px"
            textAlign="center"
            maxW="400px"
            whiteSpace="pre-wrap"
          >
            {description}
          </Text>
        )}
        {action && <Box mt={2}>{action}</Box>}
      </VStack>
    </Box>
  );
};

Empty.displayName = 'Empty';

export default Empty;
