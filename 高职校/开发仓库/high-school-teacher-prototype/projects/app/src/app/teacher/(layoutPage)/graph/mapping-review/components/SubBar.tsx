import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Button, Flex, HStack, Text } from '@chakra-ui/react';
import { CheckIcon, DownloadIcon, RepeatIcon } from '@chakra-ui/icons';
import { CourseIcon, GraduationCapIcon } from '@/app/teacher/components/Icons';
import { COURSE_INFO, TARGET_GRAPH } from '../mockData';

type SubBarProps = {
  highConfCount: number;
  onBatchConfirm: () => void;
  onRetag: () => void;
  onExport: () => void;
};

export default function SubBar({ highConfCount, onBatchConfirm, onRetag, onExport }: SubBarProps) {
  return (
    <Box bg="white" border="1px solid" borderColor="gray.200" rounded="xl" px={5} py={3} boxShadow="sm">
      <Breadcrumb fontSize="xs" color="gray.500" mb={2}>
        <BreadcrumbItem>
          <BreadcrumbLink>图谱中心</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink>课程知识图谱</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink color="gray.700" fontWeight={500}>
            映射审核工作台
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Flex align="center" gap={3} flexWrap="wrap">
        <HStack bg="gray.50" border="1px solid" borderColor="gray.200" rounded="xl" px={3} py={2} spacing={2}>
          <CourseIcon width="18px" height="18px" color="#C83E3E" />
          <Text fontWeight={600} fontSize="sm" color="gray.800">
            {COURSE_INFO.name}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {COURSE_INFO.major} · {COURSE_INFO.knowledgeCount} 知识点
          </Text>
        </HStack>

        <Text color="gray.400" fontSize="lg">
          ⟶
        </Text>

        <HStack bg="green.50" border="1px solid" borderColor="green.100" rounded="xl" px={3} py={2} spacing={2}>
          <GraduationCapIcon width="18px" height="18px" color="#276749" />
          <Text fontWeight={600} fontSize="sm" color="green.800">
            {TARGET_GRAPH.postName} · {TARGET_GRAPH.graphName}
          </Text>
          <Box
            as="span"
            fontSize="11px"
            bg="white"
            border="1px solid"
            borderColor="green.200"
            rounded="md"
            px={1.5}
            py={0.5}
            color="green.600"
            fontWeight={500}
          >
            {TARGET_GRAPH.version} 已发布
          </Box>
        </HStack>

        <Box flex={1} />

        <HStack spacing={2}>
          <Button variant="ghost" size="sm" colorScheme="gray" leftIcon={<RepeatIcon />} onClick={onRetag}>
            重新打标
          </Button>
          <Button variant="outline" size="sm" colorScheme="gray" leftIcon={<DownloadIcon />} onClick={onExport}>
            导出映射表
          </Button>
          <Button size="sm" colorScheme="primary" leftIcon={<CheckIcon />} onClick={onBatchConfirm} isDisabled={highConfCount === 0}>
            批量确认高置信度（{highConfCount} 条）
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}
