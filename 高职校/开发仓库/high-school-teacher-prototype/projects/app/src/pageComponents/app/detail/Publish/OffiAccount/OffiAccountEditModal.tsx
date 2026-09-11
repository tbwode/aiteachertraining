import React from 'react';
import { Flex, Box, ModalBody, Input, Link, ModalFooter } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { PublishChannelEnum } from '@fastgpt/global/support/outLink/constant';
import type { OffiAccountAppType, OutLinkEditType } from '@fastgpt/global/support/outLink/type';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { createShareChat, updateShareChat } from '@/web/support/outLink/api';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import BasicInfo from '../components/BasicInfo';
import { getDocPath } from '@/web/common/system/doc';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import MyIcon from '@fastgpt/web/components/common/Icon';
import FormLabel from '@fastgpt/web/components/common/MyBox/FormLabel';

const OffiAccountEditModal = ({
  appId,
  defaultData,
  onClose,
  onCreate,
  onEdit,
  isEdit = false
}: {
  appId: string;
  defaultData: OutLinkEditType<OffiAccountAppType>;
  onClose: () => void;
  onCreate: (id: string) => void;
  onEdit: () => void;
  isEdit?: boolean;
}) => {
  const { t } = useTranslation();
  const {
    register,
    setValue,
    handleSubmit: submitShareChat
  } = useForm({
    defaultValues: defaultData
  });

  const { runAsync: onclickCreate, loading: creating } = useRequest2(
    (e: OutLinkEditType<OffiAccountAppType>) => {
      if (e?.app) {
        e.app.appId = e.app.appId?.trim();
        e.app.secret = e.app.secret?.trim();
        e.app.CallbackToken = e.app.CallbackToken?.trim();
        e.app.CallbackEncodingAesKey = e.app.CallbackEncodingAesKey?.trim();
      }
      return createShareChat({
        ...e,
        appId,
        type: PublishChannelEnum.officialAccount
      });
    },
    {
      errorToast: t('common:create_failed'),
      successToast: t('common:create_success'),
      onSuccess: onCreate
    }
  );

  const { runAsync: onclickUpdate, loading: updating } = useRequest2(
    (e) => {
      if (e?.app) {
        e.app.appId = e.app.appId?.trim();
        e.app.secret = e.app.secret?.trim();
        e.app.CallbackToken = e.app.CallbackToken?.trim();
        e.app.CallbackEncodingAesKey = e.app.CallbackEncodingAesKey?.trim();
      }
      return updateShareChat(e);
    },
    {
      errorToast: t('common:update_failed'),
      successToast: t('common:update_success'),
      onSuccess: onEdit
    }
  );

  const { feConfigs } = useSystemStore();

  return (
    <MyModal
      // iconSrc="/imgs/modal/shareFill.svg"
      title={
        isEdit
          ? t('publish:official_account.edit_modal_title')
          : t('publish:official_account.create_modal_title')
      }
      onClose={onClose}
      minW={['auto', '60rem']}
    >
      <ModalBody
        borderTop={'md'}
        borderBottom={'md'}
        display={'grid'}
        gridTemplateColumns={['1fr', '1fr 1fr']}
        fontSize={'14px'}
        p={0}
      >
        <Box p={5} minH={['auto', '400px']} borderRight={'base'}>
          <BasicInfo register={register} setValue={setValue} defaultData={defaultData} />
        </Box>
        <Flex p={5} minH={['auto', '400px']} flexDirection="column" gap={5}>
          <Flex alignItems="flex-end">
            <Box color="#000" fontSize={'16px'} marginBottom={'-4px'}>
              {t('publish:official_account.params')}
            </Box>
            {feConfigs?.docUrl && (
              <Link
                href={getDocPath('/docs/use-cases/external-integration/official_account/')}
                target={'_blank'}
                ml={2}
                color={'blue.main'}
                fontSize={'12px'}
              >
                <Flex alignItems={'center'}>
                  {/* <MyIcon name="book" w={'17px'} h={'17px'} mr="1" /> */}
                  {t('common:read_doc')}
                </Flex>
              </Link>
            )}
          </Flex>
          <Box>
            <FormLabel
              color={'myBlack.base'}
              fontSize={'base'}
              fontWeight={500}
              mb={'6px'}
              required
            >
              App ID
            </FormLabel>
            <Input
              variant={'white'}
              placeholder="App ID"
              {...register('app.appId', {
                required: true
              })}
            />
          </Box>
          <Box>
            <FormLabel
              color={'myBlack.base'}
              fontSize={'base'}
              fontWeight={500}
              mb={'6px'}
              required
            >
              Secret
            </FormLabel>
            <Input
              variant={'white'}
              placeholder="Secret"
              {...register('app.secret', {
                required: true
              })}
            />
          </Box>
          <Box>
            <FormLabel
              color={'myBlack.base'}
              fontSize={'base'}
              fontWeight={500}
              mb={'6px'}
              required
            >
              Token
            </FormLabel>
            <Input
              variant={'white'}
              placeholder="Token"
              {...register('app.CallbackToken', {
                required: true
              })}
            />
          </Box>
          <Box>
            <FormLabel color={'myBlack.base'} fontSize={'base'} fontWeight={500} mb={'6px'}>
              AES Key
            </FormLabel>
            <Input
              variant={'white'}
              placeholder="AES Key"
              {...register('app.CallbackEncodingAesKey')}
            />
          </Box>
        </Flex>
      </ModalBody>

      <ModalFooter py={5}>
        <Button variant={'whiteBase'} mr={3} onClick={onClose}>
          {t('common:Close')}
        </Button>
        <Button
          isLoading={creating || updating}
          onClick={submitShareChat((data) => (isEdit ? onclickUpdate(data) : onclickCreate(data)))}
        >
          {t('common:Confirm')}
        </Button>
      </ModalFooter>
    </MyModal>
  );
};

export default OffiAccountEditModal;
