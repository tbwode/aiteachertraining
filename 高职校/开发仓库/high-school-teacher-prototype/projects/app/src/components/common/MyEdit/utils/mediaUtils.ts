// 媒体元素类型常量
export const MEDIA_ELEMENTS = ['AUDIO', 'VIDEO', 'IFRAME', 'IMG'] as const;

// 检查是否为媒体元素的辅助函数
export const isMediaElement = (element: HTMLElement): boolean => {
  return MEDIA_ELEMENTS.includes(element.tagName as any);
};

// 媒体元素事件处理器
export const createMediaEventHandlers = () => {
  const handleMediaClick = (e: Event) => {
    const target = e.target as HTMLElement;
    if (isMediaElement(target)) {
      e.stopPropagation();
    }
  };

  const handleMediaKeyDown = (e: Event) => {
    const target = e.target as HTMLElement;
    if (isMediaElement(target)) {
      e.stopPropagation();
    }
  };

  const handleMediaDragStart = (e: Event) => {
    const target = e.target as HTMLElement;
    if (isMediaElement(target)) {
      e.preventDefault();
      return false;
    }
  };

  const handleMediaDrop = (e: Event) => {
    const target = e.target as HTMLElement;
    if (isMediaElement(target)) {
      e.preventDefault();
      return false;
    }
  };

  const handleMediaContextMenu = (e: Event) => {
    const target = e.target as HTMLElement;
    if (isMediaElement(target)) {
      e.preventDefault();
      return false;
    }
  };

  return {
    handleMediaClick,
    handleMediaKeyDown,
    handleMediaDragStart,
    handleMediaDrop,
    handleMediaContextMenu
  };
};

// 设置媒体元素属性
export const setupMediaElement = (element: HTMLElement) => {
  // 只对音频、视频、iframe等交互式媒体元素设置contenteditable=false
  // 图片元素可以被正常选中和删除
  if (element.tagName !== 'IMG') {
    element.setAttribute('contenteditable', 'false');
  }
};

// 检查是否选中了媒体元素
export const checkMediaElementSelection = (
  startContainer: Node,
  editorRef: React.RefObject<HTMLDivElement>
): boolean => {
  let currentNode = startContainer;
  while (currentNode && currentNode !== editorRef.current) {
    if (currentNode.nodeType === Node.ELEMENT_NODE && isMediaElement(currentNode as HTMLElement)) {
      return true;
    }
    const parent = currentNode.parentNode;
    if (!parent) break;
    currentNode = parent;
  }
  return false;
};

// 视频URL转换
export const convertVideoUrl = (url: string): string => {
  // 优酷
  if (url.includes('youku.com')) {
    const match = url.match(/id_([a-zA-Z0-9]+)/);
    if (match) {
      return `http://player.youku.com/embed/${match[1]}`;
    }
  }
  // 腾讯视频
  if (url.includes('v.qq.com')) {
    const match = url.match(/[?&]vid=([a-zA-Z0-9]+)/);
    if (match) {
      return `https://v.qq.com/txp/iframe/player.html?vid=${match[1]}`;
    }
  }
  // Bilibili
  if (url.includes('bilibili.com')) {
    const match = url.match(/av(\d+)/);
    if (match) {
      return `https://player.bilibili.com/player.html?aid=${match[1]}`;
    }
  }
  return url;
};

// 生成媒体元素HTML
export const generateMediaHTML = {
  image: (url: string) =>
    `<img src="${url}" alt="上传的图片" style="max-width: 100%; width: 200px; height: auto; display: inline-block; vertical-align: middle; margin: 0; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;" class="editor-image" />`,

  audio: (url: string) =>
    `<p><br></p><audio controls contenteditable="false" style="width: 100%; max-width: 400px; display: block; margin: 5px 0;"><source src="${url}" type="audio/mpeg"><source src="${url}" type="audio/wav"><source src="${url}" type="audio/ogg">您的浏览器不支持音频播放。</audio><p><br></p>`,

  video: (url: string, isUpload = false) => {
    const convertedUrl = isUpload ? url : convertVideoUrl(url);

    if (
      !isUpload &&
      (url.includes('youku.com') || url.includes('v.qq.com') || url.includes('bilibili.com'))
    ) {
      return `<p><br></p><iframe src="${convertedUrl}" width="420" height="280" frameborder="0" allowfullscreen contenteditable="false" style="border: 1px solid #ccc; display: block; margin: 5px 0;"></iframe><p><br></p>`;
    } else {
      return `<p><br></p><video controls contenteditable="false" style="width: 100%; max-width: 420px; height: auto; display: block; margin: 5px 0;"><source src="${convertedUrl}" type="video/mp4"><source src="${convertedUrl}" type="video/webm"><source src="${convertedUrl}" type="video/ogg">您的浏览器不支持视频播放。</video><p><br></p>`;
    }
  },

  formula: (url: string) =>
    `<img src="${url}" alt="数学公式" style="max-width: 100%; height: auto; vertical-align: middle; display: inline-block;" class="math-formula" />`
};

export default function DOM() {
  return null;
}
