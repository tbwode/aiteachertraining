'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Flex,
  Text,
  Button,
  SimpleGrid,
  Divider,
  Input,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useOutsideClick } from '@chakra-ui/react';

interface NewDateRangePickerProps {
  startValue?: string;
  endValue?: string;
  onStartChange?: (value: string) => void;
  onEndChange?: (value: string) => void;
  placeholder?: [string, string];
  flex?: number | object;
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
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
};

// 校验日期字符串是否合法
const isValidDateStr = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  return parseDate(dateStr) !== null;
};

export default function NewDateRangePicker({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  placeholder,
  flex
}: NewDateRangePickerProps) {
  const { t } = useTranslation('common');
  const [activePanel, setActivePanel] = useState<'start' | 'end' | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startInput, setStartInput] = useState(startValue || '');
  const [endInput, setEndInput] = useState(endValue || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useOutsideClick({
    ref: containerRef,
    handler: () => setActivePanel(null)
  });

  const startDate = parseDate(startValue || '');
  const endDate = parseDate(endValue || '');

  // 同步外部值到输入框
  useEffect(() => {
    setStartInput(startValue || '');
    setEndInput(endValue || '');
  }, [startValue, endValue]);

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
  const selectDate = useCallback(
    (day: number) => {
      const selectedDate = new Date(year, month, day);
      const dateStr = formatDate(selectedDate);

      if (activePanel === 'start') {
        onStartChange?.(dateStr);
        setStartInput(dateStr);
        // 如果结束日期早于新的开始日期，清空结束日期
        if (endDate && selectedDate > endDate) {
          onEndChange?.('');
          setEndInput('');
        }
        // 自动切换到结束日期面板
        setActivePanel('end');
        setCurrentMonth(endDate && selectedDate <= endDate ? endDate : selectedDate);
      } else if (activePanel === 'end') {
        // 确保结束日期不早于开始日期
        if (startDate && selectedDate < startDate) {
          return;
        }
        onEndChange?.(dateStr);
        setEndInput(dateStr);
        setActivePanel(null);
      }
    },
    [activePanel, year, month, startDate, endDate, onStartChange, onEndChange]
  );

  // 清空开始日期
  const clearStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartChange?.('');
    setStartInput('');
    // 如果结束日期存在，保留（业务上允许只选结束日期，但通常开始清空时结束也清空更合理）
    // 这里保持与现有逻辑一致：清空开始时不自动清空结束
  };

  // 清空结束日期
  const clearEnd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEndChange?.('');
    setEndInput('');
  };

  // 打开面板
  const openPanel = (panel: 'start' | 'end') => {
    setActivePanel(panel);
    if (panel === 'start' && startDate) {
      setCurrentMonth(startDate);
    } else if (panel === 'end' && endDate) {
      setCurrentMonth(endDate);
    } else if (panel === 'end' && startDate) {
      setCurrentMonth(startDate);
    } else {
      setCurrentMonth(new Date());
    }
  };

  // 输入框失焦校验
  const handleStartBlur = () => {
    const value = startInput.trim();
    if (!value) {
      onStartChange?.('');
      setStartInput('');
      return;
    }
    if (!isValidDateStr(value)) {
      setStartInput(startValue || '');
      return;
    }
    // 结束日期校验
    if (endValue && value > endValue) {
      onEndChange?.('');
      setEndInput('');
    }
    onStartChange?.(value);
  };

  const handleEndBlur = () => {
    const value = endInput.trim();
    if (!value) {
      onEndChange?.('');
      setEndInput('');
      return;
    }
    if (!isValidDateStr(value)) {
      setEndInput(endValue || '');
      return;
    }
    // 不能早于开始日期
    if (startValue && value < startValue) {
      setEndInput(endValue || '');
      return;
    }
    onEndChange?.(value);
  };

  // 判断日期是否在选择范围内
  const isInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const date = new Date(year, month, day);
    return date > startDate && date < endDate;
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

  // 判断日期是否可选（结束面板时不能早于开始日期）
  const isDisabled = (day: number) => {
    if (activePanel !== 'end' || !startDate) return false;
    const date = new Date(year, month, day);
    return date < startDate;
  };

  const weekDays = [
    t('dateRangePicker.weekDays.0'),
    t('dateRangePicker.weekDays.1'),
    t('dateRangePicker.weekDays.2'),
    t('dateRangePicker.weekDays.3'),
    t('dateRangePicker.weekDays.4'),
    t('dateRangePicker.weekDays.5'),
    t('dateRangePicker.weekDays.6')
  ];

  const defaultPlaceholder: [string, string] = [
    t('dateRangePicker.startPlaceholder', '开始日期'),
    t('dateRangePicker.endPlaceholder', '结束日期')
  ];
  const [startPlaceholder, endPlaceholder] = placeholder || defaultPlaceholder;

  // 日历面板组件
  const CalendarPanel = ({ align }: { align: 'left' | 'right' }) => (
    <Box
      position="absolute"
      top="40px"
      left={align === 'left' ? 0 : undefined}
      right={align === 'right' ? 0 : undefined}
      w="280px"
      bg="white"
      border="1px solid #E5E6EB"
      borderRadius="8px"
      boxShadow="0 4px 12px rgba(0,0,0,0.15)"
      zIndex={100}
      p={4}
    >
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
        {calendarDays.map((day, index) => {
          const disabled = day ? isDisabled(day) : false;
          return (
            <Box
              key={index}
              h="32px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor={day && !disabled ? 'pointer' : 'default'}
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
                disabled
                  ? '#C9CDD4'
                  : isStart(day || 0) || isEnd(day || 0)
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
                day && !disabled && !isStart(day) && !isEnd(day)
                  ? {
                      bg: isInRange(day) ? '#FFE4E4' : '#F2F3F5',
                      borderRadius: '4px'
                    }
                  : undefined
              }
              onClick={() => day && !disabled && selectDate(day)}
            >
              {day || ''}
            </Box>
          );
        })}
      </SimpleGrid>

      <Divider my={3} />

      {/* 底部操作 */}
      <Flex justify="space-between" align="center">
        <Text fontSize="13px" color="#86909C">
          {activePanel === 'start'
            ? t('dateRangePicker.selectStartDate')
            : t('dateRangePicker.selectEndDate')}
        </Text>
        <Flex gap={2}>
          <Button
            size="sm"
            variant="ghost"
            fontSize="13px"
            onClick={() => {
              if (activePanel === 'start') {
                onStartChange?.('');
                setStartInput('');
              } else {
                onEndChange?.('');
                setEndInput('');
              }
            }}
          >
            {t('dateRangePicker.clear')}
          </Button>
          <Button
            size="sm"
            bg="#C8000B"
            color="white"
            fontSize="13px"
            _hover={{ bg: '#A00000' }}
            onClick={() => setActivePanel(null)}
          >
            {t('dateRangePicker.confirm')}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );

  return (
    <Flex ref={containerRef} align="center" gap={2} flex={flex} position="relative">
      {/* 开始日期 */}
      <Box position="relative" flex={1}>
        <InputGroup>
          <Input
            value={startInput}
            onChange={(e) => setStartInput(e.target.value)}
            onFocus={() => openPanel('start')}
            onBlur={handleStartBlur}
            placeholder={startPlaceholder}
            h="36px"
            fontSize="14px"
            borderColor={activePanel === 'start' ? '#C8000B' : '#E5E6EB'}
            borderRadius="6px"
            _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
            pr="60px"
          />
          <InputRightElement h="36px" w="auto" pr={2} gap={1}>
            {startValue && (
              <Box
                as="span"
                cursor="pointer"
                color="#C9CDD4"
                _hover={{ color: '#86909C' }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={clearStart}
                display="flex"
                alignItems="center"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </Box>
            )}
            <Box as="span" display="flex" alignItems="center" color="#86909C">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </Box>
          </InputRightElement>
        </InputGroup>
        {activePanel === 'start' && <CalendarPanel align="left" />}
      </Box>

      {/* 箭头分隔 */}
      <Text fontSize="14px" color="#86909C" flexShrink={0}>
        →
      </Text>

      {/* 结束日期 */}
      <Box position="relative" flex={1}>
        <InputGroup>
          <Input
            value={endInput}
            onChange={(e) => setEndInput(e.target.value)}
            onFocus={() => openPanel('end')}
            onBlur={handleEndBlur}
            placeholder={endPlaceholder}
            h="36px"
            fontSize="14px"
            borderColor={activePanel === 'end' ? '#C8000B' : '#E5E6EB'}
            borderRadius="6px"
            _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
            pr="60px"
          />
          <InputRightElement h="36px" w="auto" pr={2} gap={1}>
            {endValue && (
              <Box
                as="span"
                cursor="pointer"
                color="#C9CDD4"
                _hover={{ color: '#86909C' }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={clearEnd}
                display="flex"
                alignItems="center"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </Box>
            )}
            <Box as="span" display="flex" alignItems="center" color="#86909C">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </Box>
          </InputRightElement>
        </InputGroup>
        {activePanel === 'end' && <CalendarPanel align="left" />}
      </Box>
    </Flex>
  );
}
