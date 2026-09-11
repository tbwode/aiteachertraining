import React, { useCallback, useEffect, useMemo, useTransition } from 'react';
import {
  Box,
  Flex,
  Grid,
  type BoxProps,
  useTheme,
  useDisclosure,
  HStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  Center
} from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import type { AppSimpleEditFormType } from '@fastgpt/global/core/app/type.d';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import dynamic from 'next/dynamic';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import Avatar from '@fastgpt/web/components/common/Avatar';
import MyIcon from '@fastgpt/web/components/common/Icon';
import VariableEdit from '@/components/core/app/VariableEdit';
import PromptEditor from '@fastgpt/web/components/common/Textarea/PromptEditor';
import { formatEditorVariablePickerIcon } from '@fastgpt/global/core/workflow/utils';
import SearchParamsTip from '@/components/core/dataset/SearchParamsTip';
import SettingLLMModel from '@/components/core/ai/SettingLLMModel';
import { TTSTypeEnum } from '@/web/core/app/constants';
import { workflowSystemVariables } from '@/web/core/app/utils';
import { useContextSelector } from 'use-context-selector';
import { AppContext } from '@/pageComponents/app/detail/context';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import FormLabel from '@fastgpt/web/components/common/MyBox/FormLabel';
import VariableTip from '@/components/common/Textarea/MyTextarea/VariableTip';
import { getWebLLMModel } from '@/web/common/system/utils';
import ToolSelect from './components/ToolSelect';
import OptimizerPopover from '@/components/common/PromptEditor/OptimizerPopover';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import Empty from './components/Empty';

const DatasetSelectModal = dynamic(() => import('@/components/core/app/DatasetSelectModal'));
const DatasetParamsModal = dynamic(() => import('@/components/core/app/DatasetParamsModal'));
const TTSSelect = dynamic(() => import('@/components/core/app/TTSSelect'));
const QGConfig = dynamic(() => import('@/components/core/app/QGConfig'));
const WhisperConfig = dynamic(() => import('@/components/core/app/WhisperConfig'));
const InputGuideConfig = dynamic(() => import('@/components/core/app/InputGuideConfig'));
const WelcomeTextConfig = dynamic(() => import('@/components/core/app/WelcomeTextConfig'));
const FileSelectConfig = dynamic(() => import('@/components/core/app/FileSelect'));

const BoxStyles: BoxProps = {
  // p: 4,
  borderBottomWidth: '1px',
  borderBottomColor: 'borderColor.low',
  borderTop: 'none'
  // cursor: 'pointer'
};
const LabelStyles: BoxProps = {
  w: ['60px', '100px'],
  whiteSpace: 'nowrap',
  flexShrink: 0,
  fontSize: 'sm',
  color: 'myGray.900'
};

const EditForm = ({
  appForm,
  setAppForm
}: {
  appForm: AppSimpleEditFormType;
  setAppForm: React.Dispatch<React.SetStateAction<AppSimpleEditFormType>>;
}) => {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { defaultModels } = useSystemStore();

  const { appDetail } = useContextSelector(AppContext, (v) => v);
  const selectDatasets = useMemo(() => appForm?.dataset?.datasets, [appForm]);
  const [, startTst] = useTransition();

  const {
    isOpen: isOpenDatasetSelect,
    onOpen: onOpenDatasetSelect,
    onClose: onCloseDatasetSelect
  } = useDisclosure();
  const {
    isOpen: isOpenDatasetParams,
    onOpen: onOpenDatasetParams,
    onClose: onCloseDatasetParams
  } = useDisclosure();

  const formatVariables = useMemo(
    () =>
      formatEditorVariablePickerIcon([
        ...workflowSystemVariables.filter(
          (variable) =>
            !['appId', 'chatId', 'responseChatItemId', 'histories'].includes(variable.key)
        ),
        ...(appForm.chatConfig.variables || [])
      ]).map((item) => ({
        ...item,
        label: t(item.label as any),
        parent: {
          id: 'VARIABLE_NODE_ID',
          label: t('common:core.module.Variable'),
          avatar: 'core/workflow/template/variable'
        }
      })),
    [appForm.chatConfig.variables, t]
  );

  const selectedModel = getWebLLMModel(appForm.aiSettings.model);
  const tokenLimit = useMemo(() => {
    return selectedModel?.quoteMaxToken || 3000;
  }, [selectedModel?.quoteMaxToken]);

  // Force close image select when model not support vision
  useEffect(() => {
    if (!selectedModel.vision) {
      setAppForm((state) => ({
        ...state,
        chatConfig: {
          ...state.chatConfig,
          ...(state.chatConfig.fileSelectConfig
            ? {
                fileSelectConfig: {
                  ...state.chatConfig.fileSelectConfig,
                  canSelectImg: false
                }
              }
            : {})
        }
      }));
    }
  }, [selectedModel, setAppForm]);

  useEffect(() => {
    if (
      appForm.dataset.datasetSearchUsingExtensionQuery &&
      !appForm.dataset.datasetSearchExtensionModel
    ) {
      setAppForm((state) => ({
        ...state,
        dataset: {
          ...state.dataset,
          datasetSearchExtensionModel: defaultModels.llm?.model
        }
      }));
    }
  }, [
    appForm.dataset.datasetSearchUsingExtensionQuery,
    appForm.dataset.datasetSearchExtensionModel,
    defaultModels.llm?.model,
    setAppForm
  ]);

  // 20260206 - 锚点
  // const OptimizerPopverComponent = useCallback(
  //   ({ iconButtonStyle }: { iconButtonStyle: Record<string, any> }) => {
  //     return (
  //       <OptimizerPopover
  //         iconButtonStyle={iconButtonStyle}
  //         defaultPrompt={appForm.aiSettings.systemPrompt}
  //         onChangeText={(e) => {
  //           setAppForm((state) => ({
  //             ...state,
  //             aiSettings: {
  //               ...state.aiSettings,
  //               systemPrompt: e
  //             }
  //           }));
  //         }}
  //       />
  //     );
  //   },
  //   [appForm.aiSettings.systemPrompt, setAppForm]
  // );

  return (
    <>
      <Flex h="full" flexDirection={'column'}>
        {/* ai模型 */}
        <Flex justifyContent={'space-between'} alignItems={'center'} p={4} borderBottom={'md'}>
          <Box fontSize={'15px'} color={'myBlack.pure'}>
            {t('common:core.ai.Model')}
          </Box>
          <Box>
            <SettingLLMModel
              selectProps={{
                boxShadow: 'none'
              }}
              llmModelType={'all'}
              defaultData={{
                model: appForm.aiSettings.model,
                temperature: appForm.aiSettings.temperature,
                maxToken: appForm.aiSettings.maxToken,
                maxHistories: appForm.aiSettings.maxHistories,
                aiChatReasoning: appForm.aiSettings.aiChatReasoning ?? true,
                aiChatTopP: appForm.aiSettings.aiChatTopP,
                aiChatStopSign: appForm.aiSettings.aiChatStopSign,
                aiChatResponseFormat: appForm.aiSettings.aiChatResponseFormat,
                aiChatJsonSchema: appForm.aiSettings.aiChatJsonSchema
              }}
              onChange={({ maxHistories = 6, ...data }) => {
                setAppForm((state) => ({
                  ...state,
                  aiSettings: {
                    ...state.aiSettings,
                    ...data,
                    maxHistories
                  }
                }));
              }}
            />
          </Box>
        </Flex>
        <Flex flex={'1 0 0'} minH={'0'}>
          {/* 提示词 */}
          <Flex
            flex={'1 0 0'}
            borderRight={'md'}
            px={4}
            py={'10px'}
            h={'full'}
            flexDirection={'column'}
          >
            <HStack {...LabelStyles} w={'100%'} spacing={1} alignItems={'center'} mb={4}>
              <Box>{t('common:core.ai.Prompt')}</Box>
              <QuestionTip label={t('common:core.app.tip.systemPromptTip')} />
              <VariableTip color={'myGray.500'} />

              <Box flex={1} />
              <OptimizerPopover
                triggerComponent={
                  <Button
                    size={'sm'}
                    borderRadius={'12px'}
                    variant={'grayBase'}
                    color={'#1C1C1C'}
                    fontSize={'12px'}
                    fontWeight={400}
                  >
                    <MyIcon name={'dashboard/ai_pref'} w={'14px'} mr={1} />
                    {t('common:core.ai.Optimization')}
                  </Button>
                }
                defaultPrompt={appForm.aiSettings.systemPrompt}
                onChangeText={(e) => {
                  setAppForm((state) => ({
                    ...state,
                    aiSettings: {
                      ...state.aiSettings,
                      systemPrompt: e
                    }
                  }));
                }}
              />
            </HStack>
            <Box flex={1} minH={0} overflowY={'auto'}>
              <PromptEditor
                overflowY={'auto'}
                minH={150}
                maxH={9999}
                value={appForm.aiSettings.systemPrompt}
                bg={'#fff'}
                onChange={(text) => {
                  startTst(() => {
                    setAppForm((state) => ({
                      ...state,
                      aiSettings: {
                        ...state.aiSettings,
                        systemPrompt: text
                      }
                    }));
                  });
                }}
                boxStyle={{
                  border: 'none',
                  padding: 0
                }}
                placeholderPadding={'0'}
                variableLabels={formatVariables}
                variables={formatVariables}
                placeholder={t('common:core.app.tip.systemPromptTip')}
                title={t('common:core.ai.Prompt')}
                // ExtensionPopover={[OptimizerPopverComponent]}
                isRichText={true}
              />
            </Box>
          </Flex>
          <Box flex={'1 0 0'} overflowY={'auto'} h="full">
            <Accordion allowMultiple>
              <Box px={4} py={'14px'} color={'rgba(0, 0, 0, 0.40)'} fontSize={'base'}>
                {t('common:core.app.Knowledge & Skills')}
              </Box>
              {/* 关联知识库 */}
              <AccordionItem {...BoxStyles}>
                {({ isExpanded }) => (
                  <>
                    <AccordionButton alignItems={'center'} p={4}>
                      <Flex alignItems={'center'} flex={1}>
                        <MyIcon
                          name={'arrowRight'}
                          w={'20px'}
                          mr={'10px'}
                          transform={isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}
                          transition={'transform 0.2s'}
                        />
                        <FormLabel color={'myBlack.pure'} fontSize={'15px'}>
                          {t('common:core.dataset.Choose Dataset')}
                        </FormLabel>
                      </Flex>

                      <MyTooltip label={t('common:Params')}>
                        <MyIcon
                          name={'dashboard/link_lib'}
                          w={'15px'}
                          mr={'14px'}
                          onClick={(e) => {
                            e.stopPropagation(); // 阻止冒泡
                            onOpenDatasetParams();
                          }}
                        />
                      </MyTooltip>
                      <MyTooltip label={t('common:Choose')}>
                        <MyIcon
                          name="common/addLight"
                          w={'20px'}
                          onClick={(e) => {
                            e.stopPropagation(); // 阻止冒泡
                            onOpenDatasetSelect();
                          }}
                        />
                      </MyTooltip>
                    </AccordionButton>
                    <AccordionPanel p={4} pt={0}>
                      {appForm.dataset.datasets?.length > 0 && (
                        <Box my={3}>
                          <SearchParamsTip
                            searchMode={appForm.dataset.searchMode}
                            similarity={appForm.dataset.similarity}
                            limit={appForm.dataset.limit}
                            usingReRank={appForm.dataset.usingReRank}
                            usingExtensionQuery={appForm.dataset.datasetSearchUsingExtensionQuery}
                            queryExtensionModel={appForm.dataset.datasetSearchExtensionModel}
                          />
                        </Box>
                      )}
                      <Grid gridTemplateColumns={'repeat(2, minmax(0, 1fr))'} gridGap={[2, 4]}>
                        {selectDatasets.map((item) => (
                          <MyTooltip
                            key={item.datasetId}
                            label={t('common:core.dataset.Read Dataset')}
                          >
                            <Flex
                              overflow={'hidden'}
                              alignItems={'center'}
                              p={2}
                              bg={'#F2F2F2'}
                              // boxShadow={
                              //   '0 4px 8px -2px rgba(16,24,40,.1),0 2px 4px -2px rgba(16,24,40,.06)'
                              // }
                              borderRadius={'8px'}
                              // border={theme.borders.base}
                              cursor={'pointer'}
                              onClick={() =>
                                router.push({
                                  pathname: '/dataset/detail',
                                  query: {
                                    datasetId: item.datasetId
                                  }
                                })
                              }
                            >
                              <Center w={4} h={4} border={'md'} borderRadius={'3px'}>
                                <Avatar src={item.avatar} w={3} h={3} borderRadius={'3px'} />
                              </Center>

                              <Box
                                ml={2}
                                flex={'1 0 0'}
                                w={0}
                                className={'textEllipsis'}
                                fontSize={'base'}
                                color={'#000'}
                              >
                                {item.name}
                              </Box>
                            </Flex>
                          </MyTooltip>
                        ))}
                      </Grid>

                      {!appForm.dataset.datasets?.length && <Empty />}
                    </AccordionPanel>
                  </>
                )}
              </AccordionItem>

              {/* 工具调用 */}
              <AccordionItem {...BoxStyles}>
                {({ isExpanded }) => (
                  <ToolSelect isExpanded={isExpanded} appForm={appForm} setAppForm={setAppForm} />
                )}
              </AccordionItem>

              {/* 文件上传 */}
              <AccordionItem {...BoxStyles}>
                {({ isExpanded }) => (
                  <FileSelectConfig
                    isExpanded={isExpanded}
                    forbidVision={!selectedModel?.vision}
                    value={appForm.chatConfig.fileSelectConfig}
                    onChange={(e) => {
                      setAppForm((state) => ({
                        ...state,
                        chatConfig: {
                          ...state.chatConfig,
                          fileSelectConfig: e
                        }
                      }));
                    }}
                  />
                )}
              </AccordionItem>

              {/* 全局变量 */}
              <AccordionItem {...BoxStyles}>
                {({ isExpanded }) => (
                  <VariableEdit
                    isExpanded={isExpanded}
                    variables={appForm.chatConfig.variables}
                    onChange={(e) => {
                      setAppForm((state) => ({
                        ...state,
                        chatConfig: {
                          ...state.chatConfig,
                          variables: e
                        }
                      }));
                    }}
                  />
                )}
              </AccordionItem>
              <Box px={4} py={'14px'} color={'rgba(0, 0, 0, 0.40)'} fontSize={'base'}>
                {t('common:core.app.Chat Configuration')}
              </Box>
              {/* 对话开场白 */}
              <AccordionItem {...BoxStyles}>
                {({ isExpanded }) => (
                  <WelcomeTextConfig
                    isExpanded={isExpanded}
                    value={appForm.chatConfig.welcomeText}
                    onChange={(e) => {
                      setAppForm((state) => ({
                        ...state,
                        chatConfig: {
                          ...state.chatConfig,
                          welcomeText: e.target.value
                        }
                      }));
                    }}
                  />
                )}
              </AccordionItem>

              {/* 语音播放 */}
              <AccordionItem {...BoxStyles}>
                {({ isExpanded }) => (
                  <TTSSelect
                    isExpanded={isExpanded}
                    value={appForm.chatConfig.ttsConfig}
                    onChange={(e) => {
                      setAppForm((state) => ({
                        ...state,
                        chatConfig: {
                          ...state.chatConfig,
                          ttsConfig: e
                        }
                      }));
                    }}
                  />
                )}
              </AccordionItem>

              {/* 语音输入 */}
              <AccordionItem {...BoxStyles}>
                {({ isExpanded }) => (
                  <WhisperConfig
                    isExpanded={isExpanded}
                    isOpenAudio={appForm.chatConfig.ttsConfig?.type !== TTSTypeEnum.none}
                    value={appForm.chatConfig.whisperConfig}
                    onChange={(e) => {
                      setAppForm((state) => ({
                        ...state,
                        chatConfig: {
                          ...state.chatConfig,
                          whisperConfig: e
                        }
                      }));
                    }}
                  />
                )}
              </AccordionItem>

              {/* 猜你想问 */}
              <AccordionItem {...BoxStyles}>
                {({ isExpanded }) => (
                  <QGConfig
                    isExpanded={isExpanded}
                    value={appForm.chatConfig.questionGuide}
                    onChange={(e) => {
                      setAppForm((state) => ({
                        ...state,
                        chatConfig: {
                          ...state.chatConfig,
                          questionGuide: e
                        }
                      }));
                    }}
                  />
                )}
              </AccordionItem>

              {/* 输入引导 */}
              <AccordionItem {...BoxStyles}>
                {({ isExpanded }) => (
                  <InputGuideConfig
                    isExpanded={isExpanded}
                    appId={appDetail._id}
                    value={appForm.chatConfig.chatInputGuide}
                    onChange={(e) => {
                      setAppForm((state) => ({
                        ...state,
                        chatConfig: {
                          ...state.chatConfig,
                          chatInputGuide: e
                        }
                      }));
                    }}
                  />
                )}
              </AccordionItem>
            </Accordion>
          </Box>
        </Flex>
      </Flex>

      {/* 知识库选择 */}
      {isOpenDatasetSelect && (
        <DatasetSelectModal
          defaultSelectedDatasets={selectDatasets.map((item) => ({
            datasetId: item.datasetId,
            vectorModel: item.vectorModel,
            name: item.name,
            avatar: item.avatar
          }))}
          onClose={onCloseDatasetSelect}
          onChange={(e) => {
            setAppForm((state) => ({
              ...state,
              dataset: {
                ...state.dataset,
                datasets: e
              }
            }));
          }}
        />
      )}

      {/* 知识库参数 */}
      {isOpenDatasetParams && (
        <DatasetParamsModal
          {...appForm.dataset}
          maxTokens={tokenLimit}
          onClose={onCloseDatasetParams}
          onSuccess={(e) => {
            setAppForm((state) => ({
              ...state,
              dataset: {
                ...state.dataset,
                ...e
              }
            }));
          }}
        />
      )}
    </>
  );
};

export default React.memo(EditForm);
