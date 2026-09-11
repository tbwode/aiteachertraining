import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Flex, IconButton, useTheme, Progress, Tag, HStack } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useRouter } from 'next/router';
import { useContextSelector } from 'use-context-selector';
import { DatasetPageContext } from '@/web/core/dataset/context/datasetPageContext';
import { DatasetImportContext } from './Import/Context';
import LightRowTabs from '@fastgpt/web/components/common/Tabs/LightRowTabs';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import FolderPath from '@/components/common/folder/Path';
import { DatasetTypeMap } from '@fastgpt/global/core/dataset/constants';
import dynamic from 'next/dynamic';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import type { EditResourceInfoFormType } from '@/components/common/Modal/EditResourceModal';

export enum TabEnum {
  dataCard = 'dataCard',
  collectionCard = 'collectionCard',
  test = 'test',
  info = 'info',
  import = 'import'
}

const NavBar = ({
  currentTab,
  onOpenConfig
}: {
  currentTab: TabEnum;
  onOpenConfig?: () => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const query = router.query;
  const { isPc } = useSystem();
  const { datasetDetail, rebuildingCount, paths, updateDataset } = useContextSelector(
    DatasetPageContext,
    (v) => v
  );
  const { activeStep, goToPrevious } = useContextSelector(DatasetImportContext, (v) => ({
    activeStep: v.activeStep,
    goToPrevious: v.goToPrevious
  }));

  const [editedDataset, setEditedDataset] = useState<EditResourceInfoFormType>();
  const EditResourceModal = useMemo(
    () => dynamic(() => import('@/components/common/Modal/EditResourceModal')),
    []
  );
  const { runAsync: onEditBaseInfo } = useRequest2(updateDataset, {
    onSuccess() {
      setEditedDataset(undefined);
    },
    successToast: t('common:update_success'),
    errorToast: t('common:update_failed')
  });

  const tabList = [
    {
      label: t('common:core.dataset.Collection'),
      value: TabEnum.collectionCard
    },
    { label: t('common:core.dataset.test.Search Test'), value: TabEnum.test },
    ...(datasetDetail.permission.hasManagePer && !isPc
      ? [{ label: t('common:Config'), value: TabEnum.info }]
      : [])
  ];

  const setCurrentTab = useCallback(
    (tab: TabEnum) => {
      router.replace({
        query: {
          datasetId: query.datasetId,
          currentTab: tab
        }
      });
    },
    [query, router]
  );

  return (
    <>
      {isPc ? (
        currentTab === TabEnum.dataCard || currentTab === TabEnum.import ? (
          <Flex
            py={3}
            px={5}
            mb={3}
            alignItems={'center'}
            bg={'white'}
            borderBottom={'1px solid'}
            borderColor={'myGray.200'}
          >
            {currentTab === TabEnum.dataCard && (
              <Flex alignItems={'center'} cursor={'pointer'} onClick={() => router.back()}>
                <IconButton
                  icon={<MyIcon name={'common/backFill'} w={'14px'} color={'primary.500'} />}
                  bg={'white'}
                  boxShadow={'1px 1px 9px rgba(0,0,0,0.15)'}
                  size={'xsSquare'}
                  borderRadius={'50%'}
                  aria-label={t('common:back')}
                  mr={2}
                  _hover={{
                    bg: 'rgba(0,0,0,0.05)'
                  }}
                />
                <Box fontWeight={'bold'} fontSize={'md'}>
                  {t('common:back')}
                </Box>
              </Flex>
            )}
            {currentTab === TabEnum.import && (
              <Flex alignItems={'center'} cursor={'pointer'} onClick={() => router.back()}>
                <IconButton
                  icon={<MyIcon name={'common/backFill'} w={'14px'} color={'primary.500'} />}
                  bg={'white'}
                  boxShadow={'1px 1px 9px rgba(0,0,0,0.15)'}
                  size={'xsSquare'}
                  borderRadius={'50%'}
                  aria-label={t('common:Exit')}
                  mr={2}
                  _hover={{
                    bg: 'rgba(0,0,0,0.05)'
                  }}
                />
                <Box fontWeight={'bold'} fontSize={'md'}>
                  {t('common:Exit')}
                </Box>
              </Flex>
            )}
          </Flex>
        ) : (
          <Flex
            py={3}
            px={5}
            justify={'space-between'}
            alignItems={'center'}
            bg={'white'}
            borderBottom={'1px solid'}
            borderColor={'myGray.200'}
          >
            {/* Left: Info */}
            <Flex alignItems={'center'}>
              <IconButton
                icon={<MyIcon name={'common/backFill'} w={'14px'} color={'primary.500'} />}
                bg={'white'}
                boxShadow={'1px 1px 9px rgba(0,0,0,0.15)'}
                size={'xsSquare'}
                borderRadius={'50%'}
                aria-label={''}
                mr={4}
                onClick={() => {
                  router.push('/dataset/list');
                }}
              />
              <Box
                w={'34px'}
                h={'34px'}
                mr={3}
                bg={'myGray.100'}
                borderRadius={'md'}
                display={'flex'}
                alignItems={'center'}
                justifyContent={'center'}
                border={'1px solid'}
                borderColor={'myGray.200'}
              >
                <MyIcon name={datasetDetail.avatar as any} w={'20px'} />
              </Box>
              <Box>
                <Flex alignItems={'center'}>
                  <Box fontWeight={'bold'} fontSize={'md'} mr={2}>
                    {datasetDetail.name}
                  </Box>
                  <Tag
                    size={'sm'}
                    colorScheme={'gray'}
                    color={'#1D2129'}
                    variant={'solid'}
                    bg={'myGray.100'}
                  >
                    {t(DatasetTypeMap[datasetDetail?.type]?.label as any)}
                  </Tag>
                  {datasetDetail.permission.hasManagePer && (
                    <MyIcon
                      pl={1.5}
                      name={'edit'}
                      _hover={{ color: 'primary.600' }}
                      w={'0.875rem'}
                      cursor={'pointer'}
                      onClick={() =>
                        setEditedDataset({
                          id: datasetDetail._id,
                          name: datasetDetail.name,
                          avatar: datasetDetail.avatar,
                          intro: datasetDetail.intro
                        })
                      }
                    />
                  )}
                </Flex>
                <Box fontSize={'xs'} color={'myGray.500'} maxW={'300px'} className={'textEllipsis'}>
                  {datasetDetail.intro || t('common:core.dataset.Intro Placeholder')}
                </Box>
              </Box>
            </Flex>

            {/* Center: Tabs */}
            <Box position={'absolute'} left={'50%'} transform={'translateX(-50%)'}>
              <Flex bg={'myGray.100'} p={1} borderRadius={'xl'}>
                {tabList.map((tab) => (
                  <Box
                    key={tab.value}
                    px={4}
                    py={1}
                    cursor={'pointer'}
                    borderRadius={'lg'}
                    fontSize={'sm'}
                    fontWeight={500}
                    {...(currentTab === tab.value
                      ? {
                          bg: 'white',
                          color: 'black',
                          boxShadow: 'sm'
                        }
                      : {
                          color: 'myGray.500',
                          _hover: { color: 'black' }
                        })}
                    onClick={() => setCurrentTab(tab.value)}
                  >
                    {tab.label}
                  </Box>
                ))}
              </Flex>
            </Box>

            {/* Right: Actions */}
            <HStack spacing={3}>
              {rebuildingCount > 0 && (
                <Button
                  leftIcon={<MyIcon name={'common/loading'} w={'16px'} />}
                  size={'sm'}
                  variant={'whiteBase'}
                  isLoading
                >
                  {t('common:dataset.Rebuilding Count', { count: rebuildingCount })}
                </Button>
              )}

              {datasetDetail.permission.hasManagePer && (
                <IconButton
                  icon={<MyIcon name={'common/settingLight'} w={'18px'} />}
                  aria-label={t('common:Config')}
                  size={'sm'}
                  borderRadius={'12px'}
                  variant={'whiteBase'}
                  onClick={onOpenConfig}
                />
              )}
            </HStack>
          </Flex>
        )
      ) : (
        <Box mb={2}>
          <LightRowTabs<TabEnum>
            m={'auto'}
            w={'full'}
            size={'sm'}
            list={tabList}
            value={currentTab}
            onChange={setCurrentTab}
          />
        </Box>
      )}
      {editedDataset && (
        <EditResourceModal
          {...editedDataset}
          title={t('common:dataset.Edit Info')}
          onClose={() => setEditedDataset(undefined)}
          onEdit={(data) =>
            onEditBaseInfo({
              id: editedDataset.id,
              name: data.name,
              intro: data.intro,
              avatar: data.avatar
            })
          }
        />
      )}
    </>
  );
};

export default NavBar;
