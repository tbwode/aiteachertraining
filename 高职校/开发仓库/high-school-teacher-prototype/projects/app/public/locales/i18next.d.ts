import 'i18next';
import type account_team from './zh-CN/account_team.json';
import type account from './zh-CN/account.json';
import type account_thirdParty from './zh-CN/account_thirdParty.json';
import type account_promotion from './zh-CN/account_promotion.json';
import type account_inform from './zh-CN/account_inform.json';
import type account_setting from './zh-CN/account_setting.json';
import type account_apikey from './zh-CN/account_apikey.json';
import type account_bill from './zh-CN/account_bill.json';
import type account_usage from './zh-CN/account_usage.json';
import type account_info from './zh-CN/account_info.json';
import type common from './zh-CN/common.json';
import type dataset from './zh-CN/dataset.json';
import type app from './zh-CN/app.json';
import type file from './zh-CN/file.json';
import type publish from './zh-CN/publish.json';
import type workflow from './zh-CN/workflow.json';
import type user from './zh-CN/user.json';
import type chat from './zh-CN/chat.json';
import type login from './zh-CN/login.json';
import type account_model from './zh-CN/account_model.json';
import type dashboard_mcp from './zh-CN/dashboard_mcp.json';
import type dashboard_evaluation from './zh-CN/dashboard_evaluation.json';
import type teacher_layout from './zh-CN/teacher-layout.json';
import type teacher_languageSwitcher from './zh-CN/teacher-languageSwitcher.json';
import type teacher_nav from './zh-CN/teacher-nav.json';
import type teacher_subjects from './zh-CN/teacher-subjects.json';
import type teacher_auth from './zh-CN/teacher-auth.json';
import type teacher_dashboard from './zh-CN/teacher-dashboard.json';
import type teacher_courses from './zh-CN/teacher-courses.json';
import type teacher_students from './zh-CN/teacher-students.json';
import type teacher_aiTeacher from './zh-CN/teacher-aiTeacher.json';
import type admin_layout from './zh-CN/admin-layout.json';
import type admin_languageSwitcher from './zh-CN/admin-languageSwitcher.json';
import type admin_nav from './zh-CN/admin-nav.json';
import type admin_common from './zh-CN/admin-common.json';
import type admin_auth from './zh-CN/admin-auth.json';
import type admin_home from './zh-CN/admin-home.json';
import type admin_stats from './zh-CN/admin-stats.json';
import type admin_teaching from './zh-CN/admin-teaching.json';
import type student from './zh-CN/student.json';
import type admin_grades from './zh-CN/admin-grades.json';
import type { I18N_NAMESPACES } from './constants';

type teacher = {
  layout: typeof teacher_layout;
  languageSwitcher: typeof teacher_languageSwitcher;
  nav: typeof teacher_nav;
  subjects: typeof teacher_subjects;
  auth: typeof teacher_auth;
  dashboard: typeof teacher_dashboard;
  courses: typeof teacher_courses;
  students: typeof teacher_students;
  aiTeacher: typeof teacher_aiTeacher;
};

type admin = {
  layout: typeof admin_layout;
  languageSwitcher: typeof admin_languageSwitcher;
  nav: typeof admin_nav;
  common: typeof admin_common;
  auth: typeof admin_auth;
  home: typeof admin_home;
  stats: typeof admin_stats;
  teaching: typeof admin_teaching;
  grades: typeof admin_grades;
};

export interface I18nNamespaces {
  common: typeof common;
  dataset: typeof dataset;
  app: typeof app;
  file: typeof file;
  publish: typeof publish;
  workflow: typeof workflow;
  user: typeof user;
  chat: typeof chat;
  login: typeof login;
  account_info: typeof account_info;
  account_usage: typeof account_usage;
  account_bill: typeof account_bill;
  account_apikey: typeof account_apikey;
  account_setting: typeof account_setting;
  account_inform: typeof account_inform;
  account_promotion: typeof account_promotion;
  account: typeof account;
  account_team: typeof account_team;
  account_thirdParty: typeof account_thirdParty;
  account_model: typeof account_model;
  dashboard_mcp: typeof dashboard_mcp;
  dashboard_evaluation: typeof dashboard_evaluation;
  teacher: typeof teacher;
  admin: typeof admin;
  student: typeof student;
}

export type I18nNsType = (keyof I18nNamespaces)[];

export type ParseKeys<Ns extends keyof I18nNamespaces = keyof I18nNamespaces> = {
  [K in Ns]: `${K}:${keyof I18nNamespaces[K] & string}`;
}[Ns];

export type I18nKeyFunction = {
  <Key extends ParseKeys>(key: Key): Key;
};

declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false;
    defaultNS: I18N_NAMESPACES;
    resources: I18nNamespaces;
  }
}
