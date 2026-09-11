'use client';

import { Box, Heading, Text } from '@chakra-ui/react';

type SharedProfilePageProps = {
  title: string;
  description: string;
  variant?: 'teacher' | 'admin';
};

export default function SharedProfilePage({
  title,
  description,
  variant = 'teacher'
}: SharedProfilePageProps) {
  if (variant === 'admin') {
    return (
      <Box
        px={5.5}
        py={5.5}
        rounded="24px"
        borderWidth="1px"
        borderColor="blackAlpha.100"
        bg="rgba(255,255,255,0.88)"
        boxShadow="0 24px 60px rgba(15, 23, 42, 0.08)"
      >
        <Heading size="md">{title}</Heading>
        <Text mt={3} color="gray.500">
          {description}
        </Text>
      </Box>
    );
  }

  return (
    <Box bg="white" border="1px solid" borderColor="gray.200" rounded="xl" p={6}>
      <Heading size="md" color="gray.800">
        {title}
      </Heading>
      <Text mt={3} color="gray.600">
        {description}
      </Text>
    </Box>
  );
}
