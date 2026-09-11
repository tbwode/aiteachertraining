import type { FlowNodeItemType } from '@fastgpt/global/core/workflow/type/node.d';
import { type Node } from 'reactflow';
import NodeTemplateListHeader from './components/NodeTemplates/header';
import NodeTemplateList from './components/NodeTemplates/list';
import { useNodeTemplates } from './components/NodeTemplates/useNodeTemplates';
import { Box, Flex } from '@chakra-ui/react';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { useMemoizedFn } from 'ahooks';
import React from 'react';
import { XYPosition } from 'reactflow';
import { useContextSelector } from 'use-context-selector';
import { WorkflowBufferDataContext } from '../context/workflowInitContext';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useSystem } from '@fastgpt/web/hooks/useSystem';

type ModuleTemplateListProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const sliderWidth = 356;

const NodeTemplatesModal = ({ isOpen, onClose }: ModuleTemplateListProps) => {
  const setNodes = useContextSelector(WorkflowBufferDataContext, (v) => v.setNodes);
  const { isPc } = useSystem();
  const {
    templateType,
    parentId,
    searchKey,
    setSearchKey,
    templatesIsLoading,
    templates,
    onUpdateTemplateType,
    onUpdateParentId,
    selectedTagIds,
    setSelectedTagIds,
    toolTags
  } = useNodeTemplates();

  const onAddNode = useMemoizedFn(async ({ newNodes }: { newNodes: Node<FlowNodeItemType>[] }) => {
    setNodes((state) => {
      const newState = state
        .map((node) => ({
          ...node,
          selected: false
        }))
        // @ts-ignore
        .concat(newNodes);
      return newState;
    });
  });

  return (
    <>
      <Box
        zIndex={2}
        display={isOpen ? 'block' : 'none'}
        position={'absolute'}
        top={0}
        left={0}
        bottom={0}
        w={`${sliderWidth}px`}
        maxW={'100%'}
        onClick={onClose}
        fontSize={'sm'}
      />
      <MyBox
        isLoading={templatesIsLoading}
        display={'flex'}
        zIndex={3}
        flexDirection={'column'}
        position={'absolute'}
        top={0}
        bottom={0}
        left={0}
        pt={2}
        pb={4}
        w={isOpen ? ['100%', `${sliderWidth}px`] : '0'}
        bg={'#FAFAFA'}
        borderRightColor={'#E5E7EB'}
        borderRightWidth={'1px'}
        transition={'.2s ease'}
        userSelect={'none'}
        overflow={isOpen ? 'visible' : 'hidden'}
        _hover={{
          '& > .close-btn': { visibility: 'visible', opacity: 1 }
        }}
      >
        {/* 把关闭按钮置入此处 */}
        {isPc && (
          <Flex
            position={'absolute'}
            right={'-14px'}
            top={'40px'}
            // transform={isOpen ? 'translateX(50%)' : 'translateX(50%)'}
            alignItems={'center'}
            justifyContent={'center'}
            // pr={1}
            className="close-btn"
            w={!isOpen ? '36px' : '28px'}
            h={!isOpen ? '36px' : '28px'}
            borderRadius={'10px'}
            bg={!isOpen ? '#fff' : '#fcfcfc'}
            cursor={'pointer'}
            transition={'0.2s'}
            border={'1px solid #e6e6e6'}
            zIndex={9}
            {...(!isOpen
              ? {
                  opacity: 1
                }
              : {
                  visibility: 'hidden',
                  opacity: 0
                })}
            onClick={onClose}
          >
            <MyIcon name={!isOpen ? 'menu_open' : 'arrowLeft'} w={'20px'} color={'primary.500'} />
          </Flex>
        )}

        <NodeTemplateListHeader
          onClose={onClose}
          templateType={templateType}
          onUpdateTemplateType={onUpdateTemplateType}
          parentId={parentId}
          searchKey={searchKey}
          setSearchKey={setSearchKey}
          onUpdateParentId={onUpdateParentId}
          selectedTagIds={selectedTagIds}
          setSelectedTagIds={setSelectedTagIds}
          toolTags={toolTags}
        />
        <NodeTemplateList
          onAddNode={onAddNode}
          templates={templates}
          templateType={templateType}
          onUpdateParentId={onUpdateParentId}
        />
      </MyBox>
    </>
  );
};

export default React.memo(NodeTemplatesModal);
