'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Stack,
  Divider,
  Checkbox,
  Spinner,
  Tag,
  TagLabel,
  TagCloseButton
} from '@chakra-ui/react';
import {
  AddIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  ChevronRightIcon as ChevronRight,
  ChevronDownIcon,
  DeleteIcon,
  DownloadIcon,
  AttachmentIcon
} from '@chakra-ui/icons';
import type {
  TeacherItem as ApiTeacherItem,
  TeacherCreateRequest,
  TeacherPageRequest,
  TeacherUpdateRequest,
  TeacherDetailData
} from '@/types/api/admin/teaching/teachers';
import type { RoleVO } from '@/types/api/admin/teaching/roles';
import type { DeptItem } from '@/types/api/admin/teaching/depts';
import {
  postTeacherPageList,
  postTeacherDetail,
  postTeacherCreate,
  postTeacherUpdate,
  postTeacherDelete,
  getTeacherDownloadTemplate,
  postTeacherImport
} from '@/api/admin/teaching/teachers';
import { postRoleList } from '@/api/admin/teaching/roles';
import { postDeptList } from '@/api/admin/teaching/depts';
import { useAdminPageI18n } from '@/app/admin/components/AdminI18nProvider';

type TeacherStatus = string;

// 组织架构树使用 DeptItem 类型

const pageSize = 10;

// API 值映射函数 - 使用翻译键，实际渲染时通过 t() 翻译
const getGenderMap = (t: (key: string) => string): Record<number, string> => ({
  1: t('teaching.teachers.form.male'),
  2: t('teaching.teachers.form.female')
});
const getStatusMap = (t: (key: string) => string): Record<number, string> => ({
  1: t('teaching.teachers.status.active'),
  2: t('teaching.teachers.status.inactive')
});
const getAccountStatusMap = (t: (key: string) => string): Record<number, string> => ({
  1: t('teaching.teachers.accountStatus.active'),
  0: t('teaching.teachers.accountStatus.inactive')
});
const getTypeMap = (t: (key: string) => string): Record<number, string> => ({
  1: t('teaching.teachers.form.teacher'),
  2: t('teaching.teachers.form.staff')
});
const getTitleMap = (t: (key: string) => string): Record<number, string> => ({
  1: t('teaching.teachers.titles.assistantLecturer'),
  2: t('teaching.teachers.titles.seniorLecturer'),
  3: t('teaching.teachers.titles.assistant'),
  4: t('teaching.teachers.titles.lecturer'),
  5: t('teaching.teachers.titles.associateProfessor'),
  6: t('teaching.teachers.titles.professor')
});

// 组织架构树使用 deptList 数据

// 在部门树里递归查找节点
const findDeptNode = (nodes: DeptItem[], id: string): DeptItem | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findDeptNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const getStatusColor = (status: number) => {
  switch (status) {
    case 1: // 在职
      return { bg: '#DCFCE7', color: '#166534', dotColor: '#22C55E' };
    case 2: // 离职
      return { bg: '#F3F4F6', color: '#6B7280', dotColor: '#9CA3AF' };
    default:
      return { bg: '#F3F4F6', color: '#6B7280', dotColor: '#9CA3AF' };
  }
};

// 角色颜色映射
const roleColorMap: Record<string, { bg: string; color: string }> = {
  租户管理员: { bg: '#FCE7F3', color: '#BE185D' },
  教务管理员: { bg: '#F3E8FF', color: '#7C3AED' },
  班主任: { bg: '#FEF3C7', color: '#B45309' },
  辅导员: { bg: '#DCFCE7', color: '#166534' },
  教师: { bg: '#E0E7FF', color: '#4F46E5' }
};

const getRoleColor = (role: string) => roleColorMap[role] || { bg: '#F3F4F6', color: '#6B7280' };

// 反向映射（用于筛选和表单提交）- 使用翻译值作为键
const getGenderMapReverse = (t: (key: string) => string): Record<string, number> => ({
  [t('teaching.teachers.form.male')]: 1,
  [t('teaching.teachers.form.female')]: 2
});
const getStatusMapReverse = (t: (key: string) => string): Record<string, number> => ({
  [t('teaching.teachers.status.active')]: 1,
  [t('teaching.teachers.status.inactive')]: 2
});
const getTypeMapReverse = (t: (key: string) => string): Record<string, number> => ({
  [t('teaching.teachers.form.teacher')]: 1,
  [t('teaching.teachers.form.staff')]: 2
});
const getTitleMapReverse = (t: (key: string) => string): Record<string, number> => ({
  [t('teaching.teachers.titles.assistantLecturer')]: 1,
  [t('teaching.teachers.titles.seniorLecturer')]: 2,
  [t('teaching.teachers.titles.assistant')]: 3,
  [t('teaching.teachers.titles.lecturer')]: 4,
  [t('teaching.teachers.titles.associateProfessor')]: 5,
  [t('teaching.teachers.titles.professor')]: 6
});

// 组织架构树节点组件
function OrgTreeNode({
  node,
  level = 0,
  selectedId,
  onSelect,
  expandedIds,
  onToggle
}: {
  node: DeptItem;
  level?: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  // 学校图标 - 建筑样式
  const SchoolIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1L1 5V15H6V11H10V15H15V5L8 1Z"
        stroke={isSelected ? '#C83E3E' : '#666'}
        strokeWidth="1.2"
        fill="none"
      />
      <path d="M5 6H7V8H5V6ZM9 6H11V8H9V6Z" fill={isSelected ? '#C83E3E' : '#666'} />
    </svg>
  );

  // 院系图标 - 立方体样式
  const DepartmentIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z"
        stroke={isSelected ? '#C83E3E' : '#666'}
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M1 4.5L7 8L13 4.5M7 8V13"
        stroke={isSelected ? '#C83E3E' : '#666'}
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );

  const getIcon = () => {
    // 根据层级判断图标：parentId === '0' 为根节点
    if (node.parentId === '0') {
      return <SchoolIcon />;
    }
    // 有子部门的是部门，否则是办公室
    if (node.children && node.children.length > 0) {
      return <DepartmentIcon />;
    }
    return null;
  };

  return (
    <Box>
      <Flex
        align="center"
        py={1.5}
        px={2}
        cursor="pointer"
        // bg={isSelected ? '#FEF2F2' : 'transparent'}
        color={isSelected ? '#C83E3E' : 'gray.700'}
        borderRadius="md"
        ml={level * 3}
        onClick={() => {
          onSelect(node.id);
        }}
        _hover={{ bg: isSelected ? '#FEF2F2' : 'gray.50' }}
      >
        {/* 展开/折叠箭头 */}
        {hasChildren ? (
          <Box
            mr={1.5}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
          >
            {isExpanded ? (
              <ChevronDownIcon boxSize={5} color="gray.400" />
            ) : (
              <ChevronRight boxSize={5} color="gray.400" />
            )}
          </Box>
        ) : (
          <Box w="20px" mr={1.5} />
        )}
        {/* 图标 */}
        {getIcon() && (
          <Box mr={2} display="flex" alignItems="center">
            {getIcon()}
          </Box>
        )}
        {/* 叶子节点对齐 */}
        {(!node.children || node.children.length === 0) && <Box w="14px" mr={2} />}
        <Text fontSize="14px" fontWeight={isSelected ? 500 : 400}>
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

// 弹窗表单类型
// 表单数据类型 - 使用与 API 一致的字段名
type TeacherFormData = {
  id?: number;
  code: string; // 教师编号 (对应 API 的 code)
  name: string;
  gender: string; // 显示值: '男'/'女'
  phone: string;
  deptIds: number[]; // 部门ID集合 (对应 API 的 deptIds)
  type: string; // 显示值: '教师'/'行政人员'
  professionalTitle: string; // 显示值: 职称名称
  status: TeacherStatus; // 显示值: '在职'/'离职'
  email: string;
  roleIds: number[]; // 角色ID集合 (对应 API 的 roleIds)
  loginAccount?: string; // 登录账号（只读展示）
  accountStatus?: number; // 账号状态（只读展示）
};

// 部门树形多选框组件
function DeptTreeSelect({
  deptList,
  selectedIds,
  onChange,
  placeholder
}: {
  deptList: DeptItem[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  placeholder: string;
}) {
  const isI18nReady = useAdminPageI18n(['teaching']);
  const { t } = useTranslation('admin');
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchKeyword, setSearchKeyword] = useState('');

  const collectParentIds = useCallback((items: DeptItem[], ids: string[] = []) => {
    items.forEach((item) => {
      if (item.children && item.children.length > 0) {
        ids.push(item.id);
        collectParentIds(item.children, ids);
      }
    });
    return ids;
  }, []);

  const filterDeptTree = useCallback((items: DeptItem[], keyword: string): DeptItem[] => {
    if (!keyword.trim()) return items;
    const lower = keyword.toLowerCase();
    return items
      .map((item) => {
        const children = item.children ? filterDeptTree(item.children, keyword) : [];
        const matchSelf = item.name.toLowerCase().includes(lower);
        if (matchSelf) {
          return { ...item, children: item.children || [] };
        } else if (children.length > 0) {
          return { ...item, children };
        }
        return null;
      })
      .filter(Boolean) as DeptItem[];
  }, []);

  useEffect(() => {
    const items = searchKeyword.trim()
      ? filterDeptTree(deptList || [], searchKeyword)
      : deptList || [];
    const ids = collectParentIds(items, []);
    setExpandedIds(new Set(ids));
  }, [deptList, searchKeyword, collectParentIds, filterDeptTree]);

  const renderDeptTree = (items: DeptItem[], level = 0) => {
    return items.map((item) => {
      const isExpanded = expandedIds.has(item.id);
      const hasChildren = item.children && item.children.length > 0;
      const deptId = parseInt(item.id) || 0;
      const isChecked = selectedIds.includes(deptId);
      return (
        <Box key={item.id}>
          <Flex align="center" py={1.5} px={2} ml={level * 4}>
            {hasChildren ? (
              <Box
                mr={1}
                cursor="pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  const newExpanded = new Set(expandedIds);
                  if (isExpanded) newExpanded.delete(item.id);
                  else newExpanded.add(item.id);
                  setExpandedIds(newExpanded);
                }}
              >
                {isExpanded ? (
                  <ChevronDownIcon boxSize={5} color="gray.400" />
                ) : (
                  <ChevronRight boxSize={5} color="gray.400" />
                )}
              </Box>
            ) : (
              <Box w="24px" mr={1} />
            )}
            <Checkbox
              isChecked={isChecked}
              onChange={(e) => {
                const newSelected = e.target.checked
                  ? [...selectedIds, deptId]
                  : selectedIds.filter((id) => id !== deptId);
                onChange(newSelected);
              }}
              colorScheme="red"
              size="sm"
            >
              <Text fontSize="14px" ml={1}>
                {item.name}
              </Text>
            </Checkbox>
          </Flex>
          {hasChildren && isExpanded && <Box>{renderDeptTree(item.children!, level + 1)}</Box>}
        </Box>
      );
    });
  };

  const getSelectedNames = () => {
    const names: string[] = [];
    const findNames = (items: DeptItem[]) => {
      items.forEach((item) => {
        const deptId = parseInt(item.id) || 0;
        if (selectedIds.includes(deptId)) names.push(item.name);
        if (item.children) findNames(item.children);
      });
    };
    findNames(deptList || []);
    return names.join(', ') || placeholder;
  };
  if (!isI18nReady) return null;

  const filteredDeptList = searchKeyword.trim()
    ? filterDeptTree(deptList || [], searchKeyword)
    : deptList || [];

  return (
    <Box position="relative">
      <Box
        border="1px"
        borderColor="gray.200"
        borderRadius="8px"
        p={2}
        h="40px"
        cursor="pointer"
        onClick={() => setIsOpen(!isOpen)}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bg="white"
        _hover={{ borderColor: 'gray.300' }}
      >
        <Text
          fontSize="14px"
          color={selectedIds.length > 0 ? 'gray.700' : 'gray.400'}
          isTruncated
          maxW="90%"
        >
          {getSelectedNames()}
        </Text>
        <ChevronDownIcon
          boxSize={5}
          color="gray.400"
          transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
          transition="transform 0.2s"
        />
      </Box>
      {isOpen && (
        <>
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            zIndex={10}
            onClick={() => {
              setIsOpen(false);
              setSearchKeyword('');
            }}
          />
          <Box
            position="absolute"
            top="calc(100% + 4px)"
            left={0}
            right={0}
            maxH="300px"
            overflowY="auto"
            bg="white"
            border="1px"
            borderColor="gray.200"
            borderRadius="8px"
            zIndex={20}
            boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          >
            <Box px={2} pt={2} pb={1}>
              <InputGroup>
                <Input
                  placeholder="搜索组织名称"
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
            </Box>
            {filteredDeptList && filteredDeptList.length > 0 ? (
              renderDeptTree(filteredDeptList)
            ) : (
              <Text p={3} fontSize="14px" color="gray.400" textAlign="center">
                {t('teaching.teachers.import.emptyDept')}
              </Text>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}
export default function TeachersPageClient() {
  const isI18nReady = useAdminPageI18n(['teaching']);
  const { t } = useTranslation('admin');
  const initialFormData: TeacherFormData = {
    code: '',
    name: '',
    gender: '',
    phone: '',
    deptIds: [],
    type: t('teaching.teachers.form.teacher'),
    professionalTitle: '',
    status: t('teaching.teachers.status.active') as TeacherStatus,
    email: '',
    roleIds: [],
    loginAccount: '',
    accountStatus: undefined
  };
  const toast = useToast();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const importModal = useDisclosure();
  const detailModal = useDisclosure();

  const [teachers, setTeachers] = useState<ApiTeacherItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([]));
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedUserType, setSelectedUserType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [onlyAdmin, setOnlyAdmin] = useState(false);
  const [roleList, setRoleList] = useState<RoleVO[]>([]);
  const [deptList, setDeptList] = useState<DeptItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // 批量导入相关状态
  const [importing, setImporting] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);
  const [importUploadPercent, setImportUploadPercent] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 表单状态
  const [formData, setFormData] = useState<TeacherFormData>(initialFormData);
  const [editingTeacher, setEditingTeacher] = useState<ApiTeacherItem | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<ApiTeacherItem | null>(null);
  const [detailData, setDetailData] = useState<TeacherDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  // 表单错误状态
  const [errors, setErrors] = useState<{
    name?: string;
    gender?: string;
    phone?: string;
    deptIds?: string;
    status?: string;
  }>({});

  // 清除单个字段错误
  const clearError = (field: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // 关闭编辑弹窗时清除错误
  const handleCloseEditModal = () => {
    setErrors({});
    setEditLoading(false);
    editModal.onClose();
  };

  const handleToggle = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // 从 API 获取教师列表
  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      // 构建请求参数
      const params: TeacherPageRequest = {
        current: currentPage,
        size: pageSize
      };

      // 搜索关键字
      if (searchKeyword) {
        params.searchKey = searchKeyword;
      }

      // 用户类型筛选
      if (selectedUserType) {
        params.type = getTypeMapReverse(t)[selectedUserType];
      }

      // 状态筛选
      if (selectedStatus) {
        params.status = getStatusMapReverse(t)[selectedStatus];
      }

      // 部门筛选
      if (selectedOrgId) {
        params.deptId = parseInt(selectedOrgId) || undefined;
      }

      // 仅看管理员
      if (onlyAdmin) {
        params.isAdmin = 1;
      }

      const res = await postTeacherPageList(params);
      // console.log(res, 'res');

      // 直接使用 API 返回的数据
      setTeachers(res.records);
      setTotalPages(res.pages || 1);
      setTotal(res.total || 0);
    } catch (error) {
      // console.error('获取教师列表失败:', error);
      toast({
        title: t('teaching.teachers.messages.loadListError'),
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    searchKeyword,
    selectedUserType,
    selectedStatus,
    selectedOrgId,
    onlyAdmin,
    toast
  ]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // 与 AdminLayout header 中的"仅看管理员"按钮通过 CustomEvent 双向同步
  useEffect(() => {
    const handleToggleOnlyAdmin = (event: Event) => {
      const detail = (event as CustomEvent<{ value: boolean }>).detail;
      const nextValue = Boolean(detail?.value);
      setOnlyAdmin(nextValue);
      setCurrentPage(1);
    };

    window.addEventListener('admin-teachers:toggle-only-admin', handleToggleOnlyAdmin);
    // mount 时主动同步一次初始状态，避免 header 先挂载导致高亮态错位
    window.dispatchEvent(
      new CustomEvent('admin-teachers:only-admin-state', { detail: { value: false } })
    );

    return () => {
      window.removeEventListener('admin-teachers:toggle-only-admin', handleToggleOnlyAdmin);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('admin-teachers:only-admin-state', { detail: { value: onlyAdmin } })
    );
  }, [onlyAdmin]);

  // 获取角色列表
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await postRoleList({});
        if (res && Array.isArray(res)) {
          setRoleList(res);
        }
      } catch (error) {
        console.error(t('teaching.teachers.messages.loadRolesError'), error);
      }
    };
    fetchRoles();
  }, []);

  // 获取部门列表
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await postDeptList({});
        setDeptList(res);

        // 展开所有有子部门的节点
        const collectIds = (items: DeptItem[], ids: string[] = []) => {
          items.forEach((item) => {
            if (item.children && item.children.length > 0) {
              ids.push(item.id);
              collectIds(item.children, ids);
            }
          });
          return ids;
        };
        const allIds = collectIds(res || []);
        setExpandedIds(new Set(allIds));
      } catch (error) {
        console.error(t('teaching.teachers.messages.loadDeptsError'), error);
      }
    };
    fetchDepts();
  }, []);

  const safeCurrentPage = currentPage;

  // API 已分页，直接使用 teachers
  const pageTeachers = teachers;

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingTeacher(null);
    setFormData(initialFormData);
    setErrors({});
    editModal.onOpen();
  };

  // 打开详情弹窗
  const handleView = async (teacher: ApiTeacherItem) => {
    setDetailData(null);
    setDetailLoading(true);
    detailModal.onOpen();
    try {
      const res = await postTeacherDetail({ id: Number(teacher.id) });
      if (res) {
        setDetailData(res as TeacherDetailData);
      } else {
        toast({
          title: t('teaching.teachers.messages.loadDetailError'),
          status: 'error',
          duration: 2500,
          isClosable: true
        });
        detailModal.onClose();
      }
    } catch {
      toast({
        title: t('teaching.teachers.messages.loadDetailError'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
      detailModal.onClose();
    } finally {
      setDetailLoading(false);
    }
  };

  // 打开编辑弹窗
  const handleEdit = async (teacher: ApiTeacherItem) => {
    setEditingTeacher(teacher);
    // 先用列表项数据预填，避免弹框首次渲染空白
    setFormData({
      id: parseInt(teacher.id) || 0,
      code: teacher.code,
      name: teacher.name,
      gender: getGenderMap(t)[teacher.gender] || '',
      phone: teacher.phone,
      deptIds: teacher.deptIds || [],
      type: getTypeMap(t)[teacher.type] || t('teaching.teachers.form.teacher'),
      professionalTitle: getTitleMap(t)[teacher.professionalTitle] || '',
      status: getStatusMap(t)[teacher.status] as TeacherStatus,
      email: teacher.email || '',
      roleIds: teacher.roleIds || [],
      loginAccount: teacher.loginAccount || teacher.phone || '',
      accountStatus: teacher.accountStatus
    });
    setErrors({});
    setEditLoading(true);
    editModal.onOpen();
    try {
      const res = await postTeacherDetail({ id: Number(teacher.id) });
      if (res) {
        const detail = res as TeacherDetailData;
        // 仅合并账号相关字段，避免覆盖用户已输入的其他字段
        setFormData((prev) => ({
          ...prev,
          loginAccount: detail.loginAccount || detail.phone || '',
          accountStatus: detail.accountStatus
        }));
      }
    } catch {
      toast({
        title: t('teaching.teachers.messages.loadDetailError'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setEditLoading(false);
    }
  };

  // 保存教师
  const handleSave = async () => {
    const newErrors: typeof errors = {};
    if (!formData.name.trim()) {
      newErrors.name = t('teaching.teachers.messages.nameRequired');
    }
    if (!formData.gender) {
      newErrors.gender = t('teaching.teachers.messages.genderRequired');
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t('teaching.teachers.messages.phoneRequired');
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = t('teaching.teachers.messages.phoneInvalid');
    }
    if (formData.deptIds.length === 0) {
      newErrors.deptIds = t('teaching.teachers.messages.deptRequired');
    }
    if (!formData.status) {
      newErrors.status = t('teaching.teachers.messages.statusRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 转换表单数据为API格式（使用组件级别的反向映射）

    if (editingTeacher) {
      // 编辑模式 - 使用 TeacherUpdateRequest 类型
      const updateData: TeacherUpdateRequest = {
        id: String(editingTeacher.id),
        code: formData.code,
        name: formData.name,
        gender: getGenderMapReverse(t)[formData.gender] || 1,
        phone: formData.phone,
        email: formData.email,
        deptIds: formData.deptIds,
        type: getTypeMapReverse(t)[formData.type] || 1,
        professionalTitle: getTitleMapReverse(t)[formData.professionalTitle] || 1,
        status: getStatusMapReverse(t)[formData.status] || 1,
        roleIds: formData.roleIds
      };

      try {
        await postTeacherUpdate(updateData);
        toast({
          title: t('teaching.teachers.messages.updatedTitle'),
          status: 'success',
          duration: 2500,
          isClosable: true
        });
        // 刷新列表
        fetchTeachers();
        editModal.onClose();
      } catch (error: any) {
        toast({
          title: t('teaching.teachers.messages.operationError'),
          description: error.msg,
          status: 'error',
          duration: 2500,
          isClosable: true
        });
      }
    } else {
      // 新增模式 - 使用 TeacherCreateRequest 类型
      const createData: TeacherCreateRequest = {
        code: formData.code,
        name: formData.name,
        gender: getGenderMapReverse(t)[formData.gender] || 1,
        phone: formData.phone,
        email: formData.email,
        deptIds: formData.deptIds,
        type: getTypeMapReverse(t)[formData.type] || 1,
        professionalTitle: getTitleMapReverse(t)[formData.professionalTitle] || undefined,
        status: getStatusMapReverse(t)[formData.status] || 1,
        roleIds: formData.roleIds
      };

      try {
        await postTeacherCreate(createData);
        toast({
          title: t('teaching.teachers.messages.createdTitle'),
          status: 'success',
          duration: 2500,
          isClosable: true
        });
        // 刷新列表
        fetchTeachers();
        editModal.onClose();
      } catch (error: any) {
        toast({
          title: t('teaching.teachers.messages.operationError'),
          description: error.msg,
          status: 'error',
          duration: 2500,
          isClosable: true
        });
      }
    }
  };

  // 打开删除确认弹窗
  const handleDeleteClick = (teacher: ApiTeacherItem) => {
    setDeletingTeacher(teacher);
    deleteModal.onOpen();
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (deletingTeacher) {
      try {
        await postTeacherDelete({ id: parseInt(deletingTeacher.id) });
        toast({
          title: t('teaching.teachers.messages.deletedTitle'),
          status: 'success',
          duration: 2500,
          isClosable: true
        });
        // 刷新列表
        fetchTeachers();
      } catch (error) {
        toast({
          title: t('teaching.teachers.messages.deleteError'),
          status: 'error',
          duration: 2500,
          isClosable: true
        });
      }
    }
    deleteModal.onClose();
    setDeletingTeacher(null);
  };

  // 导入相关函数
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // 验证文件类型
  const validateImportFile = (file: File): boolean => {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      return true;
    } else {
      toast({
        title: t('teaching.teachers.messages.importFormatError'),
        description: t('teaching.teachers.messages.importFormatDesc'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
      return false;
    }
  };

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateImportFile(file)) {
      setSelectedImportFile(file);
      setImporting(false);
      setImportUploadPercent(0);
      // 不清除错误信息，让用户能看到之前的错误
    }
  };

  // 删除已选文件
  const handleDeleteImportFile = () => {
    if (importing) return;
    setSelectedImportFile(null);
    setImportErrorMsg(null);
    setImportUploadPercent(0);
    setImporting(false);

    // 清空 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 关闭导入弹窗时重置状态
  const handleCloseImportModal = () => {
    setSelectedImportFile(null);
    setImportErrorMsg(null);
    setImportUploadPercent(0);
    setImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    importModal.onClose();
  };

  // 确认导入
  const handleConfirmImport = async () => {
    if (!selectedImportFile) {
      toast({
        title: t('teaching.teachers.messages.selectFileFirst'),
        status: 'warning',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    setImporting(true);
    setImportUploadPercent(0);
    try {
      const res = await postTeacherImport(selectedImportFile);

      // 检查是否有错误信息
      // 检查是否有错误信息
      const errMsgs = res?.errMsgs;
      // console.log(errMsgs, 'errMsgs', res, 'res');

      const hasErrors = errMsgs && errMsgs.length > 0;

      if (!hasErrors) {
        setImportUploadPercent(100);
        toast({
          title: res?.msg || t('teaching.teachers.messages.importSuccess'),
          status: 'info',
          duration: 3000,
          isClosable: true
        });
        setSelectedImportFile(null);
        setImporting(false);
        // 不关闭弹窗，用户可以连续导入
        fetchTeachers();
      } else if (hasErrors) {
        const errorMessages = errMsgs?.join('\n');
        setImportErrorMsg(errorMessages);
        setImporting(false);
        // 不关闭弹窗，错误信息显示在弹窗内
      }
    } catch (error: any) {
      const errMsg = error?.msg;
      setImportErrorMsg(errMsg);
      setImporting(false);
      setImportUploadPercent(0);
      toast({
        title: t('teaching.teachers.messages.operationError'),
        description: errMsg,
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    }
  };

  // 下载模板
  const handleDownloadTemplate = async () => {
    try {
      const blob = await getTeacherDownloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = t('teaching.teachers.import.templateFilename');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: t('teaching.teachers.messages.downloadTemplateSuccess'),
        status: 'success',
        duration: 2500,
        isClosable: true
      });
    } catch (error: any) {
      toast({
        title: t('teaching.teachers.messages.downloadTemplateError'),
        description: error.msg,
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    }
  };
  if (!isI18nReady) return null;
  const selectedDeptNode = selectedOrgId ? findDeptNode(deptList, selectedOrgId) : null;
  return (
    <Flex
      className="teachers-page"
      borderRadius="16px"
      // bgColor="#fff"
      minH="calc(100vh - 200px)"
      gap="16px"
    >
      {/* 左侧组织架构树 */}
      <Box w="260px" p={4} overflowY="auto" borderRadius="16px" bg="white">
        <Flex align="center" justify="space-between" mb={4}>
          <Flex align="center">
            <Box w={1} h={4} bg="#C83E3E" borderRadius="full" mr={2} />
            <Text fontSize="16px" fontWeight={600}>
              {t('teaching.teachers.form.dept')}
            </Text>
          </Flex>
          {selectedOrgId && (
            <Text
              fontSize="14px"
              color="#C83E3E"
              cursor="pointer"
              _hover={{ opacity: 0.8 }}
              onClick={() => setSelectedOrgId(null)}
            >
              {t('teaching.teachers.filters.clearFilter')}
            </Text>
          )}
        </Flex>
        <Box>
          {deptList.map((node) => (
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
      <Box flex={1} p={5} overflow="auto" bgColor="#fff" borderRadius={'16px'}>
        <Box overflow="hidden">
          {/* 筛选栏 */}
          <Flex py={4} align="center" justify="space-between" gap={3} wrap="wrap">
            <Flex gap={3} flex={1} wrap="wrap">
              {/* 已选组织筛选标签 */}
              {selectedDeptNode && (
                <Tag
                  h="40px"
                  px={3}
                  bg="#FEF2F2"
                  color="#C83E3E"
                  border="1px solid"
                  borderColor="#FECACA"
                  borderRadius="8px"
                  fontSize="14px"
                  fontWeight={500}
                >
                  <TagLabel>{selectedDeptNode.name}</TagLabel>
                  <TagCloseButton
                    color="#C83E3E"
                    opacity={0.7}
                    _hover={{ opacity: 1, bg: 'transparent' }}
                    onClick={() => setSelectedOrgId(null)}
                  />
                </Tag>
              )}

              {/* 用户类型筛选 */}
              <Select
                placeholder={t('teaching.teachers.filters.allUserTypes')}
                value={selectedUserType}
                onChange={(e) => setSelectedUserType(e.target.value)}
                w="140px"
                h="40px"
                fontSize="14px"
                borderColor="gray.200"
                borderRadius="8px"
              >
                <option value={t('teaching.teachers.form.teacher')}>
                  {t('teaching.teachers.form.teacher')}
                </option>
                <option value={t('teaching.teachers.form.staff')}>
                  {t('teaching.teachers.form.staff')}
                </option>
              </Select>

              {/* 状态筛选 */}
              <Select
                placeholder={t('teaching.teachers.filters.allStatuses')}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                w="140px"
                h="40px"
                fontSize="14px"
                borderColor="gray.200"
                borderRadius="8px"
              >
                <option value={t('teaching.teachers.status.active')}>
                  {t('teaching.teachers.status.active')}
                </option>
                <option value={t('teaching.teachers.status.inactive')}>
                  {t('teaching.teachers.status.inactive')}
                </option>
              </Select>

              {/* 搜索框 */}
              <InputGroup w="240px">
                <Input
                  placeholder={t('teaching.teachers.filters.searchPlaceholder')}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchTeachers()}
                  h="40px"
                  fontSize="14px"
                  borderColor="gray.200"
                  borderRadius="8px"
                  _focus={{ borderColor: '#2D2D2D', boxShadow: 'none' }}
                />
                <InputRightElement h="40px" cursor="pointer" onClick={fetchTeachers}>
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
                onClick={importModal.onOpen}
              >
                {t('teaching.teachers.actions.batchImport')}
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
              onClick={handleAdd}
            >
              {t('teaching.teachers.actions.create')}
            </Button>
          </Flex>

          {/* 表格 */}
          <Box overflowX="auto">
            <Table variant="simple" sx={{ tableLayout: 'fixed', minWidth: '1100px' }}>
              <Thead bg="#FAFAFA">
                <Tr>
                  <Th
                    h="44px"
                    px={4}
                    color="gray.600"
                    fontSize="14px"
                    fontWeight="600"
                    textTransform="none"
                    // w="120px"
                  >
                    {t('teaching.teachers.table.code')}
                  </Th>
                  <Th
                    h="44px"
                    px={4}
                    color="gray.600"
                    fontSize="14px"
                    fontWeight="600"
                    textTransform="none"
                    // w="100px"
                  >
                    {t('teaching.teachers.table.name')}
                  </Th>
                  <Th
                    h="44px"
                    px={4}
                    color="gray.600"
                    fontSize="14px"
                    fontWeight="600"
                    textTransform="none"
                    // w="130px"
                  >
                    {t('teaching.teachers.table.phone')}
                  </Th>
                  <Th
                    h="44px"
                    px={4}
                    color="gray.600"
                    fontSize="14px"
                    fontWeight="600"
                    textTransform="none"
                    // w="120px"
                  >
                    {t('teaching.teachers.table.dept')}
                  </Th>
                  <Th
                    h="44px"
                    px={4}
                    color="gray.600"
                    fontSize="14px"
                    fontWeight="600"
                    textTransform="none"
                    // w="100px"
                  >
                    {t('teaching.teachers.table.type')}
                  </Th>
                  <Th
                    h="44px"
                    px={4}
                    color="gray.600"
                    fontSize="14px"
                    fontWeight="600"
                    textTransform="none"
                    // w="120px"
                  >
                    {t('teaching.teachers.table.roles')}
                  </Th>
                  <Th
                    h="44px"
                    px={4}
                    color="gray.600"
                    fontSize="14px"
                    fontWeight="600"
                    textTransform="none"
                    // w="90px"
                  >
                    {t('teaching.teachers.table.status')}
                  </Th>
                  <Th
                    h="44px"
                    px={4}
                    color="gray.600"
                    fontSize="14px"
                    fontWeight="600"
                    textTransform="none"
                    textAlign="center"
                    w="240px"
                  >
                    {t('teaching.teachers.table.actions')}
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {isLoading ? (
                  <Tr>
                    <Td colSpan={8} py={20} borderColor="blackAlpha.50">
                      <Flex justify="center" align="center" direction="column" gap={4}>
                        <Spinner size="xl" color="#C83E3E" thickness="4px" />
                        <Text color="gray.500" fontSize="14px">
                          {t('teaching.teachers.loading')}
                        </Text>
                      </Flex>
                    </Td>
                  </Tr>
                ) : pageTeachers.length > 0 ? (
                  pageTeachers.map((teacher) => {
                    const statusStyle = getStatusColor(teacher.status);
                    return (
                      <Tr
                        key={teacher.id}
                        _hover={{ bg: '#FCFCFC' }}
                        borderBottom="1px solid #E5E6EB"
                      >
                        <Td
                          px={4}
                          py={3.5}
                          borderColor="blackAlpha.50"
                          fontSize="14px"
                          color="gray.700"
                        >
                          {teacher.code}
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
                          {teacher.deptNames?.join(', ') || teacher.deptIds?.join(', ') || '-'}
                        </Td>
                        <Td px={4} py={3.5} borderColor="blackAlpha.50" fontSize="14px">
                          <Badge
                            bg={teacher.type === 1 ? '#E0E7FF' : '#DBEAFE'}
                            color={teacher.type === 1 ? '#4F46E5' : '#2563EB'}
                            fontSize="14px"
                            px={2}
                            py={0.5}
                            borderRadius="md"
                          >
                            {getTypeMap(t)[teacher.type] || '-'}
                          </Badge>
                        </Td>
                        <Td px={4} py={3.5} borderColor="blackAlpha.50" fontSize="14px">
                          <Flex gap={1} flexWrap="wrap">
                            {(teacher.roleNames || []).map((role, idx) => {
                              const roleStyle = getRoleColor(role);
                              return (
                                <Badge
                                  key={idx}
                                  bg={roleStyle.bg}
                                  color={roleStyle.color}
                                  fontSize="11px"
                                  px={2}
                                  py={0.5}
                                  borderRadius="md"
                                >
                                  {role}
                                </Badge>
                              );
                            })}
                          </Flex>
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
                            {getStatusMap(t)[teacher.status] || '-'}
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
                              onClick={() => handleView(teacher)}
                            >
                              {t('teaching.teachers.actions.view')}
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
                              borderColor="blackAlpha.300"
                              bg="white"
                              onClick={() => handleEdit(teacher)}
                            >
                              {t('teaching.teachers.actions.edit')}
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
                              onClick={() => handleDeleteClick(teacher)}
                            >
                              {t('teaching.teachers.actions.delete')}
                            </Button>
                          </Flex>
                        </Td>
                      </Tr>
                    );
                  })
                ) : (
                  <Tr>
                    <Td colSpan={8} py={16} borderColor="blackAlpha.50">
                      <Flex direction="column" align="center" gap={2} color="gray.500">
                        <Text fontSize="14px" fontWeight={600}>
                          {t('teaching.teachers.empty.title')}
                        </Text>
                        <Text fontSize="12px">{t('teaching.teachers.empty.description')}</Text>
                      </Flex>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>

          {/* 分页 */}
          <Flex
            justify="space-between"
            align="center"
            px={{ base: 4, md: 5 }}
            py={3.5}
            borderTopWidth="1px"
            borderColor="blackAlpha.100"
            bg="white"
            gap={3}
            wrap="wrap"
          >
            <Text color="gray.500" fontSize="14px">
              {t('teaching.teachers.pagination.total', { total })}
            </Text>
            <Flex align="center" gap={2}>
              <IconButton
                aria-label={t('teaching.teachers.pagination.prev')}
                icon={<ChevronLeftIcon boxSize={6} />}
                variant="outline"
                size="sm"
                rounded="md"
                borderColor="blackAlpha.200"
                isDisabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              />
              <Text minW="120px" textAlign="center" fontSize="12px" color="gray.600">
                {t('teaching.teachers.pagination.pageInfo', { page: safeCurrentPage, totalPages })}
              </Text>
              <IconButton
                aria-label={t('teaching.teachers.pagination.next')}
                icon={<ChevronRightIcon boxSize={6} />}
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
      </Box>

      {/* 新增/编辑弹窗 */}
      <Modal isOpen={editModal.isOpen} onClose={handleCloseEditModal} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="16px" maxW="560px">
          <ModalHeader
            fontSize="18px"
            fontWeight="600"
            borderBottom="1px"
            borderColor="gray.100"
            py={4}
          >
            {editingTeacher
              ? t('teaching.teachers.modal.editTitle')
              : t('teaching.teachers.modal.createTitle')}
          </ModalHeader>
          <ModalCloseButton top={4} right={4} />
          <ModalBody maxH={'600px'} overflowY="auto">
            <Stack spacing={5}>
              {/* 第一行：教师编号 + 姓名 */}
              <Flex gap={4} w="100%">
                <FormControl w="50%">
                  <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                    {t('teaching.teachers.form.code')}
                  </FormLabel>
                  <Input
                    placeholder={t('teaching.teachers.form.codePlaceholder')}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    isReadOnly={!!editingTeacher}
                    bg={editingTeacher ? 'gray.50' : 'white'}
                    h="40px"
                    fontSize="14px"
                    borderColor="gray.200"
                    borderRadius="8px"
                  />
                  <Text fontSize="12px" color="gray.400" mt={1}>
                    {t('teaching.teachers.form.codeHint')}
                  </Text>
                </FormControl>
                <FormControl w="50%" isRequired isInvalid={!!errors.name}>
                  <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                    {t('teaching.teachers.form.name')}
                  </FormLabel>
                  <Input
                    placeholder={t('teaching.teachers.form.namePlaceholder')}
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      clearError('name');
                    }}
                    h="40px"
                    fontSize="14px"
                    borderColor="gray.200"
                    borderRadius="8px"
                  />
                  {errors.name && (
                    <Text fontSize="12px" color="#F53F3F" mt={1}>
                      {errors.name}
                    </Text>
                  )}
                </FormControl>
              </Flex>

              {/* 第二行：性别 + 手机号 */}
              <Flex gap={4} w="100%">
                <FormControl w="50%" isRequired isInvalid={!!errors.gender}>
                  <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                    {t('teaching.teachers.form.gender')}
                  </FormLabel>
                  <Select
                    placeholder={t('teaching.teachers.form.genderPlaceholder')}
                    value={formData.gender}
                    onChange={(e) => {
                      setFormData({ ...formData, gender: e.target.value });
                      clearError('gender');
                    }}
                    h="40px"
                    fontSize="14px"
                    borderColor="gray.200"
                    borderRadius="8px"
                  >
                    <option value={t('teaching.teachers.form.male')}>
                      {t('teaching.teachers.form.male')}
                    </option>
                    <option value={t('teaching.teachers.form.female')}>
                      {t('teaching.teachers.form.female')}
                    </option>
                  </Select>
                  {errors.gender && (
                    <Text fontSize="12px" color="#F53F3F" mt={1}>
                      {errors.gender}
                    </Text>
                  )}
                </FormControl>
                <FormControl w="50%" isRequired isInvalid={!!errors.phone}>
                  <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                    {t('teaching.teachers.form.phone')}
                  </FormLabel>
                  <Input
                    placeholder={t('teaching.teachers.form.phonePlaceholder')}
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      clearError('phone');
                    }}
                    h="40px"
                    fontSize="14px"
                    borderColor="gray.200"
                    borderRadius="8px"
                  />
                  {errors.phone && (
                    <Text fontSize="12px" color="#F53F3F" mt={1}>
                      {errors.phone}
                    </Text>
                  )}
                </FormControl>
              </Flex>

              {/* 第二行（下）：登录账号 + 账号状态 */}
              {editingTeacher && (
                <Flex gap={4} w="100%">
                  <FormControl w="50%">
                    <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                      {t('teaching.teachers.form.loginAccount')}
                    </FormLabel>
                    <Input
                      value={editLoading ? '' : formData.loginAccount || formData.phone || '-'}
                      placeholder={editLoading ? t('teaching.teachers.loading') : ''}
                      isReadOnly
                      h="40px"
                      fontSize="14px"
                      borderColor="gray.200"
                      borderRadius="8px"
                      bg="gray.50"
                      _readOnly={{ cursor: 'default' }}
                    />
                  </FormControl>
                  <FormControl w="50%">
                    <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                      {t('teaching.teachers.form.accountStatus')}
                    </FormLabel>
                    <Box h="40px" display="flex" alignItems="center">
                      {editLoading ? (
                        <Spinner size="sm" color="gray.400" />
                      ) : formData.accountStatus === 1 ? (
                        <Badge
                          bg="#DCFCE7"
                          color="#166534"
                          borderRadius="6px"
                          px={2.5}
                          py={1}
                          fontSize="14px"
                          fontWeight="500"
                        >
                          <Flex align="center" gap={1}>
                            <Box
                              w="16px"
                              h="16px"
                              borderRadius="full"
                              bg="#22C55E"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Text fontSize="10px" color="white" fontWeight="bold">
                                ✓
                              </Text>
                            </Box>
                            {t('teaching.teachers.accountStatus.active')}
                          </Flex>
                        </Badge>
                      ) : formData.accountStatus === 2 ? (
                        <Badge
                          bg="#FEE2E2"
                          color="#B91C1C"
                          borderRadius="6px"
                          px={2.5}
                          py={1}
                          fontSize="14px"
                          fontWeight="500"
                        >
                          {t('teaching.teachers.accountStatus.disabled')}
                        </Badge>
                      ) : (
                        <Badge
                          bg="#F3F4F6"
                          color="#6B7280"
                          borderRadius="6px"
                          px={2.5}
                          py={1}
                          fontSize="14px"
                          fontWeight="500"
                        >
                          {formData.accountStatus === 0
                            ? t('teaching.teachers.accountStatus.inactive')
                            : '-'}
                        </Badge>
                      )}
                    </Box>
                  </FormControl>
                </Flex>
              )}

              {/* 第三行：组织架构 + 用户类型 */}
              <Flex gap={4} w="100%">
                <FormControl w="50%" isRequired isInvalid={!!errors.deptIds}>
                  <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                    {t('teaching.teachers.form.dept')}
                  </FormLabel>
                  <DeptTreeSelect
                    deptList={deptList}
                    selectedIds={formData.deptIds}
                    onChange={(ids) => {
                      setFormData({ ...formData, deptIds: ids });
                      clearError('deptIds');
                    }}
                    placeholder="请选择组织（可多选）"
                  />
                  <Text fontSize="12px" color="gray.400" mt={1}>
                    支持选择多个组织
                  </Text>
                  {errors.deptIds && (
                    <Text fontSize="12px" color="#F53F3F" mt={1}>
                      {errors.deptIds}
                    </Text>
                  )}
                </FormControl>
                <FormControl w="50%">
                  <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                    {t('teaching.teachers.form.type')}
                  </FormLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    h="40px"
                    fontSize="14px"
                    borderColor="gray.200"
                    borderRadius="8px"
                  >
                    <option value={t('teaching.teachers.form.teacher')}>
                      {t('teaching.teachers.form.teacher')}
                    </option>
                    <option value={t('teaching.teachers.form.staff')}>
                      {t('teaching.teachers.form.staff')}
                    </option>
                  </Select>
                </FormControl>
              </Flex>

              {/* 第四行：职称 */}
              <FormControl>
                <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                  {t('teaching.teachers.form.title')}
                </FormLabel>
                <Select
                  placeholder={t('teaching.teachers.form.titlePlaceholder')}
                  value={formData.professionalTitle}
                  onChange={(e) => setFormData({ ...formData, professionalTitle: e.target.value })}
                  h="40px"
                  fontSize="14px"
                  borderColor="gray.200"
                  borderRadius="8px"
                >
                  <option value={t('teaching.teachers.titles.professor')}>
                    {t('teaching.teachers.titles.professor')}
                  </option>
                  <option value={t('teaching.teachers.titles.associateProfessor')}>
                    {t('teaching.teachers.titles.associateProfessor')}
                  </option>
                  <option value={t('teaching.teachers.titles.lecturer')}>
                    {t('teaching.teachers.titles.lecturer')}
                  </option>
                  <option value={t('teaching.teachers.titles.seniorLecturer')}>
                    {t('teaching.teachers.titles.seniorLecturer')}
                  </option>
                  <option value={t('teaching.teachers.titles.assistant')}>
                    {t('teaching.teachers.titles.assistant')}
                  </option>
                  <option value={t('teaching.teachers.titles.assistantLecturer')}>
                    {t('teaching.teachers.titles.assistantLecturer')}
                  </option>
                </Select>
              </FormControl>

              {/* 第五行：状态 + 邮箱 */}
              <Flex gap={4} w="100%">
                <FormControl w="50%" isRequired isInvalid={!!errors.status}>
                  <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                    {t('teaching.teachers.form.status')}
                  </FormLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => {
                      setFormData({ ...formData, status: e.target.value as TeacherStatus });
                      clearError('status');
                    }}
                    h="40px"
                    fontSize="14px"
                    borderColor="gray.200"
                    borderRadius="8px"
                  >
                    <option value={t('teaching.teachers.status.active')}>
                      {t('teaching.teachers.status.active')}
                    </option>
                    <option value={t('teaching.teachers.status.inactive')}>
                      {t('teaching.teachers.status.inactive')}
                    </option>
                  </Select>
                  {errors.status && (
                    <Text fontSize="12px" color="#F53F3F" mt={1}>
                      {errors.status}
                    </Text>
                  )}
                </FormControl>
                <FormControl w="50%">
                  <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                    {t('teaching.teachers.form.email')}
                  </FormLabel>
                  <Input
                    placeholder={t('teaching.teachers.form.emailPlaceholder')}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    h="40px"
                    fontSize="14px"
                    borderColor="gray.200"
                    borderRadius="8px"
                  />
                </FormControl>
              </Flex>

              <Divider />

              {/* 角色选择 */}
              <FormControl>
                <FormLabel fontSize="14px" fontWeight="500" mb={2}>
                  {t('teaching.teachers.form.roles')}
                </FormLabel>
                <Box border="1px" borderColor="gray.200" borderRadius="8px" p={3}>
                  <Stack spacing={3}>
                    {roleList.map((role) => {
                      const roleId = Number(role.id) || 0;
                      return (
                        <Checkbox
                          key={roleId}
                          isChecked={formData.roleIds.includes(roleId)}
                          onChange={(e) => {
                            const newRoles = e.target.checked
                              ? [...formData.roleIds, roleId]
                              : formData.roleIds.filter((r) => r !== roleId);
                            setFormData({ ...formData, roleIds: newRoles });
                          }}
                          colorScheme="red"
                        >
                          <Text fontSize="14px">
                            {role.name} {role.info ? `- ${role.info}` : ''}
                          </Text>
                        </Checkbox>
                      );
                    })}
                  </Stack>
                </Box>
                <Text fontSize="12px" color="gray.400" mt={1.5}>
                  {t('teaching.teachers.form.rolesHint')}
                </Text>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter borderTop="1px" borderColor="gray.100" py={4}>
            <Button
              variant="outline"
              mr={3}
              onClick={handleCloseEditModal}
              h="40px"
              px={6}
              borderRadius="8px"
              fontSize="14px"
            >
              {t('teaching.teachers.actions.cancel')}
            </Button>
            <Button
              bg="#2D2D2D"
              color="white"
              _hover={{ bg: '#1F1F1F' }}
              onClick={handleSave}
              h="40px"
              px={6}
              borderRadius="8px"
              fontSize="14px"
            >
              {t('teaching.teachers.actions.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose} size="md">
        <ModalOverlay />
        <ModalContent borderRadius="16px">
          <ModalHeader
            display="flex"
            alignItems="center"
            gap={2}
            fontSize="16px"
            fontWeight="600"
            py={4}
          >
            <Box
              w="22px"
              h="22px"
              borderRadius="full"
              bg="#EF4444"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="white" fontSize="14px" fontWeight="bold">
                !
              </Text>
            </Box>
            {t('teaching.teachers.modal.deleteTitle')}
          </ModalHeader>
          <ModalCloseButton top={4} right={4} />
          <ModalBody py={4}>
            <Text fontSize="14px" color="gray.700">
              {t('teaching.teachers.delete.description', { name: deletingTeacher?.name })}
            </Text>
          </ModalBody>
          <ModalFooter py={4}>
            <Button
              variant="outline"
              mr={3}
              onClick={deleteModal.onClose}
              h="40px"
              px={6}
              borderRadius="8px"
              fontSize="14px"
              borderColor="#333"
              color="#333"
              bg="white"
              _hover={{ bg: 'gray.50' }}
            >
              {t('teaching.teachers.actions.cancel')}
            </Button>
            <Button
              bg="#333"
              color="white"
              _hover={{ bg: '#1F1F1F' }}
              onClick={handleConfirmDelete}
              h="40px"
              px={6}
              borderRadius="8px"
              fontSize="14px"
            >
              {t('teaching.teachers.actions.confirmDelete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 批量导入弹窗 - ImportPanel 风格 */}
      <Modal
        isOpen={importModal.isOpen}
        onClose={handleCloseImportModal}
        // size="xl"
        isCentered
      >
        <ModalOverlay bg="rgba(15, 23, 42, 0.22)" backdropFilter="blur(4px)" />
        <ModalContent maxW="600px" rounded="16px">
          <ModalHeader fontSize="16px" fontWeight="600" borderBottom="1px solid #E7E7E7" py={4}>
            {t('teaching.teachers.modal.importTitle')}
          </ModalHeader>
          <ModalCloseButton top={4} right={4} />
          <ModalBody py={6} px={8}>
            {/* 隐藏的文件输入 */}
            <input
              id="teacherFileInput"
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
            />

            {/* 步骤1：下载模板 */}
            <Flex align="center" mb={4} bg="#F9F9F9" p={4} borderRadius="8px" gap={3}>
              <Flex
                bg="#3366ff"
                color="#fff"
                borderRadius="full"
                w="32px"
                h="32px"
                flexShrink={0}
                align="center"
                justify="center"
                fontSize="14px"
                fontWeight="600"
              >
                1
              </Flex>
              <Text flex={1} fontSize="14px" color="#333" wordBreak="break-word">
                {t('teaching.teachers.import.step1')}
              </Text>
              <Button
                colorScheme="primary.5"
                onClick={handleDownloadTemplate}
                borderRadius="2px"
                minW="120px"
                h="32px"
                fontSize="14px"
                flexShrink={0}
                leftIcon={<DownloadIcon boxSize={4} />}
              >
                {t('teaching.teachers.actions.downloadTemplate')}
              </Button>
            </Flex>

            {/* 步骤2：选择文件 */}
            <Flex align="center" mb={4} bg="#F9F9F9" p={4} borderRadius="8px" gap={3}>
              <Flex
                bg="#3366ff"
                color="#fff"
                borderRadius="full"
                w="32px"
                h="32px"
                flexShrink={0}
                align="center"
                justify="center"
                fontSize="14px"
                fontWeight="600"
              >
                2
              </Flex>
              <Text flex={1} fontSize="14px" color="#333" wordBreak="break-word">
                {t('teaching.teachers.import.step2')}
              </Text>
              <Button
                colorScheme="primary.5"
                onClick={triggerFileSelect}
                borderRadius="2px"
                minW="120px"
                h="32px"
                fontSize="14px"
                flexShrink={0}
                isDisabled={importing}
              >
                {t('teaching.teachers.actions.selectFile')}
              </Button>
            </Flex>

            {/* 已选文件显示 */}
            {selectedImportFile && (
              <Box
                display="flex"
                border="1px solid #E5E7EB"
                borderRadius="8px"
                p={3}
                position="relative"
                mb={4}
              >
                <AttachmentIcon boxSize={10} mr={3} color="green.500" />
                <Box flex="1">
                  <Flex align="center" mb={1}>
                    <Text flex={1} fontSize="14px" fontWeight="500" color="#333">
                      {selectedImportFile.name}
                    </Text>
                  </Flex>
                  <Text fontSize="12px" color="gray.500">
                    {t('teaching.teachers.import.fileSize', {
                      size: (selectedImportFile.size / 1024).toFixed(2)
                    })}
                  </Text>
                </Box>
                {!importing && (
                  <IconButton
                    aria-label={t('teaching.teachers.actions.delete')}
                    icon={<DeleteIcon />}
                    size="sm"
                    variant="ghost"
                    color="#3366ff"
                    position="absolute"
                    right={2}
                    top={2}
                    onClick={handleDeleteImportFile}
                  />
                )}
              </Box>
            )}

            {/* 错误信息显示 */}
            {importErrorMsg && (
              <Box
                mt={4}
                color="red.500"
                maxH="200px"
                overflowY="auto"
                bg="red.50"
                p={3}
                borderRadius="8px"
              >
                {importErrorMsg.split('\n').map((errMsg, index) => (
                  <Text key={index} fontSize="13px" mb={1}>
                    {index + 1}. {errMsg}
                  </Text>
                ))}
              </Box>
            )}

            {/* 底部提示和按钮 */}
            <Flex align="center" mt={6}>
              <Text flex={1} color="orange.500" fontSize="14px">
                {t('teaching.teachers.import.warning')}
              </Text>
              <Button variant="outline" onClick={handleCloseImportModal} mr={2} h="36px" px={4}>
                {t('teaching.teachers.actions.cancel')}
              </Button>
              <Button
                colorScheme="primary.5"
                onClick={handleConfirmImport}
                isDisabled={!selectedImportFile || importing}
                isLoading={importing}
                loadingText={t('teaching.teachers.actions.confirmImport')}
                h="36px"
                px={4}
              >
                {t('teaching.teachers.actions.confirmImport')}
              </Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* 教师详情弹窗 */}
      <Modal isOpen={detailModal.isOpen} onClose={detailModal.onClose} size="md">
        <ModalOverlay />
        <ModalContent borderRadius="16px" maxW="480px">
          <ModalHeader
            fontSize="18px"
            fontWeight="600"
            borderBottom="1px"
            borderColor="gray.100"
            py={4}
          >
            {t('teaching.teachers.modal.detailTitle')}
          </ModalHeader>
          <ModalCloseButton top={4} right={4} />
          <ModalBody py={5} px={6}>
            {detailLoading ? (
              <Flex justify="center" align="center" py={10}>
                <Spinner size="lg" color="blue.500" />
              </Flex>
            ) : detailData ? (
              <Stack spacing={5}>
                {/* 基本信息 */}
                <Box>
                  <Text fontSize="14px" fontWeight="600" color="gray.800" mb={3}>
                    {t('teaching.teachers.detail.basicInfo')}
                  </Text>
                  <Stack spacing={3}>
                    <Flex align="center">
                      <Text fontSize="14px" color="gray.500" w="100px" flexShrink={0}>
                        {t('teaching.teachers.table.code')}
                      </Text>
                      <Text fontSize="14px" color="gray.800">
                        {detailData.code || '-'}
                      </Text>
                    </Flex>
                    <Flex align="center">
                      <Text fontSize="14px" color="gray.500" w="100px" flexShrink={0}>
                        {t('teaching.teachers.table.name')}
                      </Text>
                      <Text fontSize="14px" color="gray.800">
                        {detailData.name || '-'}
                      </Text>
                    </Flex>
                    <Flex align="center">
                      <Text fontSize="14px" color="gray.500" w="100px" flexShrink={0}>
                        {t('teaching.teachers.table.phone')}
                      </Text>
                      <Text fontSize="14px" color="gray.800">
                        {detailData.phone || '-'}
                      </Text>
                    </Flex>
                    <Flex align="center">
                      <Text fontSize="14px" color="gray.500" w="100px" flexShrink={0}>
                        {t('teaching.teachers.form.email')}
                      </Text>
                      <Text fontSize="14px" color="gray.800">
                        {detailData.email || '-'}
                      </Text>
                    </Flex>
                    <Flex align="center">
                      <Text fontSize="14px" color="gray.500" w="100px" flexShrink={0}>
                        {t('teaching.teachers.table.dept')}
                      </Text>
                      <Text fontSize="14px" color="gray.800">
                        {(detailData.deptNames || []).join('、') || '-'}
                      </Text>
                    </Flex>
                    <Flex align="center">
                      <Text fontSize="14px" color="gray.500" w="100px" flexShrink={0}>
                        {t('teaching.teachers.table.type')}
                      </Text>
                      <Text fontSize="14px" color="gray.800">
                        {getTypeMap(t)[detailData.type] || '-'}
                      </Text>
                    </Flex>
                    <Flex align="center">
                      <Text fontSize="14px" color="gray.500" w="100px" flexShrink={0}>
                        {t('teaching.teachers.table.status')}
                      </Text>
                      <Badge
                        bg={detailData.status === 1 ? '#DCFCE7' : '#F3F4F6'}
                        color={detailData.status === 1 ? '#166534' : '#6B7280'}
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
                          bg={detailData.status === 1 ? '#22C55E' : '#9CA3AF'}
                          borderRadius="full"
                          mr={1}
                        />
                        {getStatusMap(t)[detailData.status] || '-'}
                      </Badge>
                    </Flex>
                  </Stack>
                </Box>

                <Divider />

                {/* 账号信息 */}
                <Box>
                  <Text fontSize="14px" fontWeight="600" color="gray.800" mb={3}>
                    {t('teaching.teachers.detail.accountInfo')}
                  </Text>
                  <Stack spacing={3}>
                    <Flex align="center">
                      <Text fontSize="14px" color="gray.500" w="100px" flexShrink={0}>
                        {t('teaching.teachers.detail.loginAccount')}
                      </Text>
                      <Text fontSize="14px" color="gray.800">
                        {detailData.loginAccount || detailData.phone || '-'}
                      </Text>
                    </Flex>
                    <Flex align="center">
                      <Text fontSize="14px" color="gray.500" w="100px" flexShrink={0}>
                        {t('teaching.teachers.detail.accountStatus')}
                      </Text>
                      {detailData.accountStatus === 1 ? (
                        <Badge
                          bg="#DCFCE7"
                          color="#166534"
                          borderRadius="6px"
                          px={2.5}
                          py={1}
                          fontSize="14px"
                          fontWeight="500"
                        >
                          <Flex align="center" gap={1}>
                            <Box
                              w="16px"
                              h="16px"
                              borderRadius="full"
                              bg="#22C55E"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Text fontSize="10px" color="white" fontWeight="bold">
                                ✓
                              </Text>
                            </Box>
                            {t('teaching.teachers.accountStatus.active')}
                          </Flex>
                        </Badge>
                      ) : detailData.accountStatus === 2 ? (
                        <Badge
                          bg="#FEE2E2"
                          color="#B91C1C"
                          borderRadius="6px"
                          px={2.5}
                          py={1}
                          fontSize="14px"
                          fontWeight="500"
                        >
                          {t('teaching.teachers.accountStatus.disabled')}
                        </Badge>
                      ) : (
                        <Badge
                          bg="#F3F4F6"
                          color="#6B7280"
                          borderRadius="6px"
                          px={2.5}
                          py={1}
                          fontSize="14px"
                          fontWeight="500"
                        >
                          {detailData.accountStatus === 0
                            ? t('teaching.teachers.accountStatus.inactive')
                            : '-'}
                        </Badge>
                      )}
                    </Flex>
                    <Flex align="center">
                      <Text fontSize="14px" color="gray.500" w="100px" flexShrink={0}>
                        {t('teaching.teachers.detail.activationTime')}
                      </Text>
                      <Text fontSize="14px" color="gray.800">
                        {detailData.activateTime || '-'}
                      </Text>
                    </Flex>
                  </Stack>
                </Box>
              </Stack>
            ) : null}
          </ModalBody>
          <ModalFooter borderTop="1px" borderColor="gray.100" py={4}>
            <Button
              variant="outline"
              onClick={detailModal.onClose}
              h="40px"
              px={6}
              borderRadius="8px"
              fontSize="14px"
              fontWeight="500"
              borderColor="blackAlpha.300"
              color="gray.700"
              bg="white"
            >
              {t('teaching.teachers.actions.close')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}
