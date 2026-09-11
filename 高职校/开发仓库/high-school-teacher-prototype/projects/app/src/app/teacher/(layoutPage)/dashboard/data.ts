export type TeacherDashboardData = {
  summary: Array<{
    id: 'weeklyCourses' | 'pendingAssignments' | 'focusStudents';
    value: number;
  }>;
  todos: Array<'gradeHomework' | 'confirmOpenClass' | 'followUpAlerts'>;
};

export async function getTeacherDashboardData(): Promise<TeacherDashboardData> {
  return {
    summary: [
      { id: 'weeklyCourses', value: 18 },
      { id: 'pendingAssignments', value: 36 },
      { id: 'focusStudents', value: 8 }
    ],
    todos: ['gradeHomework', 'confirmOpenClass', 'followUpAlerts']
  };
}
