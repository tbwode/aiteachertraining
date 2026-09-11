export type AdminIconName =
  | 'graduation-cap'
  | 'database'
  | 'settings'
  | 'building'
  | 'shield'
  | 'file-text'
  | 'newspaper'
  | 'book-open'
  | 'bookmark'
  | 'calendar'
  | 'users'
  | 'clock'
  | 'user'
  | 'user-check'
  | 'library'
  | 'clipboard-list'
  | 'cpu'
  | 'app-window'
  | 'layout'
  | 'book-marked'
  | 'arrow-right'
  | 'sparkles'
  | 'check-circle'
  | 'layers'
  | 'folder'
  | 'folder-open'
  | 'bell'
  | 'message'
  | 'help'
  | 'sliders';

export type AdminNavChild = {
  key: string;
  labelKey: string;
  href: string;
  icon: AdminIconName;
  descriptionKey: string;
  menuCode?: string | string[];
  disabled?: boolean;
};

export type AdminNavSection = {
  key: string;
  labelKey: string;
  icon: AdminIconName;
  menuCode?: string | string[];
  disabled?: boolean;
  children: AdminNavChild[];
};

export type AdminModuleCard = {
  key: string;
  titleKey: string;
  descriptionKey: string;
  href: string;
  icon: AdminIconName;
  categoryKey: string;
  accent: 'orange' | 'red' | 'violet' | 'teal' | 'blue' | 'indigo' | 'pink' | 'gold';
  featured?: boolean;
};

export const adminNavSections: AdminNavSection[] = [
  {
    key: 'baseData',
    labelKey: 'nav.sections.baseData',
    icon: 'database',
    menuCode: ['admin_base', 'admin_basic_info_config'],
    disabled: false,
    children: [
      {
        key: 'configuration',
        labelKey: 'nav.items.configuration',
        href: '/admin/base/configuration',
        icon: 'settings',
        descriptionKey: 'nav.descriptions.configuration',
        menuCode: ['admin_base_configuration', 'admin_custom_config'],
        disabled: false
      },
      {
        key: 'organization',
        labelKey: 'nav.items.organization',
        href: '/admin/base/organization',
        icon: 'building',
        descriptionKey: 'nav.descriptions.organization',
        menuCode: ['admin_base_organization', 'admin_organization_manage'],
        disabled: false
      },
      {
        key: 'roles',
        labelKey: 'nav.items.roles',
        href: '/admin/base/roles',
        icon: 'shield',
        descriptionKey: 'nav.descriptions.roles',
        menuCode: ['admin_base_roles', 'admin_role_manage'],
        disabled: false
      }
    ]
  },
  {
    key: 'resourceCenter',
    labelKey: 'nav.sections.resourceCenter',
    icon: 'folder',
    menuCode: ['admin_resource', 'admin_resource_manage'],
    disabled: false,
    children: [
      {
        key: 'news',
        labelKey: 'nav.items.news',
        href: '/admin/content/news',
        icon: 'newspaper',
        descriptionKey: 'nav.descriptions.news',
        menuCode: ['admin_content_news', 'admin_news_manage'],
        disabled: false
      },
      {
        key: 'teachingResources',
        labelKey: 'nav.items.teachingResources',
        href: '/admin/resource/teaching-resources',
        icon: 'folder-open',
        descriptionKey: 'nav.descriptions.teachingResources',
        menuCode: ['admin_resource_teaching', 'admin_teaching_resource_manage']
      }
    ]
  },
  {
    key: 'teaching',
    labelKey: 'nav.sections.teaching',
    icon: 'book-open',
    menuCode: ['admin_teaching', 'admin_PC_console', 'admin_teaching_manage'],
    children: [
      {
        key: 'majors',
        labelKey: 'nav.items.majors',
        href: '/admin/teaching/majors',
        icon: 'bookmark',
        descriptionKey: 'nav.descriptions.majors',
        menuCode: ['admin_teaching_majors', 'admin_major_manage']
      },
      {
        key: 'grades',
        labelKey: 'nav.items.grades',
        href: '/admin/teaching/grades',
        icon: 'calendar',
        descriptionKey: 'nav.descriptions.grades',
        menuCode: ['admin_teaching_grades', 'admin_grade_manage']
      },
      {
        key: 'classes',
        labelKey: 'nav.items.classes',
        href: '/admin/teaching/classes',
        icon: 'users',
        descriptionKey: 'nav.descriptions.classes',
        menuCode: ['admin_teaching_classes', 'admin_class_manage']
      },
      {
        key: 'semesters',
        labelKey: 'nav.items.semesters',
        href: '/admin/teaching/semesters',
        icon: 'clock',
        descriptionKey: 'nav.descriptions.semesters',
        menuCode: ['admin_teaching_semesters', 'admin_semester_manage']
      },
      {
        key: 'students',
        labelKey: 'nav.items.students',
        href: '/admin/teaching/students',
        icon: 'user',
        descriptionKey: 'nav.descriptions.students',
        menuCode: ['admin_teaching_students', 'admin_student_manage']
      },
      {
        key: 'teachers',
        labelKey: 'nav.items.teachers',
        href: '/admin/teaching/teachers',
        icon: 'user-check',
        descriptionKey: 'nav.descriptions.teachers',
        menuCode: ['admin_teaching_teachers', 'admin_teacher_manage']
      },
      {
        key: 'courses',
        labelKey: 'nav.items.courses',
        href: '/admin/teaching/courses',
        icon: 'library',
        descriptionKey: 'nav.descriptions.courses',
        menuCode: ['admin_teaching_courses', 'admin_course_manage']
      },
      {
        key: 'tasks',
        labelKey: 'nav.items.tasks',
        href: '/admin/teaching/tasks',
        icon: 'clipboard-list',
        descriptionKey: 'nav.descriptions.tasks',
        menuCode: ['admin_teaching_tasks', 'admin_teaching_task_manage']
      }
    ]
  },
  {
    key: 'talentTraining',
    labelKey: 'nav.sections.talentTraining',
    icon: 'graduation-cap',
    menuCode: ['admin_training', 'admin_graph', 'admin_graph_manage'],
    disabled: false,
    children: [
      {
        key: 'trainingPrograms',
        labelKey: 'nav.items.trainingPrograms',
        href: '/admin/training/programs',
        icon: 'book-marked',
        descriptionKey: 'nav.descriptions.trainingPrograms',
        // admin_graph 兼容新增菜单前已登录的 Mock 管理员，避免旧会话过滤掉入口。
        menuCode: ['admin_training_programs', 'admin_training', 'admin_graph'],
        disabled: false
      },
      {
        key: 'abilityGraph',
        labelKey: 'nav.items.abilityGraph',
        href: '/admin/graph/ability',
        icon: 'layers',
        descriptionKey: 'nav.descriptions.abilityGraph',
        menuCode: ['admin_graph_ability', 'admin_graph_manage'],
        disabled: false
      }
    ]
  },
  {
    key: 'account',
    labelKey: 'nav.sections.account',
    icon: 'user',
    menuCode: 'admin_account',
    children: [
      {
        key: 'profile',
        labelKey: 'nav.items.profile',
        href: '/admin/profile',
        icon: 'user',
        descriptionKey: 'nav.descriptions.profile',
        menuCode: 'admin_profile'
      }
    ]
  },
  {
    key: 'ai',
    labelKey: 'nav.sections.ai',
    icon: 'cpu',
    menuCode: ['admin_ai', 'admin_ai_app_manage'],
    disabled: true,
    children: [
      {
        key: 'apps',
        labelKey: 'nav.items.apps',
        href: '/admin/ai/apps',
        icon: 'app-window',
        descriptionKey: 'nav.descriptions.apps',
        menuCode: ['admin_ai_apps', 'admin_app_manage'],
        disabled: true
      },
      {
        key: 'scenes',
        labelKey: 'nav.items.scenes',
        href: '/admin/ai/scenes',
        icon: 'layout',
        descriptionKey: 'nav.descriptions.scenes',
        menuCode: ['admin_ai_scenes', 'admin_scene_manage'],
        disabled: true
      },
      {
        key: 'knowledge',
        labelKey: 'nav.items.knowledge',
        href: '/admin/ai/knowledge',
        icon: 'book-marked',
        descriptionKey: 'nav.descriptions.knowledge',
        menuCode: ['admin_ai_knowledge', 'admin_knowledge_manage'],
        disabled: true
      }
    ]
  }
];

export const teachingModuleCards: AdminModuleCard[] = [
  {
    key: 'majors',
    titleKey: 'home.modules.cards.majors.title',
    descriptionKey: 'home.modules.cards.majors.description',
    href: '/admin/teaching/majors',
    icon: 'book-open',
    categoryKey: 'common.categories.baseData',
    accent: 'orange'
  },
  {
    key: 'grades',
    titleKey: 'home.modules.cards.grades.title',
    descriptionKey: 'home.modules.cards.grades.description',
    href: '/admin/teaching/grades',
    icon: 'calendar',
    categoryKey: 'common.categories.baseData',
    accent: 'red'
  },
  {
    key: 'classes',
    titleKey: 'home.modules.cards.classes.title',
    descriptionKey: 'home.modules.cards.classes.description',
    href: '/admin/teaching/classes',
    icon: 'users',
    categoryKey: 'common.categories.baseData',
    accent: 'violet'
  },
  {
    key: 'semesters',
    titleKey: 'home.modules.cards.semesters.title',
    descriptionKey: 'home.modules.cards.semesters.description',
    href: '/admin/teaching/semesters',
    icon: 'clock',
    categoryKey: 'common.categories.baseData',
    accent: 'teal'
  },
  {
    key: 'students',
    titleKey: 'home.modules.cards.students.title',
    descriptionKey: 'home.modules.cards.students.description',
    href: '/admin/teaching/students',
    icon: 'user',
    categoryKey: 'common.categories.personnel',
    accent: 'blue'
  },
  {
    key: 'teachers',
    titleKey: 'home.modules.cards.teachers.title',
    descriptionKey: 'home.modules.cards.teachers.description',
    href: '/admin/teaching/teachers',
    icon: 'user-check',
    categoryKey: 'common.categories.personnel',
    accent: 'indigo'
  },
  {
    key: 'courses',
    titleKey: 'home.modules.cards.courses.title',
    descriptionKey: 'home.modules.cards.courses.description',
    href: '/admin/teaching/courses',
    icon: 'library',
    categoryKey: 'common.categories.content',
    accent: 'pink'
  },
  {
    key: 'tasks',
    titleKey: 'home.modules.cards.tasks.title',
    descriptionKey: 'home.modules.cards.tasks.description',
    href: '/admin/teaching/tasks',
    icon: 'clipboard-list',
    categoryKey: 'common.categories.core',
    accent: 'gold',
    featured: true
  }
];

export const adminOverviewStats = [
  {
    key: 'teachingModules',
    value: '8',
    labelKey: 'stats.teachingModules',
    hintKey: 'stats.teachingModulesHint'
  },
  {
    key: 'topLevelNavigation',
    value: '4',
    labelKey: 'stats.topLevelNavigation',
    hintKey: 'stats.topLevelNavigationHint'
  },
  {
    key: 'availablePages',
    value: '9',
    labelKey: 'stats.availablePages',
    hintKey: 'stats.availablePagesHint'
  },
  {
    key: 'coverage',
    value: '100%',
    labelKey: 'stats.coverage',
    hintKey: 'stats.coverageHint'
  }
] as const;

export const adminHighlights = [
  {
    key: 'architecture',
    titleKey: 'home.highlights.items.architecture.title',
    descriptionKey: 'home.highlights.items.architecture.description',
    icon: 'layers'
  },
  {
    key: 'domains',
    titleKey: 'home.highlights.items.domains.title',
    descriptionKey: 'home.highlights.items.domains.description',
    icon: 'sparkles'
  },
  {
    key: 'placeholders',
    titleKey: 'home.highlights.items.placeholders.title',
    descriptionKey: 'home.highlights.items.placeholders.description',
    icon: 'check-circle'
  }
] as const;

export const teachingModules = teachingModuleCards.map((item) => {
  const slug = item.href.split('/').pop() || '';

  return {
    ...item,
    slug
  };
});

export function getTeachingModuleBySlug(slug: string) {
  return teachingModules.find((item) => item.slug === slug);
}
