export const HUMAN_ICON = `/icon/human.svg`;
/** 默认Logo图标 */
const DEFAULT_LOGO_ICON = `/zhique_ui/logo/logo.svg`;
export const LOGO_ICON = process.env.LOGO_ICON_PATH || DEFAULT_LOGO_ICON;
/** 全图标 */
const DEFAULT_FULL_ICON = `/zhique_ui/logo/full_logo.svg`;
export const FULL_ICON = process.env.FULL_LOGO_PATH || DEFAULT_FULL_ICON;
/** 圆形图标 */
const DEFAULT_CIRCLE_ICON = `/zhique_ui/logo/circle_logo.svg`;
export const CIRCLE_ICON = process.env.CIRCLE_LOGO_PATH || DEFAULT_CIRCLE_ICON;
export const HUGGING_FACE_ICON = `/imgs/model/huggingface.svg`;

export const DEFAULT_TEAM_AVATAR = `/imgs/avatar/defaultTeamAvatar.svg`;
export const DEFAULT_ORG_AVATAR = '/imgs/avatar/defaultOrgAvatar.svg';
export const DEFAULT_USER_AVATAR = '/imgs/avatar/BlueAvatar.svg';

export const isProduction = process.env.NODE_ENV === 'production';
export const isTestEnv = process.env.NODE_ENV === 'test';
