import {
  AccordionButton,
  AccordionPanel,
  Box,
  Center,
  Flex,
  Grid,
  useDisclosure
} from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import React, { useState } from 'react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useTranslation } from 'react-i18next';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import { SmallAddIcon } from '@chakra-ui/icons';
import { type AppSimpleEditFormType } from '@fastgpt/global/core/app/type';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { theme } from '@fastgpt/web/styles/theme';
import DeleteIcon, { hoverDeleteStyles } from '@fastgpt/web/components/common/Icon/delete';
import ToolSelectModal, { childAppSystemKey } from './ToolSelectModal';
import {
  FlowNodeInputTypeEnum,
  FlowNodeTypeEnum
} from '@fastgpt/global/core/workflow/node/constant';
import Avatar from '@fastgpt/web/components/common/Avatar';
import ConfigToolModal from './ConfigToolModal';
import { getWebLLMModel } from '@/web/common/system/utils';
import FormLabel from '@fastgpt/web/components/common/MyBox/FormLabel';
import { formatToolError } from '@fastgpt/global/core/app/utils';
import { PluginStatusEnum, PluginStatusMap } from '@fastgpt/global/core/plugin/type';
import MyTag from '@fastgpt/web/components/common/Tag/index';
import Empty from './Empty';

const ToolSelect = ({
  appForm,
  setAppForm,
  isExpanded
}: {
  appForm: AppSimpleEditFormType;
  setAppForm: React.Dispatch<React.SetStateAction<AppSimpleEditFormType>>;
  isExpanded: boolean;
}) => {
  const { t } = useTranslation();

  const [configTool, setConfigTool] = useState<
    AppSimpleEditFormType['selectedTools'][number] | null
  >(null);

  const {
    isOpen: isOpenToolsSelect,
    onOpen: onOpenToolsSelect,
    onClose: onCloseToolsSelect
  } = useDisclosure();
  const selectedModel = getWebLLMModel(appForm.aiSettings.model);

  return (
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
            {t('common:core.app.Tool call')}
          </FormLabel>
          <QuestionTip ml={1} label={t('app:plugin_dispatch_tip')} />
        </Flex>
        <MyTooltip label={t('common:Choose')}>
          <MyIcon
            name="common/addLight"
            w={'20px'}
            onClick={(e) => {
              e.stopPropagation();
              onOpenToolsSelect();
            }}
          />
        </MyTooltip>
      </AccordionButton>
      <AccordionPanel p={4} pt={0}>
        <Grid
          mt={appForm.selectedTools.length > 0 ? 2 : 0}
          gridTemplateColumns={'repeat(2, minmax(0, 1fr))'}
          gridGap={[2, 3]}
        >
          {appForm.selectedTools.map((item) => {
            const toolError = formatToolError(item.pluginData?.error);
            const status = item.status || item.pluginData?.status;

            return (
              <MyTooltip key={item.id} label={item.intro}>
                <Flex
                  overflow={'hidden'}
                  alignItems={'center'}
                  p={2}
                  bg={'#F2F2F2'}
                  // boxShadow={'0 4px 8px -2px rgba(16,24,40,.1),0 2px 4px -2px rgba(16,24,40,.06)'}
                  borderRadius={'8px'}
                  // border={theme.borders.base}
                  // borderColor={toolError ? 'red.600' : ''}
                  _hover={{
                    ...hoverDeleteStyles,
                    borderColor: toolError ? 'red.600' : 'primary.300'
                  }}
                  cursor={'pointer'}
                  onClick={() => {
                    if (
                      item.inputs
                        .filter((input) => !childAppSystemKey.includes(input.key))
                        .every(
                          (input) =>
                            input.toolDescription ||
                            input.renderTypeList.includes(FlowNodeInputTypeEnum.selectLLMModel) ||
                            input.renderTypeList.includes(FlowNodeInputTypeEnum.fileSelect)
                        ) ||
                      toolError ||
                      item.flowNodeType === FlowNodeTypeEnum.tool ||
                      item.flowNodeType === FlowNodeTypeEnum.toolSet
                    ) {
                      return;
                    }
                    setConfigTool(item);
                  }}
                >
                  <Center w={4} h={4} border={'md'} borderRadius={'3px'}>
                    <Avatar src={item.avatar} w={3} h={3} borderRadius={'3px'} />
                  </Center>

                  <Box
                    flex={'1 0 0'}
                    ml={2}
                    gap={2}
                    className={'textEllipsis'}
                    fontSize={'14px'}
                    color={'myGray.900'}
                    lineHeight={1.5}
                  >
                    {item.name}
                  </Box>
                  {status !== undefined && status !== PluginStatusEnum.Normal && (
                    <MyTooltip label={t(PluginStatusMap[status].tooltip)}>
                      <MyTag
                        mr={2}
                        colorSchema={PluginStatusMap[status].tagColor}
                        type="borderFill"
                      >
                        {t(PluginStatusMap[status].label)}
                      </MyTag>
                    </MyTooltip>
                  )}
                  {toolError && (
                    <Flex
                      bg={'red.50'}
                      alignItems={'center'}
                      h={6}
                      px={2}
                      rounded={'6px'}
                      fontSize={'xs'}
                      fontWeight={'medium'}
                    >
                      <MyIcon name={'common/errorFill'} w={'14px'} mr={1} />
                      <Box color={'red.600'}>{t(toolError as any)}</Box>
                    </Flex>
                  )}
                  <DeleteIcon
                    ml={2}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAppForm((state: AppSimpleEditFormType) => ({
                        ...state,
                        selectedTools: state.selectedTools.filter((tool) => tool.id !== item.id)
                      }));
                    }}
                  />
                </Flex>
              </MyTooltip>
            );
          })}
        </Grid>
        {!appForm.selectedTools.length && <Empty />}
      </AccordionPanel>
      {isOpenToolsSelect && (
        <ToolSelectModal
          selectedTools={appForm.selectedTools}
          chatConfig={appForm.chatConfig}
          selectedModel={selectedModel}
          onAddTool={(e) => {
            setAppForm((state) => ({
              ...state,
              selectedTools: [...state.selectedTools, e]
            }));
          }}
          onRemoveTool={(e) => {
            setAppForm((state) => ({
              ...state,
              selectedTools: state.selectedTools.filter((item) => item.pluginId !== e.id)
            }));
          }}
          onClose={onCloseToolsSelect}
        />
      )}
      {configTool && (
        <ConfigToolModal
          configTool={configTool}
          onCloseConfigTool={() => setConfigTool(null)}
          onAddTool={(e) => {
            setAppForm((state) => ({
              ...state,
              selectedTools: state.selectedTools.map((item) =>
                item.pluginId === configTool.pluginId ? e : item
              )
            }));
          }}
        />
      )}
    </>
  );
};

export default React.memo(ToolSelect);
