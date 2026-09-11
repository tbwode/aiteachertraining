import React, { useState } from 'react';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useTranslation } from 'react-i18next';
import { Box, HStack, ModalBody, ModalFooter, VStack } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import MyIcon from '@fastgpt/web/components/common/Icon';
import MyIconButton from '@fastgpt/web/components/common/Icon/button';
import { postBackupDatasetCollection } from '@/web/core/dataset/api';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { DatasetPageContext } from '@/web/core/dataset/context/datasetPageContext';
import { useContextSelector } from 'use-context-selector';
import LightTip from '@fastgpt/web/components/common/LightTip';
import FileSelectorBox, { type SelectFileItemType } from '@/components/Select/FileSelectorBox';

const BackupImportModal = ({
  onFinish,
  onClose
}: {
  onFinish: () => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const datasetId = useContextSelector(DatasetPageContext, (v) => v.datasetId);

  const [selectFiles, setSelectFiles] = useState<SelectFileItemType[]>([]);
  const [percent, setPercent] = useState(0);

  const { runAsync: onBackupImport, loading: isBackupLoading } = useRequest2(
    async () => {
      await postBackupDatasetCollection({
        datasetId,
        file: selectFiles[0].file,
        percentListen: setPercent
      });
    },
    {
      onSuccess() {
        onFinish();
        onClose();
      },
      successToast: t('dataset:backup_dataset_success')
    }
  );

  return (
    <MyModal isCentered={true} iconColor={'primary.600'} isOpen title={t('dataset:backup_dataset')}>
      <ModalBody>
        <LightTip
          bg={'#E8F3FF'}
          color={'#000'}
          mb={3}
          customIcon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M1.33398 7.99967C1.33398 4.31778 4.31875 1.33301 8.00065 1.33301C11.6825 1.33301 14.6673 4.31778 14.6673 7.99967C14.6673 11.6816 11.6825 14.6663 8.00065 14.6663C4.31875 14.6663 1.33398 11.6816 1.33398 7.99967ZM8.66732 5.99967V4.66634H7.33398V5.99967H8.66732ZM7.33398 6.66634V11.333H8.66732V6.66634H7.33398Z"
                fill="#165DFF"
              />
            </svg>
          }
          text={t('dataset:backup_dataset_tip')}
        />

        <FileSelectorBox
          maxCount={1}
          fileType=".csv"
          selectFiles={selectFiles}
          setSelectFiles={(e) => setSelectFiles(e)}
        />
        {/* File render */}
        {selectFiles.length > 0 && (
          <VStack mt={4} gap={2}>
            {selectFiles.map((item, index) => (
              <HStack
                key={index}
                w={'100%'}
                bg={'white'}
                border={'1px solid #E4E4E7'}
                borderRadius={'12px'}
                padding={'6px 18px'}
                justifyContent={'space-between'}
              >
                <Box display={'flex'} alignItems={'center'} gap={2}>
                  <MyIcon name={item.icon as any} w={'1rem'} />
                  <Box>
                    <Box color={'myGray.900'} fontSize={'14px'}>
                      {item.name}
                    </Box>
                    <Box fontSize={'12px'} color={'myGray.500'} flex={1}>
                      {item.size}
                    </Box>
                  </Box>
                </Box>

                <MyIconButton
                  icon="delete"
                  hoverColor="red.500"
                  hoverBg="red.50"
                  onClick={() => {
                    setSelectFiles(selectFiles.filter((_, i) => i !== index));
                  }}
                />
              </HStack>
            ))}
          </VStack>
        )}
      </ModalBody>
      <ModalFooter>
        <Button isLoading={isBackupLoading} variant="whiteBase" mr={2} onClick={onClose}>
          {t('common:Close')}
        </Button>
        <Button onClick={onBackupImport} isDisabled={selectFiles.length === 0 || isBackupLoading}>
          {isBackupLoading
            ? percent === 100
              ? t('dataset:data_parsing')
              : t('dataset:data_uploading', { num: percent })
            : t('common:Import')}
        </Button>
      </ModalFooter>
    </MyModal>
  );
};

export default BackupImportModal;
