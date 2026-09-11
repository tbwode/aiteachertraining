'use client';

import { Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { TEXT_PRIMARY } from '../constants';

type GreetingBarProps = {
  userName?: string;
};

function getGreetingKey(hour: number): string {
  if (hour >= 7 && hour < 9) return 'workspace.greeting.morning';
  if (hour >= 9 && hour < 12) return 'workspace.greeting.forenoon';
  if (hour >= 12 && hour < 14) return 'workspace.greeting.noon';
  if (hour >= 14 && hour < 18) return 'workspace.greeting.afternoon';
  return 'workspace.greeting.evening';
}

export function GreetingBar({ userName }: GreetingBarProps) {
  const { t } = useTranslation('teacher');
  const hour = new Date().getHours();
  const greeting = t(getGreetingKey(hour));

  return (
    <VStack spacing={2} mb={8} align="center">
      <Text
        fontSize="25px"
        fontWeight={500}
        color={TEXT_PRIMARY}
        fontFamily={`"Songti SC", "SimSun", "Noto Serif CJK SC", serif`}
      >
        {greeting}，{userName || ''}
      </Text>
    </VStack>
  );
}
