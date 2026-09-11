'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Input,
  Textarea,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Divider,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner
} from '@chakra-ui/react';
import { useSimpleChat } from '@/web/common/hooks/useSimpleChat';

// 解析文件列表（逗号分隔的URL字符串）
const parseFileList = (input: string): string[] => {
  if (!input.trim()) return [];
  return input
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);
};

// 公共配置表单类型
type ConfigFormData = {
  appId: string;
  type: string;
  datasetId: string;
  files: string;
  images: string;
};

// 公共配置表单组件
interface ConfigFormProps {
  data: ConfigFormData;
  onChange: (data: ConfigFormData) => void;
}

function ConfigForm({ data, onChange }: ConfigFormProps) {
  const handleChange = (field: keyof ConfigFormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Box bg="gray.50" p={4} borderRadius="md">
      <Heading size="xs" mb={3}>
        配置
      </Heading>
      <VStack spacing={3}>
        <Box w="100%">
          <Text fontSize="sm" mb={1}>
            应用 ID <Badge colorScheme="blue">可选（与类型二选一）</Badge>
          </Text>
          <Input
            placeholder="请输入应用 ID"
            value={data.appId}
            onChange={(e) => handleChange('appId', e.target.value)}
            size="sm"
          />
        </Box>

        <Box w="100%">
          <Text fontSize="sm" mb={1}>
            类型 (Type) <Badge colorScheme="blue">可选（与应用ID二选一）</Badge>
          </Text>
          <Input
            placeholder="输入类型值：1=思维导图, 2=文档解读, 27=课程AI教师"
            value={data.type}
            onChange={(e) => handleChange('type', e.target.value)}
            size="sm"
          />
          <Text fontSize="xs" color="gray.400" mt={1}>
            类型会调用 getAgentDetailByAppointedType 自动获取 appId
          </Text>
        </Box>

        <Box w="100%">
          <Text fontSize="sm" mb={1}>
            Dataset ID <Badge colorScheme="blue">可选</Badge>
          </Text>
          <Input
            placeholder="知识库 ID，用于关联课程数据"
            value={data.datasetId}
            onChange={(e) => handleChange('datasetId', e.target.value)}
            size="sm"
          />
        </Box>

        <Box w="100%">
          <Text fontSize="sm" mb={1}>
            文件 URL <Badge colorScheme="blue">可选</Badge>
          </Text>
          <Input
            placeholder="文件 URL，多个用逗号分隔"
            value={data.files}
            onChange={(e) => handleChange('files', e.target.value)}
            size="sm"
          />
        </Box>

        <Box w="100%">
          <Text fontSize="sm" mb={1}>
            图片 URL <Badge colorScheme="blue">可选</Badge>
          </Text>
          <Input
            placeholder="图片 URL，多个用逗号分隔"
            value={data.images}
            onChange={(e) => handleChange('images', e.target.value)}
            size="sm"
          />
        </Box>
      </VStack>
    </Box>
  );
}

// 公共输入区域组件
interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minH?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

function InputArea({ value, onChange, placeholder, minH = '100px', onKeyDown }: InputAreaProps) {
  return (
    <Box>
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        minH={minH}
        resize="vertical"
        mb={2}
      />
    </Box>
  );
}

// 流式输出模式组件
function StreamModeDemo() {
  const toast = useToast();
  const { sendMessage, abort, loading, responseText } = useSimpleChat();

  const [config, setConfig] = useState<ConfigFormData>({
    appId: '69de377cd7ed58a0a23dd733',
    type: '',
    datasetId: '',
    files: '',
    images: ''
  });
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>(
    []
  );
  const [streamingText, setStreamingText] = useState('');

  const handleSend = async () => {
    if (!config.appId.trim() && !config.type.trim()) {
      toast({
        title: '请输入应用ID或类型',
        status: 'warning',
        duration: 2000
      });
      return;
    }

    if (!input.trim()) {
      toast({
        title: '请输入消息内容',
        status: 'warning',
        duration: 2000
      });
      return;
    }

    const userMessage = input;
    setChatHistory((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setStreamingText('');

    try {
      const variables: Record<string, any> = {};
      if (config.datasetId.trim()) {
        variables.dataset = [{ datasetId: config.datasetId.trim() }];
      }
      const fileList = parseFileList(config.files);
      const imageList = parseFileList(config.images);

      await sendMessage({
        appId: config.appId.trim() || undefined,
        type: config.type.trim() ? Number(config.type.trim()) : undefined,
        input: userMessage,
        variables,
        files: fileList,
        images: imageList,
        stream: true,
        onMessage: (text) => {
          setStreamingText(text);
        },
        onFinish: (fullText) => {
          setChatHistory((prev) => [...prev, { role: 'assistant', content: fullText }]);
          setStreamingText('');
          toast({
            title: '回复完成',
            status: 'success',
            duration: 2000
          });
        },
        onError: (error) => {
          toast({
            title: '请求失败',
            description: error.message,
            status: 'error',
            duration: 3000
          });
        }
      });
    } catch (error) {
      console.error('发送失败:', error);
    }
  };

  const handleClear = () => {
    setChatHistory([]);
    setStreamingText('');
    setConfig({
      appId: '',
      type: '',
      datasetId: '',
      files: '',
      images: ''
    });
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* 配置区域 */}
      <ConfigForm data={config} onChange={setConfig} />

      <Divider />

      {/* 聊天历史 */}
      <Box bg="gray.50" p={4} borderRadius="md" minH="300px" maxH="400px" overflowY="auto">
        <Heading size="xs" mb={3}>
          对话记录
        </Heading>

        {chatHistory.length === 0 && !streamingText && (
          <Text color="gray.400" textAlign="center" py={10}>
            暂无对话，请在下方输入消息
          </Text>
        )}

        {chatHistory.map((msg, index) => (
          <Box
            key={index}
            mb={3}
            p={3}
            bg={msg.role === 'user' ? 'blue.50' : 'green.50'}
            borderRadius="md"
            borderLeftWidth={3}
            borderLeftColor={msg.role === 'user' ? 'blue.400' : 'green.400'}
          >
            <Text fontSize="xs" color="gray.500" mb={1}>
              {msg.role === 'user' ? '用户' : 'AI'}
            </Text>
            <Text whiteSpace="pre-wrap">{msg.content}</Text>
          </Box>
        ))}

        {/* 流式输出 */}
        {streamingText && (
          <Box
            mb={3}
            p={3}
            bg="green.50"
            borderRadius="md"
            borderLeftWidth={3}
            borderLeftColor="green.400"
          >
            <Text fontSize="xs" color="gray.500" mb={1}>
              AI 正在回复...
            </Text>
            <Text whiteSpace="pre-wrap">{streamingText}</Text>
          </Box>
        )}
      </Box>

      <Divider />

      {/* 输入区域 */}
      <Box>
        <Textarea
          placeholder="请输入消息..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey) {
              handleSend();
            }
          }}
          minH="100px"
          resize="vertical"
          mb={2}
        />
        <Text fontSize="xs" color="gray.400">
          提示：Cmd + Enter 快速发送
        </Text>
      </Box>

      {/* 操作按钮 */}
      <HStack spacing={3} justify="flex-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          isDisabled={chatHistory.length === 0 && !streamingText}
        >
          清空对话
        </Button>

        {loading && (
          <Button colorScheme="red" size="sm" onClick={abort}>
            停止
          </Button>
        )}

        <Button
          colorScheme="blue"
          size="sm"
          onClick={handleSend}
          isLoading={loading}
          loadingText="发送中"
          isDisabled={(!config.appId.trim() && !config.type.trim()) || !input.trim()}
        >
          发送消息
        </Button>
      </HStack>

      {/* 当前回复文本 */}
      {responseText && !loading && (
        <Box bg="blue.50" p={3} borderRadius="md">
          <Text fontSize="xs" color="gray.500" mb={1}>
            最新完整回复 (Hook state):
          </Text>
          <Text fontSize="sm" noOfLines={2}>
            {responseText}
          </Text>
        </Box>
      )}
    </VStack>
  );
}

// JSON 格式模式组件
function JsonModeDemo() {
  const toast = useToast();
  const { sendMessage, loading, responseText, responseJson } = useSimpleChat();

  const [config, setConfig] = useState<ConfigFormData>({
    appId: '69de377cd7ed58a0a23dd733',
    type: '',
    datasetId: '',
    files: '',
    images: ''
  });
  const [input, setInput] = useState('');
  const [rawText, setRawText] = useState('');

  const handleSend = async () => {
    if (!config.appId.trim() && !config.type.trim()) {
      toast({
        title: '请输入应用ID或类型',
        status: 'warning',
        duration: 2000
      });
      return;
    }

    if (!input.trim()) {
      toast({
        title: '请输入消息内容',
        status: 'warning',
        duration: 2000
      });
      return;
    }

    setRawText('');

    try {
      const variables: Record<string, any> = {};
      if (config.datasetId.trim()) {
        variables.dataset = [{ datasetId: config.datasetId.trim() }];
      }

      // JSON 格式调用
      const response = await sendMessage({
        appId: config.appId.trim() || undefined,
        type: config.type.trim() ? Number(config.type.trim()) : undefined,
        input: input.trim(),
        variables,
        files: parseFileList(config.files),
        images: parseFileList(config.images),
        stream: false,
        jsonFormat: true, // 关键：启用 JSON 格式解析
        onFinish: (fullText, json) => {
          setRawText(fullText);
          toast({
            title: json ? 'JSON 解析成功' : '返回完成（非 JSON）',
            status: json ? 'success' : 'info',
            duration: 2000
          });
        },
        onError: (error) => {
          toast({
            title: '请求失败',
            description: error.message,
            status: 'error',
            duration: 3000
          });
        }
      });
    } catch (error) {
      console.error('发送失败:', error);
    }
  };

  const handleClear = () => {
    setInput('');
    setRawText('');
    setConfig({
      appId: '',
      type: '',
      datasetId: '',
      files: '',
      images: ''
    });
  };

  return (
    <VStack spacing={4} align="stretch">
      <Box bg="green.50" p={3} borderRadius="md">
        <Text fontSize="sm" color="green.600">
          <Badge colorScheme="green" mr={2}>
            模式说明
          </Badge>
          JSON 格式模式（jsonFormat: true），自动将返回内容解析为 JSON 对象
        </Text>
      </Box>

      {/* 配置区域 */}
      <ConfigForm data={config} onChange={setConfig} />

      <Divider />

      {/* 输入区域 */}
      <Box>
        <Text fontSize="sm" mb={1}>
          输入内容
        </Text>
        <Textarea
          placeholder="请输入要发送的消息，示例：请返回一个包含 name 和 age 的 JSON 对象"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          minH="120px"
          resize="vertical"
          mb={2}
        />
      </Box>

      {/* 操作按钮 */}
      <HStack spacing={3} justify="flex-end">
        <Button variant="ghost" size="sm" onClick={handleClear} isDisabled={!input && !rawText}>
          清空
        </Button>

        <Button
          colorScheme="green"
          size="sm"
          onClick={handleSend}
          isLoading={loading}
          loadingText="请求中"
          isDisabled={(!config.appId.trim() && !config.type.trim()) || !input.trim()}
        >
          获取 JSON
        </Button>
      </HStack>

      {/* 结果展示 */}
      <Box bg="gray.50" p={4} borderRadius="md" minH="200px">
        <HStack mb={3} justify="space-between">
          <Heading size="xs">解析结果</Heading>
          {loading && (
            <HStack>
              <Spinner size="xs" />
              <Text fontSize="xs" color="gray.500">
                加载中...
              </Text>
            </HStack>
          )}
        </HStack>

        {!rawText && !loading && (
          <Text color="gray.400" textAlign="center" py={10}>
            点击{'"'}获取 JSON{'"'}按钮获取结果
          </Text>
        )}

        {loading && !rawText && (
          <Box textAlign="center" py={10}>
            <Spinner size="lg" mb={4} />
            <Text color="gray.500">正在请求智能体...</Text>
          </Box>
        )}

        {rawText && (
          <VStack spacing={3} align="stretch">
            {/* 原始文本 */}
            <Box
              p={3}
              bg="blue.50"
              borderRadius="md"
              borderLeftWidth={3}
              borderLeftColor="blue.400"
            >
              <Text fontSize="xs" color="gray.500" mb={1}>
                原始返回文本 (responseText)：
              </Text>
              <Text fontSize="xs" whiteSpace="pre-wrap" noOfLines={5}>
                {rawText}
              </Text>
            </Box>

            {/* JSON 解析结果 */}
            <Box
              p={3}
              bg={responseJson ? 'green.50' : 'red.50'}
              borderRadius="md"
              borderLeftWidth={3}
              borderLeftColor={responseJson ? 'green.400' : 'red.400'}
            >
              <Text fontSize="xs" color="gray.500" mb={1}>
                JSON 解析结果 (responseJson)：
              </Text>
              {responseJson ? (
                <Box as="pre" fontSize="xs" whiteSpace="pre-wrap" overflowX="auto">
                  {JSON.stringify(responseJson, null, 2)}
                </Box>
              ) : (
                <Text fontSize="xs" color="red.500">
                  无法解析为 JSON 格式
                </Text>
              )}
            </Box>
          </VStack>
        )}
      </Box>
    </VStack>
  );
}

// 接口模式组件（非流式）
function ApiModeDemo() {
  const toast = useToast();
  const { sendMessage, loading, responseText } = useSimpleChat();

  const [config, setConfig] = useState<ConfigFormData>({
    appId: '69de377cd7ed58a0a23dd733',
    type: '',
    datasetId: '',
    files: '',
    images: ''
  });
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string>('');

  const handleSend = async () => {
    if (!config.appId.trim() && !config.type.trim()) {
      toast({
        title: '请输入应用ID或类型',
        status: 'warning',
        duration: 2000
      });
      return;
    }

    if (!input.trim()) {
      toast({
        title: '请输入消息内容',
        status: 'warning',
        duration: 2000
      });
      return;
    }

    setResult('');

    try {
      const variables: Record<string, any> = {};
      if (config.datasetId.trim()) {
        variables.dataset = [{ datasetId: config.datasetId.trim() }];
      }

      // 非流式调用 - 当接口用
      const response = await sendMessage({
        appId: config.appId.trim() || undefined,
        type: config.type.trim() ? Number(config.type.trim()) : undefined,
        input: input.trim(),
        variables,
        files: parseFileList(config.files),
        images: parseFileList(config.images),
        stream: false, // 关键：关闭流式输出
        onFinish: (fullText) => {
          toast({
            title: '请求完成',
            status: 'success',
            duration: 2000
          });
        },
        onError: (error) => {
          toast({
            title: '请求失败',
            description: error.message,
            status: 'error',
            duration: 3000
          });
        }
      });

      // 等待 loading 为 false 后，response 才是完整的
      setResult(response.responseText);
    } catch (error) {
      console.error('发送失败:', error);
    }
  };

  const handleClear = () => {
    setInput('');
    setResult('');
    setConfig({
      appId: '',
      type: '',
      datasetId: '',
      files: '',
      images: ''
    });
  };

  return (
    <VStack spacing={4} align="stretch">
      <Box bg="blue.50" p={3} borderRadius="md">
        <Text fontSize="sm" color="blue.600">
          <Badge colorScheme="blue" mr={2}>
            模式说明
          </Badge>
          非流式模式（stream: false），请求完成前 loading 为 true，完成后一次性返回完整内容
        </Text>
      </Box>

      {/* 配置区域 */}
      <ConfigForm data={config} onChange={setConfig} />

      <Divider />

      {/* 输入区域 */}
      <Box>
        <Text fontSize="sm" mb={1}>
          输入内容
        </Text>
        <Textarea
          placeholder="请输入要发送的消息..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          minH="120px"
          resize="vertical"
          mb={2}
        />
      </Box>

      {/* 操作按钮 */}
      <HStack spacing={3} justify="flex-end">
        <Button variant="ghost" size="sm" onClick={handleClear} isDisabled={!input && !result}>
          清空
        </Button>

        <Button
          colorScheme="blue"
          size="sm"
          onClick={handleSend}
          isLoading={loading}
          loadingText="请求中"
          isDisabled={(!config.appId.trim() && !config.type.trim()) || !input.trim()}
        >
          调用接口
        </Button>
      </HStack>

      {/* 结果展示 */}
      <Box bg="gray.50" p={4} borderRadius="md" minH="200px">
        <HStack mb={3} justify="space-between">
          <Heading size="xs">返回结果</Heading>
          {loading && (
            <HStack>
              <Spinner size="xs" />
              <Text fontSize="xs" color="gray.500">
                加载中...
              </Text>
            </HStack>
          )}
        </HStack>

        {!result && !loading && (
          <Text color="gray.400" textAlign="center" py={10}>
            点击{'"'}调用接口{'"'}按钮获取结果
          </Text>
        )}

        {loading && !result && (
          <Box textAlign="center" py={10}>
            <Spinner size="lg" mb={4} />
            <Text color="gray.500">正在请求智能体...</Text>
            <Text fontSize="xs" color="gray.400" mt={2}>
              非流式模式，请耐心等待完整回复
            </Text>
          </Box>
        )}

        {result && (
          <Box
            p={3}
            bg="green.50"
            borderRadius="md"
            borderLeftWidth={3}
            borderLeftColor="green.400"
          >
            <Text fontSize="xs" color="gray.500" mb={1}>
              AI 完整回复：
            </Text>
            <Text whiteSpace="pre-wrap">{result}</Text>
          </Box>
        )}
      </Box>

      {/* Hook state */}
      {responseText && !loading && (
        <Box bg="purple.50" p={3} borderRadius="md">
          <Text fontSize="xs" color="gray.500" mb={1}>
            Hook state (responseText)：
          </Text>
          <Text fontSize="sm" noOfLines={3}>
            {responseText}
          </Text>
        </Box>
      )}
    </VStack>
  );
}

export default function SimpleChatDemo() {
  return (
    <Card maxW="800px" mx="auto" mt={8}>
      <CardHeader>
        <Heading size="md">useSimpleChat Hook 演示</Heading>
        <Text fontSize="sm" color="gray.500" mt={2}>
          简化版聊天 Hook，支持流式、非流式和 JSON 格式解析三种模式
        </Text>
      </CardHeader>

      <CardBody>
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>流式输出模式</Tab>
            <Tab>接口模式（非流式）</Tab>
            <Tab>JSON 格式模式</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <StreamModeDemo />
            </TabPanel>
            <TabPanel>
              <ApiModeDemo />
            </TabPanel>
            <TabPanel>
              <JsonModeDemo />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </CardBody>
    </Card>
  );
}
