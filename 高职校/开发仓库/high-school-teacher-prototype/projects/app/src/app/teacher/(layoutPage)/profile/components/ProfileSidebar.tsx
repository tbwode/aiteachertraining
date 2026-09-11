'use client';

import { Box, Stack, Text, Flex } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { PROFILE_PRIMARY_COLOR } from '../constants';
import type { ProfileTabKey } from '../types';
// 我的资源图标
function MyResourcesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      {...props}
    >
      <path
        d="M3.65268 17.2891C4.76401 15.4354 7.19968 14.1668 10.9997 14.1668C14.7996 14.1668 17.2353 15.4354 18.3466 17.2891M14.0182 7.73044C14.0182 9.39752 12.6667 10.749 10.9997 10.749C9.33258 10.749 7.98114 9.39752 7.98114 7.73044C7.98114 6.06335 9.33258 4.71191 10.9997 4.71191C12.6667 4.71191 14.0182 6.06335 14.0182 7.73044Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 基础信息图标
function BasicInfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      {...props}
    >
      <path
        d="M5.88815 16.5765C6.24534 16.1764 7.91822 14.3355 8.40846 14.3355H13.5919C14.3023 14.3355 15.7525 15.8615 16.1119 16.3994M18.4355 10.9999C18.4355 15.1064 15.1065 18.4353 11 18.4353C6.89354 18.4353 3.56458 15.1064 3.56458 10.9999C3.56458 6.89342 6.89354 3.56445 11 3.56445C15.1065 3.56445 18.4355 6.89342 18.4355 10.9999ZM13.6635 8.46562C13.6635 7.04707 12.466 5.88803 11.0002 5.88803C9.53455 5.88803 8.337 7.04707 8.337 8.46562C8.337 9.88417 9.53455 11.0432 11.0002 11.0432C12.4659 11.0432 13.6635 9.88417 13.6635 8.46562Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

// 修改密码图标
function PasswordIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      {...props}
    >
      <path
        d="M6.85083 8.70436V8.04835C6.85083 5.86791 8.70148 4.1123 11 4.1123C13.2985 4.1123 15.1491 5.86791 15.1491 8.04835V8.70436M6.85083 8.70436C6.09015 8.70436 5.46777 9.29477 5.46777 10.0164V16.5764C5.46777 17.2981 6.09015 17.8885 6.85083 17.8885H15.1491C15.9098 17.8885 16.5322 17.2981 16.5322 16.5764V10.0164C16.5322 9.29477 15.9098 8.70436 15.1491 8.70436M6.85083 8.70436H15.1491M11 11.9844C11.7607 11.9844 12.383 12.5748 12.383 13.2964C12.383 14.018 11.7607 14.6084 11 14.6084C10.2393 14.6084 9.61693 14.018 9.61693 13.2964C9.61693 12.5748 10.2393 11.9844 11 11.9844Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

// 学校概览图标
function SchoolOverviewIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.6667 3.5C18.1087 3.5 18.5326 3.67559 18.8452 3.98816C19.1577 4.30072 19.3333 4.72464 19.3333 5.16667V16.8333C19.3333 17.2754 19.1577 17.6993 18.8452 18.0118C18.5326 18.3244 18.1087 18.5 17.6667 18.5H4.33332C3.8913 18.5 3.46737 18.3244 3.15481 18.0118C2.84225 17.6993 2.66666 17.2754 2.66666 16.8333V5.16667C2.66666 4.72464 2.84225 4.30072 3.15481 3.98816C3.46737 3.67559 3.8913 3.5 4.33332 3.5H17.6667ZM17.6667 5.16667H4.33332V16.8333H17.6667V5.16667ZM15.1667 13.5C15.3791 13.5002 15.5833 13.5816 15.7378 13.7274C15.8922 13.8732 15.9852 14.0725 15.9976 14.2845C16.0101 14.4965 15.9411 14.7053 15.8048 14.8682C15.6684 15.0311 15.4751 15.1357 15.2642 15.1608L15.1667 15.1667H6.83332C6.62092 15.1664 6.41663 15.0851 6.26218 14.9393C6.10774 14.7935 6.01479 14.5942 6.00235 14.3822C5.9899 14.1701 6.05889 13.9614 6.19521 13.7985C6.33154 13.6356 6.52491 13.5309 6.73582 13.5058L6.83332 13.5H15.1667ZM9.33332 6.83333C9.77535 6.83333 10.1993 7.00893 10.5118 7.32149C10.8244 7.63405 11 8.05797 11 8.5V10.1667C11 10.6087 10.8244 11.0326 10.5118 11.3452C10.1993 11.6577 9.77535 11.8333 9.33332 11.8333H7.66666C7.22463 11.8333 6.80071 11.6577 6.48815 11.3452C6.17558 11.0326 5.99999 10.6087 5.99999 10.1667V8.5C5.99999 8.05797 6.17558 7.63405 6.48815 7.32149C6.80071 7.00893 7.22463 6.83333 7.66666 6.83333H9.33332ZM15.1667 10.1667C15.3877 10.1667 15.5996 10.2545 15.7559 10.4107C15.9122 10.567 16 10.779 16 11C16 11.221 15.9122 11.433 15.7559 11.5893C15.5996 11.7455 15.3877 11.8333 15.1667 11.8333H12.6667C12.4456 11.8333 12.2337 11.7455 12.0774 11.5893C11.9211 11.433 11.8333 11.221 11.8333 11C11.8333 10.779 11.9211 10.567 12.0774 10.4107C12.2337 10.2545 12.4456 10.1667 12.6667 10.1667H15.1667ZM9.33332 8.5H7.66666V10.1667H9.33332V8.5ZM15.1667 6.83333C15.3791 6.83357 15.5833 6.9149 15.7378 7.06071C15.8922 7.20651 15.9852 7.40579 15.9976 7.61783C16.0101 7.82986 15.9411 8.03865 15.8048 8.20153C15.6684 8.3644 15.4751 8.46908 15.2642 8.49417L15.1667 8.5H12.6667C12.4543 8.49976 12.25 8.41843 12.0955 8.27263C11.9411 8.12682 11.8481 7.92754 11.8357 7.7155C11.8232 7.50347 11.8922 7.29468 12.0285 7.13181C12.1649 6.96893 12.3582 6.86425 12.5692 6.83917L12.6667 6.83333H15.1667Z"
        fill="currentColor"
      />
    </svg>
  );
}

type ProfileSidebarProps = {
  activeTab: ProfileTabKey;
  onChange: (tab: ProfileTabKey) => void;
};

type MenuItem = {
  key: ProfileTabKey;
  label: string;
  icon: React.ReactNode;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

export default function ProfileSidebar({ activeTab, onChange }: ProfileSidebarProps) {
  const { t } = useTranslation('teacher');

  const menuGroups: MenuGroup[] = [
    {
      title: t('profile.sidebar.teachingCenter'),
      items: [
        {
          key: 'overview',
          label: t('profile.tabs.overview.label'),
          icon: <SchoolOverviewIcon width="22px" height="22px" />
        },
        {
          key: 'myResources',
          label: t('profile.tabs.myResources.label'),
          icon: <MyResourcesIcon width="22px" height="22px" />
        }
      ]
    },
    {
      title: t('profile.sidebar.accountSettings'),
      items: [
        {
          key: 'basicInfo',
          label: t('profile.tabs.basicInfo.label'),
          icon: <BasicInfoIcon width="22px" height="22px" />
        },
        {
          key: 'password',
          label: t('profile.tabs.password.label'),
          icon: <PasswordIcon width="22px" height="22px" />
        }
      ]
    }
  ];

  return (
    <Box
      bg="white"
      w="200px"
      flexShrink={0}
      px={3}
      py={4}
      borderRadius="8px"
      position="sticky"
      top="80px"
      alignSelf="stretch"
    >
      <Stack spacing={6}>
        {menuGroups.map((group, groupIndex) => (
          <Box key={group.title}>
            <Text fontSize="14px" fontWeight={500} color="#86909C" mb={2} px={2}>
              {group.title}
            </Text>
            <Stack spacing={1}>
              {group.items.map((item) => {
                const isActive = item.key === activeTab;

                return (
                  <Flex
                    key={item.key}
                    as="button"
                    type="button"
                    alignItems="center"
                    px={3}
                    py={2.5}
                    rounded="6px"
                    border="none"
                    bg={isActive ? '#FFF1F0' : 'transparent'}
                    color={isActive ? PROFILE_PRIMARY_COLOR : '#1F2937'}
                    transition="all 0.2s ease"
                    cursor="pointer"
                    _hover={{
                      bg: isActive ? '#FFF1F0' : '#F3F4F6'
                    }}
                    onClick={() => onChange(item.key)}
                  >
                    <Box
                      w="22px"
                      h="22px"
                      mr={2}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color={isActive ? PROFILE_PRIMARY_COLOR : '#86909C'}
                      transition="all 0.2s ease"
                    >
                      {item.icon}
                    </Box>
                    <Text fontSize="14px" fontWeight={isActive ? 500 : 400}>
                      {item.label}
                    </Text>
                  </Flex>
                );
              })}
            </Stack>
            {groupIndex === 0 && <Box mt={4} mx={2} h="1px" bg="#F0F0F0" />}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
