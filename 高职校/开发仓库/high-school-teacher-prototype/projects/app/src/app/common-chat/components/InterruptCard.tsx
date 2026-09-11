'use client';

import { useState } from 'react';
import { Box, Text, Button, VStack, Input } from '@chakra-ui/react';
import type { InterruptData, AICourseOutlineData } from '@/types/common-chat';
import CourseOutlineEditor from './CourseOutlineEditor';

export type InterruptCardProps = {
  data: InterruptData;
  onSubmit: (answers: any[]) => void;
  readOnly?: boolean;
};

export default function InterruptCard({ data, onSubmit, readOnly }: InterruptCardProps) {
  const initialAnswers = data?.answers as Record<number, any> | undefined;
  const [answers, setAnswers] = useState<Record<number, any>>(initialAnswers ?? {});

  const questions = Array.isArray(data?.questions) ? data.questions : [];

  // 检测是否为 AI 课程大纲类型的 interrupt
  const isOutlineInterrupt = data?.type === 'custom_ai_course_creation_outlines_json_data';
  if (isOutlineInterrupt) {
    const outlineQuestion = questions.find((q) => q.options);
    if (outlineQuestion) {
      const outlineData = outlineQuestion.options as unknown as AICourseOutlineData;
      return (
        <CourseOutlineEditor
          data={outlineData}
          onSubmit={(editedData) =>
            onSubmit([
              {
                message: outlineQuestion.name || 'ai_course_outline',
                type: editedData,
              },
            ])
          }
          readOnly={readOnly}
        />
      );
    }
  }

  const handleSelect = (qIndex: number, value: any, inputType: string) => {
    if (inputType === 'multiple_choice') {
      setAnswers((prev) => {
        const current = (prev[qIndex] as any[]) ?? [];
        const exists = current.some((item) => JSON.stringify(item) === JSON.stringify(value));
        if (exists) {
          return { ...prev, [qIndex]: current.filter((item) => JSON.stringify(item) !== JSON.stringify(value)) };
        }
        return { ...prev, [qIndex]: [...current, value] };
      });
    } else {
      setAnswers((prev) => ({ ...prev, [qIndex]: value }));
    }
  };

  const handleTextChange = (qIndex: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: value }));
  };

  const allAnswered = questions.length > 0 && questions.every((q, i) => {
    // options 为非数组对象时（如 AI 大纲数据），自动视为已回答
    if (q.options && !Array.isArray(q.options)) return true;
    if (q.input_type === 'single_choice') return answers[i] !== undefined;
    if (q.input_type === 'multiple_choice') {
      const arr = answers[i] as any[] | undefined;
      return arr !== undefined && arr.length > 0;
    }
    return true;
  });

  const handleSubmit = () => {
    const result = questions.map((q, i) => {
      // 当 options 为非数组对象时，直接将其作为答案提交
      if (q.options && !Array.isArray(q.options)) {
        return {
          message: q.name || `question_${i}`,
          type: q.options,
        };
      }
      return {
        message: q.name || `question_${i}`,
        type: answers[i] ?? '',
      };
    });
    onSubmit(result);
  };

  if (questions.length === 0) {
    return (
      <Box w="100%" bg="#fff" borderRadius="12px" p="20px">
        <Text fontSize="14px" color="#86909C">
          暂无需要确认的信息
        </Text>
      </Box>
    );
  }

  return (
    <Box w="100%" maxW="560px" bg="#fff" borderRadius="12px" p="20px" boxShadow="0 2px 12px rgba(0,0,0,0.06)">
      <VStack spacing="20px" align="stretch">
        {Array.isArray(questions) && questions.map((q, qIndex) => (
          <Box key={qIndex}>
            <Text fontSize="15px" color="#333" fontWeight="600" mb="12px">
              {q.question || '请确认'}
            </Text>
            {(q.input_type === 'single_choice' || q.input_type === 'multiple_choice') && Array.isArray(q.options) && (
              <VStack spacing="8px" align="stretch">
                {Array.isArray(q.options) && q.options.map((opt, oIndex) => {
                  const isObj = typeof opt === 'object';
                  const label = isObj ? opt?.course_name || opt?.clazz_name || JSON.stringify(opt) : String(opt);
                  const isMulti = q.input_type === 'multiple_choice';
                  const isSelected = isMulti
                    ? ((answers[qIndex] as any[]) ?? []).some((item) => JSON.stringify(item) === JSON.stringify(opt))
                    : answers[qIndex] === opt;
                  return (
                    <Button
                      key={oIndex}
                      variant="outline"
                      justifyContent="flex-start"
                      h="auto"
                      minH="40px"
                      py="10px"
                      px="14px"
                      borderRadius="8px"
                      borderColor={isSelected ? '#C8000B' : '#E5E6EB'}
                      bg={isSelected ? '#FFF5F5' : '#fff'}
                      color={isSelected ? '#C8000B' : '#333'}
                      fontSize="14px"
                      fontWeight={isSelected ? '600' : '400'}
                      lineHeight="1.5"
                      whiteSpace="normal"
                      textAlign="left"
                      _hover={{ borderColor: '#C8000B', bg: '#FFF5F5' }}
                      onClick={() => !readOnly && handleSelect(qIndex, opt, q.input_type)}
                    >
                      {isMulti && (
                        <Box
                          w="16px"
                          h="16px"
                          borderRadius="4px"
                          border="1.5px solid"
                          borderColor={isSelected ? '#C8000B' : '#D9D9D9'}
                          bg={isSelected ? '#C8000B' : 'transparent'}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          mr="10px"
                          flexShrink={0}
                        >
                          {isSelected && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </Box>
                      )}
                      {label}
                    </Button>
                  );
                })}
              </VStack>
            )}
            {q.input_type === 'text_input' && (
              <Input
                placeholder="请输入..."
                value={answers[qIndex] || ''}
                onChange={(e) => !readOnly && handleTextChange(qIndex, e.target.value)}
                isReadOnly={readOnly}
                borderRadius="8px"
                borderColor="#E5E6EB"
                _focus={{ borderColor: '#C8000B', boxShadow: 'none' }}
              />
            )}
            {q.options && !Array.isArray(q.options) && (
              <Button
                variant="outline"
                justifyContent="flex-start"
                h="auto"
                py="10px"
                px="14px"
                borderRadius="8px"
                borderColor={answers[qIndex] ? '#C8000B' : '#E5E6EB'}
                bg={answers[qIndex] ? '#FFF5F5' : '#fff'}
                color={answers[qIndex] ? '#C8000B' : '#333'}
                fontSize="14px"
                fontWeight={answers[qIndex] ? '600' : '400'}
                _hover={{ borderColor: '#C8000B', bg: '#FFF5F5' }}
                onClick={() => !readOnly && handleSelect(qIndex, q.options, q.input_type)}
              >
                {answers[qIndex] ? '已确认生成课程' : '确认并生成课程'}
              </Button>
            )}
          </Box>
        ))}

        <Button
          w="100%"
          h="44px"
          bg="#C8000B"
          color="#fff"
          borderRadius="8px"
          fontSize="15px"
          fontWeight="500"
          _hover={{ bg: '#a00008' }}
          isDisabled={!allAnswered || readOnly}
          onClick={handleSubmit}
        >
          确认
        </Button>
      </VStack>
    </Box>
  );
}
