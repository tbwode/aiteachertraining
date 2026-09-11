'use client';

import { useState, useCallback, useRef, Fragment } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  HStack,
  Input,
  Textarea,
  IconButton,
  Collapse,
  Badge,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Checkbox,
} from '@chakra-ui/react';
import { DeleteIcon, DragHandleIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import type { AICourseOutlineData, OutlineScene } from '@/types/common-chat';

const SCENE_TYPE_COLOR: Record<string, string> = {
  slide: 'blue',
  interactive: 'green',
  quiz: 'purple',
  pbl: 'orange',
};

export type CourseOutlineEditorProps = {
  data: AICourseOutlineData;
  onSubmit: (data: AICourseOutlineData) => void;
  readOnly?: boolean;
};

export default function CourseOutlineEditor({ data, onSubmit, readOnly }: CourseOutlineEditorProps) {
  const { t } = useTranslation('teacher');

  const [outlines, setOutlines] = useState<OutlineScene[]>(
    () =>
      (data.allOutlines ?? []).map((o, i) => ({
        ...o,
        type: o.type ?? 'slide',
        quizConfig:
          o.type === 'quiz'
            ? {
                difficulty: 'easy',
                questionTypes: ['single'],
                questionCount: 2,
                ...(typeof o.quizConfig === 'object' && o.quizConfig !== null ? o.quizConfig : {}),
              }
            : undefined,
        title: o.title ?? '',
        description: o.description ?? '',
        teachingObjective: o.teachingObjective ?? '',
        keyPoints: o.keyPoints ?? [],
        estimatedDuration: o.estimatedDuration ?? 0,
        order: o.order ?? i + 1,
      }))
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const dragItemIndex = useRef<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const updateScene = useCallback((id: string, patch: Partial<OutlineScene>) => {
    setOutlines((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }, []);

  const deleteScene = useCallback((id: string) => {
    setOutlines((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const addScene = useCallback((insertIndex: number) => {
    const newId = `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newScene: OutlineScene = {
      id: newId,
      type: 'slide',
      title: '',
      description: '',
      teachingObjective: '',
      keyPoints: [],
      estimatedDuration: 0,
      order: insertIndex + 1,
    };
    setOutlines((prev) => {
      const next = [...prev];
      next.splice(insertIndex, 0, newScene);
      return next.map((o, i) => ({ ...o, order: i + 1 }));
    });
    setExpandedId(newId);
  }, []);

  const handleDragStart = (index: number) => {
    dragItemIndex.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItemIndex.current = index;
  };

  const handleDragEnd = () => {
    const from = dragItemIndex.current;
    const to = dragOverItemIndex.current;
    if (from === null || to === null || from === to) {
      dragItemIndex.current = null;
      dragOverItemIndex.current = null;
      return;
    }
    setOutlines((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((o, i) => ({ ...o, order: i + 1 }));
    });
    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };

  const handleSubmit = () => {
    onSubmit({
      stageInfo: data.stageInfo,
      allOutlines: outlines,
    });
  };

  const totalDuration = outlines.reduce((sum, o) => sum + (o.estimatedDuration || 0), 0);

  const typeLabel = (type: string) =>
    t(`commonChat.outline.scene_type.${type as 'slide' | 'interactive' | 'quiz' | 'pbl'}`, { defaultValue: type });

  return (
    <Box w="100%" maxW="640px" bg="#fff" borderRadius="12px" p="20px" boxShadow="0 2px 12px rgba(0,0,0,0.06)">
      <VStack spacing="16px" align="stretch">
        {/* 头部信息 */}
        <Box>
          <Text fontSize="16px" fontWeight="600" color="#333">
            {data.stageInfo?.name || t('commonChat.outline.title')}
          </Text>
          {data.stageInfo?.description && (
            <Text fontSize="13px" color="#666" mt="4px">{data.stageInfo.description}</Text>
          )}
          <HStack spacing="12px" mt="8px">
            <Badge colorScheme="red" variant="subtle" fontSize="12px">
              {t('commonChat.outline.scene_count', { count: outlines.length })}
            </Badge>
            <Badge colorScheme="gray" variant="subtle" fontSize="12px">
              {t('commonChat.outline.total_duration', { minutes: Math.ceil(totalDuration / 60) })}
            </Badge>
          </HStack>
        </Box>

        {/* 场景列表 */}
        <VStack spacing="8px" align="stretch">
          {outlines.map((scene, index) => (
            <Fragment key={scene.id}>
              <Box
                border="1px solid"
              borderColor={expandedId === scene.id ? '#C8000B' : '#E5E6EB'}
              borderRadius="10px"
              overflow="hidden"
              bg={expandedId === scene.id ? '#FFF5F5' : '#fff'}
              transition="all 0.2s"
              draggable={!readOnly}
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
            >
              {/* 场景头部 */}
              <Flex
                align="center"
                px="12px"
                py="10px"
                cursor="pointer"
                onClick={() => toggleExpand(scene.id)}
                gap="8px"
              >
                {!readOnly && (
                  <Box
                    cursor="grab"
                    color="#999"
                    _hover={{ color: '#666' }}
                    display="flex"
                    alignItems="center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DragHandleIcon boxSize={4} />
                  </Box>
                )}

                <Text fontSize="13px" color="#999" fontWeight="500" w="28px" flexShrink={0}>
                  {String(index + 1).padStart(2, '0')}
                </Text>

                <Badge
                  colorScheme={SCENE_TYPE_COLOR[scene.type] || 'gray'}
                  fontSize="11px"
                  borderRadius="4px"
                  px="6px"
                  py="2px"
                  flexShrink={0}
                >
                  {typeLabel(scene.type)}
                </Badge>

                <Text
                  fontSize="14px"
                  fontWeight={expandedId === scene.id ? '600' : '500'}
                  color="#333"
                  flex={1}
                  noOfLines={1}
                >
                  {scene.title}
                </Text>

                <Text fontSize="12px" color="#999" flexShrink={0}>
                  {Math.ceil((scene.estimatedDuration || 0) / 60)}min
                </Text>

                {!readOnly && (
                  <IconButton
                    aria-label={t('commonChat.outline.delete_aria')}
                    icon={<DeleteIcon />}
                    size="xs"
                    variant="ghost"
                    colorScheme="red"
                    flexShrink={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteScene(scene.id);
                    }}
                  />
                )}
              </Flex>

              {/* 展开编辑区 */}
              <Collapse in={expandedId === scene.id} animateOpacity>
                <Box px="16px" pb="16px" pt="4px">
                  <VStack spacing="12px" align="stretch">
                    <Box>
                      <Text fontSize="12px" color="#666" mb="4px" fontWeight="500">
                        {t('commonChat.outline.scene_type_label')}
                      </Text>
                      {readOnly ? (
                        <Badge
                          colorScheme={SCENE_TYPE_COLOR[scene.type] || 'gray'}
                          fontSize="12px"
                          borderRadius="4px"
                          px="8px"
                          py="4px"
                        >
                          {typeLabel(scene.type)}
                        </Badge>
                      ) : (
                        <Select
                          size="sm"
                          borderRadius="6px"
                          value={scene.type}
                          onChange={(e) => {
                            const newType = e.target.value;
                            const oldType = scene.type;
                            if (oldType === 'quiz' && newType !== 'quiz') {
                              updateScene(scene.id, {
                                type: newType,
                                quizConfig: undefined,
                              });
                            } else if (oldType !== 'quiz' && newType === 'quiz') {
                              updateScene(scene.id, {
                                type: newType,
                                quizConfig: { difficulty: 'easy', questionTypes: ['single'], questionCount: 2 },
                              });
                            } else {
                              updateScene(scene.id, { type: newType });
                            }
                          }}
                          _focus={{ borderColor: '#C8000B', boxShadow: 'none' }}
                        >
                          {Object.keys(SCENE_TYPE_COLOR).map((type) => (
                            <option key={type} value={type}>
                              {typeLabel(type)}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Box>

                    <Box>
                      <Text fontSize="12px" color="#666" mb="4px" fontWeight="500">
                        {t('commonChat.outline.scene_title')}
                      </Text>
                      <Input
                        size="sm"
                        borderRadius="6px"
                        value={scene.title}
                        onChange={(e) => updateScene(scene.id, { title: e.target.value })}
                        placeholder={t('commonChat.outline.scene_title')}
                        _focus={{ borderColor: '#C8000B', boxShadow: 'none' }}
                        isReadOnly={readOnly}
                      />
                    </Box>

                    <Box>
                      <Text fontSize="12px" color="#666" mb="4px" fontWeight="500">
                        {t('commonChat.outline.scene_description')}
                      </Text>
                      <Textarea
                        size="sm"
                        borderRadius="6px"
                        value={scene.description}
                        onChange={(e) => updateScene(scene.id, { description: e.target.value })}
                        placeholder={t('commonChat.outline.scene_description')}
                        rows={2}
                        _focus={{ borderColor: '#C8000B', boxShadow: 'none' }}
                        isReadOnly={readOnly}
                      />
                    </Box>

                    {scene.type === 'quiz' && (
                      <>
                        <Box>
                          <Text fontSize="12px" color="#666" mb="4px" fontWeight="500">
                            {t('commonChat.outline.difficulty_label')}
                          </Text>
                          {readOnly ? (
                            <Input
                              size="sm"
                              borderRadius="6px"
                              value={t(`commonChat.outline.difficulty.${scene.quizConfig?.difficulty || 'easy'}`)}
                              isReadOnly
                              w="160px"
                            />
                          ) : (
                            <Select
                              size="sm"
                              borderRadius="6px"
                              w="160px"
                              value={scene.quizConfig?.difficulty || 'easy'}
                              onChange={(e) =>
                                updateScene(scene.id, {
                                  quizConfig: {
                                    ...(scene.quizConfig || {}),
                                    difficulty: e.target.value,
                                  },
                                })
                              }
                              _focus={{ borderColor: '#C8000B', boxShadow: 'none' }}
                            >
                              <option value="easy">{t('commonChat.outline.difficulty.easy')}</option>
                              <option value="medium">{t('commonChat.outline.difficulty.medium')}</option>
                              <option value="hard">{t('commonChat.outline.difficulty.hard')}</option>
                            </Select>
                          )}
                        </Box>
                        <Box>
                          <Text fontSize="12px" color="#666" mb="4px" fontWeight="500">
                            {t('commonChat.outline.question_type_label')}
                          </Text>
                          {readOnly ? (
                            <Input
                              size="sm"
                              borderRadius="6px"
                              value={Array.isArray(scene.quizConfig?.questionTypes)
                                ? (scene.quizConfig?.questionTypes as string[]).map((qt) =>
                                    t('commonChat.outline.question_type.' + qt)
                                  ).join(', ')
                                : t(`commonChat.outline.question_type.${scene.quizConfig?.questionTypes || 'single'}`)}
                              isReadOnly
                              w="160px"
                            />
                          ) : (
                            <HStack spacing={3}>
                              {['single', 'multiple', 'text'].map((qt) => (
                                <Checkbox
                                  key={qt}
                                  size="sm"
                                  isChecked={
                                    Array.isArray(scene.quizConfig?.questionTypes)
                                      ? scene.quizConfig?.questionTypes.includes(qt)
                                      : scene.quizConfig?.questionTypes === qt
                                  }
                                  onChange={(e) => {
                                    const current = scene.quizConfig?.questionTypes;
                                    const arr = Array.isArray(current) ? [...current] : current ? [current] : [];
                                    if (e.target.checked) {
                                      if (!arr.includes(qt)) arr.push(qt);
                                    } else {
                                      const idx = arr.indexOf(qt);
                                      if (idx > -1) arr.splice(idx, 1);
                                    }
                                    updateScene(scene.id, {
                                      quizConfig: {
                                        ...(scene.quizConfig || {}),
                                        questionTypes: arr.length > 0 ? arr : ['single'],
                                      },
                                    });
                                  }}
                                >
                                  {t(`commonChat.outline.question_type.${qt}`)}
                                </Checkbox>
                              ))}
                            </HStack>
                          )}
                        </Box>
                        <Box>
                          <Text fontSize="12px" color="#666" mb="4px" fontWeight="500">
                            {t('commonChat.outline.question_count_label')}
                          </Text>
                          {readOnly ? (
                            <Input
                              size="sm"
                              borderRadius="6px"
                              value={scene.quizConfig?.questionCount ?? 2}
                              isReadOnly
                              w="160px"
                            />
                          ) : (
                            <NumberInput
                              size="sm"
                              min={1}
                              max={50}
                              value={scene.quizConfig?.questionCount ?? 2}
                              onChange={(_, value) =>
                                updateScene(scene.id, {
                                  quizConfig: {
                                    ...(scene.quizConfig || {}),
                                    questionCount: Number.isNaN(value) ? 2 : value,
                                  },
                                })
                              }
                              borderRadius="6px"
                              w="160px"
                            >
                              <NumberInputField borderRadius="6px" _focus={{ borderColor: '#C8000B', boxShadow: 'none' }} />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          )}
                        </Box>
                      </>
                    )}

                    <Box>
                      <Text fontSize="12px" color="#666" mb="4px" fontWeight="500">
                        {t('commonChat.outline.teaching_objective')}
                      </Text>
                      <Textarea
                        size="sm"
                        borderRadius="6px"
                        value={scene.teachingObjective}
                        onChange={(e) => updateScene(scene.id, { teachingObjective: e.target.value })}
                        placeholder={t('commonChat.outline.teaching_objective')}
                        rows={2}
                        _focus={{ borderColor: '#C8000B', boxShadow: 'none' }}
                        isReadOnly={readOnly}
                      />
                    </Box>

                    <Box>
                      <Text fontSize="12px" color="#666" mb="4px" fontWeight="500">
                        {t('commonChat.outline.key_points')}
                      </Text>
                      <Textarea
                        size="sm"
                        borderRadius="6px"
                        value={scene.keyPoints?.join('\n') || ''}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n').filter((l) => l.trim() !== '');
                          updateScene(scene.id, { keyPoints: lines });
                        }}
                        placeholder={t('commonChat.outline.key_points')}
                        rows={3}
                        _focus={{ borderColor: '#C8000B', boxShadow: 'none' }}
                        isReadOnly={readOnly}
                      />
                    </Box>

                    <Box>
                      <Text fontSize="12px" color="#666" mb="4px" fontWeight="500">
                        {t('commonChat.outline.estimated_duration')}
                      </Text>
                      {readOnly ? (
                        <Input
                          size="sm"
                          borderRadius="6px"
                          value={scene.estimatedDuration}
                          isReadOnly
                          w="160px"
                        />
                      ) : (
                        <NumberInput
                          size="sm"
                          min={10}
                          max={3600}
                          value={scene.estimatedDuration}
                          onChange={(_, value) => updateScene(scene.id, { estimatedDuration: Number.isNaN(value) ? 0 : value })}
                          borderRadius="6px"
                          w="160px"
                        >
                          <NumberInputField borderRadius="6px" _focus={{ borderColor: '#C8000B', boxShadow: 'none' }} />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      )}
                    </Box>
                  </VStack>
                </Box>
              </Collapse>
              </Box>
            </Fragment>
          ))}
          {!readOnly && <InsertDivider onClick={() => addScene(outlines.length)} />}
        </VStack>

        {/* 提交按钮 */}
        {!readOnly && (
          <Button
            w="100%"
            h="44px"
            bg="#C8000B"
            color="#fff"
            borderRadius="8px"
            fontSize="15px"
            fontWeight="500"
            _hover={{ bg: '#a00008' }}
            isDisabled={outlines.length === 0}
            onClick={handleSubmit}
          >
            {t('commonChat.outline.confirm_generate')}
          </Button>
        )}
      </VStack>
    </Box>
  );
}

function InsertDivider({ onClick }: { onClick: () => void }) {
  return (
    <Flex
      align="center"
      justify="center"
      position="relative"
      h="20px"
      cursor="pointer"
      onClick={onClick}
    >
      <Box w="100%" h="1px" bg="#E5E6EB" />
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        w="22px"
        h="22px"
        borderRadius="50%"
        bg="#3B82F6"
        display="flex"
        alignItems="center"
        justifyContent="center"
        color="white"
        fontSize="14px"
        lineHeight="1"
        transition="all 0.2s"
        _hover={{ bg: '#2563EB', transform: 'translate(-50%, -50%) scale(1.1)' }}
      >
        +
      </Box>
    </Flex>
  );
}
