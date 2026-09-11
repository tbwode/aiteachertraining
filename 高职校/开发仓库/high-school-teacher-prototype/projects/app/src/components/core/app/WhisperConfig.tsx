import MyIcon from '@fastgpt/web/components/common/Icon';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import {
  Box,
  // Button,
  Flex,
  // ModalBody,
  useDisclosure,
  Switch,
  AccordionButton,
  AccordionPanel
} from '@chakra-ui/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { AppWhisperConfigType } from '@fastgpt/global/core/app/type.d';
// import MyModal from '@fastgpt/web/components/common/MyModal';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import { defaultWhisperConfig } from '@fastgpt/global/core/app/constants';
import FormLabel from '@fastgpt/web/components/common/MyBox/FormLabel';
import Empty from '@/pageComponents/app/detail/SimpleApp/components/Empty';

const WhisperConfig = ({
  isOpenAudio,
  value = defaultWhisperConfig,
  isExpanded,
  onChange
}: {
  isOpenAudio: boolean;
  isExpanded: boolean;
  value?: AppWhisperConfigType;
  onChange: (e: AppWhisperConfigType) => void;
}) => {
  const { t } = useTranslation();
  // const { isOpen, onOpen, onClose } = useDisclosure();

  const isOpenWhisper = value.open;
  const isAutoSend = value.autoSend;

  const formLabel = isOpenWhisper
    ? t('common:core.app.whisper.Open')
    : t('common:core.app.whisper.Close');

  return (
    <>
      <AccordionButton alignItems={'center'} p={4}>
        <MyIcon
          name={'arrowRight'}
          w={'20px'}
          mr={'10px'}
          transform={isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}
          transition={'transform 0.2s'}
        />
        <FormLabel color={'myBlack.pure'} fontSize={'15px'}>
          {t('common:core.app.Whisper')}
        </FormLabel>
        <Box flex={1} />
        <MyTooltip label={t('common:core.app.Config whisper')}>
          <Switch
            isChecked={isOpenWhisper}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              onChange({
                ...value,
                open: e.target.checked
              });
            }}
          />
        </MyTooltip>
        {/* <MyTooltip label={t('common:core.app.Config whisper')}>
        <Button
          variant={'transparentBase'}
          iconSpacing={1}
          size={'sm'}
          mr={'-5px'}
          color={'myGray.600'}
          onClick={onOpen}
        >
          {formLabel}
        </Button>
      </MyTooltip> */}
        {/* <MyModal
          title={t('common:core.app.Whisper config')}
          iconSrc="core/app/simpleMode/whisper"
          isOpen={isOpen}
          onClose={onClose}
        >
          <ModalBody px={[5, 16]} py={[4, 8]}>
            <Flex justifyContent={'space-between'} alignItems={'center'}>
              <FormLabel>{t('common:core.app.whisper.Switch')}</FormLabel>
              <Switch
                isChecked={isOpenWhisper}
                onChange={(e) => {
                  onChange({
                    ...value,
                    open: e.target.checked
                  });
                }}
              />
            </Flex>
          </ModalBody>
        </MyModal> */}
      </AccordionButton>
      <AccordionPanel p={4} pt={0}>
        {!isOpenWhisper && <Empty />}
        {isOpenWhisper && (
          <Flex alignItems={'center'}>
            <FormLabel>{t('common:core.app.whisper.Auto send')}</FormLabel>
            <QuestionTip label={t('common:core.app.whisper.Auto send tip')} />
            <Box flex={'1 0 0'} />
            <Switch
              isChecked={value.autoSend}
              onChange={(e) => {
                onChange({
                  ...value,
                  autoSend: e.target.checked
                });
              }}
            />
          </Flex>
        )}
        {isOpenWhisper && isAutoSend && (
          <>
            <Flex mt={'14px'} alignItems={'center'}>
              <FormLabel>{t('common:core.app.whisper.Auto tts response')}</FormLabel>
              <QuestionTip label={t('common:core.app.whisper.Auto tts response tip')} />
              <Box flex={'1 0 0'} />
              <Switch
                isChecked={value.autoTTSResponse}
                onChange={(e) => {
                  onChange({
                    ...value,
                    autoTTSResponse: e.target.checked
                  });
                }}
              />
            </Flex>
            {!isOpenAudio && (
              <Box mt={1} color={'myGray.600'} fontSize={'sm'}>
                {t('common:core.app.whisper.Not tts tip')}
              </Box>
            )}
          </>
        )}
      </AccordionPanel>
    </>
  );
};

export default React.memo(WhisperConfig);
