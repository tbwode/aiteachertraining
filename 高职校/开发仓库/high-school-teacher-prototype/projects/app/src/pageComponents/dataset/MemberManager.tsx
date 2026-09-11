import { Box, Flex } from '@chakra-ui/react';
import React from 'react';
import CollaboratorContextProvider, {
  type MemberManagerInputPropsType
} from '@/components/support/permission/MemberManager/context';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useTranslation } from 'react-i18next';

function MemberManager({ managePer }: { managePer: MemberManagerInputPropsType }) {
  const { t } = useTranslation();
  return (
    <Box>
      <CollaboratorContextProvider {...managePer}>
        {({ MemberListCard, onOpenManageModal }) => {
          return (
            <>
              <Flex alignItems="center" flexDirection="row" justifyContent="space-between" w="full">
                <Box color={'myGray.900'} fontSize={'mini'} fontWeight={'bold'}>
                  {t('common:permission.Collaborator')}
                </Box>
                <Flex gap={2}>
                  <Box
                    bg={'white'}
                    p={1}
                    borderRadius={'md'}
                    border={'base'}
                    display={'flex'}
                    justifyContent={'center'}
                    alignItems={'center'}
                  >
                    <MyIcon
                      onClick={onOpenManageModal}
                      name="common/memberManager"
                      w={'1rem'}
                      h={'1rem'}
                      color={'myGray.600'}
                      cursor={'pointer'}
                      _hover={{ color: 'primary.500' }}
                    />
                  </Box>
                </Flex>
              </Flex>
              <MemberListCard mt={2} borderRadius="md" bg={'white'} />
            </>
          );
        }}
      </CollaboratorContextProvider>
    </Box>
  );
}

export default MemberManager;
