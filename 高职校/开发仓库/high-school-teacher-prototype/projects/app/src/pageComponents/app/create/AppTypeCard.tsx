import type { CreateAppType } from '@/pageComponents/dashboard/agent/AddAgentModal';
import type { createAppTypeMap } from '../constants';
import { Box, Card, Flex } from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useTranslation } from 'react-i18next';

const AppTypeCard = ({
  selectedAppType,
  onClick,
  option
}: {
  selectedAppType: CreateAppType;
  onClick: () => void;
  option: (typeof createAppTypeMap)[CreateAppType];
}) => {
  const { t } = useTranslation();
  return (
    <Card
      key={option.type}
      p={5}
      borderRadius={'10px'}
      border={'1px solid'}
      {...(selectedAppType === option.type
        ? {
            borderColor: '#09090B'
          }
        : {
            borderColor: '#E5E6EB'
          })}
      cursor={'pointer'}
      userSelect={'none'}
      onClick={onClick}
      boxShadow={'none'}
      _hover={{
        boxShadow: '0 4px 10px 0 rgba(19, 51, 107, 0.08), 0 0 1px 0 rgba(19, 51, 107, 0.08)'
      }}
    >
      <Flex alignItems={'center'}>
        <Flex
          border-radius={' 6px'}
          border={'1px solid #E5E6EB'}
          bg={'#fff'}
          w={7}
          h={7}
          borderRadius={'6px'}
          flexShrink={0}
          mr={3}
          alignItems={'center'}
          justifyContent={'center'}
        >
          <MyIcon name={option.icon as any} w={6} h={6} borderRadius={'6px'} />
        </Flex>
        <Box>
          <Box fontWeight={'15px'} color={'myGray.900'}>
            {t(option.title)}
          </Box>
          <Box fontSize={'13px'} color={'#86909C'} mt={1} lineHeight={'16px'} whiteSpace={'nowrap'}>
            {t(option.intro)}
          </Box>
        </Box>
      </Flex>
    </Card>
  );
};

export default AppTypeCard;
