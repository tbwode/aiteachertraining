import { getFavouriteApps } from '@/web/core/chat/api';
import {
  Box,
  Center,
  Flex,
  Grid,
  GridItem,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Tab,
  TabIndicator,
  TabList,
  Tabs
} from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useContextSelector } from 'use-context-selector';
import { ChatPageContext } from '@/web/core/chat/context/chatPageContext';
import { useMemo } from 'react';
import Avatar from '@fastgpt/web/components/common/Avatar';
import { ChatSettingTabOptionEnum, ChatSidebarPaneEnum } from '@/pageComponents/chat/constants';
import MyPopover from '@fastgpt/web/components/common/MyPopover';
import NextHead from '@/components/common/NextHead';
import MyBox from '@fastgpt/web/components/common/MyBox';
import ChatSliderMobileDrawer from '@/pageComponents/chat/slider/ChatSliderMobileDrawer';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { ChatContext } from '@/web/core/chat/context/chatContext';
import EmptyTip from '@fastgpt/web/components/common/EmptyTip';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { useUserStore } from '@/web/support/user/useUserStore';

const ChatFavouriteApp = () => {
  const { isPc } = useSystem();
  const { t } = useTranslation();
  const { feConfigs } = useSystemStore();
  const { userInfo } = useUserStore();

  const onOpenSlider = useContextSelector(ChatContext, (v) => v.onOpenSlider);

  const handlePaneChange = useContextSelector(ChatPageContext, (v) => v.handlePaneChange);
  const wideLogoUrl = useContextSelector(ChatPageContext, (v) => v.chatSettings?.wideLogoUrl);
  const homeTabTitle = useContextSelector(ChatPageContext, (v) => v.chatSettings?.homeTabTitle);

  const tags = useContextSelector(ChatPageContext, (v) => v.chatSettings?.favouriteTags || []);
  const tagCache = useMemo(() => {
    return tags.reduce(
      (acc, tag) => {
        acc[tag.id] = tag;
        return acc;
      },
      {} as Record<string, (typeof tags)[number]>
    );
  }, [tags]);

  const tagOptions = useMemo(
    () => [
      { label: t('chat:setting.favourite.category_tab.all'), value: '' },
      ...tags.map((tag) => ({
        label: tag.name,
        value: tag.id
      }))
    ],
    [tags, t]
  );

  const { register, watch, setValue } = useForm<{ name: string; tag: string }>({
    defaultValues: {
      name: '',
      tag: ''
    }
  });
  const searchAppName = watch('name');
  const selectedTag = watch('tag');

  // load all favourites for checked state and saving
  const { loading: isSearching, data: favouriteApps = [] } = useRequest2(
    async () => {
      return await getFavouriteApps({
        name: searchAppName,
        tag: selectedTag
      });
    },
    {
      manual: false,
      throttleWait: 500,
      refreshDeps: [searchAppName, selectedTag]
    }
  );

  const TagBox = ({ id }: { id: string }) => {
    const tag = tagCache[id];

    if (!tag) return null;

    return (
      <Flex
        key={id}
        fontSize="xs"
        borderRadius="sm"
        bg="myGray.100"
        px="1.5"
        py="0.5"
        cursor="text"
        minW="40px"
        justifyContent="center"
        onClick={(e) => e.stopPropagation()}
      >
        {tag.name}
      </Flex>
    );
  };
  return (
    <MyBox isLoading={isSearching} display="flex" flexDirection={'column'} h={'100%'} bg={'#fff'}>
      <NextHead title={homeTabTitle} icon={getWebReqUrl(feConfigs?.favicon)} />

      {!isPc && (
        <Flex
          py={4}
          color="myGray.900"
          gap={2}
          alignItems={'center'}
          px={4}
          justifyContent={'space-between'}
        >
          <MyIcon
            w="20px"
            color="myGray.500"
            name="core/chat/sidebar/menu"
            onClick={onOpenSlider}
          />

          <Box w="70%">
            <InputGroup w="100%">
              <InputLeftElement h="36px">
                <MyIcon name="common/searchLight" w="16px" color="myGray.500" />
              </InputLeftElement>
              <Input
                placeholder={t('chat:setting.favourite.search_placeholder')}
                {...register('name')}
              />
            </InputGroup>
          </Box>

          <ChatSliderMobileDrawer
            showList={false}
            showMenu={false}
            banner={wideLogoUrl}
            menuConfirmButtonText={t('common:core.chat.Confirm to clear history')}
          />
        </Flex>
      )}

      {/* pc加个标题 */}
      {isPc && (
        <Flex
          p={5}
          lineHeight={1}
          fontSize={'22px'}
          color={'#000'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Flex
            lineHeight={1}
            fontSize={'22px'}
            color={'#000'}
            justifyContent={'space-between'}
            alignItems={'center'}
          >
            {t('chat:sidebar.favourite_apps')}
          </Flex>

          <InputGroup maxW="300px">
            <InputRightElement h="36px">
              <MyIcon name="common/searchLight" w="16px" color="myGray.500" />
            </InputRightElement>
            <Input
              placeholder={t('chat:setting.favourite.search_placeholder')}
              {...register('name')}
            />
          </InputGroup>
        </Flex>
      )}

      {/* 顶部 */}
      <Flex w="full" p={['0 16px 0 16px', '0 20px']} gap={4} justifyContent="space-between">
        {/* tag tabs */}
        <Tabs variant="unstyled">
          <TabList
            gap={'9px'}
            overflowX="auto"
            overflowY="hidden"
            flexWrap="nowrap"
            position="relative"
            css={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': { display: 'none' }
            }}
          >
            {tagOptions.map((option) => (
              <Tab
                flexShrink="0"
                key={option.value}
                value={option.value}
                fontWeight={500}
                px={5}
                py={'6px'}
                color={selectedTag === option.value ? '#fff' : '#86909C'}
                bg={selectedTag === option.value ? 'primary.600' : '#fff'}
                borderRadius={'10px'}
                _hover={{
                  bg: selectedTag === option.value ? 'primary.600' : 'primary.50'
                }}
                onClick={() => setValue('tag', option.value)}
              >
                {option.label}
              </Tab>
            ))}
            {/* <TabIndicator mt="36px" height="2px" bg="primary.600" borderRadius="1px" /> */}
          </TabList>
        </Tabs>
      </Flex>

      {/* list */}
      {favouriteApps.length > 0 ? (
        <Grid
          templateColumns={['1fr', 'repeat(3, 1fr)']}
          rowGap={'25px'}
          columnGap={'20px'}
          p={['4', '5']}
          overflowY="auto"
        >
          {favouriteApps.map((app) => (
            <GridItem key={app.appId} cursor="pointer">
              <Flex
                flexDirection={'column'}
                justifyContent="flex-start"
                gap={4}
                p={5}
                borderRadius={'16px'}
                border="sm"
                borderColor="myGray.200"
                // boxShadow="sm"
                bg="white"
                // h="160px"
                transition="all 0.1s ease-in-out"
                _hover={{
                  transform: 'translateY(-3px)',
                  borderColor: 'primary.600'
                }}
                onClick={() => handlePaneChange(ChatSidebarPaneEnum.RECENTLY_USED_APPS, app.appId)}
              >
                <Flex fontWeight="500" alignItems="center" gap={'10px'}>
                  <Center w={'44px'} h={'44px'} borderRadius={'8px'} border="base">
                    <Avatar src={app.avatar} borderRadius={'8px'} w={'38px'} h={'38px'} />
                  </Center>
                  <Flex fontSize="17px" color={'#000'}>
                    {app.name}
                  </Flex>
                </Flex>

                <Box fontSize="14px" color="myGray.5" minH="0" noOfLines={2} overflow="hidden">
                  {app.intro || t('common:no_intro')}
                </Box>

                <Flex gap="2" flexWrap="wrap" mt="auto">
                  {app.favouriteTags.slice(0, 3).map((id) => (
                    <TagBox key={id} id={id} />
                  ))}

                  {app.favouriteTags.length > 3 && (
                    <MyPopover
                      placement="bottom"
                      trigger="hover"
                      width="fit-content"
                      Trigger={
                        <Box
                          fontSize="xs"
                          borderRadius={8}
                          bg="myGray.100"
                          px="1.5"
                          py="0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          +{app.favouriteTags.length - 3}
                        </Box>
                      }
                    >
                      {() => (
                        <Flex
                          p="2"
                          gap="2"
                          flexWrap="wrap"
                          maxW="200px"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {app.favouriteTags.slice(3).map((id) => (
                            <TagBox key={id} id={id} />
                          ))}
                        </Flex>
                      )}
                    </MyPopover>
                  )}
                </Flex>
              </Flex>
            </GridItem>
          ))}
        </Grid>
      ) : (
        <Flex flexDir="column" flex="1" justifyContent="center" alignItems="center" gap={4}>
          <EmptyTip p="0" text={t('chat:setting.favourite.category.no_data')} />

          {userInfo?.permission.hasManagePer && (
            <Button
              variant="primary"
              leftIcon={<MyIcon name="common/settingLight" w="16px" />}
              onClick={() =>
                // handlePaneChange(
                //   ChatSidebarPaneEnum.SETTING,
                //   undefined,
                //   ChatSettingTabOptionEnum.FAVOURITE_APPS
                // )
                (window.location.href = `/account/portalConfig?tab=${ChatSettingTabOptionEnum.FAVOURITE_APPS}`)
              }
            >
              {t('chat:setting.favourite.goto_add')}
            </Button>
          )}
        </Flex>
      )}
    </MyBox>
  );
};

export default ChatFavouriteApp;
