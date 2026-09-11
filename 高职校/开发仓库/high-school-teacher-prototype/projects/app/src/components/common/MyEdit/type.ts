// 编辑器属性接口
export interface MyEditProps {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: string;
  onInsertText?: (insertFn: (text: string) => void) => void;
  onGetContent?: (getContentFn: () => string) => void;
  onCursorChange?: (range: Range | null) => void;
  disabled?: boolean;
  key?: string | number;
}

// 字体大小选项接口
export interface FontSizeOption {
  value: string;
  label: string;
}

// 工具栏按钮接口
export interface ToolbarButton {
  name: string;
  icon: string;
  tooltip: string;
  onClick: () => void;
}

// 媒体元素类型
export type MediaElementType = 'AUDIO' | 'VIDEO' | 'IFRAME' | 'IMG';

// 媒体元素事件处理器接口
export interface MediaEventHandlers {
  handleMediaClick: (e: Event) => void;
  handleMediaKeyDown: (e: Event) => void;
  handleMediaDragStart: (e: Event) => void;
  handleMediaDrop: (e: Event) => void;
  handleMediaContextMenu: (e: Event) => void;
}

// 编辑器状态接口
export interface EditorState {
  currentContent: string;
  undoHistory: string[];
  redoHistory: string[];
  isComposing: boolean;
  isUserTyping: boolean;
  isUpdating: boolean;
  isInitialized: boolean;
}

// 文件上传配置接口
export interface FileUploadConfig {
  fileType: string;
  multiple: boolean;
  maxSize?: number; // 字节
}

// 媒体插入配置接口
export interface MediaInsertConfig {
  image: {
    maxSize: number;
    allowedTypes: string[];
  };
  audio: {
    maxSize: number;
    allowedTypes: string[];
  };
  video: {
    maxSize: number;
    allowedTypes: string[];
  };
}

// 编辑器命令类型
export type EditorCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'subscript'
  | 'superscript'
  | 'undo'
  | 'redo'
  | 'insertHTML'
  | 'insertText';

// 编辑器事件类型
export interface EditorEvents {
  onInput: (e: React.FormEvent<HTMLDivElement>) => void;
  onBlur: () => void;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onKeyUp: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
  onCompositionStart: (e: React.CompositionEvent<HTMLDivElement>) => void;
  onCompositionEnd: (e: React.CompositionEvent<HTMLDivElement>) => void;
}

// 光标位置接口
export interface CursorPosition {
  range: Range | null;
  saved: boolean;
}

// 历史记录接口
export interface HistoryRecord {
  content: string;
  timestamp: number;
  action: 'input' | 'command' | 'paste' | 'undo' | 'redo';
}

// 编辑器配置接口
export interface EditorConfig {
  placeholder: string;
  height: string;
  maxHistorySize: number;
  debounceDelay: number;
  enableFullscreen: boolean;
  enableMediaInsert: boolean;
  enableFormula: boolean;
  enableUndoRedo: boolean;
}

// 默认配置
export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  placeholder: '请输入内容...',
  height: '300px',
  maxHistorySize: 50,
  debounceDelay: 100,
  enableFullscreen: true,
  enableMediaInsert: true,
  enableFormula: false,
  enableUndoRedo: true
};

// 媒体元素样式配置
export interface MediaElementStyles {
  image: React.CSSProperties;
  audio: React.CSSProperties;
  video: React.CSSProperties;
  iframe: React.CSSProperties;
}

// 默认媒体元素样式
export const DEFAULT_MEDIA_STYLES: MediaElementStyles = {
  image: {
    maxWidth: '100%',
    height: 'auto',
    display: 'inline-block',
    verticalAlign: 'middle',
    margin: 0,
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  audio: {
    width: '100%',
    maxWidth: '400px',
    display: 'block',
    margin: '5px 0'
  },
  video: {
    width: '100%',
    maxWidth: '420px',
    height: 'auto',
    display: 'block',
    margin: '5px 0'
  },
  iframe: {
    border: '1px solid #ccc',
    display: 'block'
  }
};

export default function DOM() {
  return null;
}
