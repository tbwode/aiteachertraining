import { Box, Checkbox, Flex, HStack, Input, useDisclosure } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import MyPopover from '@fastgpt/web/components/common/MyPopover';
import MyIcon from '@fastgpt/web/components/common/Icon';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { useContextSelector } from 'use-context-selector';
import { DatasetPageContext } from '@/web/core/dataset/context/datasetPageContext';
import { useTranslation } from 'react-i18next';
import { CollectionPageContext } from './Context';
import { isEqual } from 'lodash';
import TagManageModal from './TagManageModal';
import { type DatasetTagType } from '@fastgpt/global/core/dataset/type';
import MyInput from '@/components/MyInput';

const HeaderTagPopOver = () => {
  const { t } = useTranslation();

  const {
    searchDatasetTagsResult,
    searchTagKey,
    setSearchTagKey,
    checkedDatasetTag,
    setCheckedDatasetTag,
    onCreateCollectionTag,
    isCreateCollectionTagLoading
  } = useContextSelector(DatasetPageContext, (v) => v);

  const { filterTags, setFilterTags, getData } = useContextSelector(
    CollectionPageContext,
    (v) => v
  );

  const checkedTags = filterTags;

  const {
    isOpen: isTagManageModalOpen,
    onOpen: onOpenTagManageModal,
    onClose: onCloseTagManageModal
  } = useDisclosure();

  const checkTags = (tag: DatasetTagType) => {
    let currentCheckedTags = [];
    if (checkedTags.includes(tag._id)) {
      currentCheckedTags = checkedTags.filter((t) => t !== tag._id);
      setCheckedDatasetTag(checkedDatasetTag.filter((t) => t._id !== tag._id));
    } else {
      currentCheckedTags = [...checkedTags, tag._id];
      setCheckedDatasetTag([...checkedDatasetTag, tag]);
    }
    if (isEqual(currentCheckedTags, filterTags)) return;
    setFilterTags(currentCheckedTags);
  };

  return (
    <>
      <MyPopover
        placement="bottom"
        hasArrow={false}
        offset={[-80, 4]}
        w={'250px'}
        closeOnBlur={true}
        trigger={'click'}
        bg={'#fff'}
        Trigger={
          <Flex
            alignItems={'center'}
            px={3}
            py={2}
            w={['100px', '100px']}
            h={['28px', '36px']}
            fontSize={'sm'}
            cursor={'pointer'}
            overflow={'hidden'}
            borderRadius={'12px'}
            border={
              'var(--form-field-border-width, 1px) solid var(--form-field-border, rgba(0, 0, 0, 0.00))'
            }
            bg={'var(--form-field-bg, #FFF)'}
            boxShadow={
              '0 var(--depth, 0) var(--depth, 0) 0 rgba(255, 255, 255, 0.10) inset, 0 2px 4px 0 var(--form-field-shadow, rgba(0, 0, 0, 0.04)), 0 1px 2px 0 var(--form-field-shadow-2, rgba(0, 0, 0, 0.06)), 0 0 1px 0 var(--form-field-shadow-2, rgba(0, 0, 0, 0.06))'
            }
            style={{
              backdropFilter: 'blur(calc(var(--blur, 0) / 2))'
            }}
            _hover={{
              boxShadow: '0px 0px 0px 2.4px rgba(51, 112, 255, 0.15)',
              borderColor: 'primary.300'
            }}
          >
            <Flex flex={'1 0 0'} fontSize={'14px'}>
              {t('dataset:tag.tags')}
              <Box as={'span'}>
                {checkedTags.length > 0 && (
                  <Box ml={1} fontSize={'xs'} color={'myGray.600'}>
                    {`(${checkedTags.length})`}
                  </Box>
                )}
              </Box>
            </Flex>
            <MyIcon name={'core/chat/chevronDown'} w={'14px'} />
          </Flex>
        }
      >
        {({ onClose }) => (
          <MyBox isLoading={isCreateCollectionTagLoading} onClick={(e) => e.stopPropagation()}>
            <Box px={2} pt={2}>
              <MyInput
                h={8}
                borderRadius={'xs'}
                value={searchTagKey}
                placeholder={t('dataset:tag.searchOrAddTag')}
                onChange={(e) => setSearchTagKey(e.target.value)}
                rightIcon={<MyIcon name={'common/searchLight'} w={'14px'} color={'myGray.600'} />}
              />
            </Box>

            <Box my={1} px={2} maxH={'240px'} overflow={'auto'}>
              {searchTagKey &&
                !searchDatasetTagsResult.map((item) => item.tag).includes(searchTagKey) && (
                  <Flex
                    alignItems={'center'}
                    fontSize={'sm'}
                    px={2}
                    cursor={'pointer'}
                    _hover={{ bg: 'myGray.100', color: 'primary.700' }}
                    borderRadius={'md'}
                    onClick={() => onCreateCollectionTag(searchTagKey)}
                  >
                    <MyIcon name={'common/addLight'} w={'16px'} />
                    <Box ml={2} py={2}>
                      {t('dataset:tag.add') + ` "${searchTagKey}"`}
                    </Box>
                  </Flex>
                )}

              {[
                ...new Map(
                  [...checkedDatasetTag, ...searchDatasetTagsResult].map((item) => [item._id, item])
                ).values()
              ].map((item) => {
                const checked = checkedTags.includes(item._id);
                return (
                  <Flex
                    alignItems={'center'}
                    fontSize={'sm'}
                    px={2}
                    py={2}
                    my={1}
                    cursor={'pointer'}
                    color={checked ? 'primary.700' : 'myGray.600'}
                    _hover={{
                      bg: 'myGray.100',
                      color: 'primary.700',
                      ...(checked ? {} : { svg: { color: 'myGray.600' } })
                    }}
                    borderRadius={'md'}
                    key={item._id}
                    onClick={(e) => {
                      e.preventDefault();
                      checkTags(item);
                    }}
                    justifyContent={'space-between'}
                  >
                    <Flex alignItems={'center'} overflow={'hidden'}>
                      <MyIcon
                        name={'common/tag'}
                        w={'16px'}
                        color={checked ? 'primary.700' : 'myGray.500'}
                      />
                      <Box ml={2} isTruncated>
                        {item.tag}
                      </Box>
                    </Flex>
                    {checked && <MyIcon name={'common/check'} w={'16px'} color={'primary.700'} />}
                  </Flex>
                );
              })}
            </Box>
            <HStack spacing={3} px={2} pb={2}>
              <Button
                variant={'outline'}
                size={'md'}
                flex={1}
                borderRadius={'lg'}
                borderColor={'myGray.200'}
                _hover={{ borderColor: 'primary.300', color: 'primary.500' }}
                onClick={() => {
                  setSearchTagKey('');
                  setFilterTags([]);
                  onClose();
                }}
              >
                {t('dataset:tag.cancel')}
              </Button>
              <Button
                variant={'outline'}
                size={'md'}
                flex={1}
                borderRadius={'lg'}
                borderColor={'myGray.200'}
                _hover={{ borderColor: 'primary.300', color: 'primary.500' }}
                onClick={onOpenTagManageModal}
              >
                {t('dataset:tag.manage')}
              </Button>
            </HStack>
          </MyBox>
        )}
      </MyPopover>
      {isTagManageModalOpen && (
        <TagManageModal
          onClose={() => {
            onCloseTagManageModal();
            getData(1);
          }}
        />
      )}
    </>
  );
};

export default HeaderTagPopOver;
