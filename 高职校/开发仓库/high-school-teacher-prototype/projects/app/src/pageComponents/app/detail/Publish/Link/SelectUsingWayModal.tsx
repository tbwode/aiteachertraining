import { type OutLinkSchema } from '@fastgpt/global/support/outLink/type';
import React, { useCallback, useState } from 'react';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Center,
  Divider,
  Flex,
  type FlexProps,
  Grid,
  ModalBody,
  Switch,
  useTheme
} from '@chakra-ui/react';
import MyRadio from '@/components/common/MyRadio';
import { useForm } from 'react-hook-form';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useCopyData } from '@fastgpt/web/hooks/useCopyData';
import { useSelectFile } from '@/web/common/file/hooks/useSelectFile';
import { fileToBase64 } from '@/web/common/file/utils';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import MyImage from '@fastgpt/web/components/common/Image/MyImage';
import { subRoute } from '@fastgpt/web/common/system/utils';

enum UsingWayEnum {
  link = 'link',
  iframe = 'iframe',
  script = 'script'
}

const SelectUsingWayModal = ({ share, onClose }: { share: OutLinkSchema; onClose: () => void }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { copyData } = useCopyData();
  const { File, onOpen } = useSelectFile({
    multiple: false,
    fileType: 'image/*'
  });
  const { feConfigs } = useSystemStore();

  const VariableTypeList = [
    {
      title: <MyImage src={'/imgs/outlink/link.svg'} alt={''} />,
      value: UsingWayEnum.link
    },
    {
      title: <MyImage src={'/imgs/outlink/iframe.svg'} alt={''} />,
      value: UsingWayEnum.iframe
    },
    {
      title: <MyImage src={'/imgs/outlink/script.svg'} alt={''} />,
      value: UsingWayEnum.script
    }
  ];

  const [refresh, setRefresh] = useState(false);

  const { getValues, setValue, register, watch } = useForm({
    defaultValues: {
      usingWay: UsingWayEnum.link,
      showHistory: true,
      scriptIconCanDrag: false,
      scriptDefaultOpen: false,
      scriptOpenIcon:
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTguOTk5NTggMS42ODc1QzcuNzI5NiAxLjY4NzQgNi40ODE0OSAyLjAxODA2IDUuMzc4MTMgMi42NDY5MUM0LjI3NDc3IDMuMjc1NzYgMy4zNTQyMSA0LjE4MTEyIDIuNzA3MDggNS4yNzM4NkMyLjA1OTk1IDYuMzY2NiAxLjcwODU3IDcuNjA5MDQgMS42ODc1MyA4Ljg3ODg0QzEuNjY2NDkgMTAuMTQ4NiAxLjk3NjUxIDExLjQwMiAyLjU4NzA4IDEyLjUxNTZMMS45ODk0MiAxNC42MThDMS45MzMyMSAxNC44MTE0IDEuOTI5NjQgMTUuMDE2NCAxLjk3OTA5IDE1LjIxMTdDMi4wMjg1MyAxNS40MDY5IDIuMTI5MTggMTUuNTg1NSAyLjI3MDY3IDE1LjcyODlDMi40MTIxNSAxNS44NzExIDIuNTg5NDggMTUuOTcyMyAyLjc4MzgzIDE2LjAyMThDMi45NzgxOSAxNi4wNzEzIDMuMTgyMzIgMTYuMDY3MyAzLjM3NDU4IDE2LjAxMDJMNS40ODM5NSAxNS40MTI1QzYuNDYxNSAxNS45NDgzIDcuNTQ4NiAxNi4yNTM1IDguNjYyMTYgMTYuMzA0OEM5Ljc3NTcyIDE2LjM1NiAxMC44ODYzIDE2LjE1MjEgMTEuOTA4OSAxNS43MDg0QzEyLjkzMTYgMTUuMjY0NyAxMy44MzkzIDE0LjU5MzEgMTQuNTYyNiAxMy43NDQ5QzE1LjI4NTkgMTIuODk2NyAxNS44MDU4IDExLjg5NDQgMTYuMDgyNCAxMC44MTQ1QzE2LjM1OSA5LjczNDYyIDE2LjM4NSA4LjYwNTc5IDE2LjE1ODUgNy41MTQzQzE1LjkzMjEgNi40MjI4IDE1LjQ1OSA1LjM5NzU0IDE0Ljc3NTYgNC41MTY4N0MxNC4wOTIyIDMuNjM2MTkgMTMuMjE2NSAyLjkyMzQzIDEyLjIxNTQgMi40MzMwNUMxMS4yMTQzIDEuOTQyNjcgMTAuMTE0MyAxLjY4NzY1IDguOTk5NTggMS42ODc1Wk01LjYyNDU4IDkuODQzNzVDNS40NTc3IDkuODQzNzUgNS4yOTQ1NyA5Ljc5NDI2IDUuMTU1ODIgOS43MDE1NUM1LjAxNzA2IDkuNjA4ODQgNC45MDg5MiA5LjQ3NzA2IDQuODQ1MDYgOS4zMjI4OUM0Ljc4MTE5IDkuMTY4NzEgNC43NjQ0OCA4Ljk5OTA2IDQuNzk3MDQgOC44MzUzOUM0LjgyOTYgOC42NzE3MiA0LjkwOTk2IDguNTIxMzggNS4wMjc5NiA4LjQwMzM4QzUuMTQ1OTYgOC4yODUzOCA1LjI5NjMgOC4yMDUwMiA1LjQ1OTk3IDguMTcyNDZDNS42MjM2NCA4LjEzOTkxIDUuNzkzMjkgOC4xNTY2MiA1Ljk0NzQ3IDguMjIwNDhDNi4xMDE2NCA4LjI4NDM0IDYuMjMzNDIgOC4zOTI0OCA2LjMyNjEzIDguNTMxMjRDNi40MTg4NCA4LjY2OTk5IDYuNDY4MzMgOC44MzMxMiA2LjQ2ODMzIDlDNi40NjgzMyA5LjIyMzc4IDYuMzc5NDMgOS40MzgzOSA2LjIyMTIgOS41OTY2MkM2LjA2Mjk3IDkuNzU0ODUgNS44NDgzNiA5Ljg0Mzc1IDUuNjI0NTggOS44NDM3NVpNOC45OTk1OCA5Ljg0Mzc1QzguODMyNyA5Ljg0Mzc1IDguNjY5NTcgOS43OTQyNiA4LjUzMDgyIDkuNzAxNTVDOC4zOTIwNiA5LjYwODg0IDguMjgzOTIgOS40NzcwNiA4LjIyMDA2IDkuMzIyODlDOC4xNTYxOSA5LjE2ODcxIDguMTM5NDggOC45OTkwNiA4LjE3MjA0IDguODM1MzlDOC4yMDQ2IDguNjcxNzIgOC4yODQ5NiA4LjUyMTM4IDguNDAyOTYgOC40MDMzOEM4LjUyMDk2IDguMjg1MzggOC42NzEzIDguMjA1MDIgOC44MzQ5NyA4LjE3MjQ2QzguOTk4NjQgOC4xMzk5MSA5LjE2ODI5IDguMTU2NjIgOS4zMjI0NyA4LjIyMDQ4QzkuNDc2NjQgOC4yODQzNCA5LjYwODQyIDguMzkyNDggOS43MDExMyA4LjUzMTI0QzkuNzkzODQgOC42Njk5OSA5Ljg0MzMzIDguODMzMTIgOS44NDMzMyA5QzkuODQzMzMgOS4yMjM3OCA5Ljc1NDQzIDkuNDM4MzkgOS41OTYyIDkuNTk2NjJDOS40Mzc5NyA5Ljc1NDg1IDkuMjIzMzUgOS44NDM3NSA4Ljk5OTU4IDkuODQzNzVaTTEyLjM3NDYgOS44NDM3NUMxMi4yMDc3IDkuODQzNzUgMTIuMDQ0NiA5Ljc5NDI2IDExLjkwNTggOS43MDE1NUMxMS43NjcxIDkuNjA4ODQgMTEuNjU4OSA5LjQ3NzA2IDExLjU5NTEgOS4zMjI4OUMxMS41MzEyIDkuMTY4NzEgMTEuNTE0NSA4Ljk5OTA2IDExLjU0NyA4LjgzNTM5QzExLjU3OTYgOC42NzE3MiAxMS42NiA4LjUyMTM4IDExLjc3OCA4LjQwMzM4QzExLjg5NiA4LjI4NTM4IDEyLjA0NjMgOC4yMDUwMiAxMi4yMSA4LjE3MjQ2QzEyLjM3MzYgOC4xMzk5MSAxMi41NDMzIDguMTU2NjIgMTIuNjk3NSA4LjIyMDQ4QzEyLjg1MTYgOC4yODQzNCAxMi45ODM0IDguMzkyNDggMTMuMDc2MSA4LjUzMTI0QzEzLjE2ODggOC42Njk5OSAxMy4yMTgzIDguODMzMTIgMTMuMjE4MyA5QzEzLjIxODMgOS4yMjM3OCAxMy4xMjk0IDkuNDM4MzkgMTIuOTcxMiA5LjU5NjYyQzEyLjgxMyA5Ljc1NDg1IDEyLjU5ODQgOS44NDM3NSAxMi4zNzQ2IDkuODQzNzVaIiBmaWxsPSIjMUMxQzFDIi8+Cjwvc3ZnPgo=',
      scriptCloseIcon:
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkgMS42ODc1QzcuNTUzNzMgMS42ODc1IDYuMTM5OTMgMi4xMTYzNyA0LjkzNzQgMi45MTk4OEMzLjczNDg2IDMuNzIzMzkgMi43OTc2IDQuODY1NDQgMi4yNDQxMyA2LjIwMTYzQzEuNjkwNjcgNy41Mzc4MSAxLjU0NTg2IDkuMDA4MTEgMS44MjgwMSAxMC40MjY2QzIuMTEwMTcgMTEuODQ1MSAyLjgwNjYxIDEzLjE0OCAzLjgyOTI4IDE0LjE3MDdDNC44NTE5NiAxNS4xOTM0IDYuMTU0OTIgMTUuODg5OCA3LjU3MzQxIDE2LjE3MkM4Ljk5MTg5IDE2LjQ1NDEgMTAuNDYyMiAxNi4zMDkzIDExLjc5ODQgMTUuNzU1OUMxMy4xMzQ2IDE1LjIwMjQgMTQuMjc2NiAxNC4yNjUxIDE1LjA4MDEgMTMuMDYyNkMxNS44ODM2IDExLjg2MDEgMTYuMzEyNSAxMC40NDYzIDE2LjMxMjUgOUMxNi4zMDg4IDcuMDYxNzUgMTUuNTM3MiA1LjIwMzk0IDE0LjE2NjYgMy44MzMzOUMxMi43OTYxIDIuNDYyODMgMTAuOTM4MyAxLjY5MTIyIDkgMS42ODc1Wk0xMS42NTA4IDEwLjg0OTJDMTEuNzU2NCAxMC45NTU5IDExLjgxNTcgMTEuMDk5OSAxMS44MTU3IDExLjI1QzExLjgxNTcgMTEuNDAwMSAxMS43NTY0IDExLjU0NDEgMTEuNjUwOCAxMS42NTA4QzExLjU0MzMgMTEuNzU0NyAxMS4zOTk2IDExLjgxMjkgMTEuMjUgMTEuODEyOUMxMS4xMDA0IDExLjgxMjkgMTAuOTU2NyAxMS43NTQ3IDEwLjg0OTIgMTEuNjUwOEw5IDkuNzk0NTNMNy4xNTA3OCAxMS42NTA4QzcuMDQzMjcgMTEuNzU0NyA2Ljg5OTU2IDExLjgxMjkgNi43NSAxMS44MTI5QzYuNjAwNDQgMTEuODEyOSA2LjQ1Njc0IDExLjc1NDcgNi4zNDkyMiAxMS42NTA4QzYuMjQzNiAxMS41NDQxIDYuMTg0MzQgMTEuNDAwMSA2LjE4NDM0IDExLjI1QzYuMTg0MzQgMTEuMDk5OSA2LjI0MzYgMTAuOTU1OSA2LjM0OTIyIDEwLjg0OTJMOC4yMDU0NyA5TDYuMzQ5MjIgNy4xNTA3OEM2LjI1OTUyIDcuMDQxNDkgNi4yMTM2OSA2LjkwMjc0IDYuMjIwNjIgNi43NjE1M0M2LjIyNzU2IDYuNjIwMzEgNi4yODY3NyA2LjQ4NjcyIDYuMzg2NzUgNi4zODY3NEM2LjQ4NjcyIDYuMjg2NzcgNi42MjAzMSA2LjIyNzU1IDYuNzYxNTMgNi4yMjA2MkM2LjkwMjc0IDYuMjEzNjggNy4wNDE0OSA2LjI1OTUyIDcuMTUwNzggNi4zNDkyMkw5IDguMjA1NDdMMTAuODQ5MiA2LjM0OTIyQzEwLjk1ODUgNi4yNTk1MiAxMS4wOTczIDYuMjEzNjggMTEuMjM4NSA2LjIyMDYyQzExLjM3OTcgNi4yMjc1NSAxMS41MTMzIDYuMjg2NzcgMTEuNjEzMyA2LjM4Njc0QzExLjcxMzIgNi40ODY3MiAxMS43NzI1IDYuNjIwMzEgMTEuNzc5NCA2Ljc2MTUzQzExLjc4NjMgNi45MDI3NCAxMS43NDA1IDcuMDQxNDkgMTEuNjUwOCA3LjE1MDc4TDkuNzk0NTMgOUwxMS42NTA4IDEwLjg0OTJaIiBmaWxsPSIjMUMxQzFDIi8+Cjwvc3ZnPgo='
    }
  });

  const selectFile = useCallback(
    async (files: File[], key: 'scriptOpenIcon' | 'scriptCloseIcon') => {
      const file = files[0];
      if (!file) return;
      // image to base64
      const base64 = await fileToBase64(file);
      setValue(key, base64);
    },
    [setValue]
  );

  watch(() => {
    setRefresh(!refresh);
  });

  const baseUrl = feConfigs?.customSharePageDomain || location?.origin;
  const linkUrl = `${baseUrl}${subRoute ? `${subRoute}/` : '/'}chat/share?shareId=${share?.shareId}${
    getValues('showHistory') ? '' : '&showHistory=0'
  }`;

  const wayMap = {
    [UsingWayEnum.link]: {
      blockTitle: t('common:core.app.outLink.Link block title'),
      code: linkUrl
    },
    [UsingWayEnum.iframe]: {
      blockTitle: t('common:core.app.outLink.Iframe block title'),
      code: `<iframe
  src="${linkUrl}"
  style="width: 100%; height: 100%;"
  frameborder="0" 
  allow="microphone *; *"
/>`
    },
    [UsingWayEnum.script]: {
      blockTitle: t('common:core.app.outLink.Script block title'),
      code: `<script
  type="text/javascript"
  src="${baseUrl}/js/iframe.js"
  id="chatbot-iframe" 
  data-bot-src="${linkUrl}" 
  data-default-open="${getValues('scriptDefaultOpen') ? 'true' : 'false'}"
  data-drag="${getValues('scriptIconCanDrag') ? 'true' : 'false'}"
  data-open-icon="${getValues('scriptOpenIcon')}"
  data-close-icon="${getValues('scriptCloseIcon')}"
  defer
></script>`
    }
  };

  const gridItemStyle: FlexProps = {
    alignItems: 'center',
    bg: '#fff',
    p: '12px 18px',
    borderRadius: '10px',
    border: theme.borders.sm
  };

  return (
    <MyModal
      isOpen
      isCentered
      // iconSrc="/imgs/modal/usingWay.svg"
      title={t('common:core.app.outLink.Select Using Way')}
      onClose={onClose}
      maxW={['90vw', '700px']}
    >
      <ModalBody py={3} px={5} borderTop={'base'}>
        <MyRadio
          gridGap={'14px'}
          gridTemplateColumns={['repeat(1,1fr)', 'repeat(3,1fr)']}
          value={getValues('usingWay')}
          list={VariableTypeList}
          hiddenCircle
          p={0}
          onChange={(e) => {
            setValue('usingWay', e);
          }}
        />

        {/* config */}
        <Grid
          gridTemplateColumns={['repeat(2,1fr)', 'repeat(3,1fr)']}
          gridGap={4}
          my={5}
          fontSize={'sm'}
        >
          <Flex {...gridItemStyle}>
            <Box flex={1}>{t('common:core.app.outLink.Show History')}</Box>
            <Switch {...register('showHistory')} />
          </Flex>

          {getValues('usingWay') === UsingWayEnum.script && (
            <>
              <Flex {...gridItemStyle}>
                <Box flex={1}>{t('common:core.app.outLink.Can Drag')}</Box>
                <Switch {...register('scriptIconCanDrag')} />
              </Flex>
              <Flex {...gridItemStyle}>
                <Box flex={1}>{t('common:core.app.outLink.Default open')}</Box>
                <Switch {...register('scriptDefaultOpen')} />
              </Flex>
              <Flex {...gridItemStyle}>
                <Box flex={1}>{t('common:core.app.outLink.Script Open Icon')}</Box>
                <Center
                  w={'32px'}
                  h={'32px'}
                  cursor={'pointer'}
                  onClick={() => onOpen('scriptOpenIcon')}
                  border={'base'}
                  borderRadius={'50%'}
                  p={'6px'}
                >
                  <MyImage src={getValues('scriptOpenIcon')} alt={''} w={'full'} h={'full'} />
                </Center>
              </Flex>
              <Flex {...gridItemStyle}>
                <Box flex={1}>{t('common:core.app.outLink.Script Close Icon')}</Box>
                <Center
                  w={'32px'}
                  h={'32px'}
                  cursor={'pointer'}
                  onClick={() => onOpen('scriptCloseIcon')}
                  border={'base'}
                  borderRadius={'50%'}
                  p={'6px'}
                >
                  <MyImage src={getValues('scriptCloseIcon')} alt={''} w={'full'} h={'full'} />
                </Center>
              </Flex>
            </>
          )}
        </Grid>

        <Divider color={'#E5E6EB'} w="full" h={'1px'} mb={5}></Divider>

        {/* code */}
        <Box borderRadius={'md'} bg={'#F4F4F5'} overflow={'hidden'} fontSize={'sm'}>
          <Flex
            p={3}
            bg={'#fff'}
            border={theme.borders.base}
            borderTopLeftRadius={'md'}
            borderTopRightRadius={'md'}
          >
            <Box flex={1} color={'#18181B'}>
              {wayMap[getValues('usingWay')].blockTitle}
            </Box>
            <MyIcon
              name={'chat/copy'}
              w={'16px'}
              color={'myGray.600'}
              cursor={'pointer'}
              _hover={{ color: 'primary.500' }}
              onClick={() => {
                copyData(wayMap[getValues('usingWay')].code);
              }}
            />
          </Flex>
          <Box whiteSpace={'pre'} p={3} overflowX={'auto'}>
            {wayMap[getValues('usingWay')].code}
          </Box>
        </Box>
      </ModalBody>

      <File onSelect={selectFile} />
    </MyModal>
  );
};

export default SelectUsingWayModal;
