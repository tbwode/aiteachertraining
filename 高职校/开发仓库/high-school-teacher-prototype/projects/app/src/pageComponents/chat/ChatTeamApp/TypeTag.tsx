import React, { useRef } from 'react';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { Box, Flex } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const AppTypeTag = ({ type }: { type: AppTypeEnum }) => {
  const { t } = useTranslation();

  const map = useRef({
    [AppTypeEnum.simple]: {
      label: t('app:type.Chat_Agent'),
      icon: 'core/app/type/simple',
      bg: '#DBF3FF',
      color: '#0884DD'
    },
    [AppTypeEnum.workflow]: {
      label: t('app:type.Workflow bot'),
      icon: 'core/app/type/workflow',
      bg: '#E4E1FC',
      color: '#6F5DD7'
    },
    [AppTypeEnum.workflowTool]: {
      label: t('app:toolType_workflow'),
      icon: 'core/app/type/plugin',
      bg: '#D0F5EE',
      color: '#007E7C'
    },
    [AppTypeEnum.httpPlugin]: {
      label: t('account_team:type.Http plugin'),
      icon: 'core/app/type/httpPlugin',
      bg: '#FFE4EE',
      color: '#E82F72'
    },
    [AppTypeEnum.httpToolSet]: {
      label: t('app:toolType_http'),
      icon: 'core/app/type/httpPlugin',
      bg: '#FFE4EE',
      color: '#E82F72'
    },
    [AppTypeEnum.mcpToolSet]: {
      label: t('app:toolType_mcp'),
      icon: 'core/app/type/mcpTools',
      bg: '',
      color: ''
    },
    [AppTypeEnum.tool]: undefined,
    [AppTypeEnum.folder]: undefined,
    [AppTypeEnum.hidden]: undefined
  });

  const data = map.current[type as keyof typeof map.current];

  return data ? (
    <Flex
      bg={'#F2F3F5'}
      color={'#1D2129'}
      alignItems={'center'}
      py={'6px'}
      px={2}
      borderRadius={'6px'}
      whiteSpace={'nowrap'}
    >
      <MyIcon name={data.icon as any} w={'12px'} h={'12px'} color={'#1D2129'} />
      <Box ml={1} fontSize={'mini'} lineHeight={1}>
        {data.label}
      </Box>
    </Flex>
  ) : null;
};

export default AppTypeTag;
