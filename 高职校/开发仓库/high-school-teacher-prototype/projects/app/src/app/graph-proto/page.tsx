'use client';

import { Avatar, Box, ChakraProvider, Flex, HStack, Tag, Text } from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';
import { appChakraTheme } from '@/theme/appChakraTheme';
import Workbench from '@/app/teacher/(layoutPage)/graph/mapping-review/components/Workbench';

// 原型演示专用：携带 ?demo=1 访问且当前未登录时，写入模拟教师登录态。
// 必须在模块顶层执行：根路由守卫依据 localStorage 判定登录态，模块代码先于 React 挂载运行。
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  if (params.get('demo') === '1' && !localStorage.getItem('course-auth-user')) {
    localStorage.setItem(
      'course-auth-user',
      JSON.stringify({
        id: 'proto-teacher',
        name: '李老师',
        account: 'li.laoshi',
        token: 'proto-token',
        type: 2,
        roleType: 1,
        menuCodes: []
      })
    );
    localStorage.setItem('system_access_token', 'proto-token');
    localStorage.setItem('course-selected-role', 'teacher');
  }
}

const navItems = ['工作台', '课程', '图谱中心', '测评', '学生画像'];

// 原型预览外壳：脱离教师端路由守卫与租户接口，便于无后端环境下评审交互。
// 正式页面位于 /teacher/graph/mapping-review（需真实登录）。
export default function GraphProtoPage() {
  return (
    <ChakraProvider theme={appChakraTheme} resetCSS>
      <Box minH="100vh" bg="gray.50">
        <Flex
          h="56px"
          bg="white"
          borderBottom="1px solid"
          borderColor="gray.200"
          align="center"
          px={5}
          gap={6}
          position="sticky"
          top={0}
          zIndex={10}
        >
          <HStack spacing={2.5}>
            <Flex
              w="30px"
              h="30px"
              rounded="lg"
              bgGradient="linear(135deg, #C83E3E, #805AD5)"
              align="center"
              justify="center"
              color="white"
              fontSize="13px"
              fontWeight={700}
            >
              谱
            </Flex>
            <Text fontWeight={700} fontSize="md" color="gray.800">
              智教云 · 图谱中心
            </Text>
            <Tag size="sm" colorScheme="orange" variant="subtle" rounded="full">
              原型预览
            </Tag>
          </HStack>

          <HStack spacing={1} flex={1}>
            {navItems.map((item) => {
              const active = item === '图谱中心';
              return (
                <Box
                  key={item}
                  as="button"
                  px={3.5}
                  py={1.5}
                  rounded="xl"
                  fontSize="sm"
                  color={active ? 'primary.500' : 'gray.600'}
                  bg={active ? 'primary.50' : 'transparent'}
                  fontWeight={active ? 600 : 400}
                  _hover={{ color: 'gray.900' }}
                >
                  {item}
                </Box>
              );
            })}
          </HStack>

          <HStack spacing={2.5}>
            <Text fontSize="sm" color="gray.500">
              李老师
            </Text>
            <Avatar size="sm" name="李" bg="primary.100" color="primary.700" />
          </HStack>
        </Flex>

        <Flex bg="orange.50" borderBottom="1px solid" borderColor="orange.100" px={5} py={2} align="center" gap={2}>
          <WarningIcon color="orange.500" boxSize={3.5} />
          <Text fontSize="xs" color="gray.600">
            本页为图谱中心「映射审核工作台」可交互原型，数据为演示用 mock;
            正式集成页面位于 /teacher/graph/mapping-review（需真实登录）。
          </Text>
        </Flex>

        <Box maxW="1400px" mx="auto" py={5} px={5}>
          <Workbench />
        </Box>
      </Box>
    </ChakraProvider>
  );
}
