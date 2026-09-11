import React from 'react';
import { Box, Center, Flex, Grid, HStack } from '@chakra-ui/react';
import { usePathname, useSearchParams } from 'next/navigation';
import MyIcon from '@fastgpt/web/components/common/Icon';
import Avatar from '@fastgpt/web/components/common/Avatar';
import EmptyTip from '@fastgpt/web/components/common/EmptyTip';
import { useTranslation } from 'react-i18next';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { useContextSelector } from 'use-context-selector';
import { AppListContext } from '@/pageComponents/dashboard/agent/context';
import { AppTypeEnum, ToolTypeList } from '@fastgpt/global/core/app/constants';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import AppTypeTag from '@/pageComponents/chat/ChatTeamApp/TypeTag';

import { formatTimeToChatTime } from '@fastgpt/global/common/string/time';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import UserBox from '@fastgpt/web/components/common/UserBox';
import { ChatPageContext } from '@/web/core/chat/context/chatPageContext';
import { ChatSidebarPaneEnum } from '@/pageComponents/chat/constants';
import dayjs from 'dayjs';

const List = ({ appType }: { appType: AppTypeEnum | 'all' }) => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isPc } = useSystem();

  const myApps = useContextSelector(AppListContext, (v) =>
    v.myApps.filter(
      (app) =>
        appType === 'all' ||
        [
          appType,
          ToolTypeList.includes(appType) ? AppTypeEnum.toolFolder : AppTypeEnum.folder
        ].includes(app.type)
    )
  );
  const handlePaneChange = useContextSelector(ChatPageContext, (v) => v.handlePaneChange);

  return (
    <>
      <Grid
        py={[0, 4]}
        gridTemplateColumns={[
          '1fr',
          'repeat(2,1fr)',
          'repeat(2,1fr)',
          'repeat(3,1fr)',
          'repeat(4,1fr)'
        ]}
        rowGap={'25px'}
        columnGap={'20px'}
        alignItems={'stretch'}
      >
        {myApps.map((app) => {
          return (
            <MyTooltip
              key={app._id}
              h="100%"
              label={
                app.type === AppTypeEnum.folder ? t('common:open_folder') : t('app:go_to_chat')
              }
            >
              <MyBox
                lineHeight={1.5}
                h="100%"
                p={5}
                cursor={'pointer'}
                border={'sm'}
                // boxShadow={'2'}
                bg={'white'}
                borderRadius={'16px'}
                position={'relative'}
                display={'flex'}
                flexDirection={'column'}
                _hover={{
                  transform: 'translateY(-3px)',
                  borderColor: 'primary.600',
                  '& .more': {
                    display: 'flex'
                  },
                  '& .time': {
                    display: ['flex', 'none']
                  }
                }}
                onClick={() => {
                  if (app.type === AppTypeEnum.folder) {
                    const params = new URLSearchParams(searchParams?.toString() || '');
                    params.set('parentId', app._id);
                    window.history.pushState(null, '', `${pathname}?${params.toString()}`);
                  } else {
                    handlePaneChange(ChatSidebarPaneEnum.RECENTLY_USED_APPS, app._id);
                  }
                }}
              >
                <Flex gap={'10px'} alignItems={'center'}>
                  <Center w={'44px'} h={'44px'} borderRadius={'8px'} border="base" flexShrink={0}>
                    <Avatar src={app.avatar} borderRadius={'8px'} w={'38px'} h={'38px'} />
                  </Center>
                  <Flex direction={'column'}>
                    <Box color={'#000'} fontSize={'17px'} noOfLines={1}>
                      {app.name}
                    </Box>
                    <UserBox
                      sourceMember={app.sourceMember}
                      fontSize="xs"
                      avatarSize="1rem"
                      spacing={0.5}
                    />
                  </Flex>

                  {/* <Box mr={'-1.25rem'}>
                    <AppTypeTag type={app.type} />
                  </Box> */}
                </Flex>
                <Box
                  py={4}
                  textAlign={'justify'}
                  wordBreak={'break-all'}
                  fontSize={'14px'}
                  color={'#797979'}
                >
                  <Box className={'textEllipsis2'} whiteSpace={'pre-wrap'}>
                    {app.intro || t('common:no_intro')}
                  </Box>
                </Box>
                <HStack
                  h={'24px'}
                  fontSize={'mini'}
                  color={'myGray.500'}
                  w="full"
                  borderTop={'sm'}
                  pt={4}
                >
                  {/* <HStack flex={'1 0 0'}> */}
                  {/* <UserBox
                      sourceMember={app.sourceMember}
                      fontSize="xs"
                      avatarSize="1rem"
                      spacing={0.5}
                    /> */}
                  {/* </HStack> */}
                  <HStack flex={'1 0 0'}>
                    {/* {isPc && ( */}
                    <HStack spacing={0.5}>
                      {/* <MyIcon name={'history'} w={'0.85rem'} color={'myGray.400'} /> */}
                      <Box color={'myGray.400'}>
                        {t('common:Recently_Edited')}
                        {/*  HH:mm:ss dddd */}
                        {' ' + dayjs(app.updateTime).format('YYYY-MM-DD')}
                        {/* {t(formatTimeToChatTime(app.updateTime) as any).replace('#', ':')} */}
                      </Box>
                    </HStack>
                    {/* )} */}
                  </HStack>
                  <HStack>
                    <AppTypeTag type={app.type} />
                  </HStack>
                </HStack>
              </MyBox>
            </MyTooltip>
          );
        })}
      </Grid>
      {myApps.length === 0 && <EmptyTip text={t('common:core.app.no_app')} pt={'30vh'} />}
    </>
  );
};
export default List;
