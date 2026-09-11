import {
  Badge,
  Box,
  Flex,
  Grid,
  HStack,
  Image,
  Input,
  Progress,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useToast
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import type { StudentData } from '../constants';
import type { AvatarStudentsStatsResponse } from '@/teacher/types/aiTeacher';
import { PRIMARY_COLOR, SUCCESS_COLOR, WARNING_COLOR } from '../constants';
import { getStatusMeta, getProgressColor } from '../utils';
import { exportAvatarStudents } from '@/teacher/api/aiTeacher';

type TabStudentsProps = {
  avatarId: string;
  teacherId: number;
  searchText: string;
  setSearchText: (text: string) => void;
  selectedClass: string;
  setSelectedClass: (className: string) => void;
  filteredStudents: StudentData[];
  allStudents: StudentData[];
  studentsStats: AvatarStudentsStatsResponse | null;
  isLoading: boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  total: number;
  onViewStudent: (student: StudentData) => void;
  onViewConversation?: (student: StudentData) => void;
  onRemindClick: (student: StudentData) => void;
  classList?: Array<{ classId: number; className: string }>;
};

export function TabStudents({
  avatarId,
  teacherId,
  searchText,
  setSearchText,
  selectedClass,
  setSelectedClass,
  filteredStudents,
  allStudents,
  studentsStats,
  isLoading,
  currentPage,
  setCurrentPage,
  pageSize,
  total,
  onViewStudent,
  onViewConversation,
  onRemindClick,
  classList
}: TabStudentsProps) {
  const { t } = useTranslation('teacher');
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const totalPages = Math.ceil(total / pageSize);

  // 从 classList 或学生列表中提取唯一的班级名称
  const uniqueClasses = React.useMemo(() => {
    // 优先使用 classList（来自 detail 接口）
    if (classList && classList.length > 0) {
      return classList.map((c) => c.className).sort();
    }
    // 降级方案：从学生列表中提取
    const classSet = new Set<string>();
    allStudents.forEach((student) => {
      if (student.className && student.className !== '未分配班级') {
        classSet.add(student.className);
      }
    });
    return Array.from(classSet).sort();
  }, [classList, allStudents]);

  // 创建班级名称到ID的映射
  const classNameToIdMap = React.useMemo(() => {
    const map = new Map<string, number>();
    allStudents.forEach((student) => {
      if (student.className && student.classId !== null) {
        map.set(student.className, student.classId);
      }
    });
    return map;
  }, [allStudents]);

  // 处理导出
  const handleExport = async () => {
    if (!avatarId) {
      toast({
        title: t('aiTeacher.avatar.detail.students.toasts.exportFailed'),
        description: t('aiTeacher.avatar.detail.students.toasts.missingAvatarId'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    setIsExporting(true);

    try {
      // 获取选中班级的ID
      let clazzId: number | null = null;
      if (selectedClass !== 'all') {
        clazzId = classNameToIdMap.get(selectedClass) ?? null;
      }

      // 构建导出参数
      const exportParams = {
        avatarId: Number(avatarId),
        clazzId: selectedClass === 'all' ? null : clazzId,
        progressRange: null,
        status: null,
        isLagging: null,
        searchKey: searchText || null
      };

      // 调用导出接口
      const blob = await exportAvatarStudents(exportParams);

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `学生数据_${new Date().getTime()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: t('aiTeacher.avatar.detail.students.toasts.exportSuccess'),
        description: t('aiTeacher.avatar.detail.students.toasts.exportSuccessDesc'),
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
    } catch (error) {
      console.error('导出失败:', error);
      toast({
        title: t('aiTeacher.avatar.detail.students.toasts.exportFailed'),
        description:
          error instanceof Error
            ? error.message
            : t('aiTeacher.avatar.detail.students.toasts.exportFailedDesc'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <VStack spacing={5} align="stretch">
      {/* 统计卡片 */}
      <Grid
        templateColumns={{ base: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }}
        gap={{ base: 3, md: 5 }}
      >
        <Box
          bg="white"
          borderRadius="18px"
          border="1px solid"
          borderColor="#E5E6EB"
          boxShadow="0 8px 28px rgba(31,35,41,0.07)"
          p={{ base: 4, md: 5 }}
        >
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="sm" color="gray.500" mb={2}>
                {t('aiTeacher.avatar.detail.students.stats.total')}
              </Text>
              <Text fontSize="3xl" fontWeight={700} color="gray.800">
                {studentsStats?.totalCount ?? 0}
                <Text as="span" ml={1} fontSize="lg" fontWeight={400} color="gray.500">
                  {t('aiTeacher.avatar.detail.students.stats.unit')}
                </Text>
              </Text>
            </Box>
            <Image src="/imgs/teacher/aiTeacher/stats/icon-total.svg" alt="" w="40px" h="40px" />
          </Flex>
        </Box>
        <Box
          bg="white"
          borderRadius="18px"
          border="1px solid"
          borderColor="#E5E6EB"
          boxShadow="0 8px 28px rgba(31,35,41,0.07)"
          p={{ base: 4, md: 5 }}
        >
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="sm" color="gray.500" mb={2}>
                {t('aiTeacher.avatar.detail.students.stats.studying')}
              </Text>
              <Text fontSize="3xl" fontWeight={700} color={PRIMARY_COLOR}>
                {studentsStats?.studyingCount ?? 0}
                <Text as="span" ml={1} fontSize="lg" fontWeight={400} color="gray.500">
                  {t('aiTeacher.avatar.detail.students.stats.unit')}
                </Text>
              </Text>
            </Box>
            <Image src="/imgs/teacher/aiTeacher/stats/icon-studying.svg" alt="" w="37px" h="37px" />
          </Flex>
        </Box>
        <Box
          bg="white"
          borderRadius="18px"
          border="1px solid"
          borderColor="#E5E6EB"
          boxShadow="0 8px 28px rgba(31,35,41,0.07)"
          p={{ base: 4, md: 5 }}
        >
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="sm" color="gray.500" mb={2}>
                {t('aiTeacher.avatar.detail.students.stats.completed')}
              </Text>
              <Text fontSize="3xl" fontWeight={700} color={SUCCESS_COLOR}>
                {studentsStats?.completedCount ?? 0}
                <Text as="span" ml={1} fontSize="lg" fontWeight={400} color="gray.500">
                  {t('aiTeacher.avatar.detail.students.stats.unit')}
                </Text>
              </Text>
            </Box>
            <Image
              src="/imgs/teacher/aiTeacher/stats/icon-completed.svg"
              alt=""
              w="32px"
              h="32px"
            />
          </Flex>
        </Box>
        <Box
          bg="white"
          borderRadius="18px"
          border="1px solid"
          borderColor="#E5E6EB"
          boxShadow="0 8px 28px rgba(31,35,41,0.07)"
          p={{ base: 4, md: 5 }}
        >
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="sm" color="gray.500" mb={2}>
                {t('aiTeacher.avatar.detail.students.stats.attention')}
              </Text>
              <Text fontSize="3xl" fontWeight={700} color={WARNING_COLOR}>
                {studentsStats?.needAttentionCount ?? 0}
                <Text as="span" ml={1} fontSize="lg" fontWeight={400} color="gray.500">
                  {t('aiTeacher.avatar.detail.students.stats.unit')}
                </Text>
              </Text>
            </Box>
            <Image
              src="/imgs/teacher/aiTeacher/stats/icon-attention.svg"
              alt=""
              w="43px"
              h="44px"
            />
          </Flex>
        </Box>
      </Grid>

      {/* 学生列表 */}
      <Box
        bg="white"
        borderRadius="20px"
        border="1px solid"
        borderColor="#E5E6EB"
        boxShadow="0 8px 28px rgba(31,35,41,0.07)"
        p={{ base: 4, md: 6 }}
      >
        {/* 标题栏 */}
        <Flex
          align={{ base: 'stretch', lg: 'center' }}
          justify="space-between"
          direction={{ base: 'column', lg: 'row' }}
          gap={4}
          mb={5}
        >
          <HStack spacing={2}>
            <Box w="3px" h="16px" bg={PRIMARY_COLOR} borderRadius="full" />
            <Text fontSize="md" fontWeight={600} color="gray.800">
              {t('aiTeacher.avatar.detail.students.listTitle')}
            </Text>
          </HStack>
          <Flex gap={3} direction={{ base: 'column', sm: 'row' }} flexWrap="wrap">
            <Input
              placeholder={t('aiTeacher.avatar.detail.students.searchPlaceholder')}
              w={{ base: '100%', sm: '220px' }}
              h="44px"
              borderRadius="10px"
              borderColor="gray.300"
              _hover={{ borderColor: 'gray.400' }}
              _focusVisible={{
                borderColor: PRIMARY_COLOR,
                boxShadow: '0 0 0 3px rgba(200,0,11,0.12)'
              }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select
              w={{ base: '100%', sm: '160px' }}
              h="44px"
              borderRadius="10px"
              borderColor="gray.300"
              _hover={{ borderColor: 'gray.400' }}
              _focusVisible={{
                borderColor: PRIMARY_COLOR,
                boxShadow: '0 0 0 3px rgba(200,0,11,0.12)'
              }}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="all">{t('aiTeacher.avatar.detail.students.allClasses')}</option>
              {uniqueClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </Select>
            <Button
              onClick={handleExport}
              isLoading={isExporting}
              loadingText={t('aiTeacher.avatar.detail.students.actions.exporting')}
              borderRadius="10px"
              fontSize="13px"
              minH="44px"
              h="44px"
              px={5}
            >
              {t('aiTeacher.avatar.detail.students.actions.export')}
            </Button>
          </Flex>
        </Flex>

        {isLoading ? (
          <Flex justify="center" align="center" minH="300px">
            <Spinner size="lg" color={PRIMARY_COLOR} />
          </Flex>
        ) : (
          <>
            {/* 表格 */}
            <Box overflowX="auto" border="1px solid" borderColor="#ECEEF2" borderRadius="14px">
              <Table variant="simple" size="md" minW="980px">
                <Thead>
                  <Tr bg="gray.50">
                    <Th
                      color="gray.600"
                      fontWeight={500}
                      fontSize="xs"
                      textTransform="none"
                      borderColor="gray.200"
                      py={3}
                    >
                      {t('aiTeacher.avatar.detail.students.table.name')}
                    </Th>
                    <Th
                      color="gray.600"
                      fontWeight={500}
                      fontSize="xs"
                      textTransform="none"
                      borderColor="gray.200"
                      py={3}
                    >
                      {t('aiTeacher.avatar.detail.students.table.className')}
                    </Th>
                    <Th
                      color="gray.600"
                      fontWeight={500}
                      fontSize="xs"
                      textTransform="none"
                      borderColor="gray.200"
                      py={3}
                    >
                      {t('aiTeacher.avatar.detail.students.table.progress')}
                    </Th>
                    <Th
                      color="gray.600"
                      fontWeight={500}
                      fontSize="xs"
                      textTransform="none"
                      borderColor="gray.200"
                      py={3}
                    >
                      {t('aiTeacher.avatar.detail.students.table.studyHours')}
                    </Th>
                    <Th
                      color="gray.600"
                      fontWeight={500}
                      fontSize="xs"
                      textTransform="none"
                      borderColor="gray.200"
                      py={3}
                    >
                      {t('aiTeacher.avatar.detail.students.table.lastStudy')}
                    </Th>
                    <Th
                      color="gray.600"
                      fontWeight={500}
                      fontSize="xs"
                      textTransform="none"
                      borderColor="gray.200"
                      py={3}
                    >
                      {t('aiTeacher.avatar.detail.students.table.status')}
                    </Th>
                    <Th
                      color="gray.600"
                      fontWeight={500}
                      fontSize="xs"
                      textTransform="none"
                      borderColor="gray.200"
                      py={3}
                    >
                      {t('aiTeacher.avatar.detail.students.table.actions')}
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredStudents.map((student) => {
                    const statusMeta = getStatusMeta(student.status);
                    const progressColor = getProgressColor(student.progress);

                    return (
                      <Tr key={student.id} _hover={{ bg: 'gray.50' }} transition="all 0.2s">
                        <Td fontWeight={500} color="gray.800" borderColor="gray.100" py={4}>
                          {student.name}
                        </Td>
                        <Td color="gray.600" fontSize="sm" borderColor="gray.100" py={4}>
                          {student.className}
                        </Td>
                        <Td minW="180px" borderColor="gray.100" py={4}>
                          <Flex align="center" gap={3}>
                            <Progress
                              value={student.progress}
                              size="sm"
                              flex="1"
                              borderRadius="full"
                              sx={{
                                '& > div': {
                                  bg: progressColor,
                                  transition: 'all 0.3s'
                                }
                              }}
                              bg="gray.200"
                            />
                            <Text
                              minW="45px"
                              fontSize="sm"
                              fontWeight={600}
                              color={progressColor}
                              textAlign="right"
                            >
                              {student.progress}%
                            </Text>
                          </Flex>
                        </Td>
                        <Td color="gray.600" fontSize="sm" borderColor="gray.100" py={4}>
                          {student.studyHours}小时
                        </Td>
                        <Td
                          color={student.status === 'lagging' ? PRIMARY_COLOR : 'gray.600'}
                          fontSize="sm"
                          borderColor="gray.100"
                          py={4}
                        >
                          {student.lastStudy}
                        </Td>
                        <Td borderColor="gray.100" py={4}>
                          <Badge
                            bg={statusMeta.bg}
                            color={statusMeta.color}
                            fontSize="xs"
                            px={3}
                            py={1}
                            borderRadius="full"
                            fontWeight={500}
                          >
                            {statusMeta.label}
                          </Badge>
                        </Td>
                        <Td borderColor="gray.100" py={4}>
                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              variant="outline"
                              bg="white"
                              borderColor="gray.300"
                              color="gray.700"
                              borderRadius="6px"
                              px={4}
                              h="40px"
                              minH="40px"
                              fontSize="sm"
                              _hover={{ borderColor: 'gray.400', bg: 'gray.50' }}
                              onClick={() => onViewStudent(student)}
                            >
                              {t('aiTeacher.avatar.detail.students.actions.view')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              bg="white"
                              borderColor="gray.300"
                              color="gray.700"
                              borderRadius="6px"
                              px={4}
                              h="40px"
                              minH="40px"
                              fontSize="sm"
                              _hover={{ borderColor: 'gray.400', bg: 'gray.50' }}
                              onClick={() => onViewConversation?.(student)}
                            >
                              {t('aiTeacher.avatar.detail.students.actions.viewConversation')}
                            </Button>
                            {(student.status === 'lagging' || student.status === 'not-started') &&
                              (student.reminded ? (
                                <Button
                                  size="sm"
                                  borderRadius="6px"
                                  px={4}
                                  h="40px"
                                  minH="40px"
                                  fontSize="sm"
                                  isDisabled
                                  opacity={0.6}
                                  cursor="not-allowed"
                                  _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
                                >
                                  {t('aiTeacher.avatar.detail.students.actions.reminded')}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  bg="white"
                                  borderRadius="6px"
                                  px={4}
                                  h="40px"
                                  minH="40px"
                                  fontSize="sm"
                                  color="#C8000B"
                                  borderColor="#C8000B"
                                  _hover={{ bg: '#C8000B', color: 'white', borderColor: '#C8000B' }}
                                  onClick={() => onRemindClick(student)}
                                >
                                  {t('aiTeacher.avatar.detail.students.actions.remind')}
                                </Button>
                              ))}
                          </HStack>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>

            {/* 分页 */}
            <Flex
              align="center"
              justify="space-between"
              direction={{ base: 'column', md: 'row' }}
              gap={3}
              mt={5}
              pt={4}
              borderTop="1px solid"
              borderColor="gray.100"
            >
              <Text fontSize="sm" color="gray.500">
                {t('aiTeacher.avatar.common.units.records', { count: total })}
              </Text>
              <HStack spacing={2}>
                <Button
                  variant="outline"
                  h="40px"
                  minH="40px"
                  fontSize="13px"
                  isDisabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  _hover={{ bg: 'gray.50' }}
                >
                  {t('aiTeacher.avatar.detail.students.pagination.previous')}
                </Button>
                <HStack spacing={1}>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        minW="40px"
                        h="40px"
                        minH="40px"
                        fontSize="13px"
                        bg={currentPage === page ? PRIMARY_COLOR : 'white'}
                        color={currentPage === page ? 'white' : 'gray.700'}
                        border="1px solid"
                        borderColor={currentPage === page ? PRIMARY_COLOR : 'gray.300'}
                        borderRadius="6px"
                        _hover={{
                          bg: currentPage === page ? PRIMARY_COLOR : 'gray.50',
                          borderColor: currentPage === page ? PRIMARY_COLOR : 'gray.400'
                        }}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </HStack>
                {totalPages > 5 && (
                  <Text color="gray.400" px={2}>
                    ...
                  </Text>
                )}
                <Button
                  h="40px"
                  minH="40px"
                  fontSize="13px"
                  isDisabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  {t('aiTeacher.avatar.detail.students.pagination.next')}
                </Button>
              </HStack>
            </Flex>
          </>
        )}
      </Box>
    </VStack>
  );
}
