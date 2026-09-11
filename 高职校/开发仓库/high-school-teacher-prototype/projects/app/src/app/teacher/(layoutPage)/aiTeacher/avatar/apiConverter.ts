/**
 * API数据转换工具
 */
import type { TeachingTaskCourseSemesterGroup } from '@/teacher/types/aiTeacher';
import type { CourseOption } from './avatarStorage';

// 颜色配置数组,用于为课程分配不同的视觉样式
const COURSE_VISUAL_CONFIGS = [
  {
    heroBg: 'linear-gradient(135deg, #FEE2E2 0%, #FED7AA 100%)',
    accentColor: '#C83E3E',
    coverageBg: '#EFF6FF',
    coverageColor: '#2563EB'
  },
  {
    heroBg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
    accentColor: '#FAAD14',
    coverageBg: '#FFFBEB',
    coverageColor: '#B45309'
  },
  {
    heroBg: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)',
    accentColor: '#52C41A',
    coverageBg: '#F0FFF4',
    coverageColor: '#2F855A'
  },
  {
    heroBg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
    accentColor: '#1677FF',
    coverageBg: '#EFF6FF',
    coverageColor: '#2563EB'
  },
  {
    heroBg: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)',
    accentColor: '#EC4899',
    coverageBg: '#FDF2F8',
    coverageColor: '#BE185D'
  }
];

/**
 * 获取课程名称的首字母或首字作为heroText
 */
function getCourseHeroText(courseName: string): string {
  if (!courseName) return '课';

  // 尝试提取中文首字
  const chineseMatch = courseName.match(/[\u4e00-\u9fa5]/);
  if (chineseMatch) {
    return chineseMatch[0];
  }

  // 尝试提取英文首字母
  const englishMatch = courseName.match(/[A-Za-z]/);
  if (englishMatch) {
    return englishMatch[0].toUpperCase();
  }

  return courseName.charAt(0);
}

/**
 * 将API返回的教学任务课程数据转换为CourseOption格式
 */
export function convertTeachingTaskCoursesToOptions(
  semesterGroups: TeachingTaskCourseSemesterGroup[]
): CourseOption[] {
  const courseOptions: CourseOption[] = [];
  let colorIndex = 0;

  semesterGroups.forEach((group) => {
    if (!group?.courses) return;
    group.courses.forEach((course) => {
      // 过滤出可用的班级
      const availableClasses = course.clazzList.filter((clazz) => clazz.isAvailable);

      // 如果是必修课且没有可用班级，跳过该课程
      if (course.courseType === 1 && availableClasses.length === 0) {
        console.log('convertTeachingTaskCoursesToOptions - 跳过课程（无可用班级）:', {
          courseName: course.courseName,
          totalClazzCount: course.clazzList.length,
          availableClazzCount: 0
        });
        return;
      }

      const visualConfig = COURSE_VISUAL_CONFIGS[colorIndex % COURSE_VISUAL_CONFIGS.length];
      colorIndex++;

      const classes = availableClasses.map((clazz) => clazz.clazzName);
      const classIds = availableClasses.map((clazz) => clazz.clazzId);

      console.log('convertTeachingTaskCoursesToOptions - 转换课程:', {
        courseName: course.courseName,
        courseType: course.courseType,
        totalClazzCount: course.clazzList.length,
        availableClazzCount: classes.length,
        clazzList: course.clazzList,
        extractedClasses: classes,
        extractedClassIds: classIds
      });

      courseOptions.push({
        id: String(course.teachingTaskId),
        tenantCourseId: course.tenantCourseId, // 保存租户课程ID
        semester: group.semesterName,
        title: course.courseName,
        type: course.courseType === 1 ? 'required' : 'optional',
        hours: course.courseHours,
        classes: course.courseType === 1 ? classes : [],
        classIds: course.courseType === 1 ? classIds : [], // 保存班级ID
        majors: course.courseType === 2 ? classes : undefined,
        heroText: getCourseHeroText(course.courseName),
        heroBg: visualConfig.heroBg,
        accentColor: visualConfig.accentColor,
        coverageBg: visualConfig.coverageBg,
        coverageColor: visualConfig.coverageColor
      });
    });
  });

  console.log('convertTeachingTaskCoursesToOptions - 转换完成，总课程数:', courseOptions.length);

  return courseOptions;
}
