'use client';

import { useState } from 'react';
import { Box, Button, Text, Spinner } from '@chakra-ui/react';
import { createDigitalCourseware } from '@/api/common-chat/api';

export type MaterialCreateCardProps = {
  content?: string;
  buttonText?: string;
  redirectUrl?: string;
  coursewareId?: string;
  onClick?: () => void;
};

export default function MaterialCreateCard({
  content = '已为您识别到需求，您想新建一门独立数字课件，点击下方按钮即可开始制作。',
  buttonText = '创作数字课件',
  redirectUrl,
  coursewareId,
  onClick
}: MaterialCreateCardProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (onClick) {
      onClick();
    }

    const url = redirectUrl || '#';

    if (!coursewareId) {
      window.open(url, '_blank');
      return;
    }

    setLoading(true);
    try {
      await createDigitalCourseware({ chatId: coursewareId });
      window.open(url, '_blank');
    } catch {
      window.open(url, '_blank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Text fontSize="14px" color="#333" lineHeight="1.6" mb="12px">
        {content}
      </Text>
      <Button
        h="40px"
        px="20px"
        bg="#C8000B"
        color="#fff"
        borderRadius="8px"
        fontSize="14px"
        fontWeight="500"
        leftIcon={
          loading ? (
            <Spinner size="sm" color="white" mr="4px" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M10.0001 4.16699V15.8337M4.16675 10.0003H15.8334"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )
        }
        _hover={{ bg: '#a00008' }}
        onClick={handleClick}
        isDisabled={loading}
      >
        {buttonText}
      </Button>
    </Box>
  );
}
