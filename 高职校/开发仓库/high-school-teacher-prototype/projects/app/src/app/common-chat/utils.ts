export function formatCourseOptions(options: Array<{ course_name: string; tenant_course_id: number }>) {
  return options.map((item) => ({
    label: item.course_name,
    value: String(item.tenant_course_id),
  }));
}
