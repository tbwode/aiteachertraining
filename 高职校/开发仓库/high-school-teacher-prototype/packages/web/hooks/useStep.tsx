import {
  Box,
  Flex,
  Step,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  css
} from '@chakra-ui/react';
import React, { useCallback, useState } from 'react';

export const useMyStep = ({
  defaultStep = 0,
  steps = []
}: {
  defaultStep?: number;
  steps: { title?: string; description?: string }[];
}) => {
  const [activeStep, setActiveStep] = useState(defaultStep);

  const goToNext = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const goToPrevious = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const resetStep = useCallback(() => {
    setActiveStep(defaultStep);
  }, [defaultStep]);

  const MyStep = useCallback(
    () => (
      <Stepper
        size={['xs', 'sm']}
        index={activeStep}
        colorScheme="primary"
        gap={5}
        w={'100%'}
        css={css({
          '.chakra-step__indicator': {
            borderWidth: '0 !important'
          }
        })}
      >
        {steps.map((step, index) => (
          <Step key={step.title}>
            <StepIndicator>
              <StepStatus
                complete={<StepIcon />}
                incomplete={
                  <Flex
                    bg={'#F2F3F5'}
                    color={'##4E5969'}
                    w={'100%'}
                    h={'100%'}
                    lineHeight={'100%'}
                    borderRadius={'50%'}
                    alignItems={'center'}
                    justifyContent={'center'}
                  >
                    {index + 1}
                  </Flex>
                }
                active={
                  <Flex
                    bg={'#000000'}
                    color={'white'}
                    w={'100%'}
                    h={'100%'}
                    lineHeight={'100%'}
                    borderRadius={'50%'}
                    alignItems={'center'}
                    justifyContent={'center'}
                  >
                    {index + 1}
                  </Flex>
                }
              />
            </StepIndicator>

            <Box flexShrink="0">
              <StepTitle>{step.title}</StepTitle>
            </Box>

            <StepSeparator />
          </Step>
        ))}
      </Stepper>
    ),
    [steps, activeStep]
  );

  return {
    activeStep,
    goToNext,
    goToPrevious,
    MyStep,
    resetStep
  };
};
