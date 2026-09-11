'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Flex,
  Text,
  SimpleGrid,
  Button,
  Divider,
  InputGroup,
  Input,
  InputRightElement,
  IconButton,
  type InputProps
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Portal } from '@chakra-ui/react';

export interface DatePickerProps extends Omit<InputProps, 'value' | 'onChange' | 'size'> {
  value?: string;
  onChange?: (value: string) => void;
  format?: string;
  allowClear?: boolean;
  showToday?: boolean;
  disabledDate?: (date: Date) => boolean;
  disabled?: boolean;
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
const formatDate = (date: Date, format = 'YYYY-MM-DD') => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return format.replace('YYYY', String(year)).replace('MM', month).replace('DD', day);
};

// 解析日期
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day);
};

// 判断是否是同一天
const isSameDay = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// 判断是否是今天
const isToday = (year: number, month: number, day: number) => {
  const today = new Date();
  return year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
};

export default function DatePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  format = 'YYYY-MM-DD',
  allowClear = true,
  showToday = true,
  disabledDate,
  ...inputProps
}: DatePickerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { t } = useTranslation('common' as any);
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [inputValue, setInputValue] = useState(value || '');
  const [viewMode, setViewMode] = useState<'date' | 'month' | 'year'>('date');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });

  // 自定义点击外部处理，支持 Portal 内的面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;

      const target = event.target as Node;
      const isInsideInput = inputRef.current?.contains(target);
      const isInsidePanel = panelRef.current?.contains(target);

      if (!isInsideInput && !isInsidePanel) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 计算面板位置
  const calculatePosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setPanelPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
  }, []);

  // 打开选择器时计算位置
  useEffect(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen, calculatePosition]);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        calculatePosition();
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isOpen, calculatePosition]);

  // 同步外部 value
  useEffect(() => {
    setInputValue(value || '');
    if (value) {
      const parsed = parseDate(value);
      if (parsed) {
        setCurrentDate(parsed);
      }
    }
  }, [value]);

  const selectedDate = parseDate(inputValue);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 生成日历数据
  const generateCalendar = useCallback(() => {
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
  }, [year, month]);

  const calendarDays = generateCalendar();

  // 生成年份列表 (当前年份前后10年)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  // 月份列表
  const months: string[] = [
    t('datePicker.months.jan'),
    t('datePicker.months.feb'),
    t('datePicker.months.mar'),
    t('datePicker.months.apr'),
    t('datePicker.months.may'),
    t('datePicker.months.jun'),
    t('datePicker.months.jul'),
    t('datePicker.months.aug'),
    t('datePicker.months.sep'),
    t('datePicker.months.oct'),
    t('datePicker.months.nov'),
    t('datePicker.months.dec')
  ];

  // 星期标题
  const weekDays: string[] = [
    t('datePicker.weekDays.0'),
    t('datePicker.weekDays.1'),
    t('datePicker.weekDays.2'),
    t('datePicker.weekDays.3'),
    t('datePicker.weekDays.4'),
    t('datePicker.weekDays.5'),
    t('datePicker.weekDays.6')
  ];

  // 切换月份
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 切换年份
  const prevYear = () => {
    setCurrentDate(new Date(year - 1, month, 1));
  };

  const nextYear = () => {
    setCurrentDate(new Date(year + 1, month, 1));
  };

  // 选择日期
  const selectDate = (day: number) => {
    const date = new Date(year, month, day);

    if (disabledDate && disabledDate(date)) {
      return;
    }

    const dateStr = formatDate(date, format);
    setInputValue(dateStr);
    onChange?.(dateStr);
    setIsOpen(false);
  };

  // 选择月份
  const selectMonth = (monthIndex: number) => {
    setCurrentDate(new Date(year, monthIndex, 1));
    setViewMode('date');
  };

  // 选择年份
  const selectYear = (selectedYear: number) => {
    setCurrentDate(new Date(selectedYear, month, 1));
    setViewMode('month');
  };

  // 选择今天
  const selectToday = () => {
    const today = new Date();
    const dateStr = formatDate(today, format);
    setInputValue(dateStr);
    setCurrentDate(today);
    onChange?.(dateStr);
    setIsOpen(false);
  };

  // 清空选择
  const clearSelection = () => {
    setInputValue('');
    onChange?.('');
    setIsOpen(false);
  };

  // 处理输入框变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // 尝试解析日期
    const parsed = parseDate(val);
    if (parsed) {
      setCurrentDate(parsed);
      onChange?.(val);
    }
  };

  // 打开选择器
  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
      setViewMode('date');
    }
  };

  // 判断日期是否被禁用
  const isDisabled = (day: number) => {
    if (!disabledDate) return false;
    const date = new Date(year, month, day);
    return disabledDate(date);
  };

  // 判断日期是否被选中
  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      year === selectedDate.getFullYear() &&
      month === selectedDate.getMonth() &&
      day === selectedDate.getDate()
    );
  };

  return (
    <Box position="relative" w="100%">
      {/* 输入框触发器 */}
      <InputGroup>
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onClick={handleOpen}
          placeholder={placeholder || t('datePicker.placeholder')}
          isDisabled={disabled}
          readOnly={false}
          bg="#fff"
          border="1px solid #E5E6EB"
          h="36px"
          fontSize="14px"
          color="#1D2129"
          _placeholder={{ color: '#86909C' }}
          _focus={{ bg: '#F2F3F5', boxShadow: 'none' }}
          _hover={{ bg: '#F2F3F5' }}
          {...inputProps}
        />
        <InputRightElement
          h={(inputProps.h || inputProps.height || '36px') as string}
          display="flex"
          alignItems="center"
          justifyContent="center"
          top="0"
          right="0"
        >
          {allowClear && inputValue ? (
            <IconButton
              aria-label="Clear"
              icon={
                <Box as="span" fontSize="16px" lineHeight="1">
                  ×
                </Box>
              }
              size="xs"
              variant="ghost"
              color="gray.400"
              _hover={{ color: 'gray.600' }}
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
            />
          ) : (
            <CalendarIcon boxSize={4} color="gray.400" />
          )}
        </InputRightElement>
      </InputGroup>

      {/* 下拉面板 */}
      <AnimatePresence>
        {isOpen && (
          <Portal>
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: panelPosition.top,
                left: panelPosition.left,
                zIndex: 9999
              }}
            >
              <Box
                ref={panelRef}
                bg="white"
                borderRadius="8px"
                boxShadow="0 4px 20px rgba(0, 0, 0, 0.15)"
                border="1px solid #E5E6EB"
                p={4}
                minW="280px"
              >
                {/* 头部导航 */}
                <Flex justify="space-between" align="center" mb={3}>
                  <Flex gap={1}>
                    <Button
                      size="sm"
                      variant="ghost"
                      p={1}
                      minW="auto"
                      onClick={viewMode === 'year' ? undefined : prevYear}
                    >
                      <ChevronLeftIcon boxSize={4} />
                    </Button>
                    {viewMode === 'date' && (
                      <Button size="sm" variant="ghost" p={1} minW="auto" onClick={prevMonth}>
                        <ChevronLeftIcon boxSize={4} />
                      </Button>
                    )}
                  </Flex>

                  <Flex gap={2}>
                    {viewMode === 'date' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          fontWeight={600}
                          onClick={() => setViewMode('year')}
                        >
                          {year}
                          {t('datePicker.year')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          fontWeight={600}
                          onClick={() => setViewMode('month')}
                        >
                          {months[month]}
                        </Button>
                      </>
                    )}
                    {viewMode === 'month' && (
                      <Button size="sm" variant="ghost" fontWeight={600}>
                        {year}
                        {t('datePicker.year')}
                      </Button>
                    )}
                    {viewMode === 'year' && (
                      <Button size="sm" variant="ghost" fontWeight={600}>
                        {year - 10}-{year + 10}
                      </Button>
                    )}
                  </Flex>

                  <Flex gap={1}>
                    {viewMode === 'date' && (
                      <Button size="sm" variant="ghost" p={1} minW="auto" onClick={nextMonth}>
                        <ChevronRightIcon boxSize={4} />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      p={1}
                      minW="auto"
                      onClick={viewMode === 'year' ? undefined : nextYear}
                    >
                      <ChevronRightIcon boxSize={4} />
                    </Button>
                  </Flex>
                </Flex>

                {/* 日期视图 */}
                {viewMode === 'date' && (
                  <>
                    {/* 星期标题 */}
                    <SimpleGrid columns={7} mb={1}>
                      {weekDays.map((day, idx) => (
                        <Text
                          key={idx}
                          textAlign="center"
                          fontSize="12px"
                          color="#86909C"
                          py={1}
                          fontWeight={500}
                        >
                          {day}
                        </Text>
                      ))}
                    </SimpleGrid>

                    {/* 日期网格 */}
                    <SimpleGrid columns={7} spacing={1}>
                      {calendarDays.map((day, index) => {
                        const disabled = day ? isDisabled(day) : false;
                        const selected = day ? isSelected(day) : false;
                        const isTodayDate = day ? isToday(year, month, day) : false;

                        return (
                          <Box
                            key={index}
                            h="32px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            cursor={day && !disabled ? 'pointer' : 'default'}
                            borderRadius="4px"
                            bg={selected ? '#C8000B' : 'transparent'}
                            color={
                              disabled
                                ? '#C9CDD4'
                                : selected
                                  ? 'white'
                                  : isTodayDate
                                    ? '#C8000B'
                                    : '#1D2129'
                            }
                            fontSize="13px"
                            fontWeight={selected || isTodayDate ? 600 : 400}
                            border={isTodayDate && !selected ? '1px solid #C8000B' : 'none'}
                            _hover={day && !disabled && !selected ? { bg: '#F2F3F5' } : undefined}
                            onClick={() => day && !disabled && selectDate(day)}
                          >
                            {day || ''}
                          </Box>
                        );
                      })}
                    </SimpleGrid>
                  </>
                )}

                {/* 月份视图 */}
                {viewMode === 'month' && (
                  <SimpleGrid columns={3} spacing={2}>
                    {months.map((monthName, index) => (
                      <Button
                        key={monthName}
                        h="40px"
                        variant="ghost"
                        fontSize="14px"
                        fontWeight={month === index ? 600 : 400}
                        color={month === index ? '#C8000B' : '#1D2129'}
                        bg={month === index ? '#FFF0F0' : 'transparent'}
                        _hover={{ bg: month === index ? '#FFF0F0' : '#F2F3F5' }}
                        onClick={() => selectMonth(index)}
                      >
                        {monthName}
                      </Button>
                    ))}
                  </SimpleGrid>
                )}

                {/* 年份视图 */}
                {viewMode === 'year' && (
                  <SimpleGrid columns={4} spacing={2} maxH="240px" overflowY="auto">
                    {generateYears().map((yearNum) => (
                      <Button
                        key={yearNum}
                        h="40px"
                        variant="ghost"
                        fontSize="14px"
                        fontWeight={year === yearNum ? 600 : 400}
                        color={year === yearNum ? '#C8000B' : '#1D2129'}
                        bg={year === yearNum ? '#FFF0F0' : 'transparent'}
                        _hover={{ bg: year === yearNum ? '#FFF0F0' : '#F2F3F5' }}
                        onClick={() => selectYear(yearNum)}
                      >
                        {yearNum}
                      </Button>
                    ))}
                  </SimpleGrid>
                )}

                <Divider my={3} />

                {/* 底部操作 */}
                <Flex justify="space-between" align="center">
                  {showToday && (
                    <Button
                      size="sm"
                      variant="ghost"
                      fontSize="13px"
                      color="#C8000B"
                      onClick={selectToday}
                    >
                      {t('datePicker.today')}
                    </Button>
                  )}
                  <Flex gap={2} ml="auto">
                    {allowClear && (
                      <Button size="sm" variant="ghost" fontSize="13px" onClick={clearSelection}>
                        {t('datePicker.clear')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      bg="#C8000B"
                      color="white"
                      fontSize="13px"
                      _hover={{ bg: '#A00000' }}
                      onClick={() => setIsOpen(false)}
                    >
                      {t('datePicker.confirm')}
                    </Button>
                  </Flex>
                </Flex>
              </Box>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </Box>
  );
}
