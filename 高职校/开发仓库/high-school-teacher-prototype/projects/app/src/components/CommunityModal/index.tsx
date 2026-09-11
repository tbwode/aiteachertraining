import React from 'react';
import { ModalFooter, ModalBody } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useTranslation } from 'react-i18next';
import Markdown from '../Markdown';
import { useSystemStore } from '@/web/common/system/useSystemStore';

const CommunityModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const { feConfigs } = useSystemStore();

  return (
    <MyModal
      isOpen={true}
      onClose={onClose}
      iconSrc="modal/concat"
      title={t('common:system.Concat us')}
    >
      <ModalBody textAlign={'center'}>
        <Markdown source={feConfigs?.concatMd || ''} />
      </ModalBody>

      <ModalFooter>
        <Button variant={'whiteBase'} onClick={onClose}>
          {t('common:Close')}
        </Button>
      </ModalFooter>
    </MyModal>
  );
};

export default CommunityModal;
