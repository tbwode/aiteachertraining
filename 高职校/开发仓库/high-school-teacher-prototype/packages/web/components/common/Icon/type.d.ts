import type { iconPaths } from './constants';
import type { iconPaths as zqIconPath } from './zq_constants';

export type IconNameType = keyof typeof iconPaths | keyof typeof zqIconPath;
