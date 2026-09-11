import { Box, Flex, IconButton } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import FolderPath from '@/components/common/folder/Path';
import { useTranslation } from 'react-i18next';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useContextSelector } from 'use-context-selector';
import { AppContext } from '../context';
import { getAppFolderPath } from '@/web/core/app/api/app';
import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { type McpToolConfigType } from '@fastgpt/global/core/app/tool/mcpTool/type';
import { postUpdateMCPTools } from '@/web/core/app/api/tool';
import { type StoreSecretValueType } from '@fastgpt/global/common/secret/type';
import AppCard from './AppCard';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useSystem } from '@fastgpt/web/hooks/useSystem';

const Header = ({
  url,
  toolList,
  headerSecret
}: {
  url: string;
  toolList: McpToolConfigType[];
  headerSecret: StoreSecretValueType;
}) => {
  const { t } = useTranslation();
  const appId = useContextSelector(AppContext, (v) => v.appId);
  const appDetail = useContextSelector(AppContext, (v) => v.appDetail);
  const router = useRouter();
  const { isPc } = useSystem();

  const { lastAppListRouteType } = useSystemStore();

  const { data: paths = [] } = useRequest2(
    () => getAppFolderPath({ sourceId: appId, type: 'parent' }),
    {
      manual: false,
      refreshDeps: [appId]
    }
  );

  const onClickRoute = useCallback(() => {
    router.push({
      pathname: '/dashboard/tool',
      query: {
        parentId: appDetail.parentId,
        type: lastAppListRouteType
      }
    });
  }, [router, appDetail.parentId, lastAppListRouteType]);

  const { runAsync: saveMCPTools, loading: isSavingMCPTools } = useRequest2(
    async () => {
      return await postUpdateMCPTools({ appId, url, toolList, headerSecret });
    },
    {
      successToast: t('common:update_success')
    }
  );

  return (
    <Box>
      {/* {!isPc && (
        <Flex justifyContent={'center'}>
          <RouteTab />
        </Flex>
      )} */}
      <Flex
        flexShrink={0}
        mt={[2, 0]}
        px={[2, 6]}
        alignItems={['flex-start', 'center']}
        userSelect={'none'}
        h={['auto', '73px']}
        flexWrap={'wrap'}
        borderBottom={isPc ? 'md' : 'none'}
      >
        {/* <Box flex={'1'}>
          <FolderPath
            rootName={t('common:All')}
            paths={paths}
            hoverStyle={{ color: 'primary.600' }}
            onClick={onClickRoute}
            fontSize={'14px'}
          />
        </Box> */}
        {/* back */}
        <Box
          _hover={{
            bg: 'myGray.200'
          }}
          w={'40px'}
          h={'40px'}
          borderRadius={'sm'}
          mr={'14px'}
        >
          <IconButton
            icon={<MyIcon name={'common/arrowLeft'} color={'#09244B'} w={'18px'} />}
            aria-label={''}
            // size={'xs'}
            w={'full'}
            h={'full'}
            variant={'ghost'}
            onClick={onClickRoute}
          />
        </Box>
        <AppCard />
        <Box flex={1} />
        {/* {isPc && (
          <Box position={'absolute'} left={'50%'} transform={'translateX(-50%)'}>
            <RouteTab />
          </Box>
        )} */}
        <Button size={'sm'} isLoading={isSavingMCPTools} onClick={() => saveMCPTools()}>
          {t('common:Save')}
        </Button>
      </Flex>
    </Box>
  );
};

export default Header;
