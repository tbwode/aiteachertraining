import React, { useMemo } from 'react';
import {
  background,
  Box,
  type BoxProps,
  Center,
  Flex,
  Link,
  type LinkProps
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useUserStore } from '@/web/support/user/useUserStore';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import NextLink from 'next/link';
import Badge from '../Badge';
import Avatar from '@fastgpt/web/components/common/Avatar';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useTranslation } from 'react-i18next';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import MyImage from '@fastgpt/web/components/common/Image/MyImage';
import { FULL_ICON } from '@fastgpt/global/common/system/constants';

export enum NavbarTypeEnum {
  normal = 'normal',
  small = 'small'
}

const itemStyles: BoxProps & LinkProps = {
  // my: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  position: 'relative'
  // w: '48px',
  // h: '58px',
  // borderRadius: 'md'
};
const hoverStyle: LinkProps = {
  _hover: {
    bg: 'myGray.05',
    color: 'primary.600'
  }
};

const optionStyle = {
  background: 'rgba(28, 28, 28, 0.05)',
  borderRadius: '8px',
  cursor: 'pointer',
  w: '28px',
  h: '28px'
};

const Navbar = ({ unread }: { unread: number }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { userInfo } = useUserStore();
  const { gitStar, feConfigs, chatLogos } = useSystemStore();
  const { lastChatAppId, lastPane } = useChatStore();

  const navbarList = useMemo(
    () => [
      {
        label: t('common:navbar.Chat'),
        icon: 'navbar/chatLight',
        activeIcon: 'navbar/chatFill',
        link: `/chat?appId=${lastChatAppId}&pane=${lastPane}`,
        activeLink: ['/chat']
      },
      {
        label: t('common:navbar.Studio'),
        icon: 'navbar/dashboardLight',
        activeIcon: 'navbar/dashboardFill',
        link: `/dashboard/agent`,
        activeLink: [
          '/dashboard/agent',
          '/dashboard/create',
          '/app/detail',
          '/dashboard/tool',
          '/dashboard/systemTool',
          '/dashboard/templateMarket',
          '/dashboard/mcpServer',
          '/dashboard/evaluation',
          '/dashboard/evaluation/create'
        ]
      },
      {
        label: t('common:navbar.Datasets'),
        icon: 'navbar/datasetLight',
        activeIcon: 'navbar/datasetFill',
        link: `/dataset/list`,
        activeLink: ['/dataset/list', '/dataset/detail']
      },
      {
        label: t('common:navbar.Account'),
        icon: 'navbar/userLight',
        activeIcon: 'navbar/userFill',
        link: '/account/info',
        activeLink: [
          '/account/bill',
          '/account/info',
          '/account/customDomain',
          '/account/team',
          '/account/usage',
          '/account/thirdParty',
          '/account/apikey',
          '/account/setting',
          '/account/inform',
          '/account/promotion',
          '/account/model',
          '/account/packageAndUsage',
          '/account/portalConfig'
        ]
      },
      ...(userInfo?.username === 'root'
        ? [
            {
              label: t('common:navbar.Config'),
              icon: 'support/config/configLight',
              activeIcon: 'support/config/configFill',
              link: '/config/tool',
              activeLink: ['/config/tool', '/config/tool/marketplace']
            }
          ]
        : [])
    ],
    [lastChatAppId, lastPane, t, userInfo?.username]
  );

  const isDashboardPage = useMemo(() => {
    return router.pathname.startsWith('/dashboard');
  }, [router.pathname]);
  const isAppDetailPage = useMemo(() => {
    return router.pathname.startsWith('/app/detail');
  }, [router.pathname]);

  const isDatasetDetailPage = useMemo(() => {
    return router.pathname.startsWith('/dataset/detail');
  }, [router.pathname]);

  if (isDatasetDetailPage) return null;

  return (
    <Flex
      // flexDirection={'column'}
      position={'relative'}
      alignItems={'center'}
      py={5}
      px={10}
      h={'100%'}
      w={'100%'}
      userSelect={'none'}
      // bg={isDashboardPage ? 'myGray.50' : isAppDetailPage ? 'myGray.25' : 'transparent'}
      bg={'transparent'}
    >
      {/* logo */}
      <Box position={'absolute'}>
        <MyImage h={'22px'} src={chatLogos.wideLogoUrl || FULL_ICON} />
      </Box>
      {/* 导航列表 */}
      <Flex flex={1} justifyContent={'center'} gap={10}>
        {navbarList.map((item) => {
          const isActive = item.activeLink.includes(router.pathname);
          return (
            <Box
              key={item.link}
              {...itemStyles}
              {...(isActive
                ? {
                    color: '#2b2121ff',
                    _before: {
                      content: "''",
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: '-9px',
                      height: '2px',
                      bg: '#000'
                    }
                    // bg: 'white',
                    // boxShadow:
                    //   '0px 0px 1px 0px rgba(19, 51, 107, 0.08), 0px 4px 4px 0px rgba(19, 51, 107, 0.05)'
                  }
                : {
                    color: 'rgba(0, 0, 0, 0.40)',
                    // bg: 'transparent',
                    _hover: {
                      color: '#000'
                    }
                  })}
              {...(item.link !== router.asPath
                ? {
                    onClick: () => {
                      // if (item.link.startsWith('/chat')) {
                      //   window.open(getWebReqUrl(item.link), '_blank', 'noopener,noreferrer');
                      //   return;
                      // }
                      router.push(item.link);
                    }
                  }
                : {})}
            >
              {/* <MyIcon
                {...(isActive
                  ? {
                      name: item.activeIcon as any,
                      color: 'primary.600'
                    }
                  : {
                      name: item.icon as any,
                      color: 'myGray.400'
                    })}
                width={'24px'}
                height={'24px'}
              /> */}
              <Box
                fontSize={'15px'}
                transform={'scale(0.9)'}
                lineHeight={1}
                color={isActive ? '#000' : 'rgba(0, 0, 0, 0.40),'}
              >
                {item.label}
              </Box>
            </Box>
          );
        })}
      </Flex>

      <Flex position={'absolute'} right={'40px'} alignItems={'center'} gap={4}>
        {unread > 0 && (
          <Center>
            <Link
              as={NextLink}
              {...itemStyles}
              {...hoverStyle}
              {...optionStyle}
              prefetch
              href={`/account/inform`}
              mb={0}
              color={'#1C1C1C'}
            >
              <Badge count={unread}>
                <Center>
                  <MyIcon name={'bell'} width={'16px'} height={'16px'} />
                </Center>
              </Badge>
            </Link>
          </Center>
        )}

        {feConfigs?.navbarItems
          ?.filter((item) => item.isActive)
          .map((item) => (
            <MyTooltip key={item.id} label={item.name} placement={'right-end'}>
              <Link
                as={NextLink}
                href={item.url}
                target={'_blank'}
                {...itemStyles}
                {...hoverStyle}
                {...optionStyle}
                mt={0}
                color={'#1C1C1C'}
              >
                <Avatar src={item.avatar} borderRadius={'md'} width={'16px'} height={'16px'} />
              </Link>
            </MyTooltip>
          ))}

        {/* {feConfigs?.show_git && (
          <MyTooltip label={`Git Star: ${gitStar}`} placement={'right-end'}>
            <Link
              as={NextLink}
              href="https://github.com/labring/FastGPT"
              target={'_blank'}
              {...itemStyles}
              {...hoverStyle}
              {...optionStyle}
              mt={0}
              color={'#1C1C1C'}
            >
              <MyIcon name={'github'} width={'16px'} height={'16px'} />
            </Link>
          </MyTooltip>
        )} */}

        <Box cursor={'pointer'} onClick={() => router.push('/account/info')}>
          <Avatar w={9} src={userInfo?.avatar} borderRadius={'50%'} />
        </Box>
      </Flex>
    </Flex>
  );
};

export default Navbar;
