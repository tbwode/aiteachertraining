'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  IconButton,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Badge,
  useDisclosure,
  useToast,
  Select,
  Input,
  InputGroup,
  InputRightElement,
  Collapse,
  Divider
} from '@chakra-ui/react';
import {
  AddIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  ChevronRightIcon as ChevronRight,
  ChevronDownIcon,
  TriangleDownIcon,
  TriangleUpIcon
} from '@chakra-ui/icons';
// 使用自定义图标替代 react-icons

type TeacherStatus = '在职' | '离职' | '休假';

type TeacherItem = {
  id: number;
  teacherNo: string;
  name: string;
  gender: string;
  phone: string;
  organization: string;
  userType: string;
  title: string;
  role: string;
  status: TeacherStatus;
};

type OrgTreeNode = {
  id: string;
  name: string;
  type: 'school' | 'department' | 'office';
  children?: OrgTreeNode[];
};

const pageSize = 10;

// 组织架构树数据
const orgTreeData: OrgTreeNode[] = [
  {
    id: '1',
    name: '铁路职业技术学院',
    type: 'school',
    children: [
      {
        id: '1-1',
        name: '计算机系',
        type: 'department',
        children: [
          { id: '1-1-1', name: '软件技术教研室', type: 'office' },
          { id: '1-1-2', name: '网络技术教研室', type: 'office' }
        ]
      },
      {
        id: '1-2',
        name: '电子工程系',
        type: 'department',
        children: [
          { id: '1-2-1', name: '电子技术教研室', type: 'office' },
          { id: '1-2-2', name: '通信技术教研室', type: 'office' }
        ]
      },
      {
        id: '1-3',
        name: '机械工程系',
        type: 'department',
        children: [
          { id: '1-3-1', name: '机械设计教研室', type: 'office' },
          { id: '1-3-2', name: '数控技术教研室', type: 'office' }
        ]
      },
      {
        id: '1-4',
        name: '财经系',
        type: 'department',
        children: [
          { id: '1-4-1', name: '会计教研室', type: 'office' },
          { id: '1-4-2', name: '财务管理教研室', type: 'office' }
        ]
      },
      {
        id: '1-5',
        name: '教务处',
        type: 'department',
        children: [
          { id: '1-5-1', name: '教学管理办公室', type: 'office' },
          { id: '1-5-2', name: '考试中心', type: 'office' }
        ]
      }
    ]
  }
];

// 假数据
const initialTeachers: TeacherItem[] = [
  {
    id: 1,
    teacherNo: 'ADMIN',
    name: '系统管理员',
    gender: '男',
    phone: '13800138001',
    organization: '教务处',
    userType: '行政人员',
    title: '-',
    role: '租户管理员',
    status: '在职'
  },
  {
    id: 2,
    teacherNo: 'JS-0001',
    name: '王教授',
    gender: '女',
    phone: '13800138002',
    organization: '计算机系',
    userType: '教师',
    title: '教授',
    role: '班主任',
    status: '在职'
  },
  {
    id: 3,
    teacherNo: 'JS-0002',
    name: '李博士',
    gender: '男',
    phone: '13800138003',
    organization: '信息技术系',
    userType: '教师',
    title: '博士',
    role: '-',
    status: '在职'
  },
  {
    id: 4,
    teacherNo: 'JS-0003',
    name: '张老师',
    gender: '男',
    phone: '13800138004',
    organization: '软件工程系',
    userType: '教师',
    title: '讲师',
    role: '教务管理员',
    status: '在职'
  },
  {
    id: 5,
    teacherNo: 'JS-0004',
    name: '赵研究员',
    gender: '男',
    phone: '13800138005',
    organization: '网络工程系',
    userType: '行政人员',
    title: '研究员',
    role: '班主任',
    status: '在职'
  },
  {
    id: 6,
    teacherNo: 'JS-0005',
    name: '钱教授',
    gender: '女',
    phone: '13800138006',
    organization: '人工智能系',
    userType: '行政人员',
    title: '教授',
    role: '-',
    status: '离职'
  },
  {
    id: 7,
    teacherNo: 'JS-0006',
    name: '孙教授',
    gender: '女',
    phone: '13800138007',
    organization: '数据科学系',
    userType: '教师',
    title: '教授',
    role: '教务管理员',
    status: '在职'
  },
  {
    id: 8,
    teacherNo: 'JS-0007',
    name: '周主任',
    gender: '男',
    phone: '13800138008',
    organization: '云计算系',
    userType: '教师',
    title: '高级讲师',
    role: '班主任',
    status: '在职'
  },
  {
    id: 9,
    teacherNo: 'JS-0008',
    name: '吴讲师',
    gender: '男',
    phone: '13800138009',
    organization: '人机交互系',
    userType: '教师',
    title: '讲师',
    role: '辅导员',
    status: '在职'
  }
];

const getStatusColor = (status: TeacherStatus) => {
  switch (status) {
    case '在职':
      return { bg: '#DCFCE7', color: '#166534', dotColor: '#22C55E' };
    case '休假':
      return { bg: '#FEF3C7', color: '#92400E', dotColor: '#F59E0B' };
    case '离职':
      return { bg: '#F3F4F6', color: '#6B7280', dotColor: '#9CA3AF' };
    default:
      return { bg: '#F3F4F6', color: '#6B7280', dotColor: '#9CA3AF' };
  }
};

// 组织架构树节点组件
function OrgTreeNode({
  node,
  level = 0,
  selectedId,
  onSelect,
  expandedIds,
  onToggle
}: {
  node: OrgTreeNode;
  level?: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  const getIcon = () => {
    switch (node.type) {
      case 'school':
        // 学校图标 - 建筑样式
        return (
          <Box w="16px" h="16px" display="flex" alignItems="center" justifyContent="center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"
                fill="#C83E3E"
              />
            </svg>
          </Box>
        );
      case 'department':
        // 部门图标 - 人员样式
        return (
          <Box w="14px" h="14px" display="flex" alignItems="center" justifyContent="center">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4C14.21 4 16 5.79 16 8C16 10.21 14.21 12 12 12C9.79 12 8 10.21 8 8C8 5.79 9.79 4 12 4ZM12 14C16.42 14 20 15.79 20 18V20H4V18C4 15.79 7.58 14 12 14Z"
                fill="#666"
              />
            </svg>
          </Box>
        );
      case 'office':
        // 办公室图标 - 多人样式
        return (
          <Box w="14px" h="14px" display="flex" alignItems="center" justifyContent="center">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C15.05 13.06 15.07 13.08 15.09 13.09C16.37 13.96 17 14.92 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z"
                fill="#999"
              />
            </svg>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Flex
        align="center"
        py={2}
        px={3}
        cursor="pointer"
        bg={isSelected ? '#FEF2F2' : 'transparent'}
        color={isSelected ? '#C83E3E' : 'gray.700'}
        borderRadius="md"
        ml={level * 4}
        onClick={() => {
          onSelect(node.id);
          if (hasChildren) {
            onToggle(node.id);
          }
        }}
        _hover={{ bg: isSelected ? '#FEF2F2' : 'gray.50' }}
      >
        {hasChildren && (
          <Box
            mr={2}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
          >
            {isExpanded ? (
              <ChevronDownIcon boxSize={4} color="gray.500" />
            ) : (
              <ChevronRight boxSize={4} color="gray.500" />
            )}
          </Box>
        )}
        {!hasChildren && <Box w={6} />}
        <Box mr={2}>{getIcon()}</Box>
        <Text fontSize="14px" fontWeight={isSelected ? 600 : 400}>
          {node.name}
        </Text>
      </Flex>
      {hasChildren && (
        <Collapse in={isExpanded}>
          <Box>
            {node.children!.map((child) => (
              <OrgTreeNode
                key={child.id}
                node={child}
                level={level + 1}
                selectedId={selectedId}
                onSelect={onSelect}
                expandedIds={expandedIds}
                onToggle={onToggle}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

export default function TeachersPageClient() {
  const toast = useToast();
  const editModal = useDisclosure();

  const [teachers] = useState<TeacherItem[]>(initialTeachers);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1', '1-1']));
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedUserType, setSelectedUserType] = useState('');

  const handleToggle = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const totalPages = Math.max(1, Math.ceil(teachers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  return (
    <Flex className="teachers-page" borderRadius="16px" bgColor="#fff" h="calc(100vh - 140px)">
      {/* 左侧组织架构树 */}
      <Box w="280px" borderRight="1px" borderColor="gray.100" p={4} overflowY="auto">
        <Flex align="center" mb={4}>
          <Box w={1} h={4} bg="#C83E3E" borderRadius="full" mr={2} />
          <Text fontSize="16px" fontWeight={600}>
            组织架构
          </Text>
        </Flex>
        <Box>
          {orgTreeData.map((node) => (
            <OrgTreeNode
              key={node.id}
              node={node}
              selectedId={selectedOrgId}
              onSelect={setSelectedOrgId}
              expandedIds={expandedIds}
              onToggle={handleToggle}
            />
          ))}
        </Box>
      </Box>

      {/* 右侧教师列表 */}
      <Box flex={1} p={5} overflow="auto">
        {/* 筛选栏 */}
        <Flex mb={5} align="center" justify="space-between" gap={3} wrap="wrap">
          <Flex gap={3} flex={1} wrap="wrap">
            {/* 状态筛选 */}
            <Select
              placeholder="全部状态"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              w="140px"
              h="40px"
              fontSize="14px"
              borderColor="gray.200"
              borderRadius="8px"
            >
              <option value="在职">在职</option>
              <option value="离职">离职</option>
              <option value="休假">休假</option>
            </Select>

            {/* 用户类型筛选 */}
            <Select
              placeholder="全部用户类型"
              value={selectedUserType}
              onChange={(e) => setSelectedUserType(e.target.value)}
              w="140px"
              h="40px"
              fontSize="14px"
              borderColor="gray.200"
              borderRadius="8px"
            >
              <option value="教师">教师</option>
              <option value="行政人员">行政人员</option>
            </Select>

            {/* 搜索框 */}
            <InputGroup w="260px">
              <Input
                placeholder="搜索教师编号或姓名"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                h="40px"
                fontSize="14px"
                borderColor="gray.200"
                borderRadius="8px"
                _focus={{ borderColor: '#2D2D2D', boxShadow: 'none' }}
              />
              <InputRightElement h="40px">
                <SearchIcon color="gray.400" boxSize={4} />
              </InputRightElement>
            </InputGroup>

            {/* 批量导入按钮 */}
            <Button
              h="40px"
              px={4}
              variant="outline"
              borderColor="gray.300"
              borderRadius="8px"
              fontSize="14px"
              fontWeight="500"
              color="gray.700"
            >
              批量导入
            </Button>
          </Flex>

          {/* 新增教师按钮 */}
          <Button
            leftIcon={<AddIcon />}
            h="40px"
            px={4}
            rounded="md"
            color="white"
            fontSize="14px"
            fontWeight="500"
            bg="#2D2D2D"
            _hover={{ bg: '#1F1F1F' }}
            onClick={() => editModal.onOpen()}
          >
            新增教师
          </Button>
        </Flex>

        {/* 表格 */}
        <Box overflowX="auto">
          <Table variant="simple" sx={{ tableLayout: 'fixed', minWidth: '900px' }}>
            <Thead bg="#FAFAFA">
              <Tr>
                <Th
                  h="44px"
                  px={4}
                  color="gray.600"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="100px"
                >
                  教师编号
                </Th>
                <Th
                  h="44px"
                  px={4}
                  color="gray.600"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="100px"
                >
                  姓名
                </Th>
                <Th
                  h="44px"
                  px={4}
                  color="gray.600"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="130px"
                >
                  手机号
                </Th>
                <Th
                  h="44px"
                  px={4}
                  color="gray.600"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="120px"
                >
                  组织架构
                </Th>
                <Th
                  h="44px"
                  px={4}
                  color="gray.600"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="100px"
                >
                  用户类型
                </Th>
                <Th
                  h="44px"
                  px={4}
                  color="gray.600"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="100px"
                >
                  角色
                </Th>
                <Th
                  h="44px"
                  px={4}
                  color="gray.600"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="90px"
                >
                  状态
                </Th>
                <Th
                  h="44px"
                  px={4}
                  color="gray.600"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  textAlign="center"
                  w="160px"
                >
                  操作
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {teachers.map((teacher) => {
                const statusStyle = getStatusColor(teacher.status);
                return (
                  <Tr key={teacher.id} _hover={{ bg: '#FCFCFC' }}>
                    <Td
                      px={4}
                      py={3.5}
                      borderColor="blackAlpha.50"
                      fontSize="14px"
                      color="gray.700"
                    >
                      <Flex align="center" gap={2}>
                        {teacher.teacherNo}
                        {teacher.teacherNo === 'ADMIN' && (
                          <Badge bg="#E0E7FF" color="#4338CA" fontSize="10px" px={1.5} py={0.5}>
                            系统
                          </Badge>
                        )}
                      </Flex>
                    </Td>
                    <Td
                      px={4}
                      py={3.5}
                      borderColor="blackAlpha.50"
                      fontSize="14px"
                      color="gray.700"
                    >
                      {teacher.name}
                    </Td>
                    <Td
                      px={4}
                      py={3.5}
                      borderColor="blackAlpha.50"
                      fontSize="14px"
                      color="gray.700"
                    >
                      {teacher.phone}
                    </Td>
                    <Td
                      px={4}
                      py={3.5}
                      borderColor="blackAlpha.50"
                      fontSize="14px"
                      color="gray.700"
                    >
                      {teacher.organization}
                    </Td>
                    <Td px={4} py={3.5} borderColor="blackAlpha.50" fontSize="14px">
                      <Badge
                        bg={teacher.userType === '教师' ? '#DCFCE7' : '#E0E7FF'}
                        color={teacher.userType === '教师' ? '#166534' : '#4338CA'}
                        fontSize="12px"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                      >
                        {teacher.userType}
                      </Badge>
                    </Td>
                    <Td px={4} py={3.5} borderColor="blackAlpha.50" fontSize="14px">
                      {teacher.role !== '-' && (
                        <Badge
                          bg={
                            teacher.role === '班主任'
                              ? '#FEF3C7'
                              : teacher.role === '教务管理员'
                                ? '#FCE7F3'
                                : '#F3F4F6'
                          }
                          color={
                            teacher.role === '班主任'
                              ? '#92400E'
                              : teacher.role === '教务管理员'
                                ? '#BE185D'
                                : '#6B7280'
                          }
                          fontSize="12px"
                          px={2}
                          py={0.5}
                          borderRadius="md"
                        >
                          {teacher.role}
                        </Badge>
                      )}
                      {teacher.role === '-' && <Text color="gray.400">-</Text>}
                    </Td>
                    <Td px={4} py={3.5} borderColor="blackAlpha.50" fontSize="14px">
                      <Badge
                        bg={statusStyle.bg}
                        color={statusStyle.color}
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        fontSize="12px"
                        fontWeight="500"
                      >
                        <Box
                          as="span"
                          display="inline-block"
                          w="6px"
                          h="6px"
                          bg={statusStyle.dotColor}
                          borderRadius="full"
                          mr={1}
                        />
                        {teacher.status}
                      </Badge>
                    </Td>
                    <Td px={4} py={3.5} borderColor="blackAlpha.50">
                      <Flex justify="center" gap={2}>
                        <Button
                          size="sm"
                          h="32px"
                          minW="60px"
                          px={3}
                          variant="outline"
                          rounded="md"
                          fontSize="14px"
                          fontWeight="500"
                          borderColor="blackAlpha.300"
                          bg="white"
                        >
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          h="32px"
                          minW="60px"
                          px={3}
                          variant="outline"
                          rounded="md"
                          fontSize="14px"
                          fontWeight="500"
                          color="#F04438"
                          borderColor="#F5B4AE"
                          bg="white"
                          _hover={{ bg: '#FFF5F5' }}
                        >
                          删除
                        </Button>
                      </Flex>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>

        {/* 分页 */}
        <Flex
          justify="space-between"
          align="center"
          mt={4}
          py={3}
          borderTopWidth="1px"
          borderColor="blackAlpha.100"
        >
          <Text color="gray.500" fontSize="12px">
            共 {teachers.length} 条记录
          </Text>
          <Flex align="center" gap={2}>
            <IconButton
              aria-label="上一页"
              icon={<ChevronLeftIcon boxSize={4.5} />}
              variant="outline"
              size="sm"
              rounded="md"
              borderColor="blackAlpha.200"
              isDisabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            />
            <Text minW="120px" textAlign="center" fontSize="12px" color="gray.600">
              第 {safeCurrentPage} 页 / 共 {totalPages} 页
            </Text>
            <IconButton
              aria-label="下一页"
              icon={<ChevronRightIcon boxSize={4.5} />}
              variant="outline"
              size="sm"
              rounded="md"
              borderColor="blackAlpha.200"
              isDisabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            />
          </Flex>
        </Flex>
      </Box>
    </Flex>
  );
}
