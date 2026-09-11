import { Alert, AlertIcon, Box, Button, Text, VStack } from '@chakra-ui/react';
import type { ErrorInfo, ReactNode } from 'react';
import React, { Component } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error('MyEdit ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // 自定义降级 UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          p={4}
          border="1px solid"
          borderColor="red.200"
          borderRadius="md"
          bg="red.50"
          minH="200px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <VStack spacing={4} maxW="400px">
            <Alert status="error">
              <AlertIcon />
              <Text fontSize="sm">编辑器遇到了一个错误，请尝试重新加载或联系技术支持。</Text>
            </Alert>

            <VStack spacing={2} align="start">
              <Text fontSize="xs" color="gray.600">
                错误详情：
              </Text>
              <Text fontSize="xs" color="red.600" fontFamily="mono">
                {this.state.error?.message || '未知错误'}
              </Text>
            </VStack>

            <Button colorScheme="red" size="sm" onClick={this.handleRetry}>
              重试
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
