import React from 'react';
import { useContextSelector } from 'use-context-selector';
import { ChatContext } from '@/web/core/chat/context/chatContext';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditTitle } from '@/web/common/hooks/useEditTitle';
import { Box, Divider, Flex, IconButton } from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import MyMenu from '@fastgpt/web/components/common/MyMenu';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { formatTimeToChatTime } from '@fastgpt/global/common/string/time';
import { ChatItemContext } from '@/web/core/chat/context/chatItemContext';
import PopoverConfirm from '@fastgpt/web/components/common/MyPopover/PopoverConfirm';
type HistoryItemType = {
  id: string;
  title: string;
  customTitle?: string;
  top?: boolean;
  updateTime: Date;
};

/** 消息组件 */
const HistoryItem = React.memo(function HistoryItem({
  item,
  index
}: {
  item: HistoryItemType;
  index: number;
}) {
  const { isPc } = useSystem();
  const { t } = useTranslation();
  const { chatId: activeChatId } = useChatStore();

  const onDelHistory = useContextSelector(ChatContext, (v) => v.onDelHistory);
  const onUpdateHistory = useContextSelector(ChatContext, (v) => v.onUpdateHistory);
  const onChangeChatId = useContextSelector(ChatContext, (v) => v.onChangeChatId);

  const setCiteModalData = useContextSelector(ChatItemContext, (v) => v.setCiteModalData);

  // custom title edit
  const { onOpenModal, EditModal: EditTitleModal } = useEditTitle({
    title: t('common:core.chat.Custom History Title'),
    placeholder: t('common:core.chat.Custom History Title Description')
  });
  return (
    <>
      <Flex
        position={'relative'}
        key={item.id}
        alignItems={'center'}
        px={4}
        h={'44px'}
        mt={index == 0 ? 0 : '10px'}
        cursor={'pointer'}
        userSelect={'none'}
        borderRadius={'md'}
        fontSize={'sm'}
        _hover={{
          bg: 'myGray.50',
          '& .more': {
            display: 'block'
          },
          '& .time': {
            display: isPc ? 'none' : 'block'
          }
        }}
        // bg={item.top ? '#E6F6F6 !important' : ''}
        {...(item.id === activeChatId
          ? {
              backgroundColor: 'primary.50 !important',
              color: 'primary.600'
            }
          : {
              onClick: () => {
                onChangeChatId(item.id);
                setCiteModalData(undefined);
              }
            })}
        // {...(i !== concatHistory.length - 1 && {
        //   mb: '8px'
        // })}
      >
        <MyIcon
          name={item.id === activeChatId ? 'chat/messageItem_active' : 'chat/messageItem'}
          w={'16px'}
        />
        <Box flex={'1 0 0'} ml={2} className="textEllipsis">
          {item.customTitle || item.title}
        </Box>
        {!!item.id && (
          <Flex gap={2} alignItems={'center'}>
            {/* <Box
              className="time"
              display={'block'}
              fontWeight={'400'}
              fontSize={'mini'}
              color={'myGray.500'}
            >
              {t(formatTimeToChatTime(item.updateTime) as any).replace('#', ':')}
            </Box> */}
            <Box className="more" display={['block', 'none']}>
              <MyMenu
                Button={
                  <IconButton
                    size={'xs'}
                    variant={'grayBase'}
                    icon={<MyIcon name={'chat/more_small'} w={'16px'} p={1} />}
                    aria-label={''}
                  />
                }
                menuList={[
                  {
                    children: [
                      {
                        label: item.top ? t('common:core.chat.Unpin') : t('common:core.chat.Pin'),
                        icon: item.top ? 'chat/cancel_top' : 'core/chat/setTopLight',
                        onClick: () => {
                          onUpdateHistory({
                            chatId: item.id,
                            top: !item.top
                          });
                        }
                      },

                      {
                        label: t('common:custom_title'),
                        icon: 'chat/edit_pen',
                        onClick: () => {
                          onOpenModal({
                            defaultVal: item.customTitle || item.title,
                            onSuccess: (e) =>
                              onUpdateHistory({
                                chatId: item.id,
                                customTitle: e
                              })
                          });
                        }
                      },
                      {
                        label: t('common:Delete'),
                        icon: 'delete',
                        onClick: () => {
                          onDelHistory(item.id);
                          if (item.id === activeChatId) {
                            onChangeChatId();
                            setCiteModalData(undefined);
                          }
                        },
                        type: 'danger'
                      }
                    ]
                  }
                ]}
              />
            </Box>
          </Flex>
        )}
      </Flex>
      <EditTitleModal />
    </>
  );
});
type Props = {
  menuConfirmButtonText?: string;
};
const ChatSliderList = ({ menuConfirmButtonText }: Props) => {
  const { t } = useTranslation();
  const { chatId: activeChatId } = useChatStore();
  const histories = useContextSelector(ChatContext, (v) => v.histories);
  const ScrollData = useContextSelector(ChatContext, (v) => v.ScrollData);
  const onClearHistory = useContextSelector(ChatContext, (v) => v.onClearHistories);

  const concatHistory = useMemo(() => {
    const formatHistories: HistoryItemType[] = histories.map((item) => {
      return {
        id: item.chatId,
        title: item.title,
        customTitle: item.customTitle,
        top: item.top,
        updateTime: item.updateTime
      };
    });

    const newChat: {
      id: string;
      title: string;
      customTitle?: string;
      top?: boolean;
      updateTime: Date;
    } = {
      id: activeChatId,
      title: t('common:core.chat.New Chat'),
      updateTime: new Date()
    };
    const activeChat = histories.find((item) => item.chatId === activeChatId);

    return !activeChat ? [newChat].concat(formatHistories) : formatHistories;
  }, [activeChatId, histories, t]);

  // 整理数据：置顶数据 + 按时间分组的非置顶数据
  const organizedHistory = useMemo(() => {
    // 分离置顶数据和非置顶数据
    const topItems = concatHistory.filter((item) => item.top);
    const nonTopItems = concatHistory.filter((item) => !item.top);

    // 对非置顶数据按时间分组
    const groupedByTime: Record<string, typeof nonTopItems> = {};
    nonTopItems.forEach((item) => {
      const timeKey = formatTimeToChatTime(item.updateTime).replace('#', ':');
      if (!groupedByTime[timeKey]) {
        groupedByTime[timeKey] = [];
      }
      groupedByTime[timeKey].push(item);
    });

    // 转换为数组格式，方便渲染
    const timeGroups = Object.entries(groupedByTime).map(([time, items]) => ({
      time,
      items
    }));
    return {
      topItems,
      timeGroups
    };
  }, [concatHistory]);

  return (
    <>
      <ScrollData flex={'1 0 0'} h={0} px={[2, 5]} overflow={'overlay'}>
        {/* 渲染置顶数据 */}
        {!!organizedHistory.topItems?.length && (
          <Box>
            <Flex
              alignItems={'center'}
              justifyContent={'space-between'}
              color="myGray.400"
              fontSize={'12px'}
              my={'10px'}
            >
              <Box>{t('common:core.chat.Pin')}</Box>
              <Box cursor={'pointer'}>
                <PopoverConfirm
                  Trigger={<Box>{t('common:Clear')}</Box>}
                  type="delete"
                  content={menuConfirmButtonText || t('common:Delete')}
                  onConfirm={() => onClearHistory()}
                />
              </Box>
            </Flex>
            {organizedHistory.topItems.map((item, i) => (
              <HistoryItem key={item.id} item={item} index={i}></HistoryItem>
            ))}
            <Divider color={'#EFEFEF'} mt={'10px'}></Divider>
          </Box>
        )}

        {/* 渲染按时间分组的非置顶数据 */}
        {organizedHistory.timeGroups.map((group, i) => (
          <Box key={group.time}>
            <Flex
              alignItems={'center'}
              justifyContent={'space-between'}
              color="myGray.400"
              fontSize={'12px'}
              my={'10px'}
            >
              <Box>{t(group.time)}</Box>
              {!organizedHistory.topItems?.length && i == 0 && (
                <Box cursor={'pointer'}>
                  <PopoverConfirm
                    Trigger={<Box>{t('common:Clear')}</Box>}
                    type="delete"
                    content={menuConfirmButtonText || t('common:Delete')}
                    onConfirm={() => onClearHistory()}
                  />
                </Box>
              )}
            </Flex>

            {group.items.map((item, i) => (
              <HistoryItem key={`${group.time}-${item.id}`} item={item} index={i}></HistoryItem>
            ))}
          </Box>
        ))}

        {/* {concatHistory.map((item, i) => (
          <HistoryItem key={item.id} item={item}></HistoryItem>
        ))} */}
      </ScrollData>
    </>
  );
};

export default ChatSliderList;
