# 学生详情弹窗国际化示例

## 原始代码（硬编码中文）

```typescript
export function StudentDetailModal({
  isOpen,
  onClose,
  student,
  onRemind
}: StudentDetailModalProps) {
  // ...

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent maxW="384px">
        <ModalHeader borderBottom="1px solid" borderColor="gray.200" pb={4}>
          <Text fontSize="lg" fontWeight={600} color="gray.800">
            学生学情详情
          </Text>
        </ModalHeader>

        <ModalBody py={6}>
          <VStack spacing={4} align="stretch">
            {/* 学生信息 */}
            <HStack spacing={3}>
              {/* ... */}
            </HStack>

            {/* 学习数据 */}
            <Box borderTop="1px solid" borderColor="gray.100" pt={4}>
              <VStack spacing={2} align="stretch">
                <Text fontSize="sm" color="gray.600" mb={2}>
                  课程：{student.course}
                </Text>

                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.500">
                    当前进度
                  </Text>
                  <Text fontSize="sm" fontWeight={600}>
                    {student.progress}%
                  </Text>
                </Flex>

                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.500">
                    学习时长
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    {student.studyHours}小时
                  </Text>
                </Flex>

                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.500">
                    最后学习
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    {student.lastStudyTimeDesc}
                  </Text>
                </Flex>
              </VStack>
            </Box>

            {/* 滞后原因 */}
            {student.lagReasonList && student.lagReasonList.length > 0 && (
              <Box bg="rgba(250,173,20,0.1)" p={3} borderRadius="lg">
                <Text fontSize="xs" color="#B7791F" fontWeight={500} mb={1}>
                  滞后原因分析：
                </Text>
                <VStack spacing={1} align="stretch">
                  {student.lagReasonList.map((reason, index) => (
                    <Text key={index} fontSize="xs" color="#B7791F">
                      • {reason}
                    </Text>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor="gray.200" gap={3} flexDirection="column">
          <Flex gap={3} w="full">
            {!student.reminded ? (
              <Button
                flex="1"
                bg={PRIMARY_COLOR}
                color="white"
                onClick={() => {
                  onRemind(student.id);
                  onClose();
                }}
              >
                发送提醒
              </Button>
            ) : null}
            <Button
              flex="1"
              bg="gray.100"
              color="gray.700"
              onClick={onClose}
            >
              关闭
            </Button>
          </Flex>
          {student.reminded && (
            <Text fontSize="xs" color="gray.400" textAlign="center" w="full">
              该学生已提醒
            </Text>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
```

## 国际化后的代码

```typescript
import { useTranslation } from 'react-i18next';

export function StudentDetailModal({
  isOpen,
  onClose,
  student,
  onRemind
}: StudentDetailModalProps) {
  const { t } = useTranslation('teacher-aiTeacher');

  // ...

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent maxW="384px">
        <ModalHeader borderBottom="1px solid" borderColor="gray.200" pb={4}>
          <Text fontSize="lg" fontWeight={600} color="gray.800">
            {t('avatar.detail.studentDetailModal.title')}
          </Text>
        </ModalHeader>

        <ModalBody py={6}>
          <VStack spacing={4} align="stretch">
            {/* 学生信息 */}
            <HStack spacing={3}>
              {/* ... */}
            </HStack>

            {/* 学习数据 */}
            <Box borderTop="1px solid" borderColor="gray.100" pt={4}>
              <VStack spacing={2} align="stretch">
                <Text fontSize="sm" color="gray.600" mb={2}>
                  {t('avatar.detail.studentDetailModal.course', { title: student.course })}
                </Text>

                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.500">
                    {t('avatar.detail.studentDetailModal.currentProgress')}
                  </Text>
                  <Text fontSize="sm" fontWeight={600}>
                    {student.progress}%
                  </Text>
                </Flex>

                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.500">
                    {t('avatar.detail.studentDetailModal.studyHours')}
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    {t('avatar.common.units.studyHours', { count: student.studyHours })}
                  </Text>
                </Flex>

                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.500">
                    {t('avatar.detail.studentDetailModal.lastStudy')}
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    {student.lastStudyTimeDesc}
                  </Text>
                </Flex>
              </VStack>
            </Box>

            {/* 滞后原因 */}
            {student.lagReasonList && student.lagReasonList.length > 0 && (
              <Box bg="rgba(250,173,20,0.1)" p={3} borderRadius="lg">
                <Text fontSize="xs" color="#B7791F" fontWeight={500} mb={1}>
                  {t('avatar.detail.studentDetailModal.laggingAnalysis')}
                </Text>
                <VStack spacing={1} align="stretch">
                  {student.lagReasonList.map((reason, index) => (
                    <Text key={index} fontSize="xs" color="#B7791F">
                      • {reason}
                    </Text>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor="gray.200" gap={3} flexDirection="column">
          <Flex gap={3} w="full">
            {!student.reminded ? (
              <Button
                flex="1"
                bg={PRIMARY_COLOR}
                color="white"
                onClick={() => {
                  onRemind(student.id);
                  onClose();
                }}
              >
                {t('avatar.detail.studentDetailModal.sendReminder')}
              </Button>
            ) : null}
            <Button
              flex="1"
              bg="gray.100"
              color="gray.700"
              onClick={onClose}
            >
              {t('avatar.common.actions.close')}
            </Button>
          </Flex>
          {student.reminded && (
            <Text fontSize="xs" color="gray.400" textAlign="center" w="full">
              {t('avatar.detail.studentDetailModal.reminded')}
            </Text>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
```

## 对应的翻译文件

### 中文 (zh-CN)
```json
{
  "avatar": {
    "detail": {
      "studentDetailModal": {
        "title": "学生学情详情",
        "course": "课程：{{title}}",
        "currentProgress": "当前进度",
        "studyHours": "学习时长",
        "lastStudy": "最后学习",
        "laggingAnalysis": "滞后原因分析：",
        "sendReminder": "发送提醒",
        "reminded": "该学生已提醒"
      }
    },
    "common": {
      "units": {
        "studyHours": "{{count}}小时"
      },
      "actions": {
        "close": "关闭"
      }
    }
  }
}
```

### 英文 (en)
```json
{
  "avatar": {
    "detail": {
      "studentDetailModal": {
        "title": "Student Learning Details",
        "course": "Course: {{title}}",
        "currentProgress": "Current Progress",
        "studyHours": "Study Hours",
        "lastStudy": "Last Study",
        "laggingAnalysis": "Lagging Analysis:",
        "sendReminder": "Send Reminder",
        "reminded": "Student has been reminded"
      }
    },
    "common": {
      "units": {
        "studyHours": "{{count}} hours"
      },
      "actions": {
        "close": "Close"
      }
    }
  }
}
```

## 关键变化点

### 1. 导入翻译Hook
```typescript
import { useTranslation } from 'react-i18next';
```

### 2. 使用Hook
```typescript
const { t } = useTranslation('teacher-aiTeacher');
```

### 3. 替换硬编码文本
```typescript
// 之前
<Text>学生学情详情</Text>

// 之后
<Text>{t('avatar.detail.studentDetailModal.title')}</Text>
```

### 4. 带参数的翻译
```typescript
// 之前
<Text>课程：{student.course}</Text>

// 之后
<Text>{t('avatar.detail.studentDetailModal.course', { title: student.course })}</Text>
```

### 5. 单位翻译
```typescript
// 之前
<Text>{student.studyHours}小时</Text>

// 之后
<Text>{t('avatar.common.units.studyHours', { count: student.studyHours })}</Text>
```

## 显示效果

### 中文
```
学生学情详情
课程：数据结构与算法
当前进度          35%
学习时长          5小时
最后学习          3天前
滞后原因分析：
• 第2章学习进度较慢
• 连续3天未学习
[发送提醒] [关闭]
```

### 英文
```
Student Learning Details
Course: Data Structures and Algorithms
Current Progress          35%
Study Hours              5 hours
Last Study               3 days ago
Lagging Analysis:
• Slow progress in Chapter 2
• No study for 3 consecutive days
[Send Reminder] [Close]
```

## 测试步骤

1. 切换到中文，检查所有文本显示
2. 切换到英文，检查所有文本显示
3. 验证带参数的翻译（课程名、学习时长等）
4. 验证按钮文本
5. 验证提示文本

## 注意事项

1. **翻译键命名要清晰**
   - 使用层级结构：`模块.子模块.组件.字段`
   - 避免过长的键名

2. **参数命名要有意义**
   - ✅ `{ title: student.course }`
   - ❌ `{ t: student.course }`

3. **复用通用翻译**
   - 通用操作（关闭、确认等）使用 `avatar.common.actions.*`
   - 通用单位使用 `avatar.common.units.*`

4. **保持翻译文件同步**
   - 添加新键时同时更新中英文文件
   - 保持键的结构一致
