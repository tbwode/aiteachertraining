import React, { useState } from 'react';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { ModalBody, ModalFooter } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import { useTranslation } from 'react-i18next';
import LeftRadio from '@fastgpt/web/components/common/Radio/LeftRadio';
import { useRouter } from 'next/router';
import { TabEnum } from '../../../../../pages/dataset/detail';
import { ImportDataSourceEnum } from '@fastgpt/global/core/dataset/constants';

const FileModeSelector = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [value, setValue] = useState<ImportDataSourceEnum>(ImportDataSourceEnum.fileLocal);

  return (
    <MyModal
      isOpen
      onClose={onClose}
      title={t('common:core.dataset.import.Select source')}
      w={'600px'}
      isCentered={true}
    >
      <ModalBody px={6} py={4}>
        <LeftRadio
          list={[
            {
              title: t('common:core.dataset.import.Local file'),
              desc: t('common:core.dataset.import.Local file desc'),
              value: ImportDataSourceEnum.fileLocal,
              icon: 'core/dataset/fileLocal'
            },
            {
              title: t('common:core.dataset.import.Web link'),
              desc: t('common:core.dataset.import.Web link desc'),
              value: ImportDataSourceEnum.fileLink,
              icon: 'core/dataset/fileLink'
            },
            {
              title: t('common:core.dataset.import.Custom text'),
              desc: t('common:core.dataset.import.Custom text desc'),
              value: ImportDataSourceEnum.fileCustom,
              icon: 'core/dataset/fileCustom'
            }
          ]}
          value={value}
          onChange={setValue}
        />
      </ModalBody>
      <ModalFooter>
        <Button variant={'whiteBase'} mr={3} onClick={onClose} borderRadius={'lg'}>
          {t('common:cancel')}
        </Button>
        <Button
          onClick={() =>
            router.push({
              query: {
                ...router.query,
                currentTab: TabEnum.import,
                source: value
              }
            })
          }
        >
          {t('common:create')}
        </Button>
      </ModalFooter>
    </MyModal>
  );
};

export default FileModeSelector;
