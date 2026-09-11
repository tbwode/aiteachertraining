import React, { useMemo } from 'react';
import { Box, Divider, Flex, Switch } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import FormLabel from '@fastgpt/web/components/common/MyBox/FormLabel';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import {
  getPlaygroundVisibilityConfig,
  updatePlaygroundVisibilityConfig
} from '@/web/support/outLink/api';
import type { PlaygroundVisibilityConfigType } from '@fastgpt/global/support/outLink/type';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useCopyData } from '@fastgpt/web/hooks/useCopyData';
import { ChatSidebarPaneEnum } from '@/pageComponents/chat/constants';

const defaultPlaygroundVisibilityForm: PlaygroundVisibilityConfigType = {
  showRunningStatus: true,
  showCite: true,
  showFullText: true,
  canDownloadSource: true,
  showWholeResponse: true
};

const PlaygroundVisibilityConfig = ({ appId }: { appId: string }) => {
  const { t } = useTranslation();
  const { copyData } = useCopyData();

  const { register, watch, setValue, reset } = useForm({
    defaultValues: defaultPlaygroundVisibilityForm
  });

  const showCite = watch('showCite');
  const showFullText = watch('showFullText');
  const canDownloadSource = watch('canDownloadSource');
  const showRunningStatus = watch('showRunningStatus');
  const showWholeResponse = watch('showWholeResponse');

  const playgroundLink = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/chat?appId=${appId}&pane=${ChatSidebarPaneEnum.RECENTLY_USED_APPS}`;
    }
    return '';
  }, [appId]);

  useRequest2(() => getPlaygroundVisibilityConfig({ appId }), {
    onSuccess: (data) => {
      reset({
        showRunningStatus: data.showRunningStatus,
        showCite: data.showCite,
        showFullText: data.showFullText,
        canDownloadSource: data.canDownloadSource,
        showWholeResponse: data.showWholeResponse
      });
    },
    manual: false
  });

  const { runAsync: saveConfig } = useRequest2(
    async (data: PlaygroundVisibilityConfigType) => {
      return await updatePlaygroundVisibilityConfig({
        appId,
        ...data
      });
    },
    {
      successToast: t('common:save_success')
    }
  );

  const autoSave = async () => {
    const values = watch();
    await saveConfig(values);
  };

  return (
    <Flex flexDirection="column" h="100%">
      <Box fontWeight={'bold'} fontSize={['md', '16px']} color={'myBlack.pure'} mb={'14px'}>
        {t('publish:playground.title')}
      </Box>
      <Flex
        flex={1}
        minH={0}
        overflowY={'auto'}
        flexDirection="column"
        borderRadius={'8px'}
        bg="white"
        p={5}
      >
        <Box fontSize={'sm'} fontWeight={'medium'} color={'myGray.900'} mb={3}>
          {t('app:publish.playground_link')}
        </Box>

        <Box borderRadius={'md'} bg={'myGray.100'} overflow={'hidden'} fontSize={'sm'}>
          <Flex
            p={3}
            bg={'#fff'}
            border="base"
            borderTopLeftRadius={'md'}
            borderTopRightRadius={'md'}
            alignItems={'center'}
          >
            <Box flex={1} fontSize={'base'} color={'myBlack.base'}>
              {t('common:core.app.outLink.Link block title')}
            </Box>
            <MyIcon
              name={'chat/copy'}
              w={'16px'}
              color={'myGray.600'}
              cursor={'pointer'}
              _hover={{ color: 'primary.500' }}
              onClick={() => copyData(playgroundLink)}
            />
          </Flex>
          <Box whiteSpace={'nowrap'} p={3} overflowX={'auto'}>
            {playgroundLink}
          </Box>
        </Box>

        <Divider color="#E5E6EB" my={5} />

        <Box fontSize={'15px'} fontWeight={'medium'} color={'myBlack.base'}>
          {t('publish:private_config')}
        </Box>

        <Flex flexDirection="column" gap={5} mt={4}>
          <Flex gap={'14px'} flexWrap={'wrap'}>
            <Flex
              alignItems={'center'}
              border={'base'}
              borderRadius={'10px'}
              py={'14px'}
              px={'18px'}
            >
              <FormLabel fontSize={'12px'} flex={'0 0 220px'}>
                {t('publish:show_node')}
              </FormLabel>
              <Switch
                {...register('showRunningStatus', {
                  onChange: autoSave
                })}
                isChecked={showRunningStatus}
              />
            </Flex>
            <Flex
              alignItems={'center'}
              border={'base'}
              borderRadius={'10px'}
              py={'14px'}
              px={'18px'}
            >
              <Flex alignItems={'center'} flex={'0 0 220px'}>
                <FormLabel fontSize={'12px'}>
                  {t('common:core.chat.response.Read complete response')}
                </FormLabel>
                <QuestionTip
                  ml={1}
                  label={t('common:core.chat.response.Read complete response tips')}
                />
              </Flex>
              <Switch
                {...register('showWholeResponse', {
                  onChange: autoSave
                })}
                isChecked={showWholeResponse}
              />
            </Flex>
          </Flex>
          <Flex gap={'14px'} flexWrap={'wrap'}>
            <Flex
              alignItems={'center'}
              border={'base'}
              borderRadius={'10px'}
              py={'14px'}
              px={'18px'}
            >
              <Flex alignItems={'center'} flex={'0 0 220px'}>
                <FormLabel fontSize={'12px'}>
                  {t('common:support.outlink.share.Response Quote')}
                </FormLabel>
                <QuestionTip ml={1} label={t('common:support.outlink.share.Response Quote tips')} />
              </Flex>
              <Switch
                {...register('showCite', {
                  onChange(e) {
                    if (!e.target.checked) {
                      setValue('showFullText', false);
                      setValue('canDownloadSource', false);
                    }
                    autoSave();
                  }
                })}
                isChecked={showCite}
              />
            </Flex>
            <Flex
              alignItems={'center'}
              border={'base'}
              borderRadius={'10px'}
              py={'14px'}
              px={'18px'}
            >
              <Flex alignItems={'center'} flex={'0 0 220px'}>
                <FormLabel fontSize={'12px'}>{t('common:core.app.share.Show full text')}</FormLabel>
                <QuestionTip ml={1} label={t('common:support.outlink.share.Show full text tips')} />
              </Flex>
              <Switch
                {...register('showFullText', {
                  onChange(e) {
                    if (!e.target.checked) {
                      setValue('canDownloadSource', false);
                    } else {
                      setValue('showCite', true);
                    }
                    autoSave();
                  }
                })}
                isChecked={showFullText}
              />
            </Flex>
            <Flex
              alignItems={'center'}
              border={'base'}
              borderRadius={'10px'}
              py={'14px'}
              px={'18px'}
            >
              <Flex alignItems={'center'} flex={'0 0 220px'}>
                <FormLabel fontSize={'12px'} fontWeight={'medium'}>
                  {t('common:core.app.share.Download source')}
                </FormLabel>
                <QuestionTip
                  ml={1}
                  label={t('common:support.outlink.share.Download source tips')}
                />
              </Flex>
              <Switch
                {...register('canDownloadSource', {
                  onChange(e) {
                    if (e.target.checked) {
                      setValue('showFullText', true);
                      setValue('showCite', true);
                    }
                    autoSave();
                  }
                })}
                isChecked={canDownloadSource}
              />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default PlaygroundVisibilityConfig;
