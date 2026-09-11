import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTeachingModuleBySlug, teachingModules } from '@/app/admin/_config/adminConfig';
import TeachingModulePageClient from './TeachingModulePageClient';
import MajorsPageClient from './MajorsPageClient';
import CoursesPageClient from './CoursesPageClient';
import TasksPageClient from './TasksPageClient';
import GradesPageClient from './GradesPageClient';
import StudentsPageClient from './StudentsPageClient';
import SemestersPageClient from './SemestersPageClient';
import TeachersPageClient from './TeachersPageClient';
import ConfigurationPageClient from '../../base/configuration/ConfigurationPageClient';
import ClassesPageClient from './ClassesPageClient';
import TeachingModulePageMetaSync from './TeachingModulePageMetaSync';

type TeachingModulePageProps = {
  params: {
    module: string;
  };
};

export function generateStaticParams() {
  return teachingModules.map((item) => ({
    module: item.slug
  }));
}

// 静态导出模式下无法按用户语言在服务端实时生成 metadata，页面实际标题与描述在客户端按当前语言同步。
export function generateMetadata(): Metadata {
  return {
    title: 'Teaching Management | Admin Portal',
    description: 'Teaching management module page.'
  };
}

export default function TeachingModulePage({ params }: TeachingModulePageProps) {
  const currentModule = getTeachingModuleBySlug(params.module);

  if (!currentModule) {
    notFound();
  }

  let pageContent = <TeachingModulePageClient moduleSlug={params.module} />;

  if (params.module === 'majors') {
    pageContent = <MajorsPageClient />;
  }

  if (params.module === 'courses') {
    pageContent = <CoursesPageClient />;
  }

  if (params.module === 'tasks') {
    pageContent = <TasksPageClient />;
  }

  if (params.module === 'grades') {
    pageContent = <GradesPageClient />;
  }

  if (params.module === 'students') {
    pageContent = <StudentsPageClient />;
  }

  if (params.module === 'semesters') {
    pageContent = <SemestersPageClient />;
  }

  if (params.module === 'teachers') {
    pageContent = <TeachersPageClient />;
  }

  if (params.module === 'configuration') {
    pageContent = <ConfigurationPageClient />;
  }

  if (params.module === 'classes') {
    pageContent = <ClassesPageClient />;
  }

  return (
    <TeachingModulePageMetaSync
      titleKey={currentModule.titleKey}
      descriptionKey={currentModule.descriptionKey}
    >
      {pageContent}
    </TeachingModulePageMetaSync>
  );
}
