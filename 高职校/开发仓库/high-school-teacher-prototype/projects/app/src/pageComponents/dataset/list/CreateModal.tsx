import React, { useMemo } from 'react';
import { Box, Flex, ModalFooter, ModalBody, Input, Grid } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import Avatar from '@fastgpt/web/components/common/Avatar';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { postCreateDataset } from '@/web/core/dataset/api';
import type { CreateDatasetParams } from '@/global/core/dataset/api.d';
import { useTranslation } from 'react-i18next';
import { DatasetTypeEnum, DatasetTypeMap } from '@fastgpt/global/core/dataset/constants';
import AIModelSelector from '@/components/Select/AIModelSelector';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import ComplianceTip from '@/components/common/ComplianceTip/index';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { getDocPath } from '@/web/common/system/doc';
import ApiDatasetForm from '../ApiDatasetForm';
import { getWebDefaultEmbeddingModel, getWebDefaultLLMModel } from '@/web/common/system/utils';
import { useUploadAvatar } from '@fastgpt/web/common/file/hooks/useUploadAvatar';
import { getUploadAvatarPresignedUrl } from '@/web/common/file/api';

export type CreateDatasetType =
  | DatasetTypeEnum.dataset
  | DatasetTypeEnum.apiDataset
  | DatasetTypeEnum.websiteDataset
  | DatasetTypeEnum.feishu
  | DatasetTypeEnum.yuque
  | DatasetTypeEnum.externalFile;

const CreateModal = ({
  onClose,
  parentId,
  type
}: {
  onClose: () => void;
  parentId?: string;
  type: CreateDatasetType;
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { defaultModels, embeddingModelList, datasetModelList, getVlmModelList, feConfigs } =
    useSystemStore();
  const { isPc } = useSystem();

  const filterNotHiddenVectorModelList = embeddingModelList.filter((item) => !item.hidden);

  const vllmModelList = useMemo(() => getVlmModelList(), [getVlmModelList]);

  const form = useForm<CreateDatasetParams>({
    defaultValues: {
      parentId,
      type: type || DatasetTypeEnum.dataset,
      avatar: DatasetTypeMap[type].avatar,
      name: '',
      intro: '',
      vectorModel:
        defaultModels.embedding?.model || getWebDefaultEmbeddingModel(embeddingModelList)?.model,
      agentModel:
        defaultModels.datasetTextLLM?.model || getWebDefaultLLMModel(datasetModelList)?.model,
      vlmModel: defaultModels.datasetImageLLM?.model
    }
  });
  const { register, setValue, handleSubmit, watch } = form;
  const avatar = watch('avatar');
  const vectorModel = watch('vectorModel');
  const agentModel = watch('agentModel');
  const vlmModel = watch('vlmModel');
  const currentType = watch('type');

  const isExternal = useMemo(
    () =>
      [DatasetTypeEnum.apiDataset, DatasetTypeEnum.feishu, DatasetTypeEnum.yuque].includes(
        type as DatasetTypeEnum
      ),
    [type]
  );

  const { Component: AvatarUploader, handleFileSelectorOpen: handleAvatarSelectorOpen } =
    useUploadAvatar(getUploadAvatarPresignedUrl, {
      onSuccess: (avatar: string) => {
        setValue('avatar', avatar);
      }
    });

  /* create a new kb and router to it */
  const { runAsync: onclickCreate, loading: creating } = useRequest2(
    async (data: CreateDatasetParams) => await postCreateDataset(data),
    {
      successToast: t('common:create_success'),
      errorToast: t('common:create_failed'),
      onSuccess(id) {
        router.push(`/dataset/detail?datasetId=${id}`);
      }
    }
  );

  const SelectorCard = ({ type: cardType }: { type: DatasetTypeEnum }) => {
    const isSelected = currentType === cardType;
    return (
      <Box
        cursor={'pointer'}
        p={4}
        border={'1px solid'}
        borderColor={isSelected ? 'primary.500' : 'myGray.200'}
        borderRadius={'md'}
        bg={isSelected ? 'primary.50' : 'white'}
        _hover={{ borderColor: 'primary.500', boxShadow: 'md' }}
        onClick={() => {
          setValue('type', cardType);
          setValue('avatar', DatasetTypeMap[cardType].avatar);
        }}
        display={'flex'}
        flexDirection={'column'}
        h={'100%'}
      >
        <Flex alignItems={'center'} gap={3}>
          <Box w={'24px'} h={'24px'} flexShrink={0}>
            <Avatar src={DatasetTypeMap[cardType].avatar} w={'100%'} h={'100%'} />
          </Box>
          <Box fontSize={'sm'} fontWeight={'bold'} color={'myGray.900'}>
            {t(DatasetTypeMap[cardType].label)}
          </Box>
        </Flex>
      </Box>
    );
  };

  return (
    <MyModal
      title={t('common:core.dataset.Create dataset', { name: t(DatasetTypeMap[type].label) })}
      isOpen
      onClose={onClose}
      isCentered
      w={isExternal ? '900px' : '500px'}
      maxW={'90vw'}
    >
      <ModalBody p={5}>
        {isExternal && (
          <Box mb={8}>
            <Box mb={3} fontSize={'sm'} color={'myGray.900'} fontWeight={'medium'}>
              {t('dataset:create_method')}
              <Box as={'span'} color={'red.600'} ml={1}>
                *
              </Box>
            </Box>
            <Grid templateColumns={['1fr', 'repeat(3, 1fr)']} gap={4}>
              <SelectorCard type={DatasetTypeEnum.apiDataset} />
              {feConfigs?.show_dataset_feishu !== false && (
                <SelectorCard type={DatasetTypeEnum.feishu} />
              )}
              {feConfigs?.show_dataset_yuque !== false && (
                <SelectorCard type={DatasetTypeEnum.yuque} />
              )}
            </Grid>
          </Box>
        )}
        {/* divider */}
        {isExternal && <Box my={8} borderBottom={'1px solid'} borderColor={'myGray.200'}></Box>}
        {/* Avatar */}
        <Flex justifyContent={isExternal ? 'flex-start' : 'center'} mb={6}>
          <Box
            w={'60px'}
            h={'60px'}
            p={'6px'}
            bg={'white'}
            borderRadius={'12px'}
            border={'1px solid'}
            borderColor={'myGray.200'}
            cursor={'pointer'}
            _hover={{
              borderColor: 'primary.500'
            }}
            onClick={handleAvatarSelectorOpen}
            display={'flex'}
            alignItems={'center'}
            justifyContent={'center'}
            boxShadow={'0px 1px 2px rgba(0, 0, 0, 0.05)'}
          >
            <Avatar src={avatar} w={'100%'} h={'100%'} borderRadius={'8px'} objectFit={'contain'} />
          </Box>
        </Flex>

        <Flex flexDirection={'column'} gap={6}>
          {/* Name */}
          <Box>
            <Flex alignItems={'center'} mb={2} justifyContent={'space-between'}>
              <Box fontSize={'sm'} fontWeight={500} color={'myGray.900'}>
                {t('common:input_name')}
              </Box>
            </Flex>
            <Input
              bg={'white'}
              borderRadius={'12px'}
              borderColor={'myGray.200'}
              placeholder={t('common:Name')}
              maxLength={30}
              {...register('name', {
                required: true
              })}
            />
          </Box>

          {/* Vector Model */}
          <Box>
            <Flex alignItems={'center'} mb={2}>
              <Box fontSize={'sm'} fontWeight={500} color={'myGray.900'}>
                {t('common:core.ai.model.Vector Model')}
              </Box>
              <QuestionTip ml={1} label={t('common:core.dataset.embedding model tip')} />
            </Flex>
            <AIModelSelector
              w={'100%'}
              value={vectorModel}
              list={filterNotHiddenVectorModelList.map((item) => ({
                label: item.name,
                value: item.model
              }))}
              onChange={(e) => {
                setValue('vectorModel' as const, e);
              }}
              borderRadius={'12px'}
            />
          </Box>

          {/* Dataset Agent Model */}
          <Box>
            <Flex alignItems={'center'} mb={2}>
              <Box fontSize={'sm'} fontWeight={500} color={'myGray.900'}>
                {t('common:core.ai.model.Dataset Agent Model')}
              </Box>
              <QuestionTip ml={1} label={t('dataset:file_model_function_tip')} />
            </Flex>
            <AIModelSelector
              w={'100%'}
              value={agentModel}
              list={datasetModelList.map((item) => ({
                label: item.name,
                value: item.model
              }))}
              onChange={(e) => {
                setValue('agentModel', e);
              }}
              borderRadius={'12px'}
            />
          </Box>

          {/* VLM Model */}
          <Box>
            <Flex alignItems={'center'} mb={2}>
              <Box fontSize={'sm'} fontWeight={500} color={'myGray.900'}>
                {t('dataset:vllm_model')}
              </Box>
            </Flex>
            <AIModelSelector
              w={'100%'}
              value={vlmModel}
              list={vllmModelList.map((item) => ({
                label: item.name,
                value: item.model
              }))}
              onChange={(e) => {
                setValue('vlmModel', e);
              }}
              borderRadius={'12px'}
            />
          </Box>
        </Flex>

        <Box mt={6}>
          {/* @ts-ignore */}
          <ApiDatasetForm type={currentType} form={form as any} />
        </Box>
      </ModalBody>

      <ModalFooter px={5} pb={5} justifyContent={'space-between'} alignItems={'center'}>
        {DatasetTypeMap[currentType]?.courseUrl && (
          <Flex
            as={'span'}
            alignItems={'center'}
            color={'#1C1C1C'}
            border={'1px solid'}
            borderColor={'rgba(28, 28, 28, 0.10)'}
            rounded={'12px'}
            cursor={'pointer'}
            px={2}
            py={1}
            fontSize={'14px'}
            onClick={() =>
              window.open(getDocPath(DatasetTypeMap[currentType].courseUrl!), '_blank')
            }
          >
            {t('common:Instructions')}
          </Flex>
        )}
        <Box></Box>
        <Flex justifyContent={'space-between'} alignItems={'center'}>
          <Button variant={'whiteBase'} mr={3} onClick={onClose} borderRadius={'lg'}>
            {t('common:cancel')}
          </Button>
          <Button
            isLoading={creating}
            onClick={handleSubmit((data) => onclickCreate(data))}
            borderRadius={'lg'}
          >
            {t('common:create')}
          </Button>
        </Flex>
      </ModalFooter>

      {/* <ComplianceTip pb={6} pt={0} px={9} type={'dataset'} /> */}

      <AvatarUploader />
    </MyModal>
  );
};

export default CreateModal;
