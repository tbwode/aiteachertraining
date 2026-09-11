import React from 'react';
import { useContextSelector } from 'use-context-selector';
import { ChatBoxContext } from '../../Provider';
import { Box, Flex } from '@chakra-ui/react';
import Avatar from '@fastgpt/web/components/common/Avatar';
import { useTranslation } from 'react-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';

const QuickApps = () => {
  const { t } = useTranslation();
  const quickAppList = useContextSelector(ChatBoxContext, (v) => v.quickAppList);
  const currentQuickAppId = useContextSelector(ChatBoxContext, (v) => v.currentQuickAppId);
  const onSwitchQuickApp = useContextSelector(ChatBoxContext, (v) => v.onSwitchQuickApp);

  const isDefaultSelected = !currentQuickAppId;

  return quickAppList && quickAppList.length > 0 ? (
    <Flex mb="2" alignItems="center" gap={2} flexWrap="wrap">
      {/* 全部/默认选项 */}
      <Flex
        alignItems="center"
        gap={1}
        border="sm"
        borderRadius="md"
        px={2}
        py={1}
        cursor="pointer"
        _hover={{ bg: 'myGray.50' }}
        {...(isDefaultSelected
          ? {
              bg: 'primary.100',
              color: 'primary.700',
              borderColor: 'primary.500'
            }
          : {
              bg: 'white',
              color: 'myGray.600',
              borderColor: 'myGray.200'
            })}
        onClick={() => onSwitchQuickApp?.()}
      >
        <MyIcon
          name="common/list"
          w={4}
          h={4}
          color={isDefaultSelected ? 'primary.700' : 'myGray.600'}
        />
        <Box fontSize="xs" fontWeight="500" userSelect="none">
          {t('app:All')}
        </Box>
      </Flex>

      {/* 应用列表 */}
      {quickAppList.map((q) => (
        <Flex
          key={q._id}
          alignItems="center"
          gap={1}
          border="sm"
          borderRadius="md"
          px={2}
          py={1}
          cursor="pointer"
          _hover={{ bg: 'myGray.50' }}
          {...(currentQuickAppId === q._id
            ? {
                bg: 'primary.100',
                color: 'primary.700',
                borderColor: 'primary.500'
              }
            : {
                bg: 'white',
                color: 'myGray.600',
                borderColor: 'myGray.200'
              })}
          onClick={() => onSwitchQuickApp?.(q._id)}
        >
          <Avatar src={q.avatar} w={4} borderRadius="xs" />
          <Box fontSize="xs" fontWeight="500" userSelect="none">
            {q.name}
          </Box>
        </Flex>
      ))}
    </Flex>
  ) : null;
};

export default QuickApps;
