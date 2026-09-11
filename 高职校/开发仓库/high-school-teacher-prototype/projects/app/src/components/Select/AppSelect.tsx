import { Box, Flex } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import MyPopover from '@fastgpt/web/components/common/MyPopover';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SelectOneResource from '../common/folder/SelectOneResource';
import type {
  GetResourceFolderListProps,
  GetResourceListItemResponse
} from '@fastgpt/global/common/parentFolder/type';
import { getMyApps } from '@/web/core/app/api';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import Avatar from '@fastgpt/web/components/common/Avatar';

const AppSelect = ({ value, onSelect }: { value: string; onSelect: (id: string) => void }) => {
  const [currentApp, setCurrentApp] = useState<GetResourceListItemResponse | null>(null);
  const { t } = useTranslation();

  const getAppList = useCallback(async ({ parentId }: GetResourceFolderListProps) => {
    return getMyApps({
      parentId,
      type: [AppTypeEnum.folder, AppTypeEnum.simple, AppTypeEnum.workflow]
    }).then((res) =>
      res
        .filter((item) => !item.hasInteractiveNode)
        .map<GetResourceListItemResponse>((item) => ({
          id: item._id,
          name: item.name,
          avatar: item.avatar,
          isFolder: item.type === AppTypeEnum.folder
        }))
    );
  }, []);

  return (
    <MyPopover
      placement={'bottom'}
      p={4}
      w={'406px'}
      trigger={'click'}
      hasArrow={false}
      closeOnBlur={true}
      Trigger={
        <Button
          w={'full'}
          bg={'#fff'}
          variant={'whitePrimaryOutline'}
          borderRadius={'12px'}
          size={'lg'}
          fontSize={'sm'}
          px={3}
          border={'none'}
          outline={'none'}
          rightIcon={<MyIcon name={'core/chat/chevronDown'} w="1rem" color={'myGray.500'} />}
          boxShadow={
            'box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.10) inset, 0 2px 4px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.06), 0 0 1px 0 rgba(0, 0, 0, 0.06);'
          }
          iconSpacing={2}
          h={'auto'}
          _active={{
            transform: 'none'
          }}
          // _hover={{
          //   borderColor: 'primary.500'
          // }}
        >
          <Flex w={'100%'} alignItems={'center'} gap={2}>
            {currentApp && <Avatar src={currentApp.avatar} w={5} borderRadius={'sm'} />}
            {currentApp?.name || t('common:Select_App')}
          </Flex>
        </Button>
      }
    >
      {({ onClose }) => (
        <Box minH={'200px'}>
          <SelectOneResource
            maxH={'60vh'}
            value={value}
            onSelect={(item) => {
              if (!item) return;
              onSelect(item.id);
              setCurrentApp(item);
              onClose();
            }}
            server={getAppList}
          />
        </Box>
      )}
    </MyPopover>
  );
};

export default AppSelect;
