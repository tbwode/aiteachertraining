'use client';

import { useSearchParams } from 'next/navigation';
import { CourseDetailPageClient } from './CourseDetailPageClient';
import type { CourseDetailQuery } from '../types';

const getSearchParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export function CourseDetailPageWrapper() {
  const searchParams = useSearchParams();

  const query: CourseDetailQuery = {
    avatarId: getSearchParamValue(searchParams.get('avatarId')),
    courseId: getSearchParamValue(searchParams.get('courseId')),
    teachingTaskId: getSearchParamValue(searchParams.get('teachingTaskId')),
    majorName: getSearchParamValue(searchParams.get('majorName')),
    teacherName: getSearchParamValue(searchParams.get('teacherName')),
    hours: getSearchParamValue(searchParams.get('hours'))
  };

  return <CourseDetailPageClient query={query} />;
}
