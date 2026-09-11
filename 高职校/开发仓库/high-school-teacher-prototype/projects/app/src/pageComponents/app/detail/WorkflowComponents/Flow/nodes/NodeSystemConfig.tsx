import React, { type Dispatch, useCallback, useMemo } from 'react';
import { type NodeProps, useViewport } from 'reactflow';
import { Box, Accordion, AccordionItem } from '@chakra-ui/react';
import { type FlowNodeItemType } from '@fastgpt/global/core/workflow/type/node.d';

import QGConfig from '@/components/core/app/QGConfig';
import TTSSelect from '@/components/core/app/TTSSelect';
import WhisperConfig from '@/components/core/app/WhisperConfig';
import InputGuideConfig from '@/components/core/app/InputGuideConfig';
import { getAppChatConfig } from '@fastgpt/global/core/workflow/utils';
import { TTSTypeEnum } from '@/web/core/app/constants';
import NodeCard from './render/NodeCard';
import ScheduledTriggerConfig from '@/components/core/app/ScheduledTriggerConfig';
import { useContextSelector } from 'use-context-selector';
import { WorkflowBufferDataContext } from '../../context/workflowInitContext';
import {
  type AppChatConfigType,
  type AppDetailType,
  type VariableItemType
} from '@fastgpt/global/core/app/type';
import VariableEdit from '@/components/core/app/VariableEdit';
import { AppContext } from '@/pageComponents/app/detail/context';
import WelcomeTextConfig from '@/components/core/app/WelcomeTextConfig';
import FileSelect from '@/components/core/app/FileSelect';
import { userFilesInput } from '@fastgpt/global/core/workflow/template/system/workflowStart';
import Container from '../components/Container';
import AutoExecConfig from '@/components/core/app/AutoExecConfig';
import { WorkflowActionsContext } from '../../context/workflowActionsContext';

type ComponentProps = {
  chatConfig: AppChatConfigType;
  setAppDetail: Dispatch<React.SetStateAction<AppDetailType>>;
  isExpanded?: boolean;
};

const NodeUserGuide = ({ data, selected }: NodeProps<FlowNodeItemType>) => {
  const appDetail = useContextSelector(AppContext, (v) => v.appDetail);
  const setAppDetail = useContextSelector(AppContext, (v) => v.setAppDetail);

  const chatConfig = useMemo<AppChatConfigType>(() => {
    return getAppChatConfig({
      chatConfig: appDetail.chatConfig,
      systemConfigNode: data,
      isPublicFetch: true
    });
  }, [data, appDetail.chatConfig]);

  const componentsProps = useMemo(
    () => ({
      chatConfig,
      setAppDetail
    }),
    [chatConfig, setAppDetail]
  );

  return (
    <>
      <NodeCard
        selected={selected}
        menuForbid={{
          debug: true,
          copy: true,
          delete: true
        }}
        {...data}
      >
        <Container>
          {/* 这个地方由于 组件内部被修改了 导致的无奈改动 后续有需要再说 */}
          <Accordion allowMultiple defaultIndex={[0, 1, 2, 3, 4, 5]} border={'transparent'}>
            <AccordionItem border={'none'}>
              {({ isExpanded }) => <WelcomeText {...componentsProps} isExpanded={isExpanded} />}
            </AccordionItem>
            <AccordionItem mt={2} pt={2} border={'none'}>
              {({ isExpanded }) => (
                <ChatStartVariable {...componentsProps} isExpanded={isExpanded} />
              )}
            </AccordionItem>
            <AccordionItem mt={3} pt={3} borderTop={'base'} borderColor={'myGray.200'}>
              {({ isExpanded }) => (
                <FileSelectConfig {...componentsProps} isExpanded={isExpanded} />
              )}
            </AccordionItem>
            <AccordionItem mt={3} pt={3} borderTop={'base'} borderColor={'myGray.200'}>
              {({ isExpanded }) => <TTSGuide {...componentsProps} isExpanded={isExpanded} />}
            </AccordionItem>
            <AccordionItem mt={3} pt={3} borderTop={'base'} borderColor={'myGray.200'}>
              {({ isExpanded }) => <WhisperGuide {...componentsProps} isExpanded={isExpanded} />}
            </AccordionItem>
            <AccordionItem mt={3} pt={4} borderTop={'base'} borderColor={'myGray.200'}>
              {({ isExpanded }) => <QuestionGuide {...componentsProps} isExpanded={isExpanded} />}
            </AccordionItem>
          </Accordion>

          <Box mt={4} pt={3} borderTop={'base'} borderColor={'myGray.200'}>
            <ScheduledTrigger {...componentsProps} />
          </Box>
          <Box mt={3} pt={3} borderTop={'base'} borderColor={'myGray.200'}>
            <AutoExecute {...componentsProps} />
          </Box>

          <Accordion allowMultiple defaultIndex={[0]} border={'transparent'}>
            <AccordionItem mt={3} pt={3} borderTop={'base'} borderColor={'myGray.200'}>
              {({ isExpanded }) => (
                <QuestionInputGuide {...componentsProps} isExpanded={isExpanded} />
              )}
            </AccordionItem>
          </Accordion>
        </Container>
      </NodeCard>
    </>
  );
};

export default React.memo(NodeUserGuide);

function WelcomeText({ chatConfig: { welcomeText }, setAppDetail, isExpanded }: ComponentProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setAppDetail((state) => ({
        ...state,
        chatConfig: {
          ...state.chatConfig,
          welcomeText: e.target.value
        }
      }));
    },
    [setAppDetail]
  );

  return (
    <Box className="nodrag">
      <WelcomeTextConfig
        resize={'both'}
        value={welcomeText}
        onChange={handleChange}
        isExpanded={isExpanded}
      />
    </Box>
  );
}

function ChatStartVariable({
  chatConfig: { variables = [] },
  setAppDetail,
  isExpanded
}: ComponentProps) {
  const updateVariables = useCallback(
    (value: VariableItemType[]) => {
      setAppDetail((state) => ({
        ...state,
        chatConfig: {
          ...state.chatConfig,
          variables: value
        }
      }));
    },
    [setAppDetail]
  );
  const { zoom } = useViewport();

  return (
    <VariableEdit
      variables={variables}
      onChange={(e) => updateVariables(e)}
      zoom={zoom}
      isExpanded={!!isExpanded}
    />
  );
}

function AutoExecute({ chatConfig: { autoExecute }, setAppDetail }: ComponentProps) {
  return (
    <AutoExecConfig
      value={autoExecute}
      onChange={(e) =>
        setAppDetail((state) => ({
          ...state,
          chatConfig: {
            ...state.chatConfig,
            autoExecute: e
          }
        }))
      }
    />
  );
}

function QuestionGuide({
  chatConfig: { questionGuide },
  setAppDetail,
  isExpanded
}: ComponentProps) {
  return (
    <QGConfig
      value={questionGuide}
      isExpanded={!!isExpanded}
      onChange={(e) => {
        setAppDetail((state) => ({
          ...state,
          chatConfig: {
            ...state.chatConfig,
            questionGuide: e
          }
        }));
      }}
    />
  );
}

function TTSGuide({ chatConfig: { ttsConfig }, setAppDetail, isExpanded }: ComponentProps) {
  return (
    <TTSSelect
      value={ttsConfig}
      isExpanded={isExpanded}
      onChange={(e) => {
        setAppDetail((state) => ({
          ...state,
          chatConfig: {
            ...state.chatConfig,
            ttsConfig: e
          }
        }));
      }}
    />
  );
}

function WhisperGuide({
  chatConfig: { whisperConfig, ttsConfig },
  setAppDetail,
  isExpanded
}: ComponentProps) {
  return (
    <WhisperConfig
      isOpenAudio={ttsConfig?.type !== TTSTypeEnum.none}
      value={whisperConfig}
      isExpanded={!!isExpanded}
      onChange={(e) => {
        setAppDetail((state) => ({
          ...state,
          chatConfig: {
            ...state.chatConfig,
            whisperConfig: e
          }
        }));
      }}
    />
  );
}

function ScheduledTrigger({
  chatConfig: { scheduledTriggerConfig },
  setAppDetail
}: ComponentProps) {
  return (
    <ScheduledTriggerConfig
      value={scheduledTriggerConfig}
      onChange={(e) => {
        setAppDetail((state) => ({
          ...state,
          chatConfig: {
            ...state.chatConfig,
            scheduledTriggerConfig: e
          }
        }));
      }}
    />
  );
}

function QuestionInputGuide({
  chatConfig: { chatInputGuide },
  setAppDetail,
  isExpanded
}: ComponentProps) {
  const appId = useContextSelector(AppContext, (v) => v.appDetail._id);
  return appId ? (
    <InputGuideConfig
      appId={appId}
      value={chatInputGuide}
      isExpanded={!!isExpanded}
      onChange={(e) => {
        setAppDetail((state) => ({
          ...state,
          chatConfig: {
            ...state.chatConfig,
            chatInputGuide: e
          }
        }));
      }}
    />
  ) : null;
}

function FileSelectConfig({
  chatConfig: { fileSelectConfig },
  setAppDetail,
  isExpanded
}: ComponentProps) {
  const onChangeNode = useContextSelector(WorkflowActionsContext, (v) => v.onChangeNode);
  const workflowStartNode = useContextSelector(
    WorkflowBufferDataContext,
    (v) => v.workflowStartNode
  );

  if (!workflowStartNode) return null;

  return (
    <FileSelect
      value={fileSelectConfig}
      isExpanded={!!isExpanded}
      onChange={(e) => {
        setAppDetail((state) => ({
          ...state,
          chatConfig: {
            ...state.chatConfig,
            fileSelectConfig: e
          }
        }));

        // Dynamic add or delete userFilesInput
        const canUploadFiles = e.canSelectFile || e.canSelectImg;
        const repeatKey = workflowStartNode.outputs.find((item) => item.key === userFilesInput.key);
        if (canUploadFiles) {
          !repeatKey &&
            onChangeNode({
              nodeId: workflowStartNode.nodeId,
              type: 'addOutput',
              value: userFilesInput
            });
        } else {
          repeatKey &&
            onChangeNode({
              nodeId: workflowStartNode.nodeId,
              type: 'delOutput',
              key: userFilesInput.key
            });
        }
      }}
    />
  );
}
