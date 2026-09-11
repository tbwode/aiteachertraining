import React, { useMemo } from 'react';
import { ModalFooter, ModalBody, Input, Button, Box, Textarea } from '@chakra-ui/react';
import MyModal from './index';
import { useTranslation } from 'react-i18next';
import { useRequest2 } from '../../../hooks/useRequest';
import FormLabel from '../MyBox/FormLabel';
import { useForm } from 'react-hook-form';

export type EditFolderFormType = {
  id?: string;
  name?: string;
  intro?: string;
};
type CommitType = {
  name: string;
  intro?: string;
};

const EditFolderModal = ({
  onClose,
  onCreate,
  onEdit,
  id,
  name,
  intro
}: EditFolderFormType & {
  onClose: () => void;
  onCreate: (data: CommitType) => any;
  onEdit: (data: CommitType & { id: string }) => any;
}) => {
  const { t } = useTranslation();
  const isEdit = !!id;
  const { register, handleSubmit } = useForm<EditFolderFormType>({
    defaultValues: {
      name,
      intro
    }
  });

  const typeMap = useMemo(
    () =>
      isEdit
        ? {
            title: t('common:dataset.Edit Folder')
          }
        : {
            title: t('common:dataset.Create Folder')
          },
    [isEdit, t]
  );

  const { run: onSave, loading } = useRequest2(
    ({ name = '', intro }: EditFolderFormType) => {
      if (!name) return;

      if (isEdit) return onEdit({ id, name, intro });
      return onCreate({ name, intro });
    },
    {
      onSuccess: (res) => {
        onClose();
      }
    }
  );

  return (
    <MyModal isOpen onClose={onClose} title={typeMap.title} isCentered w={'480px'}>
      <ModalBody px={5} pb={6} pt={2}>
        <Box>
          <FormLabel mb={2}>{t('common:folder_name')}</FormLabel>
          <Input
            {...register('name', { required: true })}
            variant={'white'}
            autoFocus
            maxLength={100}
            placeholder={t('common:folder_name_placeholder')}
          />
        </Box>
        <Box mt={6}>
          <FormLabel mb={2}>{t('common:folder_description')}</FormLabel>
          <Textarea
            {...register('intro')}
            variant={'white'}
            px={3}
            maxLength={200}
            placeholder={t('common:folder_description_placeholder')}
          />
        </Box>
      </ModalBody>
      <ModalFooter px={8} pb={8}>
        <Button variant={'whiteBase'} mr={3} onClick={onClose} borderRadius={'lg'}>
          {t('common:Cancel')}
        </Button>
        <Button isLoading={loading} onClick={handleSubmit(onSave)} borderRadius={'lg'}>
          {isEdit ? t('common:Confirm') : t('common:Create')}
        </Button>
      </ModalFooter>
    </MyModal>
  );
};

export default EditFolderModal;
