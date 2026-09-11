import { CheckCircleIcon } from '@chakra-ui/icons';
import { Box, Flex, HStack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { PRIMARY_COLOR, type WizardStep } from '../constants';

type StepIndicatorProps = {
  currentStep: WizardStep;
};

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const { t } = useTranslation('teacher');

  const stepTitles = [
    t('aiTeacher.avatar.create.steps.classConfig'),
    t('aiTeacher.avatar.create.steps.teachingPath'),
    t('aiTeacher.avatar.create.steps.knowledgeAggregation')
  ];

  return (
    <Flex align="center" justify="space-between" w="full" flexWrap={{ base: 'wrap', md: 'nowrap' }}>
      {stepTitles.map((title, index) => {
        const step = (index + 1) as WizardStep;
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;
        const isLastStep = step === 3;

        return (
          <Flex
            key={title}
            align="center"
            flex={isLastStep ? '0 0 auto' : '1'}
            minW={{ base: '100%', md: '0' }}
          >
            <HStack spacing={3} flexShrink={0}>
              <Flex
                w="36px"
                h="36px"
                borderRadius="full"
                align="center"
                justify="center"
                bg={isCompleted || isActive ? PRIMARY_COLOR : 'gray.200'}
                color="white"
                fontWeight={700}
              >
                {isCompleted ? <CheckCircleIcon /> : step}
              </Flex>
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight={600}
                  color={isActive || isCompleted ? 'gray.800' : 'gray.400'}
                >
                  {title}
                </Text>
              </Box>
            </HStack>
            {!isLastStep && (
              <Box
                flex="1"
                h="2px"
                mx={4}
                bg={step < currentStep ? PRIMARY_COLOR : 'gray.200'}
                minW="32px"
                display={{ base: 'none', md: 'block' }}
              />
            )}
          </Flex>
        );
      })}
    </Flex>
  );
}
