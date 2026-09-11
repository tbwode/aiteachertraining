import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input, Flex, Box, Checkbox } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useTranslation } from 'react-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useContextSelector } from 'use-context-selector';
import { DatasetPageContext } from '@/web/core/dataset/context/datasetPageContext';
import { CollectionPageContext } from './Context';
import { getCollectionIcon } from '@fastgpt/global/core/dataset/utils';
import {
  delDatasetCollectionTag,
  getDatasetCollectionTags,
  getDatasetCollections,
  getTagUsage,
  postAddTagsToCollections,
  updateDatasetCollectionTag
} from '@/web/core/dataset/api';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import MyInput from '@/components/MyInput';
import { type DatasetTagType } from '@fastgpt/global/core/dataset/type';
import { useScrollPagination } from '@fastgpt/web/hooks/useScrollPagination';
import EmptyTip from '@fastgpt/web/components/common/EmptyTip';
import PopoverConfirm from '@fastgpt/web/components/common/MyPopover/PopoverConfirm';
import { type DatasetCollectionsListItemType } from '@/global/core/dataset/type';

const TagManageModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const { datasetDetail, onCreateCollectionTag, loadAllDatasetTags, setSearchTagKey } =
    useContextSelector(DatasetPageContext, (v) => v);
  const { getData, pageNum, collections } = useContextSelector(CollectionPageContext, (v) => v);

  const tagInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const [currentAddTag, setCurrentAddTag] = useState<
    (DatasetTagType & { collections: string[] }) | undefined
  >(undefined);

  const [newTag, setNewTag] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState('');

  const [currentEditTagContent, setCurrentEditTagContent] = useState<string | undefined>(undefined);
  const [currentEditTag, setCurrentEditTag] = useState<DatasetTagType | undefined>(undefined);

  useEffect(() => {
    if (newTag !== undefined && tagInputRef.current) {
      tagInputRef.current?.focus();
    }
  }, [newTag]);

  useEffect(() => {
    if (currentEditTag !== undefined && editInputRef.current) {
      editInputRef.current?.focus();
    }
  }, [currentEditTag]);

  const { runAsync: onDeleteCollectionTag } = useRequest2(
    (tag: string) =>
      delDatasetCollectionTag({
        datasetId: datasetDetail._id,
        id: tag
      }),
    {
      onSuccess() {
        refreshList();
        setSearchTagKey('');
        loadAllDatasetTags();
      },
      successToast: t('common:delete_success'),
      errorToast: t('common:delete_failed')
    }
  );

  const { runAsync: onUpdateCollectionTag } = useRequest2(
    async (tag: DatasetTagType) => {
      return updateDatasetCollectionTag({
        datasetId: datasetDetail._id,
        tagId: tag._id,
        tag: tag.tag
      });
    },
    {
      onSuccess() {
        refreshList();
        setSearchTagKey('');
        loadAllDatasetTags();
      }
    }
  );

  const { runAsync: onSaveCollectionTag } = useRequest2(
    async ({
      tag,
      originCollectionIds,
      collectionIds
    }: {
      tag: string;
      originCollectionIds: string[];
      collectionIds: string[];
    }) => {
      return postAddTagsToCollections({
        tag,
        originCollectionIds,
        collectionIds,
        datasetId: datasetDetail._id
      });
    },
    {
      onFinally() {
        getData(pageNum);
      },
      successToast: t('common:save_success'),
      errorToast: t('common:save_failed')
    }
  );

  // Tags list
  const {
    data: collectionTags,
    ScrollData,
    refreshList,
    total: tagsTotal
  } = useScrollPagination(getDatasetCollectionTags, {
    pageSize: 10,
    params: {
      datasetId: datasetDetail._id,
      searchText
    },
    refreshDeps: [searchText],
    EmptyTip: <EmptyTip text={t('dataset:no_tags')} />
  });

  // Collections list
  const { data: collectionsList, ScrollData: ScrollDataCollections } = useScrollPagination(
    getDatasetCollections,
    {
      pageSize: 30,
      params: {
        datasetId: datasetDetail._id,
        simple: true,
        searchText
      },
      refreshDeps: [searchText],
      EmptyTip: <EmptyTip text={t('dataset:no_collections')} />
    }
  );

  const { data: tagUsages } = useRequest2(() => getTagUsage(datasetDetail._id), {
    manual: false,
    refreshDeps: [collections]
  });

  return (
    <MyModal
      isOpen
      onClose={onClose}
      iconColor={'primary.600'}
      title={t('dataset:tag.manage')}
      w={'580px'}
      h={'600px'}
      closeOnOverlayClick={false}
    >
      {currentAddTag === undefined ? (
        <>
          <Flex alignItems={'center'} color={'myGray.900'} pb={2} mx={8} pt={6}>
            <MyIcon name="menu" w={5} />
            <Box ml={2} fontWeight={'semibold'} flex={'1 0 0'}>
              {t('dataset:tag.total_tags', { total: tagsTotal })}
            </Box>
            <MyInput
              placeholder={t('common:search_placeholder')}
              w={'160px'}
              h={8}
              mr={2}
              onChange={(e) => {
                setSearchText(e.target.value);
              }}
            />
            <Button
              size={'sm'}
              leftIcon={<MyIcon name="common/addLight" w={4} />}
              variant={'outline'}
              fontSize={'xs'}
              borderRadius={'12px'}
              bg={'#fff'}
              h={'34px'}
              onClick={() => {
                setNewTag('');
              }}
            >
              {t('common:create')}
            </Button>
          </Flex>
          <ScrollData flex={'1 0 0'} fontSize={'sm'} pb={2} px={2}>
            <Flex
              px={8}
              py={3}
              w={'full'}
              bg={'white'}
              borderBottom={'1px solid #F0F1F6'}
              position={'sticky'}
              top={0}
              zIndex={1}
            >
              <Box flex={'1'} color={'myGray.900'} fontSize={'sm'} fontWeight={'medium'}>
                {t('dataset:tag.tags')}
              </Box>
              <Box w={'80px'} color={'myGray.900'} fontSize={'sm'} fontWeight={'medium'}>
                {t('common:amount')}
              </Box>
              <Box w={'120px'} color={'myGray.900'} fontSize={'sm'} fontWeight={'medium'}>
                {t('common:operations')}
              </Box>
            </Flex>
            <Flex w={'full'}>
              {newTag !== undefined && (
                <Flex py={3} px={8} w={'full'} borderBottom={'1px solid #E8EBF0'}>
                  <Input
                    placeholder={t('dataset:tag.add_new_tag')}
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    ref={tagInputRef}
                    w={'200px'}
                    onBlur={async () => {
                      if (newTag && !collectionTags.map((item) => item.tag).includes(newTag)) {
                        await onCreateCollectionTag(newTag);
                        refreshList();
                      }
                      setNewTag(undefined);
                    }}
                  />
                </Flex>
              )}
            </Flex>
            {collectionTags.map((item) => {
              const tagUsage = tagUsages?.find((tagUsage) => tagUsage.tagId === item._id);
              const collections = tagUsage?.collections || [];
              const usage = collections.length;

              return (
                <Flex
                  h={'64px'}
                  borderBottom={'1px solid #E8EBF0'}
                  key={item._id}
                  alignItems={'center'}
                  px={8}
                  bg={'white'}
                  _hover={{ bg: 'myGray.50' }}
                >
                  <Flex flex={'1'} alignItems={'center'}>
                    {currentEditTag?._id !== item._id ? (
                      <Box
                        px={3}
                        py={2}
                        color={'myGray.900'}
                        fontSize={'sm'}
                        cursor={'pointer'}
                        onClick={() => {
                          setCurrentAddTag({ ...item, collections });
                        }}
                      >
                        {item.tag}
                      </Box>
                    ) : (
                      <Input
                        placeholder={t('dataset:tag.edit_tag')}
                        value={
                          currentEditTagContent !== undefined ? currentEditTagContent : item.tag
                        }
                        onChange={(e) => setCurrentEditTagContent(e.target.value)}
                        ref={editInputRef}
                        h={'30px'}
                        w={'200px'}
                        onBlur={() => {
                          if (
                            currentEditTagContent &&
                            !collectionTags.map((item) => item.tag).includes(currentEditTagContent)
                          ) {
                            onUpdateCollectionTag({
                              tag: currentEditTagContent,
                              _id: item._id
                            });
                          }
                          setCurrentEditTag(undefined);
                          setCurrentEditTagContent(undefined);
                        }}
                      />
                    )}
                  </Flex>

                  <Box w={'80px'} color={'myGray.900'} fontSize={'sm'}>
                    {usage}
                  </Box>

                  <Flex w={'120px'} alignItems={'center'} gap={2}>
                    <Flex
                      justifyContent={'center'}
                      alignItems={'center'}
                      w={'32px'}
                      h={'32px'}
                      borderRadius={'10px'}
                      _hover={{ bg: 'myGray.100', color: 'primary.600' }}
                      cursor={'pointer'}
                      onClick={() => {
                        setCurrentAddTag({ ...item, collections });
                        setSearchText('');
                      }}
                      border={'1px solid'}
                      borderColor={'rgba(0,0,0,0.1)'}
                    >
                      <MyIcon name="common/addLight" w={3.5} />
                    </Flex>
                    <Flex
                      justifyContent={'center'}
                      alignItems={'center'}
                      w={'32px'}
                      h={'32px'}
                      borderRadius={'10px'}
                      _hover={{ bg: 'myGray.100', color: 'primary.600' }}
                      cursor={'pointer'}
                      onClick={(e) => {
                        setCurrentEditTag(item);
                        editInputRef.current?.focus();
                      }}
                      border={'1px solid'}
                      borderColor={'rgba(0,0,0,0.1)'}
                    >
                      <MyIcon name="edit" w={3.5} />
                    </Flex>
                    <PopoverConfirm
                      showCancel
                      content={t('dataset:tag.delete_tag_confirm')}
                      type="delete"
                      Trigger={
                        <Flex
                          justifyContent={'center'}
                          alignItems={'center'}
                          w={'32px'}
                          h={'32px'}
                          borderRadius={'10px'}
                          _hover={{ bg: 'myGray.100', color: 'red.600' }}
                          cursor={'pointer'}
                          border={'1px solid'}
                          borderColor={'rgba(0,0,0,0.1)'}
                        >
                          <MyIcon name="delete" w={3.5} />
                        </Flex>
                      }
                      onConfirm={() => onDeleteCollectionTag(item._id)}
                    />
                  </Flex>
                </Flex>
              );
            })}
          </ScrollData>
        </>
      ) : (
        <AddTagToCollections
          currentAddTag={currentAddTag}
          setCurrentAddTag={setCurrentAddTag}
          onSaveCollectionTag={onSaveCollectionTag}
          setSearchText={setSearchText}
          collectionsList={collectionsList}
          ScrollDataCollections={ScrollDataCollections}
        />
      )}
    </MyModal>
  );
};

export default TagManageModal;

const AddTagToCollections = ({
  currentAddTag,
  setCurrentAddTag,
  onSaveCollectionTag,
  setSearchText,
  collectionsList,
  ScrollDataCollections
}: {
  currentAddTag: DatasetTagType & { collections: string[] };
  setCurrentAddTag: (tag: (DatasetTagType & { collections: string[] }) | undefined) => void;
  onSaveCollectionTag: ({
    tag,
    originCollectionIds,
    collectionIds
  }: {
    tag: string;
    originCollectionIds: string[];
    collectionIds: string[];
  }) => void;
  setSearchText: (text: string) => void;
  collectionsList: DatasetCollectionsListItemType[];
  ScrollDataCollections: ReturnType<typeof useScrollPagination>['ScrollData'];
}) => {
  const [selectedCollections, setSelectedCollections] = useState<string[]>(
    currentAddTag.collections
  );
  const [originCollections, setOriginCollections] = useState<string[]>(currentAddTag.collections);
  const { t } = useTranslation();

  const formatCollections = useMemo(
    () =>
      collectionsList.map((collection) => {
        const icon = getCollectionIcon({ type: collection.type, name: collection.name });
        return {
          id: collection._id,
          tags: collection.tags,
          name: collection.name,
          icon
        };
      }),
    [collectionsList]
  );

  return (
    <>
      <Flex alignItems={'center'} pb={2} mx={8} pt={6}>
        <MyIcon
          name="common/backFill"
          w={4}
          cursor={'pointer'}
          onClick={() => {
            setCurrentAddTag(undefined);
            setSearchText('');
          }}
        />
        {
          <Flex alignItems={'center'} fontWeight={500} color={'#000'} fontSize={'15px'}>
            <Box ml={2} px={3} py={1.5} fontSize={'sm'} borderRadius={'12px'}>
              {currentAddTag.tag}
            </Box>
            <Box
              fontWeight={500}
              color={'#000'}
              fontSize={'15px'}
            >{`(${selectedCollections.length})`}</Box>
          </Flex>
        }
        <Box flex={'1 0 0'}></Box>
        <MyInput
          placeholder={t('common:search_placeholder')}
          w={'200px'}
          mr={2}
          onChange={(e) => {
            setSearchText(e.target.value);
          }}
        />
        <Button
          borderRadius={'12px'}
          onClick={() => {
            onSaveCollectionTag({
              tag: currentAddTag._id,
              originCollectionIds: originCollections,
              collectionIds: selectedCollections
            });
            setOriginCollections(selectedCollections);
          }}
        >
          {t('common:save')}
        </Button>
      </Flex>
      <ScrollDataCollections px={4} mt={2} flex={'1 0 0'} fontSize={'sm'}>
        {formatCollections.map((collection) => {
          return (
            <Flex
              px={2}
              py={1}
              mb={2}
              flex={'1'}
              bg={'white'}
              _hover={{
                bg: 'myGray.100',
                ...(!selectedCollections.includes(collection.id)
                  ? { svg: { color: 'myGray.100' } }
                  : {})
              }}
              alignItems={'center'}
              borderRadius={'xs'}
              key={collection.id}
              cursor={'pointer'}
              onClick={() => {
                setSelectedCollections((prev) => {
                  if (prev.includes(collection.id)) {
                    return prev.filter((id) => id !== collection.id);
                  } else {
                    return [...prev, collection.id];
                  }
                });
              }}
            >
              <Checkbox
                size={'md'}
                mr={2}
                icon={<MyIcon name="common/check" w={'12px'} />}
                onChange={() => {
                  setSelectedCollections((prev) => {
                    if (prev.includes(collection.id)) {
                      return prev.filter((id) => id !== collection.id);
                    } else {
                      return [...prev, collection.id];
                    }
                  });
                }}
                isChecked={selectedCollections.includes(collection.id)}
              />
              <MyIcon name={collection.icon as any} w={'20px'} mr={2} />
              <Box fontSize={'sm'} borderRadius={'sm'} color={'myGray.900'}>
                {collection.name}
              </Box>
            </Flex>
          );
        })}
      </ScrollDataCollections>
    </>
  );
};
