'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Flex,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  Checkbox,
  Radio,
  RadioGroup,
  useToast,
  IconButton,
  Tooltip,
  Collapse
} from '@chakra-ui/react';
import { CloseIcon, CheckIcon, QuestionOutlineIcon } from '@chakra-ui/icons';
import {
  createRole,
  updateRole,
  getDetailRole,
  getMenuTreeList,
  createRoleAuthority
} from '@/api/admin/teaching/roles';
import type { MenuTreeNode } from '@/types/api/admin/teaching/roles';
import { useAdminPageI18n } from '@/app/admin/components/AdminI18nProvider';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId?: string;
  onSuccess: () => void;
}

interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
}

// 转换树数据为组件可用格式
const convertTreeData = (data: MenuTreeNode[]): TreeNode[] => {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    children: item.children ? convertTreeData(item.children) : []
  }));
};

// 获取所有节点ID
const getAllNodeIds = (nodes: TreeNode[]): string[] => {
  const ids: string[] = [];
  nodes.forEach((node) => {
    ids.push(node.id);
    if (node.children && node.children.length > 0) {
      ids.push(...getAllNodeIds(node.children));
    }
  });
  return ids;
};

// 获取节点及其所有子节点的ID
const getNodeAndChildrenIds = (node: TreeNode): string[] => {
  const ids: string[] = [node.id];
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      ids.push(...getNodeAndChildrenIds(child));
    });
  }
  return ids;
};

// 获取所有子节点的ID（不包括当前节点）
const getChildrenIds = (node: TreeNode): string[] => {
  const ids: string[] = [];
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      ids.push(child.id);
      ids.push(...getNodeAndChildrenIds(child).slice(1));
    });
  }
  return ids;
};

// 检查节点及其所有子节点是否都被选中
const areAllDescendantsSelected = (node: TreeNode, checkedIds: string[]): boolean => {
  const allIds = getNodeAndChildrenIds(node);
  return allIds.every((id) => checkedIds.includes(id));
};

// 树节点选择组件
const PermissionTree = ({
  nodes,
  checkedIds,
  onToggle,
  level = 0,
  expandedIds,
  onToggleExpand,
  disabled = false,
  onBatchSelect,
  t
}: {
  nodes: TreeNode[];
  checkedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
  level?: number;
  expandedIds: string[];
  onToggleExpand: (id: string) => void;
  disabled?: boolean;
  onBatchSelect?: (ids: string[], checked: boolean) => void;
  t: (key: string) => string;
}) => {
  const handleBatchSelect = (node: TreeNode, checked: boolean) => {
    if (onBatchSelect) {
      // 获取当前节点及其所有子节点的ID
      const idsToToggle = getNodeAndChildrenIds(node);
      onBatchSelect(idsToToggle, checked);
    }
  };

  return (
    <Box>
      {nodes.map((node) => {
        const isChecked = checkedIds.includes(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedIds.includes(node.id);
        const allDescendantsSelected = areAllDescendantsSelected(node, checkedIds);

        return (
          <Box key={node.id} mb={1}>
            <Flex align="center" gap={1}>
              {/* 展开/折叠图标 */}
              {hasChildren ? (
                <Box
                  w="16px"
                  h="16px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor={disabled ? 'not-allowed' : 'pointer'}
                  onClick={() => !disabled && onToggleExpand(node.id)}
                  color={disabled ? '#C9CDD4' : '#86909C'}
                  fontSize="10px"
                  transform={isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}
                  transition="transform 0.2s ease-in-out"
                >
                  ▶
                </Box>
              ) : (
                <Box w="16px" />
              )}
              {/* 缩进 */}
              {level > 0 && !hasChildren && <Box w={`${level * 16}px`} />}
              <Flex align="center" gap={2}>
                <Checkbox
                  isChecked={isChecked}
                  onChange={(e) => onToggle(node.id, e.target.checked)}
                  size="sm"
                  isDisabled={disabled}
                >
                  {/* 全选/取消按钮 - 仅当有待选子节点时显示 */}
                  {hasChildren && !disabled && (
                    <Button
                      size="xs"
                      variant="ghost"
                      color={allDescendantsSelected ? '#F53F3F' : '#2D2D2D'}
                      fontSize="12px"
                      height="20px"
                      px={2}
                      onClick={() => handleBatchSelect(node, !allDescendantsSelected)}
                    >
                      {allDescendantsSelected
                        ? t('base.roles.options.cancel')
                        : t('base.roles.options.selectAll')}
                    </Button>
                  )}
                </Checkbox>
                <Text fontSize="14px" color={disabled ? '#86909C' : '#1D2129'}>
                  {node.name}
                </Text>
              </Flex>
            </Flex>
            {/* 子节点 */}
            <Collapse in={hasChildren && isExpanded} animateOpacity>
              <Box mt={1} ml={6}>
                <PermissionTree
                  nodes={node.children!}
                  checkedIds={checkedIds}
                  onToggle={onToggle}
                  level={level + 1}
                  expandedIds={expandedIds}
                  onToggleExpand={onToggleExpand}
                  disabled={disabled}
                  onBatchSelect={onBatchSelect}
                  t={t}
                />
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
};

// 步骤指示器组件
const StepIndicator = ({ steps, currentStep }: { steps: string[]; currentStep: number }) => {
  return (
    <Flex justify="center" align="flex-start" py={4} px={8}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <Flex key={step} align="flex-start">
            {/* 步骤圆圈和文字 */}
            <Flex align="center" direction="column" w="100px">
              <Box
                w="32px"
                h="32px"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg={isCurrent ? '#2D2D2D' : isCompleted ? '#2D2D2D' : 'white'}
                color={isCurrent || isCompleted ? 'white' : 'rgba(0,0,0,0.25)'}
                border={isCurrent || isCompleted ? 'none' : '1px solid'}
                borderColor={isCompleted || isCurrent ? '#2D2D2D' : 'rgba(0,0,0,0.25)'}
                fontSize="14px"
                fontWeight="500"
              >
                {isCompleted ? <CheckIcon boxSize={3} /> : index + 1}
              </Box>
              <Text
                fontSize="14px"
                mt={2}
                color={isCurrent || isCompleted ? '#1D2129' : '#86909C'}
                fontWeight={isCurrent ? '500' : '400'}
                whiteSpace="nowrap"
              >
                {step}
              </Text>
            </Flex>

            {/* 连接线 */}
            {index < steps.length - 1 && (
              <Box w="60px" h="1px" bg={isCompleted ? '#2D2D2D' : '#E5E6EB'} mt={4} mx={0} />
            )}
          </Flex>
        );
      })}
    </Flex>
  );
};

export default function RoleModal({ isOpen, onClose, roleId: modalId, onSuccess }: RoleModalProps) {
  const { t } = useTranslation('admin');
  useAdminPageI18n(['base']);
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 基础信息
  const [name, setName] = useState('');
  const [info, setInfo] = useState('');
  const [nameError, setNameError] = useState('');
  const [infoError, setInfoError] = useState('');

  // 功能权限
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [allFunctionPerms, setAllFunctionPerms] = useState(false);

  // 数据权限
  const [allDataPerms, setAllDataPerms] = useState(false);
  const [classAuthority, setClassAuthority] = useState<number>(0);
  const [subjectAuthority, setSubjectAuthority] = useState<number>(0);
  const [deptAuthorityRadio, setDeptAuthorityRadio] = useState<number>(0);
  const [includeSubDept, setIncludeSubDept] = useState(false);

  // 创建后的角色ID（用于后续步骤）
  const [roleId, setRoleId] = useState<string>('');

  // 重置表单
  const resetForm = () => {
    setCurrentStep(0);
    setName('');
    setInfo('');
    setNameError('');
    setInfoError('');
    setTreeData([]);
    setCheckedIds([]);
    setExpandedIds([]);
    setAllFunctionPerms(false);
    setAllDataPerms(false);
    setClassAuthority(0);
    setSubjectAuthority(0);
    setDeptAuthorityRadio(0);
    setIncludeSubDept(false);
    setRoleId('');
  };

  // 加载菜单树
  const loadMenuTree = useCallback(async () => {
    try {
      const res = await getMenuTreeList();
      const tree = convertTreeData(
        res.filter((t) => (t as any)['code'] === 'tenant_manage_console')
      );
      setTreeData(tree);
      // 默认展开所有节点
      setExpandedIds(getAllNodeIds(tree));
    } catch (error) {
      // 加载菜单树失败，仅记录日志不做提示
      console.error('Failed to load menu tree:', error);
    }
  }, []);

  // 加载角色详情
  const loadRoleDetail = useCallback(async () => {
    if (!modalId) return;
    try {
      const res = await getDetailRole(modalId);
      setName(res.name || '');
      setInfo(res.info || '');

      // 回显功能权限
      if (res.authorityIds) {
        setCheckedIds(res.authorityIds.split(',').filter(Boolean));
      } else if (res.menuIds) {
        setCheckedIds(res.menuIds.split(',').filter(Boolean));
      }

      // 回显数据权限
      if (res.roleDataAuthority) {
        setAllDataPerms(res.roleDataAuthority.isAll === 1);
        setAllFunctionPerms((res as any).isAllAuthority === 1);
        setClassAuthority(res.roleDataAuthority.classAuthority || 0);
        setSubjectAuthority(res.roleDataAuthority.subjectAuthority || 0);

        if (res.roleDataAuthority.deptAuthority === 3) {
          setDeptAuthorityRadio(2);
          setIncludeSubDept(true);
        } else {
          setDeptAuthorityRadio(res.roleDataAuthority.deptAuthority || 0);
          setIncludeSubDept(false);
        }
      }

      // 加载菜单树
      await loadMenuTree();
    } catch (error) {
      toast({
        title: t('base.roles.messages.loadDetailFailed'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    }
  }, [modalId, toast, loadMenuTree]);

  // 加载角色详情
  useEffect(() => {
    if (!isOpen) return;

    if (modalId) {
      // 编辑模式：加载角色详情
      loadRoleDetail();
    } else {
      // 新增模式：重置表单并加载菜单树
      resetForm();
      loadMenuTree();
    }
  }, [isOpen, modalId, loadRoleDetail, loadMenuTree]);

  // 处理树节点选择
  const handleTreeToggle = (id: string, checked: boolean) => {
    setCheckedIds((prev) => {
      if (checked) {
        return [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  };

  // 处理批量选择（全选/取消）
  const handleBatchSelect = (ids: string[], checked: boolean) => {
    setCheckedIds((prev) => {
      if (checked) {
        // 选中所有子节点（去重）
        return [...new Set([...prev, ...ids])];
      } else {
        // 取消选中所有子节点
        return prev.filter((id) => !ids.includes(id));
      }
    });
  };

  // 处理树节点展开/折叠
  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  // 验证基础信息
  const validateStep1 = () => {
    let valid = true;
    setNameError('');
    setInfoError('');

    if (!name.trim()) {
      setNameError(t('base.roles.validation.nameRequired'));
      valid = false;
    } else if (name.length > 20) {
      setNameError(t('base.roles.validation.nameMaxLength'));
      valid = false;
    }

    if (!info.trim()) {
      setInfoError(t('base.roles.validation.infoRequired'));
      valid = false;
    } else if (info.length > 100) {
      setInfoError(t('base.roles.validation.infoMaxLength'));
      valid = false;
    }

    return valid;
  };

  // 下一步
  const handleNext = async () => {
    if (currentStep === 0) {
      // 第一步：验证基础信息并创建/更新角色
      if (!validateStep1()) return;

      setIsLoading(true);
      try {
        const params = { name, info } as const;
        const roleResponse =
          modalId || roleId
            ? await updateRole({ ...params, id: modalId || roleId })
            : await createRole(params);

        if (!roleResponse || !roleResponse.id) {
          throw new Error('创建角色失败');
        }

        setRoleId(roleResponse.id);
        setCurrentStep(1);
      } catch (error) {
        toast({
          title:
            modalId || roleId
              ? t('base.roles.messages.updateFailed')
              : t('base.roles.messages.createFailed'),
          status: 'error',
          duration: 2500,
          isClosable: true
        });
      } finally {
        setIsLoading(false);
      }
    } else if (currentStep === 1) {
      // 第二步：验证功能权限并保存
      if (!allFunctionPerms && checkedIds.length === 0) {
        toast({
          title: t('base.roles.validation.permissionRequired'),
          status: 'warning',
          duration: 2500,
          isClosable: true
        });
        return;
      }

      const currentRoleId = modalId || roleId;
      if (!currentRoleId) {
        toast({
          title: t('base.roles.validation.roleIdRequired'),
          status: 'error',
          duration: 2500,
          isClosable: true
        });
        return;
      }

      setIsLoading(true);
      try {
        const authorityIds = allFunctionPerms
          ? getAllNodeIds(treeData).join(',')
          : checkedIds.join(',');

        await createRoleAuthority({
          roleId: currentRoleId,
          authorityIds,
          isAll: 0,
          classAuthority: 0,
          subjectAuthority: 0,
          deptAuthority: 0,
          isAllAuthority: allFunctionPerms ? 1 : 0
        });

        setCurrentStep(2);
      } catch (error) {
        toast({
          title: t('base.roles.messages.savePermissionFailed'),
          status: 'error',
          duration: 2500,
          isClosable: true
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 上一步
  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // 提交
  const handleSubmit = async () => {
    // 数据权限映射
    const isAll = allDataPerms ? 1 : 0;
    const deptAuthority = deptAuthorityRadio === 2 && includeSubDept ? 3 : deptAuthorityRadio;

    if (!isAll && (!classAuthority || !subjectAuthority || !deptAuthority)) {
      toast({
        title: t('base.roles.validation.dataPermissionRequired'),
        status: 'warning',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    const currentRoleId = modalId || roleId;
    if (!currentRoleId) {
      toast({
        title: t('base.roles.validation.roleIdRequired'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    setIsLoading(true);
    try {
      // 第三步：保存数据权限（同时包含功能权限）
      const authorityIds = allFunctionPerms
        ? getAllNodeIds(treeData).join(',')
        : checkedIds.join(',');

      await createRoleAuthority({
        roleId: currentRoleId,
        authorityIds,
        isAll,
        classAuthority,
        subjectAuthority,
        deptAuthority,
        isAllAuthority: allFunctionPerms ? 1 : 0
      });

      toast({
        title: t('base.roles.messages.operationSuccess'),
        status: 'success',
        duration: 2500,
        isClosable: true
      });

      onSuccess();
      handleClose();
    } catch (error) {
      toast({
        title: t('base.roles.messages.saveDataPermissionFailed'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 关闭弹窗
  const handleClose = () => {
    resetForm();
    onClose();
  };

  const stepTitles = [
    t('base.roles.steps.basic'),
    t('base.roles.steps.permission'),
    t('base.roles.steps.data')
  ];

  // 渲染基础信息步骤
  const renderBasicStep = () => (
    <Box mt="24px" px={4}>
      {/* 角色名称 */}
      <Box mb="20px">
        <Flex alignItems="center" mb="8px">
          <Text fontSize="14px" fontWeight="500" color="#1D2129">
            {t('base.roles.form.name')}
          </Text>
          <Text color="#F53F3F" ml="4px">
            *
          </Text>
        </Flex>
        <Input
          borderRadius="8px"
          bg="#F2F3F5"
          border="none"
          h="42px"
          px="12px"
          maxLength={20}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('base.roles.form.namePlaceholder')}
          fontSize="14px"
          color="#1D2129"
          _focus={{ bg: '#F2F3F5', border: 'none', boxShadow: 'none' }}
          _hover={{ bg: '#F2F3F5' }}
        />
        {nameError && (
          <Text color="#F53F3F" fontSize="13px" mt="8px">
            {nameError}
          </Text>
        )}
      </Box>

      {/* 角色说明 */}
      <Box>
        <Flex alignItems="center" mb="8px">
          <Text fontSize="14px" fontWeight="500" color="#1D2129">
            {t('base.roles.form.info')}
          </Text>
          <Text color="#F53F3F" ml="4px">
            *
          </Text>
        </Flex>
        <Textarea
          borderRadius="8px"
          bg="#F2F3F5"
          border="none"
          h="184px"
          px="12px"
          py="6px"
          maxLength={100}
          value={info}
          onChange={(e) => setInfo(e.target.value)}
          placeholder={t('base.roles.form.infoPlaceholder')}
          fontSize="14px"
          color="#1D2129"
          _focus={{ bg: '#F2F3F5', border: 'none', boxShadow: 'none' }}
          _hover={{ bg: '#F2F3F5' }}
          resize="none"
        />
        {infoError && (
          <Text color="#F53F3F" fontSize="13px" mt="8px">
            {infoError}
          </Text>
        )}
      </Box>
    </Box>
  );

  // 渲染功能权限步骤
  const renderPermissionStep = () => (
    <Box mt="36px" px={4}>
      <Flex align="flex-start" gap={8}>
        {/* 左侧标签 */}
        <Flex align="center" mt={2}>
          <Text fontSize="14px" fontWeight="500" color="#1D2129">
            {t('base.roles.form.permission')}
          </Text>
          <Text color="#F53F3F" ml="4px">
            *
          </Text>
        </Flex>

        {/* 右侧内容 */}
        <Box flex={1}>
          {/* 全部权限勾选 */}
          <Flex align="center" mb={4} gap={1}>
            <Checkbox
              isChecked={allFunctionPerms}
              onChange={(e) => {
                const checked = e.target.checked;
                setAllFunctionPerms(checked);
                if (checked) {
                  // 选中全部权限
                  setCheckedIds(getAllNodeIds(treeData));
                } else {
                  // 取消全部权限
                  setCheckedIds([]);
                }
              }}
              size="md"
            >
              <Text fontSize="14px" color="#1D2129">
                {t('base.roles.form.allPermissions')}
              </Text>
            </Checkbox>
            <Tooltip label={t('base.roles.form.allPermissionsTooltip')} placement="right">
              <QuestionOutlineIcon boxSize={4} color="#86909C" cursor="pointer" />
            </Tooltip>
          </Flex>

          {/* 权限树 */}
          <Box
            bg="#F7F8FA"
            borderRadius="8px"
            p={4}
            maxH="480px"
            overflowY="auto"
            opacity={allFunctionPerms ? 0.6 : 1}
          >
            <PermissionTree
              nodes={treeData}
              checkedIds={checkedIds}
              onToggle={handleTreeToggle}
              expandedIds={expandedIds}
              onToggleExpand={handleToggleExpand}
              disabled={allFunctionPerms}
              onBatchSelect={handleBatchSelect}
              t={t}
            />
          </Box>
        </Box>
      </Flex>
    </Box>
  );

  // 渲染数据权限步骤
  const renderDataPermissionStep = () => (
    <Box mt="36px" px={4}>
      <Box bg="#F7F8FA" borderRadius="8px" p={4}>
        {/* 所有数据 */}
        <Flex align="center" mb={4}>
          <Checkbox
            isChecked={allDataPerms}
            onChange={(e) => {
              setAllDataPerms(e.target.checked);
              if (e.target.checked) {
                setClassAuthority(0);
                setSubjectAuthority(0);
                setDeptAuthorityRadio(0);
                setIncludeSubDept(false);
              }
            }}
            sx={{ '.chakra-checkbox__control': { borderRadius: '50%' } }}
          >
            <Text fontSize="14px" color="#1D2129">
              {t('base.roles.form.allData')}
            </Text>
          </Checkbox>
        </Flex>

        <Box bg="white" borderRadius="8px" p={4}>
          {/* 班级权限 */}
          <Box mb={4}>
            <Text fontSize="14px" color="#4E5969" mb={2}>
              {t('base.roles.form.classPermission')}
            </Text>
            <RadioGroup
              value={String(classAuthority || '')}
              onChange={(v) => setClassAuthority(Number(v))}
              isDisabled={allDataPerms}
            >
              <Flex gap={6} flexWrap="wrap">
                <Radio value="1">{t('base.roles.options.allGrades')}</Radio>
                <Radio value="2">{t('base.roles.options.myGrade')}</Radio>
                <Radio value="3">{t('base.roles.options.myClass')}</Radio>
                <Radio value="4">{t('base.roles.options.myClassroom')}</Radio>
              </Flex>
            </RadioGroup>
          </Box>

          {/* 学科权限 */}
          <Box mb={4}>
            <Text fontSize="14px" color="#4E5969" mb={2}>
              {t('base.roles.form.subjectPermission')}
            </Text>
            <RadioGroup
              value={String(subjectAuthority || '')}
              onChange={(v) => setSubjectAuthority(Number(v))}
              isDisabled={allDataPerms}
            >
              <Flex gap={6} flexWrap="wrap">
                <Radio value="1">{t('base.roles.options.allSubjects')}</Radio>
                <Radio value="2">{t('base.roles.options.mySubject')}</Radio>
              </Flex>
            </RadioGroup>
          </Box>

          {/* 部门权限 */}
          <Box>
            <Text fontSize="14px" color="#4E5969" mb={2}>
              {t('base.roles.form.deptPermission')}
            </Text>
            <RadioGroup
              value={String(deptAuthorityRadio || '')}
              onChange={(v) => {
                const val = Number(v);
                setDeptAuthorityRadio(val);
                if (val !== 2) setIncludeSubDept(false);
              }}
              isDisabled={allDataPerms}
            >
              <Flex gap={6} flexWrap="wrap" align="center">
                <Radio value="1">{t('base.roles.options.allDepts')}</Radio>
                <Flex align="center" gap={2}>
                  <Radio value="2">{t('base.roles.options.myDept')}</Radio>
                  <Checkbox
                    isChecked={includeSubDept}
                    onChange={(e) => setIncludeSubDept(e.target.checked)}
                    isDisabled={allDataPerms || deptAuthorityRadio !== 2}
                    size="sm"
                  >
                    <Text fontSize="13px">{t('base.roles.form.includeSubDept')}</Text>
                  </Checkbox>
                </Flex>
                <Radio value="4">{t('base.roles.options.myData')}</Radio>
              </Flex>
            </RadioGroup>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const isStep1Valid = !!(name && name.trim()) && !!(info && info.trim());

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay />
      <ModalContent
        w="722px"
        maxW="722px"
        // h="658px"
        // maxH="85vh"
        borderRadius="10px"
        overflow="hidden"
      >
        <ModalHeader
          display="flex"
          alignItems="center"
          borderBottom="1px solid #F4F6F8"
          py="16px"
          px="24px"
        >
          <Text fontSize="16px" fontWeight="600" color="#1D2129">
            {modalId ? t('base.roles.modal.editTitle') : t('base.roles.modal.createTitle')}
          </Text>
          <Box flex={1} />
          <IconButton
            aria-label={t('base.roles.modal.close')}
            icon={<CloseIcon boxSize={3} />}
            size="sm"
            variant="ghost"
            onClick={handleClose}
          />
        </ModalHeader>

        <ModalBody p="24px 0 0 0" overflow="hidden" display="flex" flexDirection="column" h="100%">
          {/* 步骤指示器 */}
          <StepIndicator steps={stepTitles} currentStep={currentStep} />

          {/* 步骤内容 */}
          <Box flex="1" px={8} pb={4}>
            {currentStep === 0 && renderBasicStep()}
            {currentStep === 1 && renderPermissionStep()}
            {currentStep === 2 && renderDataPermissionStep()}
          </Box>
        </ModalBody>

        {/* 底部按钮 */}
        <Flex
          h="64px"
          bg="#ffffff"
          borderTop="1px solid #E5E6EB"
          alignItems="center"
          justifyContent="flex-end"
          px="29px"
          gap="16px"
        >
          {currentStep < stepTitles.length - 1 && (
            <Button
              bg="#F2F3F5"
              color="#4E5969"
              h="36px"
              px="20px"
              borderRadius="8px"
              onClick={handleClose}
              fontSize="14px"
              border="none"
              _hover={{ bg: '#E5E6EB' }}
            >
              {t('base.roles.actions.cancel')}
            </Button>
          )}
          {currentStep > 0 && (
            <Button
              h="36px"
              px="20px"
              borderRadius="8px"
              onClick={handlePrev}
              fontSize="14px"
              variant="outline"
            >
              {t('base.roles.actions.prev')}
            </Button>
          )}
          {currentStep < stepTitles.length - 1 && (
            <Button
              bg="#2D2D2D"
              color="white"
              h="36px"
              px="20px"
              borderRadius="8px"
              onClick={handleNext}
              isDisabled={currentStep === 0 && !isStep1Valid}
              fontSize="14px"
              border="none"
              _hover={{ bg: '#1F1F1F' }}
              _disabled={{ bg: '#2D2D2D', opacity: 0.5 }}
              isLoading={isLoading}
            >
              {t('base.roles.actions.next')}
            </Button>
          )}
          {currentStep === stepTitles.length - 1 && (
            <Button
              bg="#2D2D2D"
              color="white"
              h="36px"
              px="20px"
              borderRadius="8px"
              onClick={handleSubmit}
              fontSize="14px"
              border="none"
              _hover={{ bg: '#1F1F1F' }}
              isLoading={isLoading}
            >
              {t('base.roles.actions.confirm')}
            </Button>
          )}
        </Flex>
      </ModalContent>
    </Modal>
  );
}
