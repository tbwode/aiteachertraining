import React, { useEffect, useMemo, useState } from 'react';
import { Box, Textarea, Flex, useTheme, useDisclosure, Center } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import {
  useSearchTestStore,
  type SearchTestStoreItemType
} from '@/web/core/dataset/store/searchTest';
import { postSearchText } from '@/web/core/dataset/api';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useRequest, useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { formatTimeToChatTime } from '@fastgpt/global/common/string/time';
import { getErrText } from '@fastgpt/global/common/error/utils';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { customAlphabet } from 'nanoid';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { useTranslation } from 'react-i18next';
import { type SearchTestResponse } from '@/global/core/dataset/api';
import {
  DatasetSearchModeEnum,
  DatasetSearchModeMap
} from '@fastgpt/global/core/dataset/constants';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import MySelect from '@fastgpt/web/components/common/MySelect';
import { useSelectFile } from '@/web/common/file/hooks/useSelectFile';
import { fileDownload } from '@/web/common/file/utils';
import QuoteItem from '@/components/core/dataset/QuoteItem';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import SearchParamsTip from '@/components/core/dataset/SearchParamsTip';
import { useContextSelector } from 'use-context-selector';
import { DatasetPageContext } from '@/web/core/dataset/context/datasetPageContext';
import EmptyTip from '@fastgpt/web/components/common/EmptyTip';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import { getNanoid } from '@fastgpt/global/common/string/tools';

const DatasetParamsModal = dynamic(() => import('@/components/core/app/DatasetParamsModal'));

type FormType = {
  inputText: string;
  searchParams: {
    searchMode: `${DatasetSearchModeEnum}`;
    embeddingWeight?: number;

    usingReRank?: boolean;
    rerankModel?: string;
    rerankWeight?: number;

    similarity?: number;
    limit?: number;
    datasetSearchUsingExtensionQuery?: boolean;
    datasetSearchExtensionModel?: string;
    datasetSearchExtensionBg?: string;
  };
};

const Test = ({ datasetId }: { datasetId: string }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { defaultModels } = useSystemStore();
  const datasetDetail = useContextSelector(DatasetPageContext, (v) => v.datasetDetail);
  const { pushDatasetTestItem } = useSearchTestStore();
  const [inputType, setInputType] = useState<'text' | 'file'>('text');
  const [datasetTestItem, setDatasetTestItem] = useState<SearchTestStoreItemType>();
  const [isFocus, setIsFocus] = useState(false);
  const { File, onOpen } = useSelectFile({
    fileType: '.csv',
    multiple: false
  });
  const [selectFile, setSelectFile] = useState<File>();

  const { getValues, setValue, register, handleSubmit } = useForm<FormType>({
    defaultValues: {
      inputText: '',
      searchParams: {
        searchMode: DatasetSearchModeEnum.embedding,
        embeddingWeight: 0.5,
        usingReRank: true,
        rerankModel: defaultModels?.rerank?.model,
        rerankWeight: 0.5,
        limit: 5000,
        similarity: 0,
        datasetSearchUsingExtensionQuery: false,
        datasetSearchExtensionModel: defaultModels.llm?.model,
        datasetSearchExtensionBg: ''
      }
    }
  });

  const searchModeData = DatasetSearchModeMap[getValues(`searchParams.searchMode`)];
  const searchParams = getValues('searchParams');

  const {
    isOpen: isOpenSelectMode,
    onOpen: onOpenSelectMode,
    onClose: onCloseSelectMode
  } = useDisclosure();

  const { runAsync: onTextTest, loading: textTestIsLoading } = useRequest2(
    ({ inputText, searchParams }: FormType) =>
      postSearchText({ datasetId, text: inputText.trim(), ...searchParams }),
    {
      onSuccess(res: SearchTestResponse) {
        if (!res || res.list.length === 0) {
          return toast({
            status: 'warning',
            title: t('common:dataset.test.noResult')
          });
        }

        const testItem: SearchTestStoreItemType = {
          id: getNanoid(),
          datasetId,
          text: getValues('inputText').trim(),
          time: new Date(),
          results: res.list,
          duration: res.duration,
          searchMode: res.searchMode,
          usingReRank: res.usingReRank,
          limit: res.limit,
          similarity: res.similarity,
          queryExtensionModel: res.queryExtensionModel
        };
        pushDatasetTestItem(testItem);
        setDatasetTestItem(testItem);
      }
    }
  );

  const onSelectFile = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setSelectFile(file);
  };

  useEffect(() => {
    setDatasetTestItem(undefined);
  }, [datasetId]);

  return (
    <Box h={'100%'} display={['block', 'flex']}>
      {/* left  */}
      <Box
        h={['auto', '100%']}
        display={['block', 'flex']}
        flexDirection={'column'}
        flex={1}
        maxW={'500px'}
        py={4}
        bg={'#f9f9f9'}
        borderRight={'1px solid #E5E6EB'}
      >
        <Box
          border={'1px solid'}
          mx={4}
          bg={'#fff'}
          borderRadius={'md'}
          {...(isFocus
            ? {
                borderColor: '#E5E6EB'
              }
            : {
                borderColor: '#E5E6EB'
              })}
        >
          {/* header */}
          <Flex
            alignItems={'center'}
            justifyContent={'space-between'}
            p={3}
            borderBottom={'1px solid #E5E6EB'}
          >
            <MySelect<'text' | 'file'>
              size={'sm'}
              list={[
                {
                  label: (
                    <Flex alignItems={'center'}>
                      <MyIcon mr={2} name={'text'} w={'14px'} color={'primary.600'} />
                      <Box fontSize={'sm'} fontWeight={'bold'} flex={1}>
                        {t('common:core.dataset.test.Test Text')}
                      </Box>
                    </Flex>
                  ),
                  value: 'text'
                }
                // {
                //   label: (
                //     <Flex alignItems={'center'}>
                //       <MyIcon mr={2} name={'file/csv'} w={'14px'} color={'primary.600'} />
                //       <Box fontSize={'sm'} fontWeight={'bold'} flex={1}>
                //         {t('common:core.dataset.test.Batch test')}
                //       </Box>
                //     </Flex>
                //   ),
                //   value: 'file'
                // }
              ]}
              border={'1px solid #E5E6EB'}
              borderRadius={'12px'}
              shadow={'none'}
              value={inputType}
              onChange={(e) => setInputType(e)}
            />

            <Button
              variant={'whitePrimary'}
              leftIcon={<MyIcon name={searchModeData.icon as any} w={'14px'} />}
              size={'sm'}
              borderRadius={'12px'}
              color={'black'}
              fontWeight={'400'}
              onClick={onOpenSelectMode}
            >
              {t(searchModeData.title as any)}
            </Button>
          </Flex>

          <Box h={'180px'}>
            {inputType === 'text' && (
              <Textarea
                p={3}
                h={'100%'}
                resize={'none'}
                variant={'unstyled'}
                maxLength={datasetDetail.vectorModel?.maxToken}
                placeholder={t('common:core.dataset.test.Test Text Placeholder')}
                onFocus={() => setIsFocus(true)}
                {...register('inputText', {
                  required: true,
                  onBlur: () => {
                    setIsFocus(false);
                  }
                })}
                _placeholder={{
                  fontSize: 'sm'
                }}
              />
            )}
            {inputType === 'file' && (
              <Box pt={5}>
                <Flex
                  p={3}
                  borderRadius={'md'}
                  borderWidth={'1px'}
                  borderColor={'borderColor.base'}
                  borderStyle={'dashed'}
                  bg={'white'}
                  cursor={'pointer'}
                  justifyContent={'center'}
                  _hover={{
                    bg: 'primary.100',
                    borderColor: 'primary.500',
                    borderStyle: 'solid'
                  }}
                  onClick={onOpen}
                >
                  <MyIcon mr={2} name={'file/csv'} w={'24px'} />
                  <Box>
                    {selectFile
                      ? selectFile.name
                      : t('common:core.dataset.test.Batch test Placeholder')}
                  </Box>
                </Flex>
                <Box mt={3} fontSize={'sm'}>
                  {t('common:info.csv_message')}
                  <Box
                    as={'span'}
                    color={'primary.600'}
                    cursor={'pointer'}
                    onClick={() => {
                      fileDownload({
                        text: `"${t('common:question')}"\n"${t('common:question')}1"\n"${t('common:question')}2"\n"${t('common:question')}3"`,

                        type: 'text/csv',
                        filename: 'Test Template'
                      });
                    }}
                  >
                    {t('common:info.csv_download')}
                  </Box>
                </Box>
              </Box>
            )}
          </Box>

          <Flex justifyContent={'flex-end'} p={3}>
            <Button
              borderRadius={'12px'}
              size={'sm'}
              isLoading={textTestIsLoading}
              isDisabled={inputType === 'file' && !selectFile}
              onClick={() => {
                if (inputType === 'text') {
                  handleSubmit((data) => onTextTest(data))();
                } else {
                  // handleSubmit((data) => onFileTest(data))();
                }
              }}
            >
              {t('common:core.dataset.test.Test')}
            </Button>
          </Flex>
        </Box>
        <Box mt={5} px={4} overflow={'overlay'} display={['none', 'block']}>
          <TestHistories
            datasetId={datasetId}
            datasetTestItem={datasetTestItem}
            setDatasetTestItem={setDatasetTestItem}
          />
        </Box>
      </Box>
      {/* result show */}
      <Box p={4} h={['auto', '100%']} overflow={'overlay'} flex={'1 0 0'} bg={'#f9f9f9'}>
        <TestResults datasetTestItem={datasetTestItem} />
      </Box>

      {isOpenSelectMode && (
        <DatasetParamsModal
          {...searchParams}
          maxTokens={20000}
          onClose={onCloseSelectMode}
          onSuccess={(e) => {
            setValue('searchParams', {
              ...searchParams,
              ...e
            });
          }}
        />
      )}
      <File onSelect={onSelectFile} />
    </Box>
  );
};

export default React.memo(Test);

const TestHistories = React.memo(function TestHistories({
  datasetId,
  datasetTestItem,
  setDatasetTestItem
}: {
  datasetId: string;
  datasetTestItem?: SearchTestStoreItemType;
  setDatasetTestItem: React.Dispatch<React.SetStateAction<SearchTestStoreItemType | undefined>>;
}) {
  const { t } = useTranslation();
  const { datasetTestList, delDatasetTestItemById } = useSearchTestStore();

  const testHistories = useMemo(
    () => datasetTestList.filter((item) => item.datasetId === datasetId),
    [datasetId, datasetTestList]
  );

  return (
    <>
      <Flex alignItems={'center'} color={'black'}>
        <MyIcon mr={2} name={'history'} w={'18px'} h={'18px'} color={'#000'} />
        <Box fontSize={'15px'} fontWeight={'500'}>
          {t('common:core.dataset.test.test history')}
        </Box>
      </Flex>
      <Box mt={2}>
        {testHistories.map((item) => (
          <Flex
            key={item.id}
            py={2}
            px={3}
            alignItems={'center'}
            borderRadius={'md'}
            _notLast={{
              mb: 2
            }}
            _hover={{
              bg: 'rgba(0, 0, 0, 0.04)',
              '& .delete': {
                display: 'block'
              },
              '& .time': {
                display: 'none'
              }
            }}
            cursor={'pointer'}
            fontSize={'sm'}
            {...(item.id === datasetTestItem?.id && {
              bg: 'rgba(0, 0, 0, 0.04)'
            })}
            onClick={() => setDatasetTestItem(item)}
          >
            <Box flex={'0 0 auto'} mr={2}>
              {DatasetSearchModeMap[item.searchMode] ? (
                <Flex alignItems={'center'} fontWeight={'500'} color={'black'} gap={1}>
                  <Center bg={'white'} w={'24px'} h={'24px'} borderRadius={'full'}>
                    <MyIcon
                      name={DatasetSearchModeMap[item.searchMode].icon as any}
                      w={'12px'}
                      mr={'1px'}
                    />
                  </Center>
                  {t(DatasetSearchModeMap[item.searchMode].title as any)}
                </Flex>
              ) : (
                '-'
              )}
            </Box>
            <Box flex={1} mr={2} wordBreak={'break-all'} fontWeight={'400'}>
              {item.text}
            </Box>
            <Box className="time" flex={'0 0 auto'} fontSize={'xs'} color={'myGray.500'}>
              {t(formatTimeToChatTime(item.time) as any).replace('#', ':')}
            </Box>
            <MyTooltip label={t('common:core.dataset.test.delete test history')}>
              <Box className="delete" display={'none'} w={'1rem'} h={'1rem'} ml={1}>
                <MyIcon
                  name={'delete'}
                  w={'1rem'}
                  _hover={{ color: 'red.600' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    delDatasetTestItemById(item.id);
                    datasetTestItem?.id === item.id && setDatasetTestItem(undefined);
                  }}
                />
              </Box>
            </MyTooltip>
          </Flex>
        ))}
      </Box>
    </>
  );
});

const TestResults = React.memo(function TestResults({
  datasetTestItem
}: {
  datasetTestItem?: SearchTestStoreItemType;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <>
      {!datasetTestItem?.results || datasetTestItem.results.length === 0 ? (
        <EmptyTip text={t('common:core.dataset.test.test result placeholder')} mt={[10, '20vh']} />
      ) : (
        <>
          <Flex fontSize={'15px'} color={'black'} alignItems={'center'} fontWeight={'500'}>
            {t('common:core.dataset.test.Test params')}
          </Flex>
          <Box mt={3}>
            <SearchParamsTip
              searchMode={datasetTestItem.searchMode}
              similarity={datasetTestItem.similarity}
              limit={datasetTestItem.limit}
              usingReRank={datasetTestItem.usingReRank}
              usingExtensionQuery={!!datasetTestItem.queryExtensionModel}
              queryExtensionModel={datasetTestItem.queryExtensionModel}
            />
          </Box>

          <Flex mt={5} mb={3} alignItems={'center'}>
            <Flex fontSize={'15px'} color={'#000'} alignItems={'center'} fontWeight={'500'}>
              {t('common:core.dataset.test.Test Result')}
            </Flex>
            <QuestionTip ml={1} label={t('common:core.dataset.test.test result tip')} />
            <Box ml={2} fontSize={'14px'} color={'#000'}>
              ({datasetTestItem.duration})
            </Box>
          </Flex>
          <Box mt={1} gap={4}>
            {datasetTestItem?.results.map((item, index) => (
              <Box key={item.id} borderRadius={'lg'} bg={'white'} _notLast={{ mb: 2 }}>
                <QuoteItem quoteItem={item} canDownloadSource canEditData />
              </Box>
            ))}
          </Box>
        </>
      )}
    </>
  );
});
