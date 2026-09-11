import React, { useState } from 'react';
import { Box, Flex, Grid, useTheme, ModalBody } from '@chakra-ui/react';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useTranslation } from 'react-i18next';
import { DatasetTypeEnum, DatasetTypeMap } from '@fastgpt/global/core/dataset/constants';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { useToast } from '@fastgpt/web/hooks/useToast';

type CreateDatasetModalProps = {
  onClose: () => void;
  onSelect: (type: DatasetTypeEnum | 'folder') => void;
};

const CreateDatasetModal = ({ onClose, onSelect }: CreateDatasetModalProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { feConfigs } = useSystemStore();
  const { toast } = useToast();

  const cardStyle = {
    p: '20px',
    bg: 'white',
    borderRadius: '14px',
    border: '1px solid',
    borderColor: 'myGray.200',
    cursor: 'pointer',
    _hover: {
      borderColor: 'primary.500',
      boxShadow: 'md'
    },
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    minH: '140px'
  };

  const IconBox = ({ icon, color = '#09244B' }: { icon: string; color?: string }) => (
    <Box w={'28px'} h={'28px'} position={'relative'} overflow={'hidden'}>
      <MyIcon name={icon as any} w={'100%'} h={'100%'} color={color} />
    </Box>
  );

  const Title = ({ children }: { children: React.ReactNode }) => (
    <Box color={'myGray.900'} fontSize={'16px'} fontWeight={'500'} lineHeight={'28px'}>
      {children}
    </Box>
  );

  const Description = ({ children }: { children: React.ReactNode }) => (
    <Box color={'myGray.500'} fontSize={'13px'} fontWeight={'400'} lineHeight={'22px'}>
      {children}
    </Box>
  );

  const handleSelect = (type: DatasetTypeEnum | 'folder') => {
    if (
      !feConfigs?.isPlus &&
      [DatasetTypeEnum.websiteDataset, DatasetTypeEnum.feishu, DatasetTypeEnum.yuque].includes(
        type as DatasetTypeEnum
      )
    ) {
      toast({
        status: 'warning',
        title: t('common:commercial_function_tip')
      });
      return;
    }
    onSelect(type);
  };

  return (
    <MyModal
      isOpen
      onClose={onClose}
      isCentered
      w={'800px'}
      maxW={['90vw', '900px']}
      title={t('dataset:create_dataset')}
    >
      <ModalBody p={'20px'}>
        <Grid templateColumns={'repeat(2, 1fr)'} gap={'16px'}>
          {/* Common Dataset */}
          <Box {...cardStyle} onClick={() => handleSelect(DatasetTypeEnum.dataset)}>
            <Flex direction={'column'} gap={'16px'}>
              <IconBox icon={DatasetTypeMap[DatasetTypeEnum.dataset].icon} />
              <Flex direction={'column'} gap={'6px'}>
                <Title>{t('dataset:common_dataset')}</Title>
                <Description>{t('dataset:common_dataset_desc')}</Description>
              </Flex>
            </Flex>
          </Box>

          {/* Website Dataset */}
          <Box {...cardStyle} onClick={() => handleSelect(DatasetTypeEnum.websiteDataset)}>
            <Flex direction={'column'} gap={'16px'}>
              <IconBox icon={DatasetTypeMap[DatasetTypeEnum.websiteDataset].icon} />
              <Flex direction={'column'} gap={'6px'}>
                <Title>{t('dataset:website_dataset')}</Title>
                <Description>{t('dataset:website_dataset_desc')}</Description>
              </Flex>
            </Flex>
          </Box>

          {/* External Dataset Group */}
          <Box
            {...cardStyle}
            justifyContent={'center'}
            alignItems={'center'}
            onClick={() => handleSelect(DatasetTypeEnum.apiDataset)}
          >
            <Flex direction={'column'} gap={'16px'} w={'100%'}>
              <IconBox icon={'core/dataset/otherDataset'} />
              <Flex direction={'column'} gap={'6px'}>
                <Title>{t('dataset:other_dataset')}</Title>
                <Description>{t('dataset:external_other_dataset_desc')}</Description>
              </Flex>
            </Flex>
          </Box>

          {/* Folder */}
          <Box {...cardStyle} onClick={() => handleSelect('folder')}>
            <Flex direction={'column'} gap={'16px'}>
              <IconBox icon={DatasetTypeMap[DatasetTypeEnum.folder].icon} />
              <Flex direction={'column'} gap={'6px'}>
                <Title>{t('common:Folder')}</Title>
                <Description>{t('dataset:create_folder')}</Description>
              </Flex>
            </Flex>
          </Box>
        </Grid>
      </ModalBody>
    </MyModal>
  );
};

export default CreateDatasetModal;
