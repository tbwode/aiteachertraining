import { Box, Flex, HStack, IconButton } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import React, { useState } from 'react';
import { AppContext } from '../context';
import { useContextSelector } from 'use-context-selector';
import Avatar from '@fastgpt/web/components/common/Avatar';
import { useTranslation } from 'react-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';
import MyMenu from '@fastgpt/web/components/common/MyMenu';
import { type AppSchema } from '@fastgpt/global/core/app/type';
import TagsEditModal from '../TagsEditModal';

const AppCard = () => {
  const { t } = useTranslation();

  const appDetail = useContextSelector(AppContext, (v) => v.appDetail);
  const onOpenInfoEdit = useContextSelector(AppContext, (v) => v.onOpenInfoEdit);
  const onDelApp = useContextSelector(AppContext, (v) => v.onDelApp);

  const [TeamTagsSet, setTeamTagsSet] = useState<AppSchema>();

  return (
    <>
      <Flex position={'relative'} alignItems={'center'}>
        <Flex alignItems={'center'} gap={'14px'}>
          <Avatar src={appDetail.avatar} w={'45px'} h={'45px'} borderRadius={'6px'} />
          <Box>
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
            <Box noOfLines={1} wordBreak={'break-all'} color={'#86909C'} fontSize={'mini'}>
              {appDetail.intro || t('common:core.app.tip.Add a intro to app')}
            </Box>
          </Box>
        </Flex>

        <HStack alignItems={'center'} spacing={'14px'} ml="14px">
          {appDetail.permission.hasManagePer && (
            <IconButton
              variant={'whitePrimary'}
              size={['smSquare', 'mdSquare']}
              icon={<MyIcon name={'common/settingLight'} w={'14px'} color={'#1C1C1C'} />}
              w={'34px'}
              h={'34px'}
              bg={'white'}
              borderRadius={'12px!important'}
              borderColor={'rgba(28, 28, 28, 0.10)!important'}
              aria-label={'Expand'}
              _hover={{
                bg: 'myGray.50'
              }}
              onClick={onOpenInfoEdit}
            />
          )}

          {appDetail.permission.isOwner && (
            <MyMenu
              size={'xs'}
              Button={
                <IconButton
                  variant={'whitePrimary'}
                  size={['smSquare', 'mdSquare']}
                  w={'34px'}
                  h={'34px'}
                  bg={'white'}
                  borderColor={'rgba(28, 28, 28, 0.10)!important'}
                  borderRadius={'12px!important'}
                  icon={<MyIcon name={'chat/more_small'} w={'1rem'} />}
                  aria-label={''}
                />
              }
              menuList={[
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
          <Box flex={1} />
        </HStack>
      </Flex>
      {TeamTagsSet && <TagsEditModal onClose={() => setTeamTagsSet(undefined)} />}
    </>
  );
};

export default React.memo(AppCard);
