import { useCallback, useEffect, useRef, useState } from 'react';

interface UseEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

interface UseEditorReturn {
  editorRef: React.RefObject<HTMLDivElement>;
  currentContent: string;
  setCurrentContent: (content: string) => void;
  getContent: () => string;
  setContent: (content: string) => void;
  insertText: (text: string) => void;
  execCommand: (command: string, value?: any) => void;
  undoHistory: string[];
  redoHistory: string[];
  isComposing: boolean;
  setIsComposing: (composing: boolean) => void;
  isUserTyping: React.MutableRefObject<boolean>;
  isUpdating: React.MutableRefObject<boolean>;
  isInitialized: React.MutableRefObject<boolean>;
  lastContent: React.MutableRefObject<string>;
  savedCursorRange: React.MutableRefObject<Range | null>;
  saveCursorPosition: () => void;
  restoreCursorPosition: () => void;
  insertMediaWithCursor: (htmlContent: string) => void;
  handleInput: (e: React.FormEvent<HTMLDivElement>) => void;
  handleBlur: () => void;
}

const MAX_HISTORY_SIZE = 50;

export const useEditor = ({
  value = '',
  onChange,
  disabled = false
}: UseEditorProps): UseEditorReturn => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [currentContent, setCurrentContent] = useState(value);
  const [undoHistory, setUndoHistory] = useState<string[]>([]);
  const [redoHistory, setRedoHistory] = useState<string[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);

  // 使用ref来避免频繁的状态更新
  const lastContent = useRef(value);
  const isUpdating = useRef(false);
  const isUserTyping = useRef(false);
  const isInitialized = useRef(false);
  const savedCursorRange = useRef<Range | null>(null);

  // 使用 ref 存储 onChange 避免依赖问题
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // 防抖机制
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingIdleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 开发环境日志控制
  const isDev = process.env.NODE_ENV === 'development';
  const devLog = (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  };

  // 保存当前光标位置（在弹窗打开前调用）
  const saveCursorPosition = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const currentRange = selection.getRangeAt(0);
      // 检查光标是否在编辑器内
      if (editorRef.current.contains(currentRange.commonAncestorContainer)) {
        savedCursorRange.current = currentRange.cloneRange();
        devLog('保存光标位置:', savedCursorRange.current);
        return;
      }
    }

    // 如果没有有效光标位置，保存编辑器末尾位置
    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    range.collapse(false);
    savedCursorRange.current = range.cloneRange();
    devLog('保存默认光标位置（编辑器末尾）');
  }, []);

  // 恢复保存的光标位置
  const restoreCursorPosition = useCallback(() => {
    if (!editorRef.current || !savedCursorRange.current) return;

    editorRef.current.focus();
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(savedCursorRange.current.cloneRange());
      devLog('恢复光标位置:', savedCursorRange.current);
    }
  }, []);

  // 获取编辑器内容
  const getContent = useCallback(() => {
    // 优先返回DOM内容，确保获取最新状态
    const domContent = editorRef.current?.innerHTML || '';
    if (domContent && domContent.trim() !== '') {
      return domContent;
    }
    // 如果DOM内容为空，回退到内部状态
    return currentContent || '';
  }, [currentContent]);

  // 设置编辑器内容
  const setContent = useCallback((content: string) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  }, []);

  // 防抖处理onChange回调
  const debouncedOnChange = useCallback(
    (content: string) => {
      // 立即更新内部状态，确保内容不丢失
      setCurrentContent(content);
      lastContent.current = content;

      // 清除之前的定时器
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // 设置新的定时器，延迟调用父组件的onChange
      debounceTimeoutRef.current = setTimeout(() => {
        // 使用 ref 存储 onChange 避免依赖问题
        if (onChangeRef.current) {
          onChangeRef.current(content);
        }
      }, 100); // 100ms防抖
    },
    [] // 空依赖，使用 ref 存储 onChange
  );

  // 插入媒体元素后设置光标位置
  const insertMediaWithCursor = useCallback((htmlContent: string) => {
    devLog('=== insertMediaWithCursor 开始 ===');
    if (!editorRef.current) return;

    // 确保编辑器获得焦点
    editorRef.current.focus();

    const selection = window.getSelection();
    if (!selection) return;

    // 优先使用保存的光标位置，如果没有则使用当前光标位置
    let targetRange: Range | null = null;

    if (savedCursorRange.current) {
      // 使用保存的光标位置
      targetRange = savedCursorRange.current.cloneRange();
      devLog('使用保存的光标位置插入媒体');
      // 清空保存的位置，避免重复使用
      savedCursorRange.current = null;
    } else {
      // 使用当前光标位置
      if (selection.rangeCount > 0) {
        const currentRange = selection.getRangeAt(0);
        // 检查光标是否在编辑器内
        if (editorRef.current.contains(currentRange.commonAncestorContainer)) {
          targetRange = currentRange.cloneRange();
          devLog('使用当前光标位置插入媒体');
        }
      }
    }

    // 如果没有有效的光标位置，设置到编辑器末尾
    if (!targetRange) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false); // 移动到末尾
      targetRange = range.cloneRange();
      devLog('使用默认位置（编辑器末尾）插入媒体');
    }

    // 设置选区到目标位置
    selection.removeAllRanges();
    selection.addRange(targetRange);

    // 使用Range.insertNode来避免execCommand自动添加换行符的问题
    try {
      // 创建临时容器来解析HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;

      // 插入所有节点
      const fragment = document.createDocumentFragment();
      let lastInsertedNode: Node | null = null;
      while (tempDiv.firstChild) {
        const node = tempDiv.firstChild as Node;
        lastInsertedNode = node;
        fragment.appendChild(node);
      }

      // 删除当前选区内容（如果有）
      targetRange.deleteContents();

      // 插入节点
      targetRange.insertNode(fragment);

      // 将光标移动到插入内容的后面
      if (lastInsertedNode) {
        const newRange = document.createRange();
        if (lastInsertedNode.nodeType === Node.TEXT_NODE) {
          newRange.setStart(lastInsertedNode, lastInsertedNode.textContent?.length || 0);
          newRange.setEnd(lastInsertedNode, lastInsertedNode.textContent?.length || 0);
        } else {
          newRange.setStartAfter(lastInsertedNode);
          newRange.setEndAfter(lastInsertedNode);
        }
        selection.removeAllRanges();
        selection.addRange(newRange);
        editorRef.current.focus();
        devLog('光标已设置到插入元素后面:', lastInsertedNode);
      } else {
        targetRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(targetRange);
        editorRef.current.focus();
        devLog('光标已设置到插入位置末尾');
      }

      // 触发内容变化事件
      const event = new Event('input', { bubbles: true });
      editorRef.current.dispatchEvent(event);

      // 更新内部状态并触发onChange回调
      const newContent = editorRef.current.innerHTML;
      lastContent.current = newContent;
      setCurrentContent(newContent);
      devLog('=== insertMediaWithCursor 成功 ===');
      if (onChangeRef.current) {
        onChangeRef.current(newContent);
      }
    } catch (error) {
      devLog('Range.insertNode failed, falling back to execCommand:', error);
      // 回退到execCommand方法
      document.execCommand('insertHTML', false, htmlContent);

      // 触发内容变化事件
      const event = new Event('input', { bubbles: true });
      editorRef.current.dispatchEvent(event);

      // 更新内部状态并触发onChange回调
      const newContent = editorRef.current.innerHTML;
      lastContent.current = newContent;
      setCurrentContent(newContent);
      if (onChangeRef.current) {
        onChangeRef.current(newContent);
      }
    }
  }, []);

  // 执行编辑器命令
  const execCommand = useCallback(
    (command: string, value?: any) => {
      // 确保编辑器有焦点
      if (editorRef.current) {
        editorRef.current.focus();

        // 对于撤销和恢复，使用自定义历史记录
        if (command === 'undo') {
          if (undoHistory.length > 0) {
            const previousContent = undoHistory[undoHistory.length - 1];
            const newUndoHistory = undoHistory.slice(0, -1);

            setIsUndoRedoAction(true);
            setRedoHistory([lastContent.current, ...redoHistory]);
            setUndoHistory(newUndoHistory);
            setCurrentContent(previousContent);
            lastContent.current = previousContent;
            setContent(previousContent);
            onChangeRef.current?.(previousContent);
          }
          return;
        }

        if (command === 'redo') {
          if (redoHistory.length > 0) {
            const nextContent = redoHistory[0];
            const newRedoHistory = redoHistory.slice(1);

            setIsUndoRedoAction(true);
            setUndoHistory([...undoHistory, lastContent.current]);
            setRedoHistory(newRedoHistory);
            setCurrentContent(nextContent);
            lastContent.current = nextContent;
            setContent(nextContent);
            onChangeRef.current?.(nextContent);
          }
          return;
        }

        // 对于insertHTML命令，使用自定义实现
        if (command === 'insertHTML') {
          insertMediaWithCursor(value);
          return;
        }

        // 其他命令正常执行
        try {
          document.execCommand(command, false, value);
        } catch (error) {
          devLog('execCommand failed:', error);
        }
      }
    },
    [undoHistory, redoHistory, setContent, insertMediaWithCursor]
  );

  // 插入文本的方法
  const insertText = useCallback((text: string) => {
    // 检查传入的文本是否有效
    if (!text || text === 'undefined' || typeof text !== 'string') {
      devLog('Invalid text passed to insertText:', text);
      return;
    }

    // 立即设置更新标志，防止useEffect干扰
    isUpdating.current = true;

    try {
      if (editorRef.current) {
        // 确保编辑器有焦点
        editorRef.current.focus();

        // 检查当前是否有有效的光标位置
        const selection = window.getSelection();
        let hasValidCursor = false;

        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          // 检查光标是否在编辑器内
          if (editorRef.current.contains(range.commonAncestorContainer)) {
            hasValidCursor = true;
            devLog('使用当前光标位置插入文本');
          }
        }

        if (!hasValidCursor) {
          // 如果没有有效的光标位置，设置到编辑器末尾
          devLog('没有有效光标位置，设置到编辑器末尾');
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }

        const success = document.execCommand('insertHTML', false, text);

        if (success) {
          // 立即更新状态，避免useEffect重置
          const newContent = editorRef.current.innerHTML;
          lastContent.current = newContent;
          setCurrentContent(newContent);
          if (onChangeRef.current) {
            onChangeRef.current(newContent);
          }
        } else {
          // 如果execCommand失败，使用手动插入
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (editorRef.current.contains(range.commonAncestorContainer)) {
              range.deleteContents();
              const textNode = document.createTextNode(text);
              range.insertNode(textNode);
              range.setStartAfter(textNode);
              range.setEndAfter(textNode);
              selection.removeAllRanges();
              selection.addRange(range);
            } else {
              const textNode = document.createTextNode(text);
              editorRef.current.appendChild(textNode);
              const newRange = document.createRange();
              newRange.setStartAfter(textNode);
              newRange.setEndAfter(textNode);
              selection?.removeAllRanges();
              selection?.addRange(newRange);
            }
          } else {
            const textNode = document.createTextNode(text);
            editorRef.current.appendChild(textNode);
            const newRange = document.createRange();
            newRange.setStartAfter(textNode);
            newRange.setEndAfter(textNode);
            selection?.removeAllRanges();
            selection?.addRange(newRange);
          }

          // 立即触发onChange
          const finalContent = editorRef.current.innerHTML;
          lastContent.current = finalContent;
          setCurrentContent(finalContent);
          if (onChangeRef.current) {
            onChangeRef.current(finalContent);
          }
        }

        // 重置更新标志
        setTimeout(() => {
          isUpdating.current = false;
        }, 0);
      }
    } catch (error) {
      devLog('插入文本失败:', error);
      // 回退方案：直接添加到编辑器末尾
      if (editorRef.current && onChangeRef.current) {
        const currentContent = editorRef.current.innerHTML || '';
        const newContent = currentContent + text;
        editorRef.current.innerHTML = newContent;
        lastContent.current = newContent;
        setCurrentContent(newContent);
        onChangeRef.current(newContent);
      }

      setTimeout(() => {
        isUpdating.current = false;
      }, 0);
    }
  }, []);

  // 处理输入事件
  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      // 标记用户正在输入
      isUserTyping.current = true;
      if (typingIdleTimeoutRef.current) {
        clearTimeout(typingIdleTimeoutRef.current);
      }

      // 检查是否正在使用输入法
      if (!isComposing) {
        const content = e.currentTarget.innerHTML;

        // 使用ref来避免频繁的状态更新
        if (content !== lastContent.current && !isUpdating.current) {
          isUpdating.current = true;

          // 记录历史（如果不是撤销/恢复操作）
          if (!isUndoRedoAction) {
            setUndoHistory((prev) => {
              const newHistory = [...prev, lastContent.current];
              // 限制历史记录数量
              return newHistory.length > MAX_HISTORY_SIZE
                ? newHistory.slice(-MAX_HISTORY_SIZE)
                : newHistory;
            });
            setRedoHistory([]); // 清空重做历史
          }

          setIsUndoRedoAction(false);

          // 使用防抖的onChange回调（内部会更新状态）
          debouncedOnChange(content);

          typingIdleTimeoutRef.current = setTimeout(() => {
            isUserTyping.current = false;
          }, 500);

          // 重置更新标志
          setTimeout(() => {
            isUpdating.current = false;
          }, 0);
        }
      }
    },
    [isComposing, isUndoRedoAction, debouncedOnChange]
  );

  // 处理失焦事件
  const handleBlur = useCallback(() => {
    // 标记用户停止输入
    isUserTyping.current = false;
    if (typingIdleTimeoutRef.current) {
      clearTimeout(typingIdleTimeoutRef.current);
    }

    // 清除防抖定时器，立即同步内容
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const flush = () => {
      const content = getContent();

      // 检查内容是否真的发生了变化
      const contentChanged = content !== lastContent.current;
      const notUpdating = !isUpdating.current;

      if (contentChanged && notUpdating) {
        isUpdating.current = true;

        // 记录历史（如果不是撤销/恢复操作）
        if (!isUndoRedoAction) {
          setUndoHistory((prev) => {
            const newHistory = [...prev, lastContent.current];
            // 限制历史记录数量
            return newHistory.length > MAX_HISTORY_SIZE
              ? newHistory.slice(-MAX_HISTORY_SIZE)
              : newHistory;
          });
          setRedoHistory([]); // 清空重做历史
        }

        lastContent.current = content;
        setCurrentContent(content);
        setIsUndoRedoAction(false);

        // 立即触发onChange回调，确保失焦时内容同步
        if (onChangeRef.current) {
          onChangeRef.current(content);
        }

        // 重置更新标志
        setTimeout(() => {
          isUpdating.current = false;
        }, 0);
      } else {
        // 即使内容没有变化，也要确保内部状态是最新的
        if (content !== lastContent.current) {
          lastContent.current = content;
          setCurrentContent(content);
        }

        // 确保内容同步到父组件
        if (onChangeRef.current && content) {
          onChangeRef.current(content);
        }
      }
    };

    // 如果正在输入法合成中，延迟处理；否则立即处理，确保同步保存
    if (isComposing) {
      setTimeout(flush, 150);
    } else {
      flush();
    }
  }, [getContent, isUndoRedoAction, isComposing]);

  // 初始化编辑器内容
  useEffect(() => {
    if (!editorRef.current) return;
    if (value === undefined) return;

    // 正在输入或输入法合成中时，忽略来自外部的覆盖，避免光标抖动/跳首
    if (isUserTyping.current || isComposing) {
      return;
    }

    // 放宽条件：只要外部 value 与内部缓存不同就同步到编辑器
    const shouldUpdate = value !== lastContent.current;
    const isInitialLoad = !isInitialized.current;

    if (!(shouldUpdate || isInitialLoad)) return;

    // 将外部 value 统一转为字符串（null/undefined 转为空串）
    const nextValue = value === null || value === undefined ? '' : String(value);

    // 检查内容是否真的需要更新
    const currentHTML = editorRef.current.innerHTML;

    // 保护：编辑器聚焦且当前有内容时，若外部值突变为空则忽略该次覆盖，避免闪烁
    const isFocused = document.activeElement === editorRef.current;
    if (isFocused && currentHTML && nextValue === '') {
      isInitialized.current = true;
      return;
    }
    if (nextValue !== currentHTML) {
      editorRef.current.innerHTML = nextValue;
      setCurrentContent(nextValue);
      lastContent.current = nextValue;
    }

    // 标记为已初始化
    isInitialized.current = true;
  }, [value, isComposing]);

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        // 立即同步内容，确保不丢失
        if (onChangeRef.current && lastContent.current) {
          onChangeRef.current(lastContent.current);
        }
      }
      if (typingIdleTimeoutRef.current) {
        clearTimeout(typingIdleTimeoutRef.current);
      }
    };
  }, []);

  return {
    editorRef,
    currentContent,
    setCurrentContent,
    getContent,
    setContent,
    insertText,
    execCommand,
    undoHistory,
    redoHistory,
    isComposing,
    setIsComposing,
    isUserTyping,
    isUpdating,
    isInitialized,
    lastContent,
    savedCursorRange,
    saveCursorPosition,
    restoreCursorPosition,
    insertMediaWithCursor,
    handleInput,
    handleBlur
  };
};

export default useEditor;
