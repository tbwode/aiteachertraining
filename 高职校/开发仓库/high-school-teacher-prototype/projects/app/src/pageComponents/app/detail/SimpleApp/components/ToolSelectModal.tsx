import React, { useCallback, useState, useMemo } from 'react';

import MyModal from '@fastgpt/web/components/common/MyModal';
import { useTranslation } from 'react-i18next';
import { parseI18nString } from '@fastgpt/global/common/i18n/utils';
import { Box, Center, Flex, Grid, IconButton } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import FillRowTabs from '@fastgpt/web/components/common/Tabs/FillRowTabs';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import EmptyTip from '@fastgpt/web/components/common/EmptyTip';
import {
  type FlowNodeTemplateType,
  type NodeTemplateListItemType
} from '@fastgpt/global/core/workflow/type/node.d';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { getToolPreviewNode, getAppToolTemplates, getAppToolPaths } from '@/web/core/app/api/tool';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { getTeamAppTemplates } from '@/web/core/app/api/tool';
import { type ParentIdType } from '@fastgpt/global/common/parentFolder/type';
// import { getAppFolderPath } from '@/web/core/app/api/app';
// import FolderPath from '@/components/common/folder/Path';
// import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { NodeInputKeyEnum, NodeOutputKeyEnum } from '@fastgpt/global/core/workflow/constants';
import { useContextSelector } from 'use-context-selector';
import { AppContext } from '../../context';
import SearchInput from '@fastgpt/web/components/common/Input/SearchInput';
// import { useMemoizedFn } from 'ahooks';
import MyAvatar from '@fastgpt/web/components/common/Avatar';
import { FlowNodeInputTypeEnum } from '@fastgpt/global/core/workflow/node/constant';
import { type AppSimpleEditFormType } from '@fastgpt/global/core/app/type';
import { useToast } from '@fastgpt/web/hooks/useToast';
import type { LLMModelItemType } from '@fastgpt/global/core/ai/model.d';
import { workflowStartNodeId } from '@/web/core/app/constants';
import ConfigToolModal from './ConfigToolModal';
import CostTooltip from '@/components/core/app/tool/CostTooltip';
import { useSafeTranslation } from '@fastgpt/web/hooks/useSafeTranslation';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import ClassifyList from './ClassifyList';
import { getPluginToolTags } from '@/web/core/plugin/toolTag/api';
import { types } from 'util';
import { useRouter } from 'next/router';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';

type Props = {
  selectedTools: FlowNodeTemplateType[];
  chatConfig: AppSimpleEditFormType['chatConfig'];
  selectedModel: LLMModelItemType;
  onAddTool: (tool: FlowNodeTemplateType) => void;
  onRemoveTool: (tool: NodeTemplateListItemType) => void;
};

export const childAppSystemKey: string[] = [
  NodeInputKeyEnum.forbidStream,
  NodeInputKeyEnum.history,
  NodeInputKeyEnum.historyMaxAmount,
  NodeInputKeyEnum.userChatInput
];

enum TemplateTypeEnum {
  'systemTools' = 'systemTools',
  'myTools' = 'myTools',
  'agent' = 'agent'
}

type TreeNodeType = NodeTemplateListItemType & {
  children?: TreeNodeType[];
};

const ToolSelectModal = ({ onClose, ...props }: Props & { onClose: () => void }) => {
  const { t } = useTranslation();
  const { appDetail } = useContextSelector(AppContext, (v) => v);

  const [templateType, setTemplateType] = useState(TemplateTypeEnum.systemTools);
  const [searchKey, setSearchKey] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const {
    data: rawTemplates = [],
    runAsync: loadTemplates,
    loading: isLoading
  } = useRequest2(
    async ({
      type = templateType,
      searchVal = searchKey
    }: {
      type?: TemplateTypeEnum;
      searchVal?: string;
    }) => {
      if (type === TemplateTypeEnum.systemTools) {
        return getAppToolTemplates({ parentId: '', searchKey: searchVal });
      } else if (type === TemplateTypeEnum.myTools) {
        return getTeamAppTemplates({
          parentId: '',
          searchKey: searchVal,
          type: [
            AppTypeEnum.toolFolder,
            AppTypeEnum.workflowTool,
            AppTypeEnum.mcpToolSet,
            AppTypeEnum.httpToolSet
          ]
        }).then((res) => res.filter((app) => app.id !== appDetail._id));
      } else if (type === TemplateTypeEnum.agent) {
        return getTeamAppTemplates({
          parentId: '',
          searchKey: searchVal,
          type: [AppTypeEnum.folder, AppTypeEnum.simple, AppTypeEnum.workflow]
        }).then((res) => res.filter((app) => app.id !== appDetail._id));
      }
    },
    {
      onSuccess(_, [{ type = templateType }]) {
        setTemplateType(type);
      },
      refreshDeps: [templateType, searchKey],
      errorToast: t('common:core.module.templates.Load plugin error')
    }
  );

  const templates = useMemo(() => {
    // 未选择或者不是系统工具，返回所有模板
    if (selectedTagIds.length === 0 || templateType !== TemplateTypeEnum.systemTools) {
      return rawTemplates;
    }
    return rawTemplates.filter((template) => {
      // @ts-ignore
      return template.tags?.some((tag) => selectedTagIds.includes(tag));
    });
  }, [rawTemplates, selectedTagIds, templateType]);

  const { data: allTags = [] } = useRequest2(getPluginToolTags, {
    manual: false
  });

  useRequest2(() => loadTemplates({ searchVal: searchKey }), {
    manual: false,
    throttleWait: 300,
    refreshDeps: [searchKey]
  });

  return (
    <MyModal
      isOpen
      // title={t('common:core.app.Tool call')}
      // iconSrc="core/app/toolCall"
      onClose={onClose}
      maxW={['90vw', '1100px']}
      w={'1100px'}
      h={['90vh', '80vh']}
    >
      <Flex h={'full'}>
        <Flex
          h={'full'}
          p={'18px'}
          w={'280px'}
          flexShrink={0}
          bg="#F4F4F4"
          flexDirection={'column'}
        >
          {/* 标题 */}
          <Box color={'myBlack.pure'} fontSize={'20px'} fontWeight={'500'} marginBottom={'14px'}>
            {t('common:core.app.Tool call')}
          </Box>
          {/* 搜索框 */}
          <SearchInput
            borderRadius={'12px'}
            border={'none'}
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            placeholder={
              templateType === TemplateTypeEnum.systemTools
                ? t('common:search_tool')
                : t('app:search_app')
            }
          />
          {/* tab */}
          <FillRowTabs
            mt={4}
            list={[
              {
                icon: 'common/app',
                label: t('app:core.module.template.System Tools'),
                value: TemplateTypeEnum.systemTools
              },
              {
                icon: 'core/app/type/plugin',
                label: t('common:navbar.Tools'),
                value: TemplateTypeEnum.myTools
              },
              {
                icon: 'core/chat/sidebar/star',
                label: 'Agent',
                value: TemplateTypeEnum.agent
              }
            ]}
            py={'4px'}
            px={'15px'}
            fontSize={'13px'}
            bg={'#E9E9E9'}
            value={templateType}
            onChange={(e) =>
              loadTemplates({
                type: e as TemplateTypeEnum
              })
            }
          />
          {/* 分类 */}
          {templateType === TemplateTypeEnum.systemTools && allTags.length > 0 && (
            <Flex mt={2} flex={'1 0 0'} minH={'0'} flexDirection={'column'}>
              <Box color={'#7A7A7A'} fontSize={'12px'} mb={2}>
                {t('app:type.Tool')}
                {t('common:user.type')}
              </Box>
              <ClassifyList
                tags={allTags}
                selectedTagIds={selectedTagIds}
                onTagSelect={setSelectedTagIds}
                size="sm"
              />
            </Flex>
          )}
        </Flex>
        {/* 右侧数据 */}
        <Flex px={5} py={6} flexDirection={'column'} flex={'1'} minW={'0'}>
          <MyBox isLoading={isLoading} mt={1} pb={3} flex={'1 0 0'} h={0}>
            <Box overflow={'overlay'} height={'100%'}>
              <RenderList
                templates={templates}
                type={templateType}
                appDetail={appDetail}
                {...props}
              />
            </Box>
          </MyBox>
        </Flex>
      </Flex>
    </MyModal>
  );
};

export default React.memo(ToolSelectModal);

const RenderList = React.memo(function RenderList({
  templates,
  type,
  onAddTool,
  onRemoveTool,
  selectedTools,
  chatConfig,
  appDetail
}: Props & {
  templates: NodeTemplateListItemType[];
  type: TemplateTypeEnum;
  appDetail: any;
}) {
  const { i18n } = useTranslation();
  const { t } = useSafeTranslation();
  const { feConfigs } = useSystemStore();
  const router = useRouter();

  const [configTool, setConfigTool] = useState<FlowNodeTemplateType>();
  const onCloseConfigTool = useCallback(() => setConfigTool(undefined), []);
  const { toast } = useToast();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [treeData, setTreeData] = useState<TreeNodeType[]>([]);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  // Sync templates to treeData when templates change (e.g. initial load or search)
  useMemo(() => {
    setTreeData(templates as TreeNodeType[]);
  }, [templates]);

  const { runAsync: onClickAdd, loading: isAdding } = useRequest2(
    async (template: NodeTemplateListItemType) => {
      const res = await getToolPreviewNode({ appId: template.id });

      /* Invalid plugin check
        1. Reference type. but not tool description;
        2. Has dataset select
        3. Has dynamic external data
      */
      const oneFileInput =
        res.inputs.filter((input) =>
          input.renderTypeList.includes(FlowNodeInputTypeEnum.fileSelect)
        ).length === 1;
      const canUploadFile =
        chatConfig?.fileSelectConfig?.canSelectFile || chatConfig?.fileSelectConfig?.canSelectImg;
      const invalidFileInput = oneFileInput && !!canUploadFile;
      if (
        res.inputs.some(
          (input) =>
            (input.renderTypeList.length === 1 &&
              input.renderTypeList[0] === FlowNodeInputTypeEnum.reference &&
              !input.toolDescription) ||
            input.renderTypeList.includes(FlowNodeInputTypeEnum.selectDataset) ||
            input.renderTypeList.includes(FlowNodeInputTypeEnum.addInputParam) ||
            (input.renderTypeList.includes(FlowNodeInputTypeEnum.fileSelect) && !invalidFileInput)
        )
      ) {
        return toast({
          title: t('app:simple_tool_tips'),
          status: 'warning'
        });
      }

      // 判断是否可以直接添加工具,满足以下任一条件:
      // 1. 有工具描述
      // 2. 是模型选择类型
      // 3. 是文件上传类型且:已开启文件上传、非必填、只有一个文件上传输入
      const hasInputForm =
        res.inputs.length > 0 &&
        res.inputs.some((input) => {
          if (input.toolDescription) {
            return false;
          }
          if (input.key === NodeInputKeyEnum.forbidStream) {
            return false;
          }
          if (input.key === NodeInputKeyEnum.systemInputConfig) {
            return true;
          }

          // Check if input has any of the form render types
          const formRenderTypes = [
            FlowNodeInputTypeEnum.input,
            FlowNodeInputTypeEnum.textarea,
            FlowNodeInputTypeEnum.numberInput,
            FlowNodeInputTypeEnum.switch,
            FlowNodeInputTypeEnum.select,
            FlowNodeInputTypeEnum.JSONEditor
          ];

          return formRenderTypes.some((type) => input.renderTypeList.includes(type));
        });

      // 构建默认表单数据
      const defaultForm = {
        ...res,
        inputs: res.inputs.map((input) => {
          // 如果是文件上传类型,设置为从工作流开始节点获取用户文件
          if (input.renderTypeList.includes(FlowNodeInputTypeEnum.fileSelect)) {
            return {
              ...input,
              value: [[workflowStartNodeId, NodeOutputKeyEnum.userFiles]]
            };
          }
          return input;
        })
      };

      if (hasInputForm) {
        setConfigTool(defaultForm);
      } else {
        onAddTool(defaultForm);
      }
    },
    {
      errorToast: t('common:core.module.templates.Load plugin error')
    }
  );

  const handleExpand = useCallback(
    async (node: TreeNodeType) => {
      const isExpanded = expandedIds.has(node.id);
      const newExpandedIds = new Set(expandedIds);

      if (isExpanded) {
        newExpandedIds.delete(node.id);
        setExpandedIds(newExpandedIds);
      } else {
        newExpandedIds.add(node.id);
        setExpandedIds(newExpandedIds);

        // Fetch children if not already present
        if (!node.children) {
          setLoadingIds((prev) => new Set(prev).add(node.id));
          try {
            let children: NodeTemplateListItemType[] = [];
            if (type === TemplateTypeEnum.systemTools) {
              children = await getAppToolTemplates({ parentId: node.id });
            } else if (type === TemplateTypeEnum.myTools) {
              children = await getTeamAppTemplates({
                parentId: node.id,
                type: [
                  AppTypeEnum.toolFolder,
                  AppTypeEnum.workflowTool,
                  AppTypeEnum.mcpToolSet,
                  AppTypeEnum.httpToolSet
                ]
              }).then((res) => res.filter((app) => app.id !== appDetail._id));
            } else if (type === TemplateTypeEnum.agent) {
              children = await getTeamAppTemplates({
                parentId: node.id,
                type: [AppTypeEnum.folder, AppTypeEnum.simple, AppTypeEnum.workflow]
              }).then((res) => res.filter((app) => app.id !== appDetail._id));
            }

            // Update treeData recursively
            const updateChildren = (list: TreeNodeType[]): TreeNodeType[] => {
              return list.map((item) => {
                if (item.id === node.id) {
                  return { ...item, children: children as TreeNodeType[] };
                }
                if (item.children) {
                  return { ...item, children: updateChildren(item.children) };
                }
                return item;
              });
            };

            setTreeData((prev) => updateChildren(prev));
          } catch (error) {
            console.error(error);
          } finally {
            setLoadingIds((prev) => {
              const newSet = new Set(prev);
              newSet.delete(node.id);
              return newSet;
            });
          }
        }
      }
    },
    [expandedIds, type, appDetail._id]
  );

  const ToolItem = useCallback(
    ({ item, level = 0 }: { item: TreeNodeType; level?: number }) => {
      const selected = selectedTools.some((tool) => tool.pluginId === item.id);
      const isSystemTool = type === TemplateTypeEnum.systemTools;
      const isExpanded = expandedIds.has(item.id);
      const isLoadingChildren = loadingIds.has(item.id);
      const canExpand = item.flowNodeType === 'toolSet' || item.isFolder;

      return (
        <Box key={item.id}>
          <Flex
            alignItems={'center'}
            p={5}
            _hover={{ bg: 'myWhite.600' }}
            // borderRadius={'sm'}
            borderBottom={level === 0 ? 'base' : 'none'}
            ml={`${level * 20}px`}
          >
            <Center mr={3} w={6} h={6} border={'base'} borderRadius={'8px'} overflow={'hidden'}>
              <MyAvatar
                src={item.avatar}
                w={5}
                h={5}
                objectFit={'cover'}
                borderRadius={'8px'}
                flexShrink={0}
              />
            </Center>
            <Box flex={'1 0 0'} mr={3}>
              <Flex alignItems={'center'}>
                <Box color={'myBlack.pure'} fontWeight={'500'} fontSize={'15px'}>
                  {t(parseI18nString(item.name, i18n.language))}
                </Box>
                {isSystemTool && (
                  <Box ml={2} fontSize={'xs'} color={'myGray.500'}>
                    By {item.author || feConfigs?.systemTitle}
                  </Box>
                )}
              </Flex>
              <Box fontSize={'xs'} color={'myGray.500'} noOfLines={1}>
                {t(parseI18nString(item.intro || '', i18n.language)) ||
                  t('common:core.workflow.Not intro')}
              </Box>
            </Box>

            {selected ? (
              <Button
                variant={'whiteBase'}
                // leftIcon={<MyIcon name={'delete'} w={'16px'} mr={-1} />}
                onClick={() => onRemoveTool(item)}
                size={'base'}
                color={'myBlack.pure'}
                px={3}
              >
                {t('common:Remove')}
              </Button>
            ) : (
              <Flex gap={2}>
                {(!canExpand || item.flowNodeType === 'toolSet') && (
                  <Button
                    variant={'whiteBase'}
                    isLoading={isAdding}
                    onClick={() => onClickAdd(item)}
                    size={'base'}
                    px={3}
                    color={'#165DFF'}
                    borderColor={'primary.300'}
                  >
                    {t('common:Add')}
                  </Button>
                )}
                {canExpand && (
                  <IconButton
                    icon={
                      <MyIcon
                        name={'arrowRight'}
                        w={'18px'}
                        transform={isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}
                      />
                    }
                    variant={'unstyled'}
                    aria-label={isExpanded ? t('common:Close') : t('common:Open')}
                    onClick={() => handleExpand(item)}
                    size={'xs'}
                    p={1}
                    isLoading={isLoadingChildren}
                    minW={'auto'}
                    h={'auto'}
                    display={'flex'}
                    alignItems={'center'}
                    justifyContent={'center'}
                    _hover={{ color: 'primary.600' }}
                  />
                )}
              </Flex>
            )}
          </Flex>
          {isExpanded && item.children && (
            <Box mt={2}>
              {item.children.map((child) => (
                <ToolItem key={child.id} item={child} level={level + 1} />
              ))}
            </Box>
          )}
        </Box>
      );
    },
    [
      selectedTools,
      type,
      expandedIds,
      loadingIds,
      isAdding,
      t,
      i18n.language,
      feConfigs?.systemTitle,
      onRemoveTool,
      handleExpand,
      onClickAdd
    ]
  );

  return (
    <Flex position="relative" direction="column" h="100%">
      {type === TemplateTypeEnum.systemTools && (
        <Flex
          alignItems="center"
          cursor="pointer"
          _hover={{
            color: 'primary.600'
          }}
          onClick={() => router.push('/plugin/tool')}
          gap={1}
          top={0}
          left={[3, 5]}
          position="absolute"
          zIndex={2}
        >
          <Box fontSize="sm">{t('app:find_more_tools')}</Box>
          <MyIcon name="common/rightArrowLight" w="0.9rem" />
        </Flex>
      )}
      <Box overflowY="auto" mt={8} w={'full'}>
        {treeData.length > 0 ? (
          treeData.map((item) => <ToolItem key={item.id} item={item} />)
        ) : (
          <EmptyTip text={t('app:module.No Modules')} />
        )}
      </Box>

      {!!configTool && (
        <ConfigToolModal
          configTool={configTool}
          onCloseConfigTool={onCloseConfigTool}
          onAddTool={onAddTool}
        />
      )}
    </Flex>
  );
});
