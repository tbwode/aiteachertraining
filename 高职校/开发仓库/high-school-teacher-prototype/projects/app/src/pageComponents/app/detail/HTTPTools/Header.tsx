import { Box, Flex, IconButton } from '@chakra-ui/react';
import FolderPath from '@/components/common/folder/Path';
import { useTranslation } from 'react-i18next';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useContextSelector } from 'use-context-selector';
import { AppContext } from '../context';
import { getAppFolderPath } from '@/web/core/app/api/app';
import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import AppCard from './AppCard';

const Header = () => {
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

  return (
    <Box>
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
        {/* <Box flex={'1'}>
          <FolderPath
            rootName={t('common:All')}
            paths={paths}
            hoverStyle={{ color: 'primary.600' }}
            onClick={onClickRoute}
            fontSize={'14px'}
          />
        </Box> */}
      </Flex>
    </Box>
  );
};

export default Header;
