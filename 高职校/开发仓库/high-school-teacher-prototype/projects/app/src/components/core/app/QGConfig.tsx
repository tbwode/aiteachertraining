import MyIcon from '@fastgpt/web/components/common/Icon';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import {
  Box,
  Flex,
  ModalBody,
  useDisclosure,
  Switch,
  type BoxProps,
  AccordionButton,
  AccordionPanel
} from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { AppQGConfigType } from '@fastgpt/global/core/app/type.d';
import MyModal from '@fastgpt/web/components/common/MyModal';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import { defaultQGConfig } from '@fastgpt/global/core/app/constants';
import ChatFunctionTip from './Tip';
import FormLabel from '@fastgpt/web/components/common/MyBox/FormLabel';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import AIModelSelector from '@/components/Select/AIModelSelector';
import CustomPromptEditor from '@fastgpt/web/components/common/Textarea/CustomPromptEditor';
import {
  QuestionGuideFooterPrompt,
  QuestionGuidePrompt
} from '@fastgpt/global/core/ai/prompt/agent';
import Empty from '@/pageComponents/app/detail/SimpleApp/components/Empty';

// question generator config
const QGConfig = ({
  value = defaultQGConfig,
  isExpanded,
  onChange
}: {
  value?: AppQGConfigType;
  isExpanded: boolean;
  onChange: (e: AppQGConfigType) => void;
}) => {
  const { t } = useTranslation();
  // const { isOpen, onOpen, onClose } = useDisclosure();

  const isOpenQG = value.open;

  // const formLabel = isOpenQG
  //   ? t('common:core.app.whisper.Open')
  //   : t('common:core.app.whisper.Close');

  const { llmModelList } = useSystemStore();
  const model = value?.model || llmModelList?.[0]?.model;
  const customPrompt = value.customPrompt;
  const {
    isOpen: isOpenCustomPrompt,
    onOpen: onOpenCustomPrompt,
    onClose: onCloseCustomPrompt
  } = useDisclosure();

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
          {t('common:core.app.Question Guide')}
        </FormLabel>
        <ChatFunctionTip type={'nextQuestion'} />
        <Box flex={1} />
        {/* <MyTooltip label={t('app:config_question_guide')}>
        <Button
          variant={'transparentBase'}
          size={'sm'}
          mr={'-5px'}
          color={'myGray.600'}
          onClick={onOpen}
        >
          {formLabel}
        </Button>
      </MyTooltip> */}
        <MyTooltip label={t('app:config_question_guide')}>
          {/* <Box onClick={onOpen}>
            <Switch isChecked={isOpenQG}></Switch>
          </Box> */}
          <Switch
            isChecked={isOpenQG}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              onChange({
                ...value,
                open: e.target.checked
              });
            }}
          />
        </MyTooltip>

        {/* {isOpen && <QGConfigModal value={value} onChange={onChange} onClose={onClose} />} */}
      </AccordionButton>
      <AccordionPanel p={4} pt={0}>
        {!isOpenQG && <Empty />}
        {isOpenQG && (
          <>
            <Flex alignItems={'center'} mt={4}>
              <Box {...LabelStyles} mr={2}>
                {t('common:core.ai.Model')}
              </Box>
              <Box flex={'1 0 0'}>
                <AIModelSelector
                  width={'100%'}
                  value={model}
                  list={llmModelList.map((item) => ({
                    value: item.model,
                    label: item.name
                  }))}
                  onChange={(e) => {
                    onChange({
                      ...value,
                      model: e
                    });
                  }}
                />
              </Box>
            </Flex>

            <Box mt={4}>
              <Flex alignItems={'center'} mb={1}>
                <FormLabel>{t('app:core.dataset.import.Custom prompt')}</FormLabel>
                <QuestionTip ml={1} label={t('common:core.app.QG.Custom prompt tip')} />
                <Box flex={1} />
                <Button
                  size="xs"
                  variant={'transparentBase'}
                  color={'#165DFF'}
                  // leftIcon={<MyIcon name={'edit'} w={'14px'} />}
                  onClick={onOpenCustomPrompt}
                >
                  {t('common:Edit')}
                </Button>
              </Flex>
              <Box
                position={'relative'}
                bg={'#fff'}
                border={'1px'}
                borderColor={'borderColor.base'}
                borderRadius={'md'}
                maxH={'200px'}
                overflow={'auto'}
                px={3}
                py={2}
                fontSize={'sm'}
                textAlign={'justify'}
                whiteSpace={'pre-wrap'}
                _hover={{
                  '& .mask': {
                    display: 'block'
                  }
                }}
              >
                {customPrompt || QuestionGuidePrompt}
              </Box>
              {isOpenCustomPrompt && (
                <CustomPromptEditor
                  defaultValue={customPrompt}
                  defaultPrompt={QuestionGuidePrompt}
                  footerPrompt={QuestionGuideFooterPrompt}
                  onChange={(e) => {
                    onChange({
                      ...value,
                      customPrompt: e
                    });
                  }}
                  onClose={onCloseCustomPrompt}
                />
              )}
            </Box>
          </>
        )}
      </AccordionPanel>
    </>
  );
};

export default QGConfig;

const LabelStyles: BoxProps = {
  display: 'flex',
  alignItems: 'center',
  fontSize: 'sm',
  color: 'myGray.900',
  width: ['6rem', '8rem']
};
// const QGConfigModal = ({
//   value,
//   onClose,
//   onChange
// }: {
//   value: AppQGConfigType;
//   onChange: (e: AppQGConfigType) => void;
//   onClose: () => void;
// }) => {
//   const { t } = useTranslation();
//   const { llmModelList } = useSystemStore();

//   const customPrompt = value.customPrompt;
//   const isOpenQG = value.open;
//   const model = value?.model || llmModelList?.[0]?.model;

//   const {
//     isOpen: isOpenCustomPrompt,
//     onOpen: onOpenCustomPrompt,
//     onClose: onCloseCustomPrompt
//   } = useDisclosure();

//   return (
//     <>
//       <MyModal
//         title={t('common:core.chat.Question Guide')}
//         iconSrc="core/chat/QGFill"
//         isOpen
//         onClose={onClose}
//         width="500px"
//       >
//         <ModalBody px={[5, 10]} py={[4, 8]} pb={[4, 12]}>
//           <Flex justifyContent={'space-between'} alignItems={'center'}>
//             <FormLabel flex={'0 0 100px'}>{t('app:core.app.QG.Switch')}</FormLabel>
//             <Switch
//               isChecked={isOpenQG}
//               onChange={(e) => {
//                 onChange({
//                   ...value,
//                   open: e.target.checked
//                 });
//               }}
//             />
//           </Flex>
//           {isOpenQG && <></>}
//         </ModalBody>
//       </MyModal>
//       {isOpenCustomPrompt && (
//         <CustomPromptEditor
//           defaultValue={customPrompt}
//           defaultPrompt={QuestionGuidePrompt}
//           footerPrompt={QuestionGuideFooterPrompt}
//           onChange={(e) => {
//             onChange({
//               ...value,
//               customPrompt: e
//             });
//           }}
//           onClose={onCloseCustomPrompt}
//         />
//       )}
//     </>
//   );
// };
