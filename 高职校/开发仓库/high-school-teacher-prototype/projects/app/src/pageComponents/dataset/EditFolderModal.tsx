import React, { useMemo, useRef, useState } from 'react';
import { ModalFooter, ModalBody, Input, Box } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useTranslation } from 'react-i18next';
import { useRequest } from '@fastgpt/web/hooks/useRequest';

const EditFolderModal = ({
  onClose,
  editCallback,
  isEdit = false,
  name
}: {
  onClose: () => void;
  editCallback: (name: string) => Promise<any>;
  isEdit: boolean;
  name?: string;
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const typeMap = useMemo(
    () =>
      isEdit
        ? {
            title: t('common:dataset.Edit Folder')
          }
        : {
            title: t('common:create_folder')
          },
    [isEdit, t]
  );

  const { mutate: onSave, isLoading } = useRequest({
    mutationFn: () => {
      const val = inputRef.current?.value;
      if (!val) return Promise.resolve('');
      return editCallback(val);
    },
    onSuccess: () => {
      onClose();
    }
  });

  return (
    <MyModal isOpen onClose={onClose} title={typeMap.title} isCentered>
      <ModalBody>
        <Box color={'#18181B'} fontSize={'14px'} fontWeight={'500'} mb={2}>
          {t('common:folder_name')}
        </Box>
        <Input
          ref={inputRef}
          defaultValue={name}
          placeholder={t('common:dataset.Folder Name') || ''}
          autoFocus
          maxLength={100}
          bg={'#fff'}
          boxShadow={
            '0 var(--depth, 0) var(--depth, 0) 0 rgba(255, 255, 255, 0.10) inset, 0 2px 4px 0 var(--form-field-shadow, rgba(0, 0, 0, 0.04)), 0 1px 2px 0 var(--form-field-shadow-2, rgba(0, 0, 0, 0.06)), 0 0 1px 0 var(--form-field-shadow-2, rgba(0, 0, 0, 0.06))'
          }
          borderRadius={'12px'}
        />
      </ModalBody>
      <ModalFooter>
        <Button
          onClick={onClose}
          borderRadius={'12px'}
          bg={'white'}
          color={'#000'}
          mr={2}
          border={'1px solid'}
          borderColor={'#eee'}
        >
          {t('common:cancel')}
        </Button>
        <Button isLoading={isLoading} onClick={onSave} borderRadius={'12px'}>
          {t('common:create')}
        </Button>
      </ModalFooter>
    </MyModal>
  );
};

export default EditFolderModal;

export const useEditFolder = () => {
  const [editFolderData, setEditFolderData] = useState<{
    id?: string;
    name?: string;
  }>();

  return {
    editFolderData,
    setEditFolderData
  };
};
