'use client';

import { useRef, useState } from 'react';
import {
  Divider,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Tooltip,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Feather,
  File as FileIcon,
  Paperclip,
  Plus,
  Sparkles,
  UserRound,
  Waypoints
} from 'lucide-react';
import {
  WORKSPACE_EXPERTS,
  WORKSPACE_MODES,
  WORKSPACE_SKILLS,
  type WorkspaceExpertKey,
  type WorkspaceExpertOption,
  type WorkspaceModeKey,
  type WorkspaceSkillKey,
  type WorkspaceSkillOption
} from '../workbuddyConfig';

export type WorkspaceAttachment = {
  id: string;
  name: string;
  size: number;
};

type ContextChipsProps = {
  skill: WorkspaceSkillKey | null;
  attachments: WorkspaceAttachment[];
  onRemoveSkill: () => void;
  onRemoveAttachment: (id: string) => void;
};

type ContextPanel = 'root' | 'mode' | 'expert' | 'skill';

const FOCUS_RING = '0 0 0 3px rgba(200,0,11,.17)';

const findLabel = <T extends { key: string; label: string }>(options: T[], key: string | null) =>
  options.find((item) => item.key === key)?.label;

function ContentEchoTag({
  children,
  onClose,
  closeLabel,
  icon,
  tooltipLabel
}: {
  children: React.ReactNode;
  onClose: () => void;
  closeLabel: string;
  icon: React.ReactElement;
  tooltipLabel: string;
}) {
  return (
    <Tooltip
      label={tooltipLabel}
      placement="top"
      openDelay={240}
      hasArrow
      maxW="300px"
      px={3}
      py={2}
      borderRadius="8px"
      bg="#24272D"
      color="white"
      fontSize="10px"
    >
      <Tag
        h="30px"
        maxW={{ base: '210px', md: '300px' }}
        px={2.5}
        borderRadius="full"
        border="1px solid #E7E7E8"
        bg="#F3F3F4"
        color="#30343B"
        fontSize="11px"
        fontWeight={600}
        boxShadow="none"
      >
        <Flex mr={1.5} align="center" color="#45484E" aria-hidden="true">
          {icon}
        </Flex>
        <TagLabel noOfLines={1}>{children}</TagLabel>
        <TagCloseButton
          aria-label={closeLabel}
          ml={1}
          opacity={0.62}
          onClick={onClose}
          _hover={{ opacity: 1, bg: '#E1E1E3' }}
          _focusVisible={{ outline: 'none', boxShadow: FOCUS_RING }}
        />
      </Tag>
    </Tooltip>
  );
}

export function WorkspaceContextChips({
  skill,
  attachments,
  onRemoveSkill,
  onRemoveAttachment
}: ContextChipsProps) {
  const skillOption = WORKSPACE_SKILLS.find((item) => item.key === skill);
  const skillLabel = skillOption?.label;

  if (!skillLabel && attachments.length === 0) return null;

  return (
    <Wrap spacing={2} px={1} pt={1} pb={2.5} aria-label="当前内容上下文">
      {skillLabel && (
        <WrapItem>
          <ContentEchoTag
            icon={<Sparkles size={13} />}
            onClose={onRemoveSkill}
            closeLabel={`删除技能：${skillLabel}`}
            tooltipLabel={`技能：${skillLabel} · ${skillOption?.description ?? ''}`}
          >
            {skillLabel}
          </ContentEchoTag>
        </WrapItem>
      )}
      {attachments.map((attachment) => (
        <WrapItem key={attachment.id}>
          <ContentEchoTag
            icon={<FileIcon size={13} />}
            onClose={() => onRemoveAttachment(attachment.id)}
            closeLabel={`删除附件：${attachment.name}`}
            tooltipLabel={`文件：${attachment.name}`}
          >
            {attachment.name}
          </ContentEchoTag>
        </WrapItem>
      ))}
    </Wrap>
  );
}

type ContextControlsProps = {
  skill: WorkspaceSkillKey | null;
  mode: WorkspaceModeKey | null;
  expert: WorkspaceExpertKey | null;
  skillOptions?: WorkspaceSkillOption[];
  expertOptions?: WorkspaceExpertOption[];
  skillMenuLabel?: string;
  onFiles: (files: File[]) => void;
  onSelectSkill: (skill: WorkspaceSkillKey) => void;
  onSelectMode: (mode: WorkspaceModeKey) => void;
  onSelectExpert: (expert: WorkspaceExpertKey) => void;
  onRemoveMode: () => void;
  onRemoveExpert: () => void;
};

function RootMenuItem({
  label,
  icon,
  onClick
}: {
  label: string;
  icon: React.ReactElement;
  onClick: () => void;
}) {
  return (
    <MenuItem
      minH="48px"
      px={3}
      borderRadius="10px"
      color="#25272C"
      onClick={onClick}
      _focus={{ bg: '#F4F4F5' }}
      _hover={{ bg: '#F4F4F5' }}
    >
      <Flex w="100%" align="center" gap={3}>
        <Flex w="24px" align="center" justify="center" color="#51545A" aria-hidden="true">
          {icon}
        </Flex>
        <Text flex="1" fontSize="14px" fontWeight={500}>
          {label}
        </Text>
        <ChevronRight size={17} color="#8B8D91" aria-hidden="true" />
      </Flex>
    </MenuItem>
  );
}

function SelectionMenuItem<T extends string>({
  option,
  selected,
  onSelect
}: {
  option: { key: T; label: string; description: string };
  selected: T | null;
  onSelect: (key: T) => void;
}) {
  const active = selected === option.key;

  return (
    <MenuItem
      minH="50px"
      px={3}
      py={2.5}
      borderRadius="10px"
      bg={active ? '#F3F3F4' : 'transparent'}
      color="#25272C"
      onClick={() => onSelect(option.key)}
      _focus={{ bg: active ? '#ECECEE' : '#F7F7F8' }}
      _hover={{ bg: active ? '#ECECEE' : '#F7F7F8' }}
    >
      <Flex w="100%" align="center" gap={3}>
        <Flex minW={0} flex="1" direction="column">
          <Text fontSize="12px" fontWeight={active ? 700 : 600}>
            {option.label}
          </Text>
          <Text mt={0.5} fontSize="9px" color="#8A8D92" noOfLines={1}>
            {option.description}
          </Text>
        </Flex>
        {active && <Check size={15} color="#C8000B" aria-hidden="true" />}
      </Flex>
    </MenuItem>
  );
}

function ToolbarEchoTag({
  label,
  closeLabel,
  icon,
  onClose,
  tooltipLabel
}: {
  label: string;
  closeLabel: string;
  icon: React.ReactElement;
  onClose: () => void;
  tooltipLabel: string;
}) {
  return (
    <Tooltip
      label={tooltipLabel}
      placement="top"
      openDelay={240}
      hasArrow
      maxW="300px"
      px={3}
      py={2}
      borderRadius="8px"
      bg="#24272D"
      color="white"
      fontSize="10px"
    >
      <Tag
        h="34px"
        px={1.5}
        borderRadius="9px"
        border="1px solid transparent"
        bg="transparent"
        color="#42464D"
        fontSize="11px"
        fontWeight={600}
        _hover={{ bg: '#F4F4F5' }}
      >
        <Flex mr={1.5} align="center" color="#5A5E65" aria-hidden="true">
          {icon}
        </Flex>
        <TagLabel maxW={{ base: '110px', md: '170px' }} noOfLines={1}>
          {label}
        </TagLabel>
        <TagCloseButton
          aria-label={closeLabel}
          ml={1}
          opacity={0.62}
          onClick={onClose}
          _hover={{ opacity: 1, bg: '#E1E1E3' }}
          _focusVisible={{ outline: 'none', boxShadow: FOCUS_RING }}
        />
      </Tag>
    </Tooltip>
  );
}

export function WorkspaceContextControls({
  skill,
  mode,
  expert,
  skillOptions = WORKSPACE_SKILLS,
  expertOptions = WORKSPACE_EXPERTS,
  skillMenuLabel,
  onFiles,
  onSelectSkill,
  onSelectMode,
  onSelectExpert,
  onRemoveMode,
  onRemoveExpert
}: ContextControlsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activePanel, setActivePanel] = useState<ContextPanel>('root');
  const modeOption = WORKSPACE_MODES.find((item) => item.key === mode);
  const expertOption = WORKSPACE_EXPERTS.find((item) => item.key === expert);
  const modeLabel = modeOption?.label;
  const expertLabel = expertOption?.label;

  return (
    <Flex align="center" gap={1} wrap="wrap">
      <input
        ref={inputRef}
        hidden
        multiple
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,image/*"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) onFiles(files);
          event.target.value = '';
        }}
      />

      <Menu placement="top-start" closeOnSelect={false} onOpen={() => setActivePanel('root')}>
        {({ onClose }) => (
          <>
            <Tooltip label="添加文件或对话设置" placement="top" hasArrow>
              <MenuButton
                as={IconButton}
                type="button"
                aria-label="添加文件或对话设置"
                icon={<Plus size={20} />}
                w="36px"
                h="36px"
                minW="36px"
                borderRadius="10px"
                variant="ghost"
                color="#30343B"
                _hover={{ bg: '#F1F1F2' }}
                _active={{ bg: '#E9E9EA' }}
                _focusVisible={{ outline: 'none', boxShadow: FOCUS_RING }}
              />
            </Tooltip>

            <Portal>
              <MenuList
                w={{ base: '250px', md: '270px' }}
                maxH="min(420px, 70vh)"
                overflowY="auto"
                p={2}
                border="1px solid #E4E4E5"
                borderRadius="18px"
                bg="white"
                boxShadow="0 18px 50px rgba(15,23,42,.16), 0 2px 8px rgba(15,23,42,.06)"
                zIndex={1800}
              >
                {activePanel === 'root' ? (
                  <>
                    <RootMenuItem
                      label="添加文件"
                      icon={<Paperclip size={21} />}
                      onClick={() => {
                        inputRef.current?.click();
                        onClose();
                      }}
                    />
                    <Divider my={1.5} borderColor="#E7E7E8" />
                    <RootMenuItem
                      label="模式"
                      icon={<Feather size={21} />}
                      onClick={() => setActivePanel('mode')}
                    />
                    <RootMenuItem
                      label="专家"
                      icon={<UserRound size={21} />}
                      onClick={() => setActivePanel('expert')}
                    />
                    <RootMenuItem
                      label="技能"
                      icon={<Sparkles size={21} />}
                      onClick={() => setActivePanel('skill')}
                    />
                  </>
                ) : (
                  <>
                    <MenuItem
                      minH="42px"
                      px={2.5}
                      borderRadius="10px"
                      onClick={() => setActivePanel('root')}
                      _focus={{ bg: '#F4F4F5' }}
                      _hover={{ bg: '#F4F4F5' }}
                    >
                      <Flex align="center" gap={2}>
                        <ChevronLeft size={17} aria-hidden="true" />
                        <Text fontSize="12px" fontWeight={700}>
                          {activePanel === 'mode'
                            ? '选择模式'
                            : activePanel === 'expert'
                              ? '选择专家'
                              : skillMenuLabel || '选择技能'}
                        </Text>
                      </Flex>
                    </MenuItem>
                    <Divider my={1.5} borderColor="#E7E7E8" />

                    {activePanel === 'mode' &&
                      WORKSPACE_MODES.map((option) => (
                        <SelectionMenuItem
                          key={option.key}
                          option={option}
                          selected={mode}
                          onSelect={(key) => {
                            onSelectMode(key);
                            onClose();
                          }}
                        />
                      ))}
                    {activePanel === 'expert' &&
                      expertOptions.map((option) => (
                        <SelectionMenuItem
                          key={option.key}
                          option={option}
                          selected={expert}
                          onSelect={(key) => {
                            onSelectExpert(key);
                            onClose();
                          }}
                        />
                      ))}
                    {activePanel === 'skill' &&
                      skillOptions.map((option) => (
                        <SelectionMenuItem
                          key={option.key}
                          option={option}
                          selected={skill}
                          onSelect={(key) => {
                            onSelectSkill(key);
                            onClose();
                          }}
                        />
                      ))}
                  </>
                )}
              </MenuList>
            </Portal>
          </>
        )}
      </Menu>

      {modeLabel && (
        <ToolbarEchoTag
          label={modeLabel}
          closeLabel={`删除模式：${modeLabel}`}
          icon={<Waypoints size={15} />}
          onClose={onRemoveMode}
          tooltipLabel={`模式：${modeLabel} · ${modeOption?.description ?? ''}`}
        />
      )}
      {expertLabel && (
        <ToolbarEchoTag
          label={expertLabel}
          closeLabel={`删除专家：${expertLabel}`}
          icon={<UserRound size={15} />}
          onClose={onRemoveExpert}
          tooltipLabel={`专家：${expertLabel} · ${expertOption?.description ?? ''}`}
        />
      )}
    </Flex>
  );
}
