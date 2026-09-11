import { getCaptchaPic } from '@/web/support/user/api';
import { Box, Input, ModalBody, ModalFooter, Skeleton } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import MyImage from '@fastgpt/web/components/common/Image/MyImage';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';

const SendCodeAuthModal = ({
  username,
  onClose,
  onSending,
  onSendCode
}: {
  username: string;
  onClose: () => void;

  onSending: boolean;
  onSendCode: (e: { username: string; captcha: string }) => Promise<void>;
}) => {
  const { t } = useTranslation();

  const { register, handleSubmit } = useForm({
    defaultValues: {
      code: ''
    }
  });

  const {
    data,
    loading,
    runAsync: getCaptcha
  } = useRequest2(() => getCaptchaPic(username), { manual: false });

  const onSubmit = async ({ code }: { code: string }) => {
    await onSendCode({ username, captcha: code });
    onClose();
  };

  const onError = (err: any) => {
    console.log(err);
  };

  const handleEnterKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key.toLowerCase() !== 'enter') return;
    handleSubmit(onSubmit, onError)();
  };

  return (
    <MyModal isOpen={true}>
      <ModalBody pt={8}>
        <Skeleton
          minH="200px"
          isLoaded={!loading}
          fadeDuration={1}
          display={'flex'}
          justifyContent={'center'}
        >
          <MyImage
            borderRadius={'16px'}
            w={'100%'}
            h={'176px'}
            _hover={{ cursor: 'pointer' }}
            mb={4}
            onClick={getCaptcha}
            src={data?.captchaImage}
            alt=""
          />
        </Skeleton>
        <Box fontSize={'14px'} color={'myBlack.base'} mb={'6px'}>
          {t('account_info:verification_code')}
        </Box>
        <Input
          variant={'white'}
          placeholder={t('common:support.user.captcha_placeholder')}
          {...register('code')}
          onKeyDown={handleEnterKeyDown}
        />
      </ModalBody>
      <ModalFooter gap={2}>
        <Button isLoading={onSending} variant={'whiteBase'} onClick={onClose}>
          {t('common:Cancel')}
        </Button>
        <Button isLoading={onSending} onClick={handleSubmit(onSubmit, onError)}>
          {t('common:Confirm')}
        </Button>
      </ModalFooter>
    </MyModal>
  );
};

export default SendCodeAuthModal;
