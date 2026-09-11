export enum StudentNotificationTypeCodeEnum {
  HOMEWORK = 'HOMEWORK',
  RESOURCE = 'RESOURCE',
  STUDENT_HOMEWORK = 'STUDENT_HOMEWORK',
  APP_CENTER = 'APP_CENTER',
  APP_CENTER_NEWS = 'APP_CENTER_NEWS',
  RESOURCE_NEWS = 'RESOURCE_NEWS',
  GROUP = 'GROUP',
  WORKSHEET = 'WORKSHEET',
  TEAM = 'TEAM',
  COURSE = 'COURSE'
}

export enum StudentNotificationModuleCodeEnum {
  HOMEWORK_DEADLINE = 'HOMEWORK_DEADLINE',
  HOMEWORK_SUBMIT = 'HOMEWORK_SUBMIT',
  AI_CORRECTION_PROGRESS = 'AI_CORRECTION_PROGRESS',
  AI_CORRECTION_COMPLETE = 'AI_CORRECTION_COMPLETE',
  STUDENT_CORRECTION_SUBMIT = 'STUDENT_CORRECTION_SUBMIT',
  STUDENT_CORRECTION_COMPLETE = 'STUDENT_CORRECTION_COMPLETE',
  RESOURCE_REJECTION = 'RESOURCE_REJECTION',
  STUDENT_HOMEWORK_PUBLISHED = 'STUDENT_HOMEWORK_PUBLISHED',
  STUDENT_HOMEWORK_SUBMITTED = 'STUDENT_HOMEWORK_SUBMITTED',
  STUDENT_HOMEWORK_REVIEWED = 'STUDENT_HOMEWORK_REVIEWED',
  STUDENT_HOMEWORK_OVERDUE = 'STUDENT_HOMEWORK_OVERDUE',
  SHARE_APP_INVITE = 'SHARE_APP_INVITE',
  STUDENT_HOMEWORK_UPDATE_SU = 'STUDENT_HOMEWORK_UPDATE_SU',
  RESOURCE_REVIEW_NO_PASS = 'RESOURCE_REVIEW_NO_PASS',
  APP_CENTER_NEWS = 'APP_CENTER_NEWS',
  RESOURCE_NEWS = 'RESOURCE_NEWS',
  GROUP_EXTERNAL_APPLICATION_RI = 'GROUP_EXTERNAL_APPLICATION_RI',
  GROUP_EXTERNAL_APPLICATION_AI = 'GROUP_EXTERNAL_APPLICATION_AI',
  GROUP_RESOURCE_REMOVED = 'GROUP_RESOURCE_REMOVED',
  GROUP_EXTERNAL_APPLICATION_TK = 'GROUP_EXTERNAL_APPLICATION_TK',
  SUTDENT_WORKSHEET_PUBLISHED = 'SUTDENT_WORKSHEET_PUBLISHED',
  SUTDENT_WORKSHEET_STRUCTURE = 'SUTDENT_WORKSHEET_STRUCTURE',
  SUTDENT_WORKSHEET_TASK_LATE = 'SUTDENT_WORKSHEET_TASK_LATE',
  SUTDENT_WORKSHEET_TASK_24LA1 = 'SUTDENT_WORKSHEET_TASK_24LA1',
  SUTDENT_WORKSHEET_TASK_URGE = 'SUTDENT_WORKSHEET_TASK_URGE',
  SUTDENT_WORKSHEET_TASK_CORR = 'SUTDENT_WORKSHEET_TASK_CORR',
  SUTDENT_WORKSHEET_TASK_REOR = 'SUTDENT_WORKSHEET_TASK_REOR',
  SUTDENT_TEAM_JOIN = 'SUTDENT_TEAM_JOIN',
  SUTDENT_TEAM_LEADER = 'SUTDENT_TEAM_LEADER',
  SUTDENT_TEAM_CORRECTION = 'SUTDENT_TEAM_CORRECTION',
  AI_ADMINISTRATION_NOTICE = 'AI_ADMINISTRATION_NOTICE',
  STUDY_REMIND = 'STUDY_REMIND',
  SELECT_SUCCESS = 'SELECT_SUCCESS'
}

export enum StudentNotificationReadStatusEnum {
  UNREAD = 0,
  READ = 1
}

export type NotificationExtensionParams = Record<string, string | number | boolean | null>;
export type StudentNotificationModuleCode =
  | StudentNotificationModuleCodeEnum
  | `${StudentNotificationModuleCodeEnum}`;

export type StudentNotificationPageParams = {
  current?: number;
  size?: number;
  ascs?: string;
  descs?: string;
  searchKey?: string;
  receiverId: number;
  typeCode?: StudentNotificationTypeCodeEnum | `${StudentNotificationTypeCodeEnum}`;
  typeCodes?: Array<StudentNotificationTypeCodeEnum | `${StudentNotificationTypeCodeEnum}`>;
  moduleCode?: StudentNotificationModuleCode;
  moduleCodes?: StudentNotificationModuleCode[];
  readStatus?: StudentNotificationReadStatusEnum | 0 | 1;
};

export type StudentNotificationReadParams = {
  notificationId: number;
  receiverId?: number;
};

export type StudentNotificationRecord = {
  id: number;
  title?: string;
  content?: string;
  senderId?: number;
  typeModuleId?: number;
  status?: number;
  readStatus?: StudentNotificationReadStatusEnum | 0 | 1;
  notificationTime?: string;
  createTime?: string;
  extensionParams?: NotificationExtensionParams;
  typeCode?: StudentNotificationTypeCodeEnum | `${StudentNotificationTypeCodeEnum}`;
  moduleCode?: StudentNotificationModuleCode;
};

export type StudentNotificationPageResponse = {
  records: StudentNotificationRecord[];
  total: number;
  size: number;
  current: number;
  pages?: number;
};
