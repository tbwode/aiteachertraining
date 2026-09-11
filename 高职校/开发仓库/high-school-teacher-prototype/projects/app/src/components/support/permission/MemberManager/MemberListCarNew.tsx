import { useUserStore } from '@/web/support/user/useUserStore';
import { Box, type BoxProps, Flex } from '@chakra-ui/react';
import { DefaultGroupName } from '@fastgpt/global/support/user/team/group/constant';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { useContextSelector } from 'use-context-selector';
import { CollaboratorContext } from './context';
import {
  OwnerRoleVal,
  ReadRoleVal,
  WriteRoleVal,
  ManageRoleVal
} from '@fastgpt/global/support/permission/constant';

export type MemberListCardProps = BoxProps;

const MemberListCard = ({ ...props }: MemberListCardProps) => {
  const { t } = useTranslation();
  const { userInfo } = useUserStore();

  const { collaboratorList, isFetchingCollaborator } = useContextSelector(
    CollaboratorContext,
    (v) => v
  );

  const getPermissionLabel = (role?: number) => {
    if (role === OwnerRoleVal) return t('common:permission.owner');
    if (role === ManageRoleVal) return t('common:permission.manager');
    if (role === WriteRoleVal) return t('common:permission.write');
    if (role === ReadRoleVal) return t('common:permission.read');
    return '';
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <MyBox
      isLoading={isFetchingCollaborator}
      userSelect={'none'}
      bg="white"
      borderRadius="10px"
      overflow="hidden"
      {...props}
    >
      {collaboratorList?.length === 0 ? (
        <Box p={3} color="myGray.600" fontSize={'xs'} textAlign={'center'}>
          {t('common:permission.Not collaborator')}
        </Box>
      ) : (
        <Flex flexDirection="column">
          {collaboratorList?.map((member, index) => {
            const isLast = index === collaboratorList.length - 1;
            const name = member.name === DefaultGroupName ? userInfo?.team.teamName : member.name;

            return (
              <Flex
                key={member.tmbId || member.groupId || member.orgId}
                h="48px"
                px={4}
                bg="white"
                borderBottom={isLast ? undefined : '1px solid'}
                borderColor="myGray.200"
                justifyContent="space-between"
                alignItems="center"
              >
                <Flex justifyContent="flex-start" alignItems="center" gap={3}>
                  <Flex
                    w="32px"
                    h="32px"
                    borderRadius="100px"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    bgColor={member.avatar ? undefined : 'slate.600'}
                    overflow="hidden"
                  >
                    {member.avatar ? (
                      <Box as="img" src={member.avatar} w="32px" h="32px" objectFit="cover" />
                    ) : (
                      <Box
                        textAlign="center"
                        justifyContent="center"
                        color="white"
                        fontSize="sm"
                        fontWeight="bold"
                        fontFamily="Nunito Sans"
                        lineHeight="16px"
                      >
                        {getInitial(name || 'W')}
                      </Box>
                    )}
                  </Flex>
                  <Box
                    textAlign="center"
                    justifyContent="center"
                    color="black"
                    fontSize="sm"
                    fontWeight="normal"
                    lineHeight="20px"
                  >
                    {name}
                  </Box>
                </Flex>
                <Flex justifyContent="flex-end" alignItems="center" gap={1.5}>
                  <Box
                    textAlign="center"
                    justifyContent="center"
                    color="black"
                    fontSize="sm"
                    fontWeight="normal"
                    lineHeight="20px"
                  >
                    {getPermissionLabel(member.permission.role)}
                  </Box>
                  {/* <Box w="16px" h="16px" position="relative" overflow="hidden">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 6L8 10L12 6"
                        stroke="#1E293B"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Box> */}
                </Flex>
              </Flex>
            );
          })}
        </Flex>
      )}
    </MyBox>
  );
};

export default MemberListCard;
