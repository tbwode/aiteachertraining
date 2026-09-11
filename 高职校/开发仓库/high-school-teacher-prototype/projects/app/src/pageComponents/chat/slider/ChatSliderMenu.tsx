import { useContextSelector } from 'use-context-selector';
import { ChatContext } from '@/web/core/chat/context/chatContext';
import { useTranslation } from 'react-i18next';
import { Box, Flex } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { ChatItemContext } from '@/web/core/chat/context/chatItemContext';
const ChatSliderMenu = () => {
  const { t } = useTranslation();
  const { isPc } = useSystem();

  // const histories = useContextSelector(ChatContext, (v) => v.histories);
  const onChangeChatId = useContextSelector(ChatContext, (v) => v.onChangeChatId);

  const setCiteModalData = useContextSelector(ChatItemContext, (v) => v.setCiteModalData);

  return (
    <Flex
      px={'18px'}
      w={'100%'}
      h={'36px'}
      mt={'10px'}
      // mb={'12px'}
      justify={['space-between', '']}
      alignItems={'center'}
    >
      {!isPc && (
        <Flex height={'100%'} align={'center'} justify={'center'}>
          <MyIcon ml={2} name="core/chat/sideLine" />
          <Box ml={2} fontWeight={'bold'}>
            {t('common:core.chat.History')}
          </Box>
        </Flex>
      )}

      <Button
        variant={'whitePrimary'}
        flex={['0 0 auto', 1]}
        h={'40px'}
        color={'primary.600'}
        borderRadius={'16px'}
        leftIcon={<MyIcon name={'plus'} w={'24px'} />}
        overflow={'hidden'}
        borderColor={'rgba(28, 28, 28, 0.10)'}
        boxShadow={'none'}
        onClick={() => {
          onChangeChatId();
          setCiteModalData(undefined);
        }}
      >
        {t('common:core.chat.New Chat')}
      </Button>

      {/* {isPc && histories.length > 0 && (
        <PopoverConfirm
          Trigger={
            <Box ml={3} h={'100%'}>
              <IconButton
                variant={'whiteDanger'}
                size={'mdSquare'}
                aria-label={''}
                borderRadius={'50%'}
                icon={<MyIcon name={'common/clearLight'} w={'16px'} />}
              />
            </Box>
          }
          type="delete"
          content={menuConfirmButtonText || t('common:Delete')}
          onConfirm={() => onClearHistory()}
        />
      )} */}
    </Flex>
  );
};

export default ChatSliderMenu;
