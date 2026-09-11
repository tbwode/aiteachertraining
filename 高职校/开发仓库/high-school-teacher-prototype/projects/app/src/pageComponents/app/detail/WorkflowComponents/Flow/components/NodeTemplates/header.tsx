import type { Dispatch, SetStateAction } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Tab,
  TabIndicator,
  TabList,
  Tabs
} from '@chakra-ui/react';
import FillRowTabs from '@fastgpt/web/components/common/Tabs/FillRowTabs';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useTranslation } from 'react-i18next';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { useRouter } from 'next/router';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { getAppToolPaths } from '@/web/core/app/api/tool';
import { getAppFolderPath } from '@/web/core/app/api/app';
import FolderPath from '@/components/common/folder/Path';
import type { ParentIdType } from '@fastgpt/global/common/parentFolder/type';
import ToolTagFilterBox from '@fastgpt/web/components/core/plugin/tool/TagFilterBox';
import type { SystemPluginToolTagType } from '@fastgpt/global/core/plugin/type';
import { useSystem } from '@fastgpt/web/hooks/useSystem';

export enum TemplateTypeEnum {
  'basic' = 'basic',
  'systemTools' = 'systemTools',
  'myTools' = 'myTools',
  'agent' = 'agent'
}

export type NodeTemplateListHeaderProps = {
  onClose?: () => void;
  isPopover?: boolean;
  templateType: TemplateTypeEnum;
  parentId: ParentIdType;
  searchKey: string;
  setSearchKey: Dispatch<SetStateAction<string>>;
  onUpdateTemplateType: (type: TemplateTypeEnum) => void;
  onUpdateParentId: (parentId: string) => void;

  selectedTagIds: string[];
  setSelectedTagIds: (e: string[]) => any;
  toolTags: SystemPluginToolTagType[];
};

const NodeTemplateListHeader = ({
  onClose,
  isPopover = false,
  templateType,
  parentId,
  searchKey,
  setSearchKey,
  onUpdateTemplateType,
  onUpdateParentId,
  selectedTagIds,
  setSelectedTagIds,
  toolTags
}: NodeTemplateListHeaderProps) => {
  const { t } = useTranslation();
  const { feConfigs } = useSystemStore();
  const router = useRouter();

  // Get paths
  const { data: paths = [] } = useRequest2(
    () => {
      if (templateType === TemplateTypeEnum.systemTools)
        return getAppToolPaths({ sourceId: parentId, type: 'current' });
      return getAppFolderPath({ sourceId: parentId, type: 'current' });
    },
    {
      manual: false,
      refreshDeps: [parentId]
    }
  );

  const showToolTag =
    templateType === TemplateTypeEnum.systemTools &&
    selectedTagIds !== undefined &&
    setSelectedTagIds;

  const tabList = useMemo(
    () => [
      {
        label: t('common:core.module.template.Basic Node'),
        value: TemplateTypeEnum.basic
      },
      {
        label: t('app:core.module.template.System Tools'),
        value: TemplateTypeEnum.systemTools
      },
      {
        label: t('common:navbar.Tools'),
        value: TemplateTypeEnum.myTools
      },
      {
        label: 'Agent',
        value: TemplateTypeEnum.agent
      }
    ],
    [t]
  );

  const { isPc } = useSystem();
  const [tabIndex, setTabIndex] = useState(0);
  const tsbsChange = (index: number) => {
    setTabIndex(index);
  };
  // 使用 useCallback 包装 onUpdateTemplateType，避免频繁变化
  const handleUpdateTemplateType = useCallback(
    (type: TemplateTypeEnum) => {
      onUpdateTemplateType(type);
    },
    [onUpdateTemplateType]
  );

  // 补全 useEffect 依赖数组
  useEffect(() => {
    handleUpdateTemplateType(tabList[tabIndex].value);
  }, [tabIndex, tabList, handleUpdateTemplateType]);
  return (
    <Box px={'5'} mb={showToolTag ? 0.5 : 2} whiteSpace={'nowrap'} overflow={'hidden'}>
      {/* Tabs */}
      <Flex flex={'1 0 0'} alignItems={'center'} gap={2}>
        <Box flex={'1 0 0'}>
          <Tabs variant="simple" index={tabIndex} onChange={(index) => tsbsChange(index)}>
            <TabList>
              {tabList.map((item) => (
                <Tab key={item.value}>{item.label}</Tab>
              ))}
            </TabList>
            <TabIndicator mt="-2px" height="2px" bg="primary.500" />
          </Tabs>
          {/* <FillRowTabs<TemplateTypeEnum>
            list={[
              {
                icon: 'core/modules/basicNode',
                label: t('common:core.module.template.Basic Node'),
                value: TemplateTypeEnum.basic
              },
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
            width={'100%'}
            px={1}
            py={isPopover ? '3px' : '5px'}
            iconGap={1}
            {...(isPopover
              ? {
                  iconSize: '14px',
                  labelSize: '12.8px'
                }
              : {})}
            value={templateType}
            onChange={(e) => {
              onUpdateTemplateType(e);
            }}
          /> */}
        </Box>
        {/* close icon */}
        {!isPc && (
          <IconButton
            size={'sm'}
            icon={<MyIcon name={'common/backFill'} w={'14px'} color={'myGray.600'} />}
            bg={'myGray.100'}
            _hover={{
              bg: 'myGray.200',
              '& svg': {
                color: 'primary.600'
              }
            }}
            variant={'grayBase'}
            aria-label={''}
            onClick={onClose}
          />
        )}
      </Flex>
      {/* Search */}
      {templateType !== TemplateTypeEnum.basic && (
        <Flex mt={2} alignItems={'center'} h={isPopover ? 8 : 10}>
          <InputGroup h={'34px'}>
            <InputRightElement h={'full'} alignItems={'center'} display={'flex'}>
              <MyIcon name={'common/searchLight'} w={'16px'} color={'myGray.500'} mr={3} />
            </InputRightElement>
            <Input
              h={'full'}
              bg={'#fff'}
              borderRadius={'12px'}
              placeholder={
                templateType === TemplateTypeEnum.systemTools
                  ? t('common:search_tool')
                  : t('common:plugin.Search_app')
              }
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
            />
          </InputGroup>
          <Box flex={1} />
          {!isPopover &&
            (templateType === TemplateTypeEnum.myTools ||
              templateType === TemplateTypeEnum.agent) && (
              <Flex
                alignItems={'center'}
                cursor={'pointer'}
                _hover={{
                  color: 'primary.600'
                }}
                color={'#4E5969'}
                fontSize={'sm'}
                onClick={() => {
                  if (templateType === TemplateTypeEnum.myTools) {
                    router.push('/dashboard/tool');
                  } else {
                    router.push('/dashboard/agent');
                  }
                }}
                gap={1}
                ml={2}
              >
                <Box>{t('common:create')}</Box>
                <MyIcon name={'common/rightArrowLight'} w={'14px'} />
              </Flex>
            )}
          {templateType === TemplateTypeEnum.systemTools && (
            <Flex
              alignItems={'center'}
              cursor={'pointer'}
              _hover={{
                color: 'primary.600'
              }}
              onClick={() => router.push('/plugin/tool')}
              gap={1}
              ml={4}
            >
              <Box fontSize={'sm'}>{t('app:find_more_tools')}</Box>
              <MyIcon name={'common/rightArrowLight'} w={'14px'} />
            </Flex>
          )}
        </Flex>
      )}
      {/* Tag filter */}
      {templateType === TemplateTypeEnum.systemTools &&
        selectedTagIds !== undefined &&
        setSelectedTagIds && (
          <Box mt={3}>
            <ToolTagFilterBox
              tags={toolTags}
              selectedTagIds={selectedTagIds}
              onTagSelect={setSelectedTagIds}
              size={isPopover ? 'sm' : 'base'}
            />
          </Box>
        )}
      {/* paths */}
      {templateType !== TemplateTypeEnum.basic && !searchKey && parentId && (
        <Flex alignItems={'center'} mt={2}>
          <FolderPath paths={paths} FirstPathDom={null} onClick={onUpdateParentId} />
        </Flex>
      )}
    </Box>
  );
};

export default React.memo(NodeTemplateListHeader);
