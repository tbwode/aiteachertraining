import React, { useMemo, useRef } from 'react';
import { QuestionOutlineIcon } from '@chakra-ui/icons';
import { Box, TableContainer, Table, Flex, IconButton, Tooltip, HStack } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import { ImportDataSourceEnum } from '@fastgpt/global/core/dataset/constants';
import { useTranslation } from 'react-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useRouter } from 'next/router';
import {
  postCreateDatasetApiDatasetCollection,
  postCreateDatasetExternalFileCollection,
  postCreateDatasetFileCollection,
  postCreateDatasetLinkCollection,
  postCreateDatasetTextCollection,
  postReTrainingDatasetFileCollection
} from '@/web/core/dataset/api';
import MyTag from '@fastgpt/web/components/common/Tag/index';
import { useContextSelector } from 'use-context-selector';
import { DatasetPageContext } from '@/web/core/dataset/context/datasetPageContext';
import { DatasetImportContext, type ImportFormType } from '../Context';
import { type ApiCreateDatasetCollectionParams } from '@fastgpt/global/core/dataset/api.d';

const Upload = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const { collectionId = '' } = router.query as {
    collectionId: string;
  };
  const datasetDetail = useContextSelector(DatasetPageContext, (v) => v.datasetDetail);
  const retrainNewCollectionId = useRef('');

  const { importSource, parentId, sources, setSources, processParamsForm, goToPrevious } =
    useContextSelector(DatasetImportContext, (v) => v);

  const { totalFilesCount, waitingFilesCount, allFinished, hasCreatingFiles } = useMemo(() => {
    const totalFilesCount = sources.length;

    const { waitingFilesCount, allFinished, hasCreatingFiles } = sources.reduce(
      (acc, file) => {
        if (file.createStatus === 'waiting') acc.waitingFilesCount++;
        if (file.createStatus === 'creating') acc.hasCreatingFiles = true;
        if (file.createStatus !== 'finish') acc.allFinished = false;
        return acc;
      },
      { waitingFilesCount: 0, allFinished: true, hasCreatingFiles: false }
    );

    return { totalFilesCount, waitingFilesCount, allFinished, hasCreatingFiles };
  }, [sources]);

  const buttonText = useMemo(() => {
    if (waitingFilesCount === totalFilesCount) {
      return t('common:core.dataset.import.Start upload');
    } else if (allFinished) {
      return t('common:core.dataset.import.Upload complete');
    } else {
      return t('common:core.dataset.import.Continue upload');
    }
  }, [waitingFilesCount, totalFilesCount, allFinished, t]);

  const { runAsync: startUpload, loading: isLoading } = useRequest2(
    async ({ customPdfParse, webSelector, ...data }: ImportFormType) => {
      if (sources.length === 0) return;
      const filterWaitingSources = sources.filter((item) => item.createStatus === 'waiting');

      if (importSource === ImportDataSourceEnum.apiDataset) {
        setSources((state) =>
          state.map((source) => ({
            ...source,
            createStatus: 'creating'
          }))
        );

        const apiFiles = filterWaitingSources
          .filter((item) => item.apiFile)
          .map((item) => item.apiFile!);

        await postCreateDatasetApiDatasetCollection({
          ...data,
          parentId,
          datasetId: datasetDetail._id,

          customPdfParse,
          apiFiles
        });
      } else {
        // Batch create collection and upload chunks
        for await (const item of filterWaitingSources) {
          setSources((state) =>
            state.map((source) =>
              source.id === item.id
                ? {
                    ...source,
                    createStatus: 'creating'
                  }
                : source
            )
          );

          // create collection
          const commonParams: ApiCreateDatasetCollectionParams & {
            name: string;
          } = {
            ...data,
            parentId,
            datasetId: datasetDetail._id,
            name: item.sourceName,

            customPdfParse
          };

          if (importSource === ImportDataSourceEnum.reTraining) {
            const res = await postReTrainingDatasetFileCollection({
              ...commonParams,
              collectionId
            });
            retrainNewCollectionId.current = res.collectionId;
          } else if (importSource === ImportDataSourceEnum.fileLocal && item.dbFileId) {
            await postCreateDatasetFileCollection({
              ...commonParams,
              fileId: item.dbFileId
            });
          } else if (importSource === ImportDataSourceEnum.fileLink && item.link) {
            await postCreateDatasetLinkCollection({
              ...commonParams,
              link: item.link,
              metadata: {
                webPageSelector: webSelector
              }
            });
          } else if (importSource === ImportDataSourceEnum.fileCustom && item.rawText) {
            // manual collection
            await postCreateDatasetTextCollection({
              ...commonParams,
              text: item.rawText
            });
          } else if (importSource === ImportDataSourceEnum.externalFile && item.externalFileUrl) {
            await postCreateDatasetExternalFileCollection({
              ...commonParams,
              externalFileUrl: item.externalFileUrl,
              externalFileId: item.externalFileId,
              filename: item.sourceName
            });
          }

          setSources((state) =>
            state.map((source) =>
              source.id === item.id
                ? {
                    ...source,
                    createStatus: 'finish'
                  }
                : source
            )
          );
        }
      }
    },
    {
      onSuccess() {
        if (!sources.some((file) => file.errorMsg !== undefined)) {
          toast({
            title:
              importSource === ImportDataSourceEnum.reTraining
                ? t('dataset:retrain_task_submitted')
                : t('common:core.dataset.import.import_success'),
            status: 'success'
          });
        }

        // Close import page
        router.replace({
          query: {
            datasetId: datasetDetail._id,
            parentId
          }
        });
      },
      onError(error) {
        setSources((state) =>
          state.map((source) =>
            source.createStatus === 'creating'
              ? {
                  ...source,
                  createStatus: 'waiting',
                  errorMsg: error.message || t('file:upload_failed')
                }
              : source
          )
        );
      },
      errorToast: t('file:upload_failed')
    }
  );

  return (
    <Box h={'100%'} overflow={'auto'}>
      <TableContainer>
        <Table variant={'simple'} fontSize={'sm'} draggable={false}>
          <HStack flexDir={'column'}>
            {sources.map((item) => (
              <Flex
                key={item.id}
                justifyContent={'space-between'}
                alignItems={'center'}
                bg={'white'}
                mb={2}
                w={'100%'}
                p={4}
                borderRadius={'md'}
              >
                <Box>
                  <Flex alignItems={'center'}>
                    <MyIcon name={item.icon as any} w={'32px'} mr={2} />
                    <Box>
                      <Box color={'#000'} mb={1}>
                        {item.sourceName}
                      </Box>
                      {!!(item as any).sourceSize && (
                        <Box color={'myGray.500'} fontSize={'xs'}>
                          {(item as any).sourceSize}
                        </Box>
                      )}
                    </Box>
                  </Flex>
                </Box>

                <Box>
                  {!hasCreatingFiles && item.createStatus !== 'finish' && (
                    <Flex alignItems={'center'} gap={4}>
                      <Box>
                        {item.errorMsg ? (
                          <Tooltip label={item.errorMsg} fontSize="md">
                            <Flex alignItems="center">
                              <MyTag colorSchema={'red'}>{t('common:Error')}</MyTag>
                              <QuestionOutlineIcon ml={2} color="red.500" w="14px" />
                            </Flex>
                          </Tooltip>
                        ) : (
                          <>
                            {item.createStatus === 'waiting' && (
                              <MyTag colorSchema={'gray'}>{t('common:Waiting')}</MyTag>
                            )}
                            {item.createStatus === 'creating' && (
                              <MyTag colorSchema={'blue'}>{t('common:Creating')}</MyTag>
                            )}
                            {/* {item.createStatus === 'finish' && (
                              <MyTag colorSchema={'green'}>{t('common:Finish')}</MyTag>
                            )} */}
                          </>
                        )}
                      </Box>
                      <IconButton
                        variant={'grayDanger'}
                        size={'sm'}
                        bg={'white'}
                        icon={<MyIcon name={'delete'} w={'16px'} />}
                        aria-label={''}
                        onClick={() => {
                          setSources((prevFiles) =>
                            prevFiles.filter((file) => file.id !== item.id)
                          );
                        }}
                      />
                    </Flex>
                  )}
                </Box>
              </Flex>
            ))}
          </HStack>
        </Table>
      </TableContainer>

      <Flex justifyContent={'flex-end'} mt={4} gap={3}>
        <Button variant={'whiteBase'} onClick={goToPrevious}>
          {t('common:last_step')}
        </Button>
        <Button
          isLoading={isLoading}
          onClick={processParamsForm.handleSubmit((data) => startUpload(data))}
        >
          {totalFilesCount > 0 &&
            `${t('dataset:total_num_files', {
              total: totalFilesCount
            })} | `}
          {buttonText}
        </Button>
      </Flex>
    </Box>
  );
};

export default Upload;
