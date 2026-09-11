'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Flex, Text, useOutsideClick, SimpleGrid, Button, Divider } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

interface DateRangePickerProps {
  startValue?: string;
  endValue?: string;
  onStartChange?: (value: string) => void;
  onEndChange?: (value: string) => void;
  placeholder?: string;
  bg?: string;
}

// 获取月份天数
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// 获取月份第一天是星期几
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

// 格式化日期
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 解析日期
const parseDate = (dateStr: string) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function DateRangePicker({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  placeholder,
  bg
}: DateRangePickerProps) {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const ref = useRef<HTMLDivElement>(null);

  useOutsideClick({
    ref,
    handler: () => setIsOpen(false)
  });

  const startDate = parseDate(startValue || '');
  const endDate = parseDate(endValue || '');

  // 生成日历数据
  const generateCalendar = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const calendarDays = generateCalendar(currentMonth);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // 切换月份
  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // 选择日期
  const selectDate = (day: number) => {
    const selectedDate = new Date(year, month, day);
    const dateStr = formatDate(selectedDate);

    if (selecting === 'start') {
      onStartChange?.(dateStr);
      // 如果结束日期早于开始日期，清空结束日期
      if (endDate && selectedDate > endDate) {
        onEndChange?.('');
      }
      setSelecting('end');
    } else {
      // 确保结束日期不早于开始日期
      if (startDate && selectedDate < startDate) {
        onStartChange?.(dateStr);
        onEndChange?.(startValue || '');
      } else {
        onEndChange?.(dateStr);
      }
      setSelecting('start');
      if (startDate) {
        setIsOpen(false);
      }
    }
  };

  // 快捷选项
  const shortcuts = [
    {
      label: t('dateRangePicker.shortcuts.today'),
      getRange: () => {
        const today = formatDate(new Date());
        return [today, today];
      }
    },
    {
      label: t('dateRangePicker.shortcuts.yesterday'),
      getRange: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = formatDate(yesterday);
        return [dateStr, dateStr];
      }
    },
    {
      label: t('dateRangePicker.shortcuts.last7Days'),
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return [formatDate(start), formatDate(end)];
      }
    },
    {
      label: t('dateRangePicker.shortcuts.last30Days'),
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return [formatDate(start), formatDate(end)];
      }
    },
    {
      label: t('dateRangePicker.shortcuts.thisMonth'),
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return [formatDate(start), formatDate(end)];
      }
    },
    {
      label: t('dateRangePicker.shortcuts.lastMonth'),
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return [formatDate(start), formatDate(end)];
      }
    }
  ];

  const applyShortcut = (getRange: () => string[]) => {
    const [start, end] = getRange();
    onStartChange?.(start);
    onEndChange?.(end);
    setIsOpen(false);
  };

  // 清空选择
  const clearSelection = () => {
    onStartChange?.('');
    onEndChange?.('');
    setSelecting('start');
  };

  // 判断日期是否在选择范围内
  const isInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const date = new Date(year, month, day);
    return date >= startDate && date <= endDate;
  };

  // 判断日期是否是开始或结束
  const isStart = (day: number) => {
    if (!startDate) return false;
    return (
      year === startDate.getFullYear() &&
      month === startDate.getMonth() &&
      day === startDate.getDate()
    );
  };

  const isEnd = (day: number) => {
    if (!endDate) return false;
    return (
      year === endDate.getFullYear() && month === endDate.getMonth() && day === endDate.getDate()
    );
  };

  // 箭头图标
  const ArrowIcon = () => (
    <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor" aria-hidden="true">
      <path d="M873.1 596.2l-164-208A32 32 0 00684 376h-64.8c-6.7 0-10.4 7.7-6.3 13l144.3 183H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h695.9c26.8 0 41.7-30.8 25.2-51.8z"></path>
    </svg>
  );

  const weekDays = [
    t('dateRangePicker.weekDays.0'),
    t('dateRangePicker.weekDays.1'),
    t('dateRangePicker.weekDays.2'),
    t('dateRangePicker.weekDays.3'),
    t('dateRangePicker.weekDays.4'),
    t('dateRangePicker.weekDays.5'),
    t('dateRangePicker.weekDays.6')
  ];

  return (
    <Box ref={ref} position="relative">
      {/* 触发器 */}
      <Box
        w="260px"
        h="36px"
        cursor="pointer"
        onClick={() => setIsOpen(!isOpen)}
        bg={bg || '#F2F3F5'}
        borderRadius="6px"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={3}
        _hover={{ bg: bg ? undefined : '#E8E9EB' }}
        transition="all 0.2s"
      >
        {/* 日期显示区域 */}
        <Flex align="center" gap={1} fontSize="14px" color={startValue ? '#333333' : '#86909C'}>
          {startValue ? (
            <>
              <Text>{startValue}</Text>
              <Box as={ArrowIcon} mx={1} color="#86909C" />
              {endValue ? (
                <Text>{endValue}</Text>
              ) : (
                <Text color="#86909C">{t('dateRangePicker.end')}</Text>
              )}
            </>
          ) : (
            <Text>{placeholder || t('dateRangePicker.placeholder')}</Text>
          )}
        </Flex>

        {/* 下拉箭头 */}
        <ChevronDownIcon
          boxSize={5}
          color="gray.400"
          transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
          transition="transform 0.2s"
        />
      </Box>

      {/* 下拉面板 */}
      {isOpen && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left={0}
          zIndex={100}
          bg="white"
          borderRadius="8px"
          boxShadow="0 4px 20px rgba(0, 0, 0, 0.15)"
          border="1px solid #E5E6EB"
          p={4}
          minW="360px"
        >
          <Flex gap={4}>
            {/* 快捷选项 */}
            <Box w="100px" borderRight="1px solid #E5E6EB" pr={4}>
              <Text fontSize="12px" color="#86909C" mb={2} fontWeight={500}>
                {t('dateRangePicker.quickSelect')}
              </Text>
              <Flex direction="column" gap={1}>
                {shortcuts.map((item) => (
                  <Button
                    key={item.label}
                    size="sm"
                    variant="ghost"
                    justifyContent="flex-start"
                    fontSize="13px"
                    color="#4E5969"
                    h="28px"
                    px={2}
                    _hover={{ bg: '#F2F3F5', color: '#C8000B' }}
                    onClick={() => applyShortcut(item.getRange)}
                  >
                    {item.label}
                  </Button>
                ))}
              </Flex>
            </Box>

            {/* 日历 */}
            <Box flex={1}>
              {/* 月份导航 */}
              <Flex justify="space-between" align="center" mb={3}>
                <Button size="sm" variant="ghost" p={1} minW="auto" onClick={prevMonth}>
                  <ChevronLeftIcon boxSize={4} />
                </Button>
                <Text fontSize="14px" fontWeight={600} color="#1D2129">
                  {t('dateRangePicker.yearMonth', { year, month: month + 1 })}
                </Text>
                <Button size="sm" variant="ghost" p={1} minW="auto" onClick={nextMonth}>
                  <ChevronRightIcon boxSize={4} />
                </Button>
              </Flex>

              {/* 星期标题 */}
              <SimpleGrid columns={7} mb={1}>
                {weekDays.map((day) => (
                  <Text key={day} textAlign="center" fontSize="12px" color="#86909C" py={1}>
                    {day}
                  </Text>
                ))}
              </SimpleGrid>

              {/* 日期网格 */}
              <SimpleGrid columns={7} spacing={1}>
                {calendarDays.map((day, index) => (
                  <Box
                    key={index}
                    h="32px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    cursor={day ? 'pointer' : 'default'}
                    borderRadius={
                      isStart(day || 0)
                        ? '4px 0 0 4px'
                        : isEnd(day || 0)
                          ? '0 4px 4px 0'
                          : isInRange(day || 0)
                            ? '0'
                            : '4px'
                    }
                    bg={
                      isStart(day || 0) || isEnd(day || 0)
                        ? '#C8000B'
                        : isInRange(day || 0)
                          ? '#FFF0F0'
                          : 'transparent'
                    }
                    color={
                      isStart(day || 0) || isEnd(day || 0)
                        ? 'white'
                        : isInRange(day || 0)
                          ? '#C8000B'
                          : day
                            ? '#1D2129'
                            : 'transparent'
                    }
                    fontSize="13px"
                    fontWeight={isStart(day || 0) || isEnd(day || 0) ? 600 : 400}
                    _hover={
                      day && !isStart(day) && !isEnd(day)
                        ? {
                            bg: isInRange(day) ? '#FFE4E4' : '#F2F3F5',
                            borderRadius: '4px'
                          }
                        : undefined
                    }
                    onClick={() => day && selectDate(day)}
                  >
                    {day || ''}
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          </Flex>

          <Divider my={3} />

          {/* 底部操作 */}
          <Flex justify="space-between" align="center">
            <Text fontSize="13px" color="#86909C">
              {startValue && endValue
                ? `${startValue} ${String(t('dateRangePicker.to'))} ${endValue}`
                : selecting === 'start'
                  ? t('dateRangePicker.selectStartDate')
                  : t('dateRangePicker.selectEndDate')}
            </Text>
            <Flex gap={2}>
              <Button size="sm" variant="ghost" fontSize="13px" onClick={clearSelection}>
                {t('dateRangePicker.clear')}
              </Button>
              <Button
                size="sm"
                bg="#C8000B"
                color="white"
                fontSize="13px"
                _hover={{ bg: '#A00000' }}
                onClick={() => setIsOpen(false)}
                isDisabled={!startValue}
              >
                {t('dateRangePicker.confirm')}
              </Button>
            </Flex>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
