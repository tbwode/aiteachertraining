import Link from 'next/link';
import {
  Box,
  Flex,
  Grid,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tag,
  Text
} from '@chakra-ui/react';
import {
  ArrowRight,
  Bot,
  MessageCircleMore,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  UsersRound
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import type { AvatarCard, TabKey } from '../constants';
import { CARD_SHADOW, CARD_SHADOW_HOVER, tabItems } from '../constants';
import { getStatusMeta } from '../utils';

type AvatarCardListProps = {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  avatars: AvatarCard[];
  onTogglePublish: (id: string) => void;
  onDelete: (id: string) => void;
};

export function AvatarCardList({
  activeTab,
  onTabChange,
  avatars,
  onTogglePublish,
  onDelete
}: AvatarCardListProps) {
  const { t } = useTranslation('teacher');

  return (
    <>
      <HStack
        role="tablist"
        aria-label={t('home.avatar_list.filter_label')}
        spacing={1}
        mb={5}
        p="4px"
        w="fit-content"
        maxW="100%"
        overflowX="auto"
        whiteSpace="nowrap"
        bg="#ECEEF2"
        borderRadius="14px"
      >
        {tabItems.map((tab) => {
          const active = activeTab === tab.key;

          return (
            <Button
              key={tab.key}
              role="tab"
              aria-selected={active}
              variant="ghost"
              borderRadius="10px"
              px={{ base: 3, md: 4 }}
              minH="36px"
              h="36px"
              bg={active ? 'white' : 'transparent'}
              color={active ? '#1D2129' : '#646A73'}
              boxShadow={active ? '0 2px 8px rgba(31,35,41,.08)' : 'none'}
              fontWeight={active ? 650 : 500}
              fontSize="13px"
              _hover={{ bg: active ? 'white' : 'rgba(255,255,255,.6)' }}
              _active={{ bg: 'white' }}
              _focusVisible={{ boxShadow: '0 0 0 3px rgba(200,0,11,.14)' }}
              onClick={() => onTabChange(tab.key)}
            >
              {t(`home.avatar_list.tabs.${tab.key}`)}
            </Button>
          );
        })}
      </HStack>

      <Grid
        role="tabpanel"
        aria-live="polite"
        templateColumns={{
          base: 'minmax(0, 1fr)',
          md: 'repeat(2, minmax(0, 1fr))',
          xl: 'repeat(3, minmax(0, 1fr))'
        }}
        gap={5}
      >
        {avatars.map((avatar) => {
          const statusMeta = getStatusMeta(avatar.status);
          const isRunning = avatar.status === 'running';

          return (
            <Box
              as="article"
              key={avatar.id}
              bg="white"
              border="1px solid"
              borderColor="#E5E6EB"
              borderRadius="20px"
              overflow="hidden"
              boxShadow={CARD_SHADOW}
              transition="transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: CARD_SHADOW_HOVER,
                borderColor: '#DADDE3'
              }}
              display="flex"
              flexDirection="column"
              minW={0}
            >
              <Box
                position="relative"
                aspectRatio="16 / 8.2"
                overflow="hidden"
                bg={avatar.heroBg.startsWith('url(') ? '#F2F3F5' : avatar.heroBg}
              >
                {avatar.heroBg.startsWith('url(') ? (
                  <Box
                    position="absolute"
                    inset={0}
                    backgroundImage={avatar.heroBg}
                    backgroundSize="cover"
                    backgroundPosition="center"
                    backgroundRepeat="no-repeat"
                  />
                ) : (
                  <Flex position="absolute" inset={0} align="center" justify="center" gap={3}>
                    <Flex
                      w="54px"
                      h="54px"
                      align="center"
                      justify="center"
                      borderRadius="17px"
                      bg="rgba(255,255,255,.68)"
                      color={avatar.accentColor}
                      boxShadow="0 8px 24px rgba(31,35,41,.08)"
                    >
                      <Bot size={28} strokeWidth={1.7} aria-hidden="true" />
                    </Flex>
                    <Text
                      fontSize="30px"
                      fontWeight={800}
                      letterSpacing="0.08em"
                      color="rgba(29,33,41,.34)"
                    >
                      {avatar.heroText}
                    </Text>
                  </Flex>
                )}
                <Box
                  position="absolute"
                  inset={0}
                  bg="linear-gradient(180deg, rgba(19,22,30,.12), rgba(19,22,30,.36))"
                  pointerEvents="none"
                />

                <Tag
                  position="absolute"
                  top={3}
                  left={3}
                  borderRadius="full"
                  bg="rgba(255,255,255,.92)"
                  color={isRunning ? '#147D64' : '#646A73'}
                  boxShadow="0 2px 8px rgba(31,35,41,.08)"
                  fontSize="11px"
                >
                  <Box w="6px" h="6px" borderRadius="full" bg={statusMeta.dotColor} mr={2} />
                  {statusMeta.label}
                </Tag>

                <Menu placement="bottom-end">
                  <MenuButton
                    as={IconButton}
                    aria-label={t('home.avatar_list.more_actions', { title: avatar.title })}
                    icon={<MoreHorizontal size={18} aria-hidden="true" />}
                    position="absolute"
                    top={2}
                    right={2}
                    minW="40px"
                    w="40px"
                    h="40px"
                    borderRadius="12px"
                    bg="rgba(255,255,255,.92)"
                    color="#1D2129"
                    boxShadow="0 2px 8px rgba(31,35,41,.08)"
                    _hover={{ bg: 'white' }}
                    _active={{ bg: '#F2F3F5' }}
                    _focusVisible={{ boxShadow: '0 0 0 3px rgba(200,0,11,.18)' }}
                  />
                  <MenuList minW="168px" py={2} borderRadius="12px" boxShadow="lg">
                    {!isRunning ? (
                      <MenuItem
                        as={Link}
                        href={`/teacher/aiTeacher/avatar/edit?tab=base&id=${avatar.id}`}
                        icon={<Pencil size={16} aria-hidden="true" />}
                        minH="40px"
                      >
                        {t('home.avatar_list.edit')}
                      </MenuItem>
                    ) : null}
                    <MenuItem
                      icon={<Send size={16} aria-hidden="true" />}
                      minH="40px"
                      onClick={() => onTogglePublish(avatar.id)}
                    >
                      {t(`home.avatar_list.${isRunning ? 'unpublish' : 'publish'}`)}
                    </MenuItem>
                    {avatar.status === 'pending' ? (
                      <MenuItem
                        icon={<Trash2 size={16} aria-hidden="true" />}
                        color="#C8000B"
                        minH="40px"
                        onClick={() => onDelete(avatar.id)}
                      >
                        {t('home.avatar_list.delete')}
                      </MenuItem>
                    ) : null}
                  </MenuList>
                </Menu>
              </Box>

              <Flex direction="column" flex="1" p={{ base: 4, md: 5 }}>
                <Box mb={4}>
                  <Text
                    as="h3"
                    fontSize="17px"
                    lineHeight="1.45"
                    fontWeight={700}
                    color="#1D2129"
                    noOfLines={1}
                    title={avatar.title}
                  >
                    {avatar.title}
                  </Text>
                  <Text fontSize="12px" color="#86909C" mt={1}>
                    {t('home.avatar_list.course_avatar')}
                  </Text>
                </Box>

                <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap={3} mb={3}>
                  <Flex align="center" gap={3} p={3} borderRadius="13px" bg="#F7F8FA" minW={0}>
                    <UsersRound size={18} color="#646A73" aria-hidden="true" />
                    <Box minW={0}>
                      <Text fontSize="10px" color="#86909C" noOfLines={1}>
                        {t('home.avatar_list.student_scale')}
                      </Text>
                      <Text fontSize="17px" fontWeight={700} color="#1D2129" noOfLines={1}>
                        {avatar.studentScale}
                      </Text>
                    </Box>
                  </Flex>
                  <Flex align="center" gap={3} p={3} borderRadius="13px" bg="#F7F8FA" minW={0}>
                    <MessageCircleMore
                      size={18}
                      color={isRunning ? avatar.accentColor : '#86909C'}
                      aria-hidden="true"
                    />
                    <Box minW={0}>
                      <Text fontSize="10px" color="#86909C" noOfLines={1}>
                        {t('home.avatar_list.today_interactions')}
                      </Text>
                      <Text
                        fontSize="17px"
                        fontWeight={700}
                        color={isRunning ? avatar.accentColor : '#86909C'}
                        noOfLines={1}
                      >
                        {avatar.interactions}
                      </Text>
                    </Box>
                  </Flex>
                </Grid>

                <Box bg={avatar.coverageBg} borderRadius="13px" px={3} py={3} mb={4} minH="70px">
                  <Text fontSize="10px" fontWeight={650} color={avatar.coverageColor} mb={1}>
                    {avatar.coverageLabel}
                  </Text>
                  <Text
                    fontSize="12px"
                    lineHeight="1.65"
                    color="#4E5969"
                    noOfLines={2}
                    title={avatar.coverageText}
                  >
                    {avatar.coverageText}
                  </Text>
                </Box>

                <Flex mt="auto" gap={2}>
                  {!isRunning ? (
                    <IconButton
                      as={Link}
                      href={`/teacher/aiTeacher/avatar/edit?tab=base&id=${avatar.id}`}
                      aria-label={t('home.avatar_list.edit_named', { title: avatar.title })}
                      icon={<Pencil size={17} aria-hidden="true" />}
                      minW="44px"
                      w="44px"
                      h="44px"
                      borderRadius="12px"
                      bg="white"
                      color="#646A73"
                      border="1px solid #E5E6EB"
                      _hover={{ bg: '#F7F8FA', color: '#1D2129' }}
                      _focusVisible={{ boxShadow: '0 0 0 3px rgba(200,0,11,.14)' }}
                    />
                  ) : null}
                  <Button
                    as={Link}
                    href={`/teacher/aiTeacher/avatar/detail?id=${avatar.id}`}
                    flex="1"
                    h="44px"
                    fontSize="14px"
                    rightIcon={<ArrowRight size={15} aria-hidden="true" />}
                  >
                    {t('home.avatar_list.enter_classroom')}
                  </Button>
                </Flex>
              </Flex>
            </Box>
          );
        })}
      </Grid>

      {avatars.length === 0 ? (
        <Flex
          role="status"
          mt={2}
          align="center"
          justify="center"
          direction="column"
          gap={3}
          bg="white"
          border="1px dashed #C9CDD4"
          borderRadius="20px"
          py={12}
        >
          <Flex
            w="48px"
            h="48px"
            borderRadius="15px"
            bg="#FFF1F0"
            color="#C8000B"
            align="center"
            justify="center"
          >
            <Bot size={24} aria-hidden="true" />
          </Flex>
          <Text color="#646A73" fontSize="14px">
            {t('home.avatar_list.empty')}
          </Text>
        </Flex>
      ) : null}
    </>
  );
}
