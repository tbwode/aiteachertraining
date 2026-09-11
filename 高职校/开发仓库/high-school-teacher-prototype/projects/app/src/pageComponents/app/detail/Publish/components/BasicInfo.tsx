import React from 'react';
import { Box, Flex, Input } from '@chakra-ui/react';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { type UseFormRegister, type UseFormSetValue } from 'react-hook-form';
import { type OutLinkEditType } from '@fastgpt/global/support/outLink/type';
import FormLabel from '@fastgpt/web/components/common/MyBox/FormLabel';

function BasicInfo({
  register,
  setValue,
  defaultData
}: {
  register: UseFormRegister<OutLinkEditType<any>>;
  setValue: UseFormSetValue<OutLinkEditType<any>>;
  defaultData: OutLinkEditType<any>;
}) {
  const { t } = useTranslation();
  return (
    <Flex flexDirection="column" gap={5}>
      <Box color="#000" fontSize={'16px'} marginBottom={'-4px'}>
        {t('publish:basic_info')}
      </Box>
      <Box>
        <FormLabel required color={'myBlack.base'} fontSize={'base'} fontWeight={500} mb={'6px'}>
          {t('common:Name')}
        </FormLabel>
        <Input
          variant={'white'}
          placeholder={t('publish:publish_name')}
          maxLength={100}
          {...register('name', {
            required: t('common:name_is_empty')
          })}
        />
      </Box>
      <Box>
        <FormLabel color={'myBlack.base'} fontSize={'base'} fontWeight={500} mb={'6px'}>
          QPM
          <QuestionTip ml={1} label={t('publish:qpm_tips')}></QuestionTip>
        </FormLabel>
        <Input
          variant={'white'}
          max={1000}
          {...register('limit.QPM', {
            min: 0,
            max: 1000,
            valueAsNumber: true,
            required: t('publish:qpm_is_empty')
          })}
        />
      </Box>
      <Box>
        <FormLabel color={'myBlack.base'} fontSize={'base'} fontWeight={500} mb={'6px'}>
          {t('common:support.outlink.Max usage points')}
          <QuestionTip
            ml={1}
            label={t('common:support.outlink.Max usage points tip')}
          ></QuestionTip>
        </FormLabel>
        <Input
          variant={'white'}
          {...register('limit.maxUsagePoints', {
            min: -1,
            max: 10000000,
            valueAsNumber: true,
            required: true
          })}
        />
      </Box>
      <Box>
        <FormLabel color={'myBlack.base'} fontSize={'base'} fontWeight={500} mb={'6px'}>
          {t('common:expired_time')}
        </FormLabel>
        <Input
          variant={'white'}
          type="datetime-local"
          defaultValue={
            defaultData.limit?.expiredTime
              ? dayjs(defaultData.limit?.expiredTime).format('YYYY-MM-DDTHH:mm')
              : ''
          }
          onChange={(e) => {
            setValue('limit.expiredTime', new Date(e.target.value));
          }}
        />
      </Box>
    </Flex>
  );
}

export default BasicInfo;
