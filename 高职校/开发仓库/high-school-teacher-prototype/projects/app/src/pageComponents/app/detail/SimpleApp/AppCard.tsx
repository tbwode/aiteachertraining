import React, { useState } from 'react';
import { Box, Flex, IconButton, HStack, ModalBody, Checkbox, ModalFooter } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import { useRouter } from 'next/router';
import { type AppSchema, type AppSimpleEditFormType } from '@fastgpt/global/core/app/type.d';
import { useTranslation } from 'react-i18next';
import Avatar from '@fastgpt/web/components/common/Avatar';
import MyIcon from '@fastgpt/web/components/common/Icon';
import TagsEditModal from '../TagsEditModal';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { AppContext } from '@/pageComponents/app/detail/context';
import { useContextSelector } from 'use-context-selector';
import MyMenu from '@fastgpt/web/components/common/MyMenu';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { postTransition2Workflow } from '@/web/core/app/api/app';
import { form2AppWorkflow } from '@/web/core/app/utils';
import { type SimpleAppSnapshotType } from './useSnapshots';
import ExportConfigPopover from '@/pageComponents/app/detail/ExportConfigPopover';
import { ChatSidebarPaneEnum } from '@/pageComponents/chat/constants';

const AppCard = ({
  appForm,
  setPast
}: {
  appForm: AppSimpleEditFormType;
  setPast: (value: React.SetStateAction<SimpleAppSnapshotType[]>) => void;
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const onSaveApp = useContextSelector(AppContext, (v) => v.onSaveApp);
  const appDetail = useContextSelector(AppContext, (v) => v.appDetail);
  const onOpenInfoEdit = useContextSelector(AppContext, (v) => v.onOpenInfoEdit);
  const onDelApp = useContextSelector(AppContext, (v) => v.onDelApp);

  const appId = appDetail._id;
  const { feConfigs } = useSystemStore();
  const [TeamTagsSet, setTeamTagsSet] = useState<AppSchema>();

  // transition to workflow
  const [transitionCreateNew, setTransitionCreateNew] = useState<boolean>();
  const { runAsync: onTransition, loading: transiting } = useRequest2(
    async () => {
      const { nodes, edges } = form2AppWorkflow(appForm, t);
      await onSaveApp({
        nodes,
        edges,
        chatConfig: appForm.chatConfig,
        isPublish: false,
        versionName: t('app:transition_to_workflow')
      });

      return postTransition2Workflow({ appId, createNew: transitionCreateNew });
    },
    {
      onSuccess: ({ id }) => {
        if (id) {
          router.replace({
            query: {
              appId: id
            }
          });
        } else {
          setPast([]);
          router.reload();
        }
      },
      successToast: t('common:Success')
    }
  );

  return (
    <>
      {/* basic info */}
      <Flex position={'relative'} alignItems={'center'}>
        <Flex alignItems={'center'} gap={'14px'}>
          <Avatar src={appDetail.avatar} w={'45px'} h={'45px'} borderRadius={'6px'} />
          <Box
            fontWeight={'bold'}
            color={'#000'}
            fontSize={'18px'}
            noOfLines={1}
            maxW={'160px'}
            wordBreak={'break-all'}
          >
            {appDetail.name}
          </Box>
        </Flex>
        <HStack alignItems={'center'} spacing={'14px'} ml="14px">
          {appDetail.permission.isOwner && (
            <MyMenu
              size={'xs'}
              Button={
                <IconButton
                  variant={'whitePrimary'}
                  size={['smSquare', 'mdSquare']}
                  icon={<MyIcon name={'common/select'} w={'18px'} color={'#1C1C1C'} />}
                  w={'34px'}
                  h={'34px'}
                  bg={'white'}
                  borderRadius={'12px!important'}
                  borderColor={'rgba(28, 28, 28, 0.10)!important'}
                  aria-label={'Expand'}
                  _hover={{
                    bg: 'myGray.50'
                  }}
                />
              }
              menuList={[
                ...(appDetail.permission.hasManagePer
                  ? [
                      {
                        children: [
                          {
                            icon: 'common/settingLight',
                            label: t('common:Setting'),
                            onClick: onOpenInfoEdit
                          }
                        ]
                      }
                    ]
                  : []),
                {
                  children: [
                    {
                      label: (
                        <Flex>
                          <ExportConfigPopover
                            appName={appDetail.name}
                            appForm={appForm}
                            chatConfig={appDetail.chatConfig}
                          />
                        </Flex>
                      )
                    },
                    {
                      icon: 'core/app/type/workflow',
                      label: t('app:transition_to_workflow'),
                      onClick: () => setTransitionCreateNew(true)
                    },
                    ...(appDetail.permission.hasWritePer && feConfigs?.show_team_chat
                      ? [
                          {
                            icon: 'core/chat/fileSelect',
                            label: t('app:team_tags_set'),
                            onClick: () => setTeamTagsSet(appDetail)
                          }
                        ]
                      : [])
                  ]
                },
                {
                  children: [
                    {
                      icon: 'delete',
                      type: 'danger',
                      label: t('common:Delete'),
                      onClick: onDelApp
                    }
                  ]
                }
              ]}
            />
          )}

          <IconButton
            variant={'whitePrimary'}
            size={['smSquare', 'mdSquare']}
            icon={<MyIcon name={'chat/message'} w={'14px'} color={'#1C1C1C'} />}
            w={'34px'}
            h={'34px'}
            bg={'white'}
            borderRadius={'12px!important'}
            borderColor={'rgba(28, 28, 28, 0.10)!important'}
            aria-label={'Expand'}
            _hover={{
              bg: 'myGray.50'
            }}
            onClick={() =>
              window.open(
                `/chat?appId=${appId}&pane=${ChatSidebarPaneEnum.RECENTLY_USED_APPS}`,
                '_blank'
              )
            }
          />
          <Box flex={1} />
          {/* {isPc && ( */}
          {/*   <MyTag */}
          {/*     type="borderFill" */}
          {/*     colorSchema="gray" */}
          {/*     onClick={() => (appDetail.permission.hasManagePer ? onOpenInfoEdit() : undefined)} */}
          {/*   > */}
          {/*     <PermissionIconText defaultPermission={appDetail.defaultPermission} /> */}
          {/*   </MyTag> */}
          {/* )} */}
        </HStack>
      </Flex>
      {TeamTagsSet && <TagsEditModal onClose={() => setTeamTagsSet(undefined)} />}
      {transitionCreateNew !== undefined && (
        <MyModal isOpen title={t('app:transition_to_workflow')} iconSrc="core/app/type/workflow">
          <ModalBody>
            <Box mb={3}>{t('app:transition_to_workflow_create_new_tip')}</Box>
            <HStack cursor={'pointer'} onClick={() => setTransitionCreateNew((state) => !state)}>
              <Checkbox
                isChecked={transitionCreateNew}
                icon={<MyIcon name={'common/check'} w={'12px'} />}
              />
              <Box>{t('app:transition_to_workflow_create_new_placeholder')}</Box>
            </HStack>
          </ModalBody>
          <ModalFooter>
            <Button variant={'whiteBase'} onClick={() => setTransitionCreateNew(undefined)} mr={3}>
              {t('common:Close')}
            </Button>
            <Button variant={'dangerFill'} isLoading={transiting} onClick={() => onTransition()}>
              {t('common:Confirm')}
            </Button>
          </ModalFooter>
        </MyModal>
      )}
    </>
  );
};

export default React.memo(AppCard);
