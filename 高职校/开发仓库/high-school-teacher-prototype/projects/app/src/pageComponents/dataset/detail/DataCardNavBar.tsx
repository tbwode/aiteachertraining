import React, { useMemo } from 'react';
import { Box, Flex, IconButton } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { useContextSelector } from 'use-context-selector';
import { DatasetPageContext } from '@/web/core/dataset/context/datasetPageContext';
import { useDataCardContext } from './DataCard/Context';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { downloadFetch } from '@/web/common/system/utils';
import RawSourceBox from '@/components/core/dataset/RawSourceBox';
import TagsPopOver from './CollectionCard/TagsPopOver';
import { getCollectionSourceData } from '@fastgpt/global/core/dataset/collection/utils';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { TabEnum } from '@/pages/dataset/detail';
import {
  ImportDataSourceEnum,
  DatasetCollectionTypeEnum
} from '@fastgpt/global/core/dataset/constants';

const DataCardNavBar = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { isPc } = useSystem();
  const { feConfigs } = useSystemStore();

  const datasetDetail = useContextSelector(DatasetPageContext, (v) => v.datasetDetail);
  const datasetId = useContextSelector(DatasetPageContext, (v) => v.datasetId);

  const { collection, setEditDataId, openInsertImagesModal } = useDataCardContext();

  const canWrite = useMemo(() => datasetDetail.permission.hasWritePer, [datasetDetail]);
  const isImageCollection = collection?.type === DatasetCollectionTypeEnum.images;

  const { runAsync: onExportAllChunks, loading: isExportChunksLoading } = useRequest2(
    async (collectionId: string) => {
      await downloadFetch({
        url: '/api/core/dataset/collection/export',
        filename: `${collection?.name}.csv`,
        body: {
          collectionId
        }
      });
    },
    {
      manual: true
    }
  );

  return (
    <Flex
      py={3}
      px={5}
      justify={'space-between'}
      alignItems={'center'}
      bg={'white'}
      borderBottom={'1px solid'}
      borderColor={'myGray.200'}
      mb={'10px'}
    >
      <Flex alignItems={'center'}>
        <IconButton
          icon={<MyIcon name={'common/backFill'} w={'14px'} color={'primary.500'} />}
          bg={'white'}
          boxShadow={'1px 1px 9px rgba(0,0,0,0.15)'}
          size={'xsSquare'}
          borderRadius={'50%'}
          aria-label={t('common:back')}
          mr={4}
          onClick={() => router.back()}
        />

        <Box flex={'1 0 0'} mr={[3, 5]} alignItems={'center'}>
          <Box className="textEllipsis" alignItems={'center'} gap={2} display={isPc ? 'flex' : ''}>
            {collection?._id && (
              <RawSourceBox
                collectionType={collection.type}
                collectionId={collection._id}
                {...getCollectionSourceData(collection)}
                fontSize={['sm', 'md']}
                color={'black'}
                textDecoration={'none'}
              />
            )}
          </Box>
          {feConfigs?.isPlus && !!collection?.tags?.length && (
            <TagsPopOver currentCollection={collection} />
          )}
        </Box>
      </Flex>

      <Flex alignItems={'center'}>
        <Button
          variant={'whitePrimary'}
          size={['sm', 'sm']}
          isDisabled={!collection}
          isLoading={isExportChunksLoading}
          onClick={() => {
            onExportAllChunks(collection?._id!);
          }}
        >
          {t('dataset:collection.export_all_chunks')}
        </Button>

        {datasetDetail.type !== 'websiteDataset' &&
          !!collection?.chunkSize &&
          collection.permission?.hasWritePer && (
            <Button
              ml={2}
              variant={'whitePrimary'}
              size={['sm', 'sm']}
              onClick={() => {
                router.push({
                  query: {
                    datasetId,
                    currentTab: TabEnum.import,
                    source: ImportDataSourceEnum.reTraining,
                    collectionId: collection?._id
                  }
                });
              }}
            >
              {t('dataset:retain_collection')}
            </Button>
          )}
        {canWrite && !isImageCollection && (
          <Button
            ml={2}
            variant={'whitePrimary'}
            size={['sm', 'sm']}
            isDisabled={!collection}
            onClick={() => {
              setEditDataId('');
            }}
          >
            {t('common:dataset.Insert Data')}
          </Button>
        )}
        {canWrite && isImageCollection && (
          <Button
            ml={2}
            variant={'whitePrimary'}
            size={['sm', 'sm']}
            isDisabled={!collection}
            onClick={openInsertImagesModal}
          >
            {t('dataset:insert_images')}
          </Button>
        )}
      </Flex>
    </Flex>
  );
};

export default DataCardNavBar;
