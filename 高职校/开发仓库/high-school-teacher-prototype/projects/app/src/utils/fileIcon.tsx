import SvgIcon, { type SvgIconProps } from '@/app/components/ui/SvgIcon';

/**
 * 文件图标渲染透传参数。
 * `src` 由工具方法内部根据文件后缀自动生成，因此对外隐藏。
 */
export type FileIconRenderProps = Omit<SvgIconProps, 'src'>;

const FILE_ICON_BASE_PATH = '/imgs/common/fileIcon';
const DEFAULT_FILE_ICON = 'txt';

const FILE_ICON_SET = new Set([
  'aac',
  'ai',
  'avi',
  'bmp',
  'css',
  'dmg',
  'doc',
  'exe',
  'flac',
  'folder',
  'gif',
  'heic',
  'heif',
  'jpeg',
  'js',
  'm4a',
  'm4v',
  'md',
  'mkv',
  'mov',
  'mp3',
  'mp4',
  'ogg',
  'png',
  'ppt',
  'psd',
  'rar',
  'svg',
  'txt',
  'wav',
  'webp',
  'wma',
  'wmv',
  'xls',
  'zip',
  'pdf'
]);

const EXTENSION_ALIAS_MAP = {
  docx: 'doc',
  pptx: 'ppt',
  xlsx: 'xls',
  jpg: 'jpeg'
} as const;

/**
 * 提取扩展名。
 * 支持以下输入形式：
 * - 普通文件名：`report.docx`
 * - URL（包含 query/hash）：`https://a.com/file.zip?x=1#test`
 * - 纯扩展名：`doc` / `.doc`
 */
const extractExtension = (input = ''): string => {
  const normalizedInput = input.trim().toLowerCase();
  if (!normalizedInput) return '';

  const withoutHash = normalizedInput.split('#')[0] ?? '';
  const withoutQuery = withoutHash.split('?')[0] ?? '';
  const rawName = withoutQuery.split('/').filter(Boolean).pop() ?? withoutQuery;

  let decodedName = rawName;
  try {
    decodedName = decodeURIComponent(rawName);
  } catch {
    decodedName = rawName;
  }

  if (!decodedName) return '';

  if (!decodedName.includes('.')) {
    return decodedName.startsWith('.') ? decodedName.slice(1) : decodedName;
  }

  return decodedName.split('.').pop() ?? '';
};

/**
 * 归一化扩展名，将同类后缀映射到统一图标名称。
 * 例如：`docx -> doc`、`pptx -> ppt`、`xlsx -> xls`。
 */
const normalizeExtension = (extension: string): string => {
  const cleanedExtension = extension.replace(/^\./, '').toLowerCase();
  if (!cleanedExtension) return '';

  const aliasedExtension =
    EXTENSION_ALIAS_MAP[cleanedExtension as keyof typeof EXTENSION_ALIAS_MAP];

  return aliasedExtension ?? cleanedExtension;
};

/**
 * 根据文件名解析最终图标名。
 * 未命中已支持图标时返回默认图标 `txt`。
 */
const resolveIconName = (fileName: string): string => {
  const extension = normalizeExtension(extractExtension(fileName));

  if (extension && FILE_ICON_SET.has(extension)) {
    return extension;
  }

  return DEFAULT_FILE_ICON;
};

/**
 * 根据文件名、URL 或纯扩展名返回文件图标组件。
 *
 * @param fileName 文件名、URL 或纯扩展名（例如 `report.docx`、`https://a.com/a.zip`、`doc`）。
 * @param props 透传给 `SvgIcon` 的展示参数（如 `size`、`width`、`height` 等），默认 `size` 为 `24px`。
 * @returns 对应文件类型的 `SvgIcon` 组件；未知类型返回 `txt.svg`。
 */
export const getFileIconByName = (fileName: string, props?: FileIconRenderProps): JSX.Element => {
  const iconName = resolveIconName(fileName);
  const iconSrc = `${FILE_ICON_BASE_PATH}/${iconName}.svg`;
  const { size = '24px', ...restProps } = props ?? {};

  return <SvgIcon src={iconSrc} size={size} {...restProps} />;
};
