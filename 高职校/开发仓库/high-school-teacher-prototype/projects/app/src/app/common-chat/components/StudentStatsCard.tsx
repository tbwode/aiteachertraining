'use client';

import { Box, Flex, Text, SimpleGrid, HStack, VStack } from '@chakra-ui/react';
import type { StudentStatsData } from '@/types/common-chat';

export type StudentStatsCardProps = {
  data: StudentStatsData;
};

export default function StudentStatsCard({ data }: StudentStatsCardProps) {
  const basic_information = data?.basic_information;
  const interaction_time_distribution = data?.interaction_time_distribution;
  const focus_on_students = data?.focus_on_students ?? [];

  const hasBasicInfo = !!basic_information;
  const hasInteractionData =
    interaction_time_distribution &&
    (interaction_time_distribution.time_slots ?? []).length > 0;

  const maxInteractionCount = hasInteractionData
    ? Math.max(
        ...(interaction_time_distribution.time_slots ?? []).map((s) => s.interaction_count),
        1
      )
    : 1;

  const progressColors = ['#86909C', '#FFD4D4', '#FF6B6B', '#C8000B'];

  return (
    <Box w="100%" maxW="560px">
      {/* 红色头部 */}
      {hasBasicInfo && (
        <Box bg="#C8000B" borderRadius="12px 12px 0 0" p="20px 24px" color="#fff">
          <Flex align="center" gap="10px" mb="8px">
            <Box
              w="28px"
              h="28px"
              borderRadius="6px"
              bg="rgba(255,255,255,0.2)"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Box>
            <Text fontSize="16px" fontWeight="600">
              {basic_information.course_name}
            </Text>
          </Flex>
          <Text fontSize="13px" opacity={0.85}>
            {basic_information.class_names} · {basic_information.course_type_label}
          </Text>
        </Box>
      )}

      {/* 白色内容区 */}
      <Box bg="#fff" borderRadius={hasBasicInfo ? '0 0 12px 12px' : '12px'} p="20px 24px">
        {/* 核心指标 */}
        {hasBasicInfo && (
          <SimpleGrid columns={3} spacing="16px" mb="24px">
            <StatBox
              label="平均进度"
              value={`${basic_information.average_progress ?? '-'}%`}
              sub={`共${basic_information.student_count ?? '-'}人`}
              highlight
            />
            <StatBox
              label="平均学时"
              value={`${basic_information.average_study_hours ?? '-'}h`}
              sub="人均"
            />
            <StatBox
              label="视频完成率"
              value={`${basic_information.video_completion_rate ?? '-'}%`}
              sub="班级平均"
            />
          </SimpleGrid>
        )}

        {/* 学习进度分布 */}
        {hasBasicInfo && (basic_information.progress_distribution ?? []).length > 0 && (
          <Box mb="24px">
            <Text fontSize="14px" color="#333" fontWeight="500" mb="12px">
              学习进度分布
            </Text>
            <Box h="8px" borderRadius="4px" overflow="hidden" display="flex" mb="10px">
              {(basic_information.progress_distribution ?? []).map((item, i) => (
                <Box
                  key={item.range}
                  h="100%"
                  flex={`${item.student_count} 1 0%`}
                  bg={progressColors[i % progressColors.length]}
                />
              ))}
            </Box>
            <HStack spacing="16px" flexWrap="wrap">
              {(basic_information.progress_distribution ?? []).map((item, i) => (
                <HStack key={item.range} spacing="4px">
                  <Box
                    w="8px"
                    h="8px"
                    borderRadius="2px"
                    bg={progressColors[i % progressColors.length]}
                  />
                  <Text fontSize="12px" color="#86909C">
                    {item.range} {item.student_count}人
                  </Text>
                </HStack>
              ))}
            </HStack>
          </Box>
        )}

        {/* 互动时间分布 */}
        {hasInteractionData && (
          <Box mb="24px">
            <Text fontSize="14px" color="#333" fontWeight="500" mb="12px">
              互动时间分布
            </Text>
            <Flex align="flex-end" gap="8px" h="100px">
              {(interaction_time_distribution.time_slots ?? []).map((slot) => (
                <VStack key={slot.slot_name} spacing="4px" flex={1} align="center" justify="flex-end" h="100%">
                  <Text fontSize="10px" color="#C8000B" fontWeight="500">
                    {slot.interaction_count > 0 ? slot.interaction_count : ''}
                  </Text>
                  <Box
                    w="100%"
                    borderRadius="4px 4px 0 0"
                    bg={slot.interaction_count > 0 ? '#C8000B' : '#F2F3F5'}
                    h={`${Math.max((slot.interaction_count / maxInteractionCount) * 70, 4)}px`}
                    transition="height 0.3s"
                  />
                  <Text fontSize="10px" color="#86909C" textAlign="center">
                    {slot.slot_name}
                  </Text>
                </VStack>
              ))}
            </Flex>
          </Box>
        )}

        {/* 重点关注学生 */}
        {focus_on_students.length > 0 && (
          <Box bg="#FFF5F5" borderRadius="8px" p="14px 16px">
            <HStack spacing="6px" mb="10px">
              <Text fontSize="14px" color="#C8000B" fontWeight="600">
                重点关注学生
              </Text>
              <Text fontSize="12px" color="#86909C">
                （{focus_on_students.length}人需关注）
              </Text>
            </HStack>
            <HStack spacing="8px" flexWrap="wrap">
              {focus_on_students.map((student, i) => (
                <Box
                  key={student.student_name + i}
                  bg="#fff"
                  border="1px solid #FFD4D4"
                  borderRadius="16px"
                  px="12px"
                  py="4px"
                >
                  <Text fontSize="13px" color="#C8000B">
                    {student.student_name}
                  </Text>
                </Box>
              ))}
            </HStack>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function StatBox({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <Box bg={highlight ? '#FFF5F5' : '#F9FAFB'} borderRadius="10px" p="16px" textAlign="center">
      <Text fontSize="12px" color="#86909C" mb="6px">
        {label}
      </Text>
      <Text fontSize="24px" fontWeight="700" color={highlight ? '#C8000B' : '#333'} lineHeight="1.2">
        {value}
      </Text>
      <Text fontSize="11px" color="#86909C" mt="4px">
        {sub}
      </Text>
    </Box>
  );
}
