import { AccordionButton, AccordionPanel, Box, Flex, type TextareaProps } from '@chakra-ui/react';
import React from 'react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import ChatFunctionTip from './Tip';
import MyTextarea from '@/components/common/Textarea/MyTextarea';
import { useTranslation } from 'react-i18next';
import FormLabel from '@fastgpt/web/components/common/MyBox/FormLabel';

const WelcomeTextConfig = ({ isExpanded, ...props }: TextareaProps & { isExpanded?: boolean }) => {
  const { t } = useTranslation();

  return (
    <>
      <AccordionButton alignItems={'center'} p={4}>
        {/* <MyIcon name={'core/app/simpleMode/chat'} w={'20px'} /> */}
        <MyIcon
          name={'arrowRight'}
          w={'20px'}
          mr={'10px'}
          transform={isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}
          transition={'transform 0.2s'}
        />
        <FormLabel color={'myBlack.pure'} fontSize={'15px'}>
          {t('common:core.app.Welcome Text')}
        </FormLabel>
        <ChatFunctionTip type={'welcome'} />
      </AccordionButton>
      <AccordionPanel p={4} pt={0}>
        <MyTextarea
          className="nowheel"
          iconSrc={'core/app/simpleMode/chat'}
          title={t('common:core.app.Welcome Text')}
          mt={1.5}
          rows={6}
          fontSize={'sm'}
          bg={'white'}
          minW={['auto', '384px']}
          placeholder={t('common:core.app.tip.welcomeTextTip')}
          autoHeight
          minH={100}
          maxH={200}
          _placeholder={{
            color: 'rgba(0, 0, 0, 0.40)'
          }}
          {...props}
        />
      </AccordionPanel>
    </>
  );
};

export default React.memo(WelcomeTextConfig);
