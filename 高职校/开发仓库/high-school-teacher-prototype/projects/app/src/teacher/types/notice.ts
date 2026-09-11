export enum TeacherNotificationTypeCodeEnum {
  COURSE = 'COURSE',
  COURSE_STUDY = 'COURSE_STUDY',
  AI_REPLY = 'AI_REPLY',
  SYSTEM = 'SYSTEM',
  COURSE_DEADLINE = 'COURSE_DEADLINE',
  COURSE_UPDATE = 'COURSE_UPDATE',
  STUDY_REMIND = 'STUDY_REMIND'
}

export enum TeacherNotificationReadStatusEnum {
  UNREAD = 0,
  READ = 1
}

export type NotificationExtensionParams = Record<string, string | number | boolean | null>;

export type TeacherNotificationPageParams = {
  current?: number;
  size?: number;
  ascs?: string;
  descs?: string;
  searchKey?: string;
  receiverId: number;
  typeCode?: TeacherNotificationTypeCodeEnum | `${TeacherNotificationTypeCodeEnum}`;
  typeCodes?: Array<TeacherNotificationTypeCodeEnum | `${TeacherNotificationTypeCodeEnum}`>;
  moduleCode?: string;
  moduleCodes?: string[];
  readStatus?: TeacherNotificationReadStatusEnum | 0 | 1;
};

export type TeacherNotificationReadParams = {
  notificationId: number;
  receiverId?: number;
};

export type TeacherNotificationRecord = {
  id: number;
  title?: string;
  content?: string;
  senderId?: number;
  typeModuleId?: number;
  status?: number;
  readStatus?: TeacherNotificationReadStatusEnum | 0 | 1;
  notificationTime?: string;
  createTime?: string;
  extensionParams?: NotificationExtensionParams;
  typeCode?: TeacherNotificationTypeCodeEnum | `${TeacherNotificationTypeCodeEnum}`;
  moduleCode?: string;
};

export type TeacherNotificationPageResponse = {
  records: TeacherNotificationRecord[];
  total: number;
  size: number;
  current: number;
  pages?: number;
};
