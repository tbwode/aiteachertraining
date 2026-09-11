import { useCallback, useEffect, useRef, useState } from 'react';

interface ImageResizeState {
  selectedImage: HTMLImageElement | null;
  resizeHandles: { x: number; y: number } | null;
}

export const useImageResize = (
  editorRef: React.RefObject<HTMLDivElement>,
  onChange?: (value: string) => void
) => {
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const isResizing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  const currentImage = useRef<HTMLImageElement | null>(null);

  // 移除所有调整手柄
  const removeResizeHandles = useCallback(() => {
    if (editorRef.current) {
      const handles = editorRef.current.querySelectorAll('.img-resize-handle');
      handles.forEach((handle) => handle.remove());
    }
  }, [editorRef]);

  // 创建调整手柄
  const createResizeHandle = useCallback(
    (img: HTMLImageElement) => {
      removeResizeHandles();

      const handle = document.createElement('div');
      handle.className = 'img-resize-handle';
      handle.style.cssText = `
      position: absolute;
      width: 12px;
      height: 12px;
      background: #C8000B;
      border: 2px solid white;
      border-radius: 50%;
      cursor: nwse-resize;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;

      const rect = img.getBoundingClientRect();
      const editorRect = editorRef.current?.getBoundingClientRect();
      if (editorRect) {
        handle.style.left = `${rect.right - editorRect.left - 6}px`;
        handle.style.top = `${rect.bottom - editorRect.top - 6}px`;
      }

      editorRef.current?.appendChild(handle);
    },
    [editorRef, removeResizeHandles]
  );

  // 处理图片点击选中
  const handleImageClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 如果点击的是调整手柄，忽略
      if (target.classList.contains('img-resize-handle')) {
        return;
      }

      // 如果点击的是编辑器内部的图片
      if (target.tagName === 'IMG' && editorRef.current?.contains(target)) {
        e.preventDefault();
        e.stopPropagation();

        const img = target as HTMLImageElement;

        // 如果点击的是已经选中的图片，不处理（让 mousedown 处理）
        if (selectedImage === img) {
          return;
        }

        // 清除之前的选中状态
        if (selectedImage && selectedImage !== img) {
          selectedImage.style.outline = 'none';
          selectedImage.style.cursor = 'pointer';
        }

        setSelectedImage(img);
        currentImage.current = img;

        // 添加选中样式
        img.style.outline = '2px solid #C8000B';
        img.style.cursor = 'nwse-resize';

        // 创建调整手柄
        createResizeHandle(img);
      } else if (!isResizing.current) {
        // 点击其他地方取消选中
        if (selectedImage) {
          selectedImage.style.outline = 'none';
          selectedImage.style.cursor = 'pointer';
        }
        setSelectedImage(null);
        currentImage.current = null;
        removeResizeHandles();
      }
    },
    [selectedImage, editorRef, createResizeHandle, removeResizeHandles]
  );

  // 处理鼠标按下开始调整大小
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 如果点击的是已选中的图片，开始调整大小
      if (target.tagName === 'IMG' && target === selectedImage) {
        e.preventDefault();
        e.stopPropagation();
        isResizing.current = true;
        startPos.current = { x: e.clientX, y: e.clientY };
        startSize.current = {
          width: (target as HTMLImageElement).width,
          height: (target as HTMLImageElement).height
        };
        currentImage.current = target as HTMLImageElement;
      }
    },
    [selectedImage]
  );

  // 处理鼠标移动调整大小
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current || !currentImage.current) return;

    e.preventDefault();
    e.stopPropagation();

    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;

    // 计算新的宽度，最小 50px，最大 800px
    let newWidth = Math.max(50, Math.min(800, startSize.current.width + deltaX));

    // 保持原始宽高比
    const aspectRatio = startSize.current.width / startSize.current.height;
    let newHeight = newWidth / aspectRatio;

    currentImage.current.style.width = `${newWidth}px`;
    currentImage.current.style.maxWidth = 'none';
    currentImage.current.style.height = `${newHeight}px`;
    currentImage.current.style.objectFit = 'contain';
  }, []);

  // 处理鼠标松开结束调整
  const handleMouseUp = useCallback(() => {
    if (isResizing.current && currentImage.current && editorRef.current) {
      isResizing.current = false;

      // 更新调整手柄位置
      if (currentImage.current) {
        createResizeHandle(currentImage.current);
      }

      // 触发 onChange 通知父组件内容变化
      if (onChange) {
        const newContent = editorRef.current.innerHTML;
        onChange(newContent);
      }
    }
  }, [editorRef, onChange, createResizeHandle]);

  // 设置事件监听
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // 使用捕获阶段监听，确保在编辑器点击事件之前处理
    editor.addEventListener('mousedown', handleMouseDown, true);
    editor.addEventListener('click', handleImageClick, true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      editor.removeEventListener('mousedown', handleMouseDown, true);
      editor.removeEventListener('click', handleImageClick, true);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      removeResizeHandles();
    };
  }, [
    editorRef,
    handleImageClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    removeResizeHandles
  ]);

  return { selectedImage };
};

export default useImageResize;
