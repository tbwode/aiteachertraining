import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  RadioGroup,
  Radio,
  Stack,
  Text
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import { PRIMARY_COLOR } from '../../constants';

export type EditModalType = 'chapter' | 'section';
export type EditModalMode = 'add' | 'edit';
export type OpenMode = 'unlimited' | 'scheduled' | 'prerequisite';

export interface EditChapterModalResult {
  name: string;
  openMode?: OpenMode;
  openTime?: string;
}

interface EditChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: EditChapterModalResult) => void;
  modalType: EditModalType;
  modalMode: EditModalMode;
  initialValue: string;
  initialOpenMode?: OpenMode;
  initialOpenTime?: string;
  /** 是否允许选择"完成前置章节学习"（第一个章节不允许） */
  allowPrerequisite?: boolean;
}

export default function EditChapterModal({
  isOpen,
  onClose,
  onConfirm,
  modalType,
  modalMode,
  initialValue,
  initialOpenMode,
  initialOpenTime,
  allowPrerequisite = true
}: EditChapterModalProps) {
  const { t } = useTranslation('teacher');

  const [inputValue, setInputValue] = useState(initialValue);
  const [openMode, setOpenMode] = useState<OpenMode>(initialOpenMode || 'unlimited');
  const [openTime, setOpenTime] = useState(initialOpenTime || '');

  // 当弹窗打开时，同步初始值
  useEffect(() => {
    setInputValue(initialValue);
    setOpenMode(initialOpenMode || 'unlimited');
    setOpenTime(initialOpenTime || '');
  }, [initialValue, initialOpenMode, initialOpenTime, isOpen]);

  const handleConfirm = () => {
    const name = inputValue.trim();
    if (!name) return;
    onConfirm({
      name,
      openMode,
      openTime: openMode === 'scheduled' ? openTime || undefined : undefined
    });
    setInputValue('');
    setOpenMode('unlimited');
    setOpenTime('');
  };

  const handleClose = () => {
    setInputValue('');
    setOpenMode('unlimited');
    setOpenTime('');
    onClose();
  };

  const title =
    modalType === 'chapter'
      ? modalMode === 'add'
        ? t('aiTeacher.avatar.edit.chapters.addChapterTitle')
        : t('aiTeacher.avatar.edit.chapters.editChapter')
      : modalMode === 'add'
        ? t('aiTeacher.avatar.edit.chapters.addSectionTitle')
        : t('aiTeacher.avatar.edit.chapters.editSection');

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay bg="rgba(0, 0, 0, 0.6)" />
      <ModalContent borderRadius="16px" maxW="480px" mx={4}>
        <ModalHeader
          pt={6}
          pb={4}
          px={6}
          borderBottom="1px solid"
          borderColor="gray.100"
          fontSize="lg"
          fontWeight={600}
          color="gray.800"
        >
          {title}
        </ModalHeader>
        <ModalCloseButton top={6} right={6} />
        <ModalBody px={6} py={6}>
          <FormControl mb={4}>
            <FormLabel fontSize="sm" color="gray.700" mb={2}>
              {t('aiTeacher.avatar.edit.chapters.nameLabel')}
            </FormLabel>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('aiTeacher.avatar.edit.chapters.namePlaceholder')}
              autoFocus
              borderRadius="8px"
              borderColor="gray.200"
              _focus={{ borderColor: PRIMARY_COLOR, boxShadow: `0 0 0 1px ${PRIMARY_COLOR}` }}
            />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel fontSize="sm" color="gray.700" mb={2}>
              学习设置
            </FormLabel>
            <RadioGroup value={openMode} onChange={(val) => setOpenMode(val as OpenMode)}>
              <Stack spacing={3}>
                <Radio value="unlimited" colorScheme="red">
                  <Text fontSize="sm" color="gray.700">无限制</Text>
                </Radio>
                <Radio value="scheduled" colorScheme="red">
                  <Stack spacing={1}>
                    <Text fontSize="sm" color="gray.700">指定开放时间</Text>
                    {openMode === 'scheduled' && (
                      <Input
                        type="datetime-local"
                        value={openTime}
                        onChange={(e) => setOpenTime(e.target.value)}
                        placeholder="请选择开放时间"
                        size="sm"
                        borderRadius="8px"
                        borderColor="gray.200"
                        _focus={{ borderColor: PRIMARY_COLOR, boxShadow: `0 0 0 1px ${PRIMARY_COLOR}` }}
                      />
                    )}
                  </Stack>
                </Radio>
                <Radio
                  value="prerequisite"
                  colorScheme="red"
                  isDisabled={!allowPrerequisite}
                >
                  <Text fontSize="sm" color={allowPrerequisite ? 'gray.700' : 'gray.400'}>
                    完成前置章节学习
                  </Text>
                </Radio>
              </Stack>
            </RadioGroup>
          </FormControl>
        </ModalBody>
        <ModalFooter px={6} pb={6} pt={4} gap={3} justifyContent="flex-end">
          <Button
            variant="outline"
            onClick={handleClose}
            px={8}
            h={10}
            borderRadius="8px"
            bg="white"
            borderColor="gray.800"
            color="gray.800"
            _hover={{ bg: 'gray.50', borderColor: 'gray.900' }}
          >
            {t('aiTeacher.avatar.common.actions.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            px={8}
            h={10}
            borderRadius="8px"
            bg="gray.800"
            color="white"
            _hover={{ bg: 'gray.900' }}
          >
            {t('aiTeacher.avatar.common.actions.confirm')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
