'use client';

import { useMemo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Flex, IconButton, Select, Text, Input } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

type PaginationProps = {
  current: number;
  total: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onChange: (page: number, pageSize: number) => void;
};

const ACCENT = '#C8000B';

export default function Pagination({
  current,
  total,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  onChange
}: PaginationProps) {
  const { t } = useTranslation('admin');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [jumpPage, setJumpPage] = useState('');

  const pages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const result: (number | 'left-ellipsis' | 'right-ellipsis')[] = [1];

    if (current > 4) {
      result.push('left-ellipsis');
    }

    const start = Math.max(2, current - 2);
    const end = Math.min(totalPages - 1, current + 2);

    for (let i = start; i <= end; i++) {
      result.push(i);
    }

    if (current < totalPages - 3) {
      result.push('right-ellipsis');
    }

    result.push(totalPages);

    return result;
  }, [totalPages, current]);

  const handlePageSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newPageSize = Number(e.target.value);
      onChange(1, newPageSize);
    },
    [onChange]
  );

  const handleJumpPage = () => {
    const page = Number(jumpPage);
    if (page >= 1 && page <= totalPages) {
      onChange(page, pageSize);
      setJumpPage('');
    }
  };

  const handleJumpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setJumpPage(value);
    }
  };

  const handleJumpInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJumpPage();
    }
  };

  return (
    <Flex
      justify="space-between"
      align="center"
      px={4}
      py={3}
      borderTopWidth="1px"
      borderColor="blackAlpha.100"
    >
      <Text color="gray.500" fontSize="12px">
        {t('common.pagination.total', { total })}
      </Text>
      <Flex align="center" gap={1}>
        <IconButton
          aria-label={t('common.pagination.prev')}
          icon={<ChevronLeftIcon w={4} h={4} />}
          variant="ghost"
          size="sm"
          w="28px"
          h="28px"
          minW="28px"
          borderRadius="4px"
          color="#86909C"
          isDisabled={current === 1}
          onClick={() => onChange(Math.max(1, current - 1), pageSize)}
          _hover={{ bg: 'transparent', color: '#4E5969' }}
          _disabled={{ opacity: 0.4, cursor: 'not-allowed' }}
        />
        {pages.map((page) => {
          if (page === 'left-ellipsis' || page === 'right-ellipsis') {
            return (
              <Text
                key={page}
                w="28px"
                h="28px"
                lineHeight="28px"
                textAlign="center"
                fontSize="14px"
                color="#86909C"
              >
                ...
              </Text>
            );
          }
          const isActive = page === current;
          return (
            <Button
              key={page}
              w="28px"
              h="28px"
              minW="28px"
              p={0}
              borderRadius="4px"
              fontSize="14px"
              fontWeight={isActive ? '500' : '400'}
              variant="ghost"
              bg={isActive ? '#F2F3F5' : 'transparent'}
              color={isActive ? '#1D2129' : '#4E5969'}
              _hover={{ bg: isActive ? '#F2F3F5' : '#F7F8FA' }}
              onClick={() => onChange(page, pageSize)}
            >
              {page}
            </Button>
          );
        })}
        <IconButton
          aria-label={t('common.pagination.next')}
          icon={<ChevronRightIcon w={4} h={4} />}
          variant="ghost"
          size="sm"
          w="28px"
          h="28px"
          minW="28px"
          borderRadius="4px"
          color="#86909C"
          isDisabled={current >= totalPages}
          onClick={() => onChange(Math.min(totalPages, current + 1), pageSize)}
          _hover={{ bg: 'transparent', color: '#4E5969' }}
          _disabled={{ opacity: 0.4, cursor: 'not-allowed' }}
        />
        <Select
          w="80px"
          h="28px"
          fontSize="12px"
          bg="white"
          borderColor="#E5E6EB"
          borderRadius="4px"
          ml={2}
          value={String(pageSize)}
          onChange={handlePageSizeChange}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={String(size)}>
              {t('common.pagination.pageSize', { size })}
            </option>
          ))}
        </Select>
        <Flex align="center" gap={1} ml={2}>
          <Text fontSize="12px" color="#4E5969">
            {t('common.pagination.jumpTo')}
          </Text>
          <Input
            w="40px"
            h="28px"
            fontSize="12px"
            bg="white"
            borderColor="#E5E6EB"
            borderRadius="4px"
            textAlign="center"
            value={jumpPage}
            onChange={handleJumpInputChange}
            onKeyDown={handleJumpInputKeyDown}
            onBlur={handleJumpPage}
            p={0}
          />
          <Text fontSize="12px" color="#4E5969">
            {t('common.pagination.page')}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}
