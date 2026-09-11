'use client';

import { Box } from '@chakra-ui/react';

type TalentTrainingPrototypeFrameProps = {
  initialView: 'dashboard' | 'abilitygraph';
  title: string;
};

export default function TalentTrainingPrototypeFrame({
  initialView,
  title
}: TalentTrainingPrototypeFrameProps) {
  const prototypeUrl = `/prototypes/talent-training-v6.html?embed=1&view=${initialView}`;

  return (
    <Box
      flex="1"
      minH={{ base: '680px', md: 'calc(100vh - 123px)' }}
      h={{ base: '680px', md: 'calc(100vh - 123px)' }}
      overflow="hidden"
      borderWidth="1px"
      borderColor="blackAlpha.100"
      borderRadius={{ base: '16px', md: '22px' }}
      bg="#F5F6F8"
      boxShadow="0 10px 30px rgba(16, 24, 40, 0.06)"
    >
      <Box
        as="iframe"
        key={initialView}
        title={title}
        src={prototypeUrl}
        loading="eager"
        sandbox="allow-scripts allow-forms allow-modals allow-downloads allow-same-origin"
        w="100%"
        h="100%"
        border="0"
        display="block"
        bg="#F5F6F8"
      />
    </Box>
  );
}
