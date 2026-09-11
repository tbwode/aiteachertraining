import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Box, Flex, IconButton, Input, Link, Textarea } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { LinkCollectionIcon } from '@fastgpt/global/core/dataset/constants';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { getDocPath } from '@/web/common/system/doc';
import Loading from '@fastgpt/web/components/common/MyLoading';
import { useContextSelector } from 'use-context-selector';
import { DatasetImportContext } from '../Context';

const DataProcess = dynamic(() => import('../commonProgress/DataProcess'), {
  loading: () => <Loading fixed={false} />
});
const Upload = dynamic(() => import('../commonProgress/Upload'));
const PreviewData = dynamic(() => import('../commonProgress/PreviewData'));

const LinkCollection = () => {
  const activeStep = useContextSelector(DatasetImportContext, (v) => v.activeStep);

  return (
    <>
      {activeStep === 0 && <CustomLinkImport />}
      {activeStep === 1 && <DataProcess />}
      {activeStep === 2 && <PreviewData />}
      {activeStep === 3 && <Upload />}
    </>
  );
};

export default React.memo(LinkCollection);

const CustomLinkImport = () => {
  const { t } = useTranslation();
  const { feConfigs } = useSystemStore();
  const { goToNext, sources, setSources, processParamsForm } = useContextSelector(
    DatasetImportContext,
    (v) => v
  );
  const { register, reset, handleSubmit, watch } = useForm({
    defaultValues: {
      link: ''
    }
  });

  const link = watch('link');
  const linkList = link.split('\n').filter((item) => item);

  useEffect(() => {
    reset({
      link: sources
        .map((item) => item.link)
        .filter((item) => item)
        .join('\n')
    });
  }, []);

  return (
    <Box maxW={['100%', '800px']}>
      <Box display={'flex'} flexDirection={'column'} mt={1} pl={1}>
        <Box
          mb={2}
          color={'var(--foreground-foreground, #18181B)'}
          fontFamily={'"PingFang SC"'}
          fontSize={'14px'}
          fontWeight={500}
          lineHeight={'143%'}
        >
          {t('common:core.dataset.import.Link name')}
        </Box>
        <Textarea
          w={'100%'}
          rows={10}
          placeholder={t('common:core.dataset.import.Link name placeholder')}
          bg={'white'}
          overflowX={'auto'}
          whiteSpace={'nowrap'}
          _focus={{
            borderColor: 'rgba(0,0,0,0.05)',
            boxShadow: '1px 1px 9px rgba(0,0,0,0.15)'
          }}
          _hover={{}}
          {...register('link', {
            required: true
          })}
        />
      </Box>
      <Box display={'flex'} flexDirection={'column'} mt={4} pl={1}>
        <Box
          mb={2}
          color={'var(--foreground-foreground, #18181B)'}
          fontFamily={'"PingFang SC"'}
          fontSize={'14px'}
          fontWeight={500}
          lineHeight={'143%'}
        >
          {t('common:core.dataset.website.Selector')}
          <Box as={'span'} color={'myGray.500'} fontSize={'sm'} ml={2}>
            {feConfigs?.docUrl && (
              <Link
                href={getDocPath('/docs/introduction/guide/knowledge_base/websync/#选择器如何使用')}
                target="_blank"
              >
                {t('common:core.dataset.website.Selector Course')}
              </Link>
            )}
          </Box>
        </Box>
        <Input
          w={'100%'}
          {...processParamsForm.register('webSelector')}
          placeholder={'body .content #document'}
          bg={'white'}
          _focus={{
            borderColor: 'rgba(0,0,0,0.05)',
            boxShadow: '1px 1px 9px rgba(0,0,0,0.15)'
          }}
        />
      </Box>

      {linkList.length > 0 && (
        <Box mt={8}>
          <Box mb={4} color={'myGray.900'} fontWeight={'bold'}>
            {t('dataset:imported')}
          </Box>
          <Flex flexDirection={'column'} gap={4}>
            {linkList.map((item, i) => (
              <Flex
                key={`${item}-${i}`}
                alignItems={'center'}
                justifyContent={'space-between'}
                p={4}
                bg={'white'}
                borderRadius={'xl'}
                border={'1px solid'}
                borderColor={'myGray.200'}
                w={'100%'}
              >
                <Flex alignItems={'center'} flex={'1 0 0'} overflow={'hidden'} gap={3}>
                  <Flex
                    alignItems={'center'}
                    justifyContent={'center'}
                    w={'24px'}
                    h={'24px'}
                    bg={'primary.50'}
                    borderRadius={'md'}
                  >
                    <MyIcon name={LinkCollectionIcon} w={'14px'} color={'primary.600'} />
                  </Flex>
                  <Box
                    color={'myGray.900'}
                    fontSize={'sm'}
                    fontFamily={'PingFang SC'}
                    fontWeight={'normal'}
                    lineHeight={'20px'}
                    noOfLines={1}
                    flex={'1 0 0'}
                    title={item}
                  >
                    {item}
                  </Box>
                </Flex>
                <IconButton
                  icon={<MyIcon name={'common/closeLight'} w={'14px'} />}
                  variant={'ghost'}
                  size={'sm'}
                  aria-label={'delete'}
                  color={'myGray.500'}
                  onClick={() => {
                    const newLinkList = linkList.filter((link, index) => index !== i);
                    reset({
                      link: newLinkList.join('\n')
                    });
                  }}
                />
              </Flex>
            ))}
          </Flex>
        </Box>
      )}
      <Flex mt={5} justifyContent={'flex-end'}>
        <Button
          onClick={handleSubmit((data) => {
            const newLinkList = data.link.split('\n').filter((item) => item);

            setSources(
              newLinkList.map((link) => ({
                id: getNanoid(32),
                createStatus: 'waiting',
                link,
                sourceName: link,
                icon: LinkCollectionIcon
              }))
            );

            goToNext();
          })}
        >
          {t('common:next_step')}
        </Button>
      </Flex>
    </Box>
  );
};
