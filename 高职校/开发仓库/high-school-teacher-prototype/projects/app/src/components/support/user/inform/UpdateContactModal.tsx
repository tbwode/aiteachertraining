import React from 'react';
import { ModalBody, Box, Flex, Input, ModalFooter, HStack } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { updateContact, updateNotificationAccount } from '@/web/support/user/api';
import Icon from '@fastgpt/web/components/common/Icon';
import { useSendCode } from '@/web/support/user/hooks/useSendCode';
import { useUserStore } from '@/web/support/user/useUserStore';
import { useSystemStore } from '@/web/common/system/useSystemStore';

type FormType = {
  contact: string;
  verifyCode: string;
};

const UpdateContactModal = ({
  onClose,
  onSuccess,
  mode
}: {
  onClose: () => void;
  onSuccess?: (val: string) => void;
  mode: 'contact' | 'notification_account';
}) => {
  const { t } = useTranslation();
  const { initUserInfo } = useUserStore();
  const { feConfigs } = useSystemStore();

  const { register, handleSubmit, watch } = useForm<FormType>({
    defaultValues: {
      contact: '',
      verifyCode: ''
    }
  });

  const account = watch('contact');
  const verifyCode = watch('verifyCode');

  const { runAsync: onSubmit, loading: isLoading } = useRequest2(
    async (data: FormType) => {
      if (mode === 'contact') {
        await updateContact(data);
      } else {
        await updateNotificationAccount({
          account: data.contact,
          verifyCode: data.verifyCode
        });
      }
      return data.contact;
    },
    {
      onSuccess(data) {
        initUserInfo();
        onClose();
        onSuccess?.(data);
      },
      successToast: t('common:support.user.info.bind_notification_success'),
      errorToast: t('common:support.user.info.bind_notification_error')
    }
  );

  const { SendCodeBox } = useSendCode({ type: 'bindNotification' });

  const placeholder = feConfigs?.bind_notification_method
    ?.map((item) => {
      switch (item) {
        case 'email':
          return t('common:support.user.login.Email');
        case 'phone':
          return t('common:support.user.login.Phone number');
      }
    })
    .join('/');

  return (
    <>
      <MyModal
        isOpen
        // iconSrc="common/settingLight"
        w={'32rem'}
        title={
          mode === 'notification_account'
            ? t('common:support.user.info.notification_receiving_hint')
            : t('common:contact_way')
        }
      >
        <ModalBody p={5}>
          <Flex flexDirection="column">
            <HStack px="4" py="10px" color="#1D2129" bgColor="#FFF7E8" borderRadius="12px">
              <Icon name="account/warning_fill" w="16px" color="#FF7D00" />
              <Box fontSize={'14px'}>{t('common:support.user.info.bind_notification_hint')}</Box>
            </HStack>
            <Box mt="6">
              <Box fontSize={'14px'} color={'myBlack.base'} mb={'6px'}>
                {t('common:user.Account')}
              </Box>
              <Input
                variant={'white'}
                {...register('contact', { required: true })}
                placeholder={placeholder}
              ></Input>
            </Box>
            <Box mt="5" position={'relative'}>
              <Box fontSize={'14px'} color={'myBlack.base'} mb={'6px'}>
                {t('common:support.user.info.verification_code')}
              </Box>
              <Flex alignItems={'center'}>
                <Input
                  variant={'white'}
                  {...register('verifyCode', { required: true })}
                  placeholder={t('common:support.user.info.code_required')}
                ></Input>
                <SendCodeBox username={account} />
              </Flex>
            </Box>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button mr={3} variant={'whiteBase'} onClick={onClose}>
            {t('common:Cancel')}
          </Button>
          <Button
            isLoading={isLoading}
            isDisabled={!account || !verifyCode}
            onClick={handleSubmit((data) => onSubmit(data))}
          >
            {t('common:Confirm')}
          </Button>
        </ModalFooter>
      </MyModal>
    </>
  );
};

export default UpdateContactModal;
