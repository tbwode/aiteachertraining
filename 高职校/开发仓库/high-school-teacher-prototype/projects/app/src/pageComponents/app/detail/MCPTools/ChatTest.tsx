import { useChatStore } from '@/web/core/chat/context/useChatStore';
import React, { useEffect, useMemo, useState } from 'react';
import { useContextSelector } from 'use-context-selector';
import { AppContext } from '../context';
import ChatItemContextProvider from '@/web/core/chat/context/chatItemContext';
import ChatRecordContextProvider from '@/web/core/chat/context/chatRecordContext';
import { Box, Flex, HStack } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import { cardStyles } from '../constants';
import { useTranslation } from 'react-i18next';
import { type McpToolConfigType } from '@fastgpt/global/core/app/tool/mcpTool/type';
import { useForm } from 'react-hook-form';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import Markdown from '@/components/Markdown';
import { postRunMCPTool } from '@/web/core/app/api/tool';
import { type StoreSecretValueType } from '@fastgpt/global/common/secret/type';
import { valueTypeToInputType } from '@/components/core/app/formRender/utils';
import { getNodeInputTypeFromSchemaInputType } from '@fastgpt/global/core/app/jsonschema';
import LabelAndFormRender from '@/components/core/app/formRender/LabelAndForm';
import FormLabel from '@fastgpt/web/components/common/MyBox/FormLabel';
import ValueTypeLabel from '../WorkflowComponents/Flow/nodes/render/ValueTypeLabel';
import { valueTypeFormat } from '@fastgpt/global/core/workflow/runtime/utils';

const ChatTest = ({
  currentTool,
  url,
  headerSecret
}: {
  currentTool?: McpToolConfigType;
  url: string;
  headerSecret: StoreSecretValueType;
}) => {
  const { t } = useTranslation();

  const [output, setOutput] = useState<string>('');
  const [paramType, setParamType] = useState<'input' | 'output'>('input');
  const controlStyle = {
    px: 4,
    py: 2,
    fontSize: '12px',
    borderRadius: '24px',
    cursor: 'pointer'
  };

  const form = useForm();
  const { handleSubmit, reset } = form;

  useEffect(() => {
    reset({});
    setOutput('');
  }, [currentTool, reset]);

  const { runAsync: runTool, loading: isRunning } = useRequest2(
    async (data: Record<string, any>) => {
      if (!currentTool) return;

      // Format type
      Object.entries(currentTool?.inputSchema.properties || {}).forEach(
        ([paramName, paramInfo]) => {
          const valueType = getNodeInputTypeFromSchemaInputType({
            type: paramInfo.type,
            arrayItems: paramInfo.items
          });
          if (data[paramName] !== undefined) {
            data[paramName] = valueTypeFormat(data[paramName], valueType);
          }
        }
      );

      return await postRunMCPTool({
        params: data,
        url,
        headerSecret,
        toolName: currentTool.name
      });
    },
    {
      onSuccess: (res) => {
        try {
          const resStr = JSON.stringify(res, null, 2);
          setOutput(resStr);
        } catch (error) {
          console.error(error);
        }
      }
    }
  );

  return (
    <Flex h={'full'} gap={2}>
      <Box
        flex={'1 0 0'}
        w={0}
        display={'flex'}
        position={'relative'}
        flexDirection={'column'}
        h={'full'}
        py={4}
        {...cardStyles}
        boxShadow={'3'}
      >
        <Flex px={[2, 5]} pb={2}>
          <Box fontSize={['md', '15px']} fontWeight={'bold'} color={'#1C1C1C'} mr={3}>
            {t('app:chat_debug')}
          </Box>
          <Box flex={1} />
        </Flex>
        {/* 选择以控制显示输入输出 */}
        <Flex px={5} mb={3}>
          <Flex fontSize={'28px'} bg={'#F4F4F5'} p={'2px'} borderRadius={'24px'}>
            <Box
              color={paramType === 'input' ? '#18181B' : '#71717A'}
              bg={paramType === 'input' ? '#fff' : 'transparent'}
              {...controlStyle}
              onClick={() => setParamType('input')}
            >
              {t('common:Input')}
            </Box>
            {/* {output && ( */}
            <Box
              color={paramType === 'output' ? '#18181B' : '#71717A'}
              bg={paramType === 'output' ? '#fff' : 'transparent'}
              {...controlStyle}
              onClick={() => setParamType('output')}
            >
              {t('common:Output')}
            </Box>
            {/* )} */}
          </Flex>
        </Flex>
        <Box flex={1} px={[2, 5]} overflow={'auto'}>
          {paramType === 'input' && (
            <>
              {Object.keys(currentTool?.inputSchema.properties || {}).length > 0 && (
                <>
                  {/* <Box color={'myGray.900'} fontSize={'16px'} fontWeight={'medium'} mb={3}>
                    {t('common:Input')}
                  </Box> */}
                  <Box border={'1px solid'} borderColor={'myGray.200'} borderRadius={'8px'} p={6}>
                    {Object.entries(currentTool?.inputSchema.properties || {}).map(
                      ([paramName, paramInfo]) => {
                        const inputType = valueTypeToInputType(
                          getNodeInputTypeFromSchemaInputType({ type: paramInfo.type })
                        );
                        const required = currentTool?.inputSchema.required?.includes(paramName);

                        return (
                          <LabelAndFormRender
                            label={
                              <HStack spacing={0} mr={2}>
                                <FormLabel required={required}>{paramName}</FormLabel>
                                <ValueTypeLabel
                                  valueType={getNodeInputTypeFromSchemaInputType({
                                    type: paramInfo.type,
                                    arrayItems: paramInfo.items
                                  })}
                                  h={'auto'}
                                />
                              </HStack>
                            }
                            required={required}
                            key={paramName}
                            inputType={inputType}
                            form={form}
                            fieldName={paramName}
                            placeholder={paramInfo.description}
                          />
                        );
                      }
                    )}
                  </Box>
                </>
              )}

              <Button mt={3} isLoading={isRunning} onClick={handleSubmit(runTool)}>
                {t('common:Run')}
              </Button>
            </>
          )}

          {paramType === 'output' && output && (
            <>
              {/* <Box color={'myGray.900'} fontSize={'16px'} fontWeight={'medium'} mb={3} mt={8}>
                {t('common:Output')}
              </Box> */}
              <Box>
                <Markdown source={`~~~json\n${output}`} />
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Flex>
  );
};

const Render = ({
  currentTool,
  url,
  headerSecret
}: {
  currentTool?: McpToolConfigType;
  url: string;
  headerSecret: StoreSecretValueType;
}) => {
  const { chatId } = useChatStore();
  const { appDetail } = useContextSelector(AppContext, (v) => v);

  const chatRecordProviderParams = useMemo(
    () => ({
      chatId: chatId,
      appId: appDetail._id
    }),
    [appDetail._id, chatId]
  );

  return (
    <ChatItemContextProvider
      showRouteToDatasetDetail={true}
      canDownloadSource={true}
      isShowCite={true}
      isShowFullText={true}
      showRunningStatus={true}
      showWholeResponse={true}
    >
      <ChatRecordContextProvider params={chatRecordProviderParams}>
        <ChatTest currentTool={currentTool} url={url} headerSecret={headerSecret} />
      </ChatRecordContextProvider>
    </ChatItemContextProvider>
  );
};

export default React.memo(Render);
