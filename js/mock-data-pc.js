// mock-data.js - 培训管理业务假数据

const MOCK_COURSE_TYPES = [
  {
    id: 'ct1',
    name: '师德师风',
    children: [
      { id: 'ct1-1', name: '职业道德', children: [] },
      { id: 'ct1-2', name: '师风建设', children: [] }
    ]
  },
  {
    id: 'ct2',
    name: '教学能力',
    children: [
      { id: 'ct2-1', name: '教学设计', children: [] },
      { id: 'ct2-2', name: '课堂管理', children: [] },
      { id: 'ct2-3', name: '教学评价', children: [] }
    ]
  },
  {
    id: 'ct3',
    name: '信息技术',
    children: [
      { id: 'ct3-1', name: '智慧课堂', children: [] },
      { id: 'ct3-2', name: 'AI应用', children: [] }
    ]
  },
  {
    id: 'ct4',
    name: '心理健康',
    children: []
  }
];

const MOCK_ORGANIZATION = [
  {
    id: 'o1',
    name: '教务处',
    children: [
      { id: 'o1-1', name: '教学研究组', children: [] },
      { id: 'o1-2', name: '课程开发组', children: [] }
    ]
  },
  {
    id: 'o2',
    name: '教师发展中心',
    children: [
      { id: 'o2-1', name: '新教师培训部', children: [] },
      { id: 'o2-2', name: '骨干教师培训部', children: [] }
    ]
  },
  {
    id: 'o3',
    name: '信息中心',
    children: []
  }
];

const MOCK_COURSES = [
  {
    id: 'c1',
    name: '新时代教师职业道德规范',
    type: ['ct1', 'ct1-1'],
    typeName: '师德师风 / 职业道德',
    status: 'published',
    instructor: '王晓明 / 教育部教师发展中心',
    sections: 8,
    rating: 4.8,
    learners: 342,
    updateTime: '2025-05-20 14:30:00',
    cover: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=225&fit=crop',
    description: '<p>本课程系统阐述了新时代教师职业道德规范的核心要义...</p>',
    departments: ['o1', 'o1-1'],
    creator: '李明',
    creatorPhone: '13800138001',
    rootTypeName: '师德师风',
    hours: 3.0,
    contentDescription: '<h4>课程内容简介</h4><p>本课程围绕《新时代教师职业道德规范》展开，系统讲解教师职业道德的历史演变、核心内涵与实践要求。课程涵盖爱国守法、爱岗敬业、关爱学生、教书育人、为人师表、终身学习六大规范模块，结合真实教育场景案例，帮助教师深刻理解师德规范的精神实质，并将其内化于心、外化于行。</p><h4>课程学习目标</h4><ul><li>理解新时代教师职业道德规范的核心要义与政策背景</li><li>掌握师德规范在教育教学中的具体应用场景</li><li>提升教师职业认同感和道德修养水平</li></ul>',
    teacherIntro: '<h4>名师介绍</h4><p><strong>王晓明</strong>，教育部教师发展中心高级讲师，从事教师职业道德研究20余年。主编《新时代教师职业道德建设指南》，在全国教师培训中授课超过500场次，培训教师逾10万人。</p>',
    knowledgeGraph: ['职业道德概述', '师德规范体系', '爱国守法', '爱岗敬业', '关爱学生', '教书育人', '为人师表', '终身学习', '师德案例分析', '师生伦理关系', '家校沟通伦理', '学术诚信', '教育公平', '师德评价标准', '师德违规处理', '师德楷模学习', '师德宣誓制度', '师德档案建设'],
    coreValue: '本课程聚焦教师职业道德规范落实难的现实痛点，对标《新时代教师职业行为十项准则》政策要求。学员将系统掌握师德规范的理论框架与实践路径，形成"知-信-行"一体化的师德认知结构，学完能够在日常教育教学中自觉践行师德规范，提升职业幸福感与社会公信力。',
    keyDifficulties: '课程核心难点在于将抽象的师德规范转化为具体可操作的日常行为。教师常见误区：1. 把师德学习当作"形式主义"任务，缺乏内化动力；2. 在师生冲突、家校矛盾等复杂情境中难以准确判断师德边界；3. 工学矛盾突出，难以将师德研修成果持续转化为教学行为。',
    tieredAdvice: '【新教师】重点建立师德规范认知框架，通过案例研讨理解六大规范的具体表现，完成师德承诺书撰写与宣誓；【骨干教师】聚焦师德示范引领作用，承担师德微讲座任务，指导新教师处理师德困境；【资深教师】深入师德研究，形成师德建设论文或校本师德课程方案，带动学科组师德文化营造。'
  },
  {
    id: 'c2',
    name: '智慧课堂教学设计与实践',
    type: ['ct3', 'ct3-1'],
    typeName: '信息技术 / 智慧课堂',
    status: 'published',
    rootTypeName: '信息技术',
    instructor: '张晓燕 / 智慧教育研究院',
    sections: 12,
    rating: 4.6,
    learners: 256,
    updateTime: '2025-05-18 09:15:00',
    cover: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&h=225&fit=crop',
    description: '<p>深入讲解智慧课堂的设计理念与实施策略...</p>',
    departments: ['o2', 'o2-1'],
    creator: '张华',
    creatorPhone: '13900139001',
    hours: 4.0,
    contentDescription: '<h4>课程内容简介</h4><p>本课程系统讲解智慧课堂的设计理念、技术架构与实施策略。从智慧课堂的定义与特征出发，深入剖析互动教学、精准教学、个性化学习等核心场景，结合智慧黑板、教学平台、数据分析工具等主流技术，帮助教师实现从"经验驱动"到"数据驱动"的教学转型。</p><h4>课程学习目标</h4><ul><li>理解智慧课堂的核心理念与技术架构</li><li>掌握智慧课堂环境下的教学设计与组织实施方法</li><li>能够运用数据工具进行学情分析与教学优化</li></ul>',
    teacherIntro: '<h4>名师介绍</h4><p><strong>张晓燕</strong>，智慧教育研究院研究员，国家智慧教育平台核心设计者之一。主持国家级智慧课堂课题3项，发表智慧教育相关论文20余篇，在智慧课堂教学设计领域具有丰富的理论与实践积累。</p>',
    knowledgeGraph: ['智慧课堂概述', '互动教学', '精准教学', '个性化学习', '智慧黑板应用', '教学数据分析', '学情诊断', '教学策略调整', '翻转课堂设计', '微课制作', '在线协作学习', '实时反馈系统', '学习路径推荐', '课堂行为分析', '智慧教室环境', '数字资源管理', '混合式教学', '技术融合评估', '信息化教学伦理'],
    coreValue: '本课程直击"技术融入教学浮于表面"的痛点，响应《教育信息化2.0行动计划》及智慧教育示范区建设政策。学员将掌握智慧课堂环境下的教学设计能力、技术工具应用能力和数据驱动决策能力，学完能够独立设计并实施一节智慧课堂示范课，显著提升课堂教学效率与学生学习参与度。',
    keyDifficulties: '核心难点在于技术与教学的深度融合，而非简单的技术工具使用。教师常见误区：1. 过度依赖技术展示，忽视教学目标的达成；2. 数据素养不足，面对海量学情数据无从下手；3. 智慧课堂与传统课堂管理模式的冲突，导致课堂秩序混乱；4. 忽视学生数字素养差异，造成新的学习不公平。',
    tieredAdvice: '【新教师】从单一工具入手（如智慧黑板的互动功能），在成熟课例中模仿实践，逐步建立技术信心；【骨干教师】系统学习智慧课堂设计框架，尝试将数据分析融入单元教学规划，形成可推广的智慧课堂模板；【资深教师】探索智慧课堂与学科核心素养的融合路径，承担校级智慧课堂示范课，带动教研组整体转型。'
  },
  {
    id: 'c3',
    name: 'AI赋能教学创新',
    type: ['ct3', 'ct3-2'],
    typeName: '信息技术 / AI应用',
    status: 'published',
    instructor: '陈技术 / AI教育实验室',
    sections: 6,
    rating: 0,
    learners: 0,
    updateTime: '2025-05-15 16:45:00',
    cover: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=225&fit=crop',
    description: '<p>探索人工智能在教学中的创新应用场景...</p>',
    departments: ['o3'],
    creator: '王强',
    creatorPhone: '13700137001',
    rootTypeName: '信息技术',
    hours: 3.0,
    contentDescription: '<h4>课程内容简介</h4><p>本课程探索人工智能在教育教学中的创新应用场景。从AI技术原理入门到教学应用落地，涵盖AI辅助教学设计、智能作业批改、学情智能诊断、个性化学习推荐等核心模块，帮助教师把握AI教育的前沿趋势，提升数字化教学竞争力。</p><h4>课程学习目标</h4><ul><li>了解AI技术的基本原理与教育应用趋势</li><li>掌握AI辅助教学设计的工具与方法</li><li>能够运用AI工具进行学情诊断与个性化教学</li></ul>',
    teacherIntro: '<h4>名师介绍</h4><p><strong>陈技术</strong>，AI教育实验室主任，清华大学人工智能教育学博士。致力于AI赋能教育研究，开发AI辅助教学工具5款，在国内外核心期刊发表AI教育论文30余篇，是AI+教育领域的青年领军学者。</p>',
    knowledgeGraph: ['AI技术基础', 'AI辅助教学设计', '智能作业批改', '学情智能诊断', '个性化学习推荐', 'AI伦理与安全', '教育大模型应用', 'AI教学案例分析', 'Prompt工程', 'AI生成内容审核', '学生AI素养培养', 'AI辅助教研', '智能辅导系统', '语音与图像识别教学', '自适应学习平台', 'AI数据隐私保护', '人机协同教学', '未来教育趋势'],
    coreValue: '本课程回应教师"AI焦虑"与"技术代差"痛点，对接《生成式人工智能服务管理暂行办法》及教育数字化转型政策。学员将建立AI教育应用的正确认知，掌握AI工具与教学场景的匹配能力，学完能够运用AI工具优化备课流程、实现精准教学反馈，成为AI时代的适应性教师。',
    keyDifficulties: '核心难点在于AI工具选择的判断力与教学伦理边界的把握。教师常见误区：1. 过度依赖AI生成内容，忽视教师专业判断与创造性劳动；2. 对学生使用AI工具监管缺位，导致学术诚信问题；3. 将AI视为"万能解药"，忽视教学基本功的修炼；4. 隐私保护意识薄弱，学生数据使用不当。',
    tieredAdvice: '【新教师】从AI辅助备课和作业设计入手，学习使用1-2个主流AI教育工具，建立AI教学应用的基本认知；【骨干教师】探索AI与学科教学的融合创新，尝试基于AI学情数据的差异化教学设计，形成AI教学应用案例；【资深教师】引领AI教学伦理讨论，制定学科AI使用规范，承担AI教学示范课与跨学科AI项目指导。'
  },
  {
    id: 'c4',
    name: '学生心理健康辅导技巧',
    type: ['ct4'],
    typeName: '心理健康',
    status: 'published',
    rootTypeName: '心理健康',
    instructor: '刘心理 / 心理咨询中心',
    sections: 10,
    rating: 4.9,
    learners: 189,
    updateTime: '2025-05-10 11:20:00',
    cover: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=225&fit=crop',
    description: '<p>掌握学生心理健康辅导的核心技巧...</p>',
    departments: ['o2', 'o2-2'],
    creator: '赵敏',
    creatorPhone: '13600136001',
    rootTypeName: '心理健康',
    hours: 2.0,
    contentDescription: '<h4>课程内容简介</h4><p>本课程系统讲解学生心理健康辅导的核心理论与实操技巧。从发展心理学视角出发，聚焦学生常见心理问题识别、心理危机预警、个体辅导与团体辅导技术，结合校园真实案例，帮助教师建立心理健康教育的第一道防线。</p><h4>课程学习目标</h4><ul><li>掌握学生心理发展规律与常见心理问题识别方法</li><li>学会心理危机预警信号识别与初步干预技巧</li><li>掌握个体辅导与团体辅导的基本技术</li></ul>',
    teacherIntro: '<h4>名师介绍</h4><p><strong>刘心理</strong>，心理咨询中心主任，注册心理师（中国心理学会）。从事学校心理健康教育18年，辅导个案超过3000例，出版《学生心理危机干预手册》等专著4部，是校园心理健康教育领域的资深专家。</p>',
    knowledgeGraph: ['心理健康概述', '发展心理学', '心理问题识别', '心理危机预警', '个体辅导技术', '团体辅导技术', '家校协同', '心理档案建设', '积极心理学', '情绪管理策略', '压力应对技术', '心理测评工具', '校园欺凌干预', '特殊学生心理支持', '心理危机干预流程', '心理咨询伦理', '心理委员培训', '班级心理氛围营造'],
    coreValue: '本课程针对教师"不敢管、不会管"学生心理问题的现实困境，落实《中小学心理健康教育指导纲要》及《全面加强和改进新时代学生心理健康工作专项行动计划》政策要求。学员将掌握心理问题识别、危机预警与初步干预的系统能力，学完能够有效识别班级心理风险信号，开展基础心理辅导，构建家校协同的心理支持网络。',
    keyDifficulties: '核心难点在于心理问题的边界判断与危机干预的伦理把握。教师常见误区：1. 将心理问题简单归因于"态度不好"或"家庭教育缺失"；2. 缺乏保密意识，学生隐私保护不当；3. 过度介入超出自身能力范围的心理危机，延误专业转介时机；4. 忽视自身心理耗竭，导致职业倦怠。',
    tieredAdvice: '【新教师】重点掌握学生心理发展规律与常见问题识别方法，建立班级心理观察日志，学会与心理老师的基本协作流程；【骨干教师】系统学习心理危机预警与干预流程，承担班级心理委员指导任务，能够组织小型团体辅导活动；【资深教师】成为学校心理健康教育骨干，参与心理危机干预小组，开展心理健康教育主题教研，带动班主任队伍心理素养提升。'
  },
  {
    id: 'c5',
    name: '高效课堂教学管理策略',
    type: ['ct2', 'ct2-2'],
    typeName: '教学能力 / 课堂管理',
    status: 'published',
    rootTypeName: '教学能力',
    instructor: '孙管理 / 教学管理研究所',
    sections: 5,
    rating: 0,
    learners: 0,
    updateTime: '2025-05-08 13:10:00',
    cover: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=225&fit=crop',
    description: '<p>学习高效课堂管理的实用策略...</p>',
    departments: ['o1'],
    creator: '周杰',
    creatorPhone: '13500135001',
    hours: 3.0,
    contentDescription: '<h4>课程内容简介</h4><p>本课程聚焦高效课堂教学管理的核心策略与实操方法。从课堂规则建立、学生动机激发、问题行为处理、课堂氛围营造等维度出发，结合不同学段、不同学科的管理案例，帮助教师建立系统化的课堂管理思维，实现"管得住、管得好、管得巧"的课堂管理目标。</p><h4>课程学习目标</h4><ul><li>掌握课堂规则建立与学生动机激发的系统方法</li><li>学会不同类型问题行为的识别与应对策略</li><li>能够营造积极、有序、高效的课堂学习氛围</li></ul>',
    teacherIntro: '<h4>名师介绍</h4><p><strong>孙管理</strong>，教学管理研究所资深研究员，原重点中学教务主任。深耕课堂管理研究15年，走访调研全国200余所学校，提炼出"课堂管理五维模型"，培训教师逾8万人次，深受一线教师好评。</p>',
    knowledgeGraph: ['课堂管理概述', '课堂规则建立', '学生动机激发', '问题行为识别', '问题行为应对', '课堂氛围营造', '分层管理策略', '管理反思与优化', '课堂时间管理', '座位编排艺术', '小组合作学习管理', '课堂纪律维护', '突发事件处理', '学生自主管理', '课堂评价与激励', '师生关系建设', '家校沟通管理', '课堂文化培育'],
    coreValue: '本课程破解"课堂管理靠经验、靠运气"的困境，对接《义务教育课程方案和课程标准》对课堂实效的要求。学员将建立系统化的课堂管理框架，掌握规则建设、动机激发、问题应对、氛围营造的闭环管理技能，学完能够独立诊断班级课堂管理问题，制定针对性的管理改进方案，实现课堂教学质量的整体提升。',
    keyDifficulties: '核心难点在于问题行为的精准识别与差异化应对。教师常见误区：1. 以"权威压制"代替"规则建设"，导致师生关系紧张；2. 忽视学生个体差异，用同一套管理方法应对不同学生；3. 过度关注问题行为矫正，忽视积极行为的正向强化；4. 课堂管理目标模糊，缺乏系统的管理规划与反思机制。',
    tieredAdvice: '【新教师】重点建立课堂规则体系与基本管理流程，从模仿成熟课堂管理案例入手，做好每日课堂管理日志记录与反思；【骨干教师】探索学科特色的课堂管理策略，形成可推广的班级管理工具包，承担新教师课堂管理指导任务；【资深教师】开展课堂管理专题研究，形成校本课堂管理课程或论文，引领学校课堂文化建设与管理制度优化。'
  },
  {
    id: 'c6',
    name: '新课标背景下的大单元教学设计',
    type: ['ct2', 'ct2-1'],
    typeName: '教学能力 / 教学设计',
    status: 'published',
    rootTypeName: '教学能力',
    instructor: '吴教研 / 课程教学研究中心',
    sections: 14,
    rating: 4.7,
    learners: 198,
    updateTime: '2025-05-05 09:00:00',
    cover: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=225&fit=crop',
    description: '<p>深入解读新课标要求，掌握大单元教学设计的核心理念与操作方法...</p>',
    departments: ['o1', 'o1-1'],
    creator: '郑华',
    creatorPhone: '13400134001',
    hours: 5.0,
    contentDescription: '<h4>课程内容简介</h4><p>本课程深入解读新课标背景下大单元教学设计的核心理念与操作方法。从"为何要大单元设计"到"如何做大单元设计"，系统讲解单元主题确立、单元目标制定、单元活动设计、单元评价设计等关键环节，帮助教师实现从"课时设计"到"单元设计"的思维方式转型。</p><h4>课程学习目标</h4><ul><li>理解新课标背景下大单元教学设计的核心理念与价值</li><li>掌握大单元教学设计的关键技术与操作流程</li><li>能够独立完成一个完整的大单元教学设计</li></ul>',
    teacherIntro: '<h4>名师介绍</h4><p><strong>吴教研</strong>，课程教学研究中心首席专家，新课标研制组核心成员。主持国家级课程改革课题5项，出版《大单元教学设计理论与实践》等专著6部，在全国开展大单元教学设计培训300余场，指导教师完成大单元设计案例逾2000个。</p>',
    knowledgeGraph: ['大单元教学概述', '新课标解读', '单元主题确立', '单元目标制定', '单元活动设计', '单元评价设计', '跨学科整合', '教学案例研习', '核心素养分析', '学习任务群设计', '真实情境创设', '驱动性问题设计', '表现性评价量规', '单元作业设计', '学生中心理念', '逆向教学设计', '单元教学反思', '单元成果展示'],
    coreValue: '本课程解决教师"课时设计碎片化、教学目标零散化"的痛点，深度对接《义务教育课程方案（2022年版）》及学科课程标准要求。学员将掌握大单元教学设计的系统方法论，形成"素养导向、任务驱动、评价嵌入"的设计能力，学完能够独立完成一个学期内至少1个完整的大单元教学设计，显著提升教学设计的整体性与学生核心素养达成度。',
    keyDifficulties: '核心难点在于单元目标与课时目标的层级关系处理及跨课时教学活动的一致性设计。教师常见误区：1. 将大单元设计简单理解为"多课时的拼盘"，缺乏真正的单元统整思维；2. 单元主题过于宏大或过于狭窄，难以承载核心素养目标；3. 评价设计滞后于活动设计，导致教-学-评脱节；4. 忽视学情分析，单元设计脱离学生真实学习起点。',
    tieredAdvice: '【新教师】从理解大单元设计理念与观摩成熟案例入手，在教研组指导下完成1个简化版大单元设计（2-3课时），重点体验设计流程；【骨干教师】独立承担1个完整大单元设计（5-8课时），尝试融入跨学科元素，形成可组内推广的设计模板；【资深教师】开展大单元设计深度研究，形成单元设计论文或校本课程开发方案，带领教研组开展大单元教学主题教研与课例打磨。'
  },
  {
    id: 'c7',
    name: '教师情绪管理与压力调适',
    type: ['ct4'],
    typeName: '心理健康',
    status: 'published',
    rootTypeName: '心理健康',
    instructor: '周心理 / 教师心理健康中心',
    sections: 7,
    rating: 4.9,
    learners: 276,
    updateTime: '2025-05-02 16:30:00',
    cover: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&h=225&fit=crop',
    description: '<p>帮助教师认识和管理自身情绪，掌握科学的压力调适方法...</p>',
    departments: ['o2'],
    creator: '林静',
    creatorPhone: '13300133001',
    hours: 2.5,
    contentDescription: '<h4>课程内容简介</h4><p>本课程帮助教师认识和管理自身情绪，掌握科学的压力调适方法。从教师职业压力源分析、情绪识别与表达、压力管理策略、自我关怀技术等方面出发，结合教师职业特点与真实案例，帮助教师建立积极的职业心态，提升职业幸福感与可持续发展能力。</p><h4>课程学习目标</h4><ul><li>识别教师职业中的主要压力源与情绪触发点</li><li>掌握情绪调节与压力管理的实用技巧</li><li>建立自我关怀与职业可持续发展的积极心态</li></ul>',
    teacherIntro: '<h4>名师介绍</h4><p><strong>周心理</strong>，教师心理健康中心主任，北京师范大学心理学博士。专注教师心理健康与职业幸福感研究12年，出版《教师职业倦怠预防与干预》等专著3部，为教师群体提供心理辅导与培训服务超过500场次。</p>',
    knowledgeGraph: ['教师心理健康', '职业压力源', '情绪识别', '情绪调节', '压力管理', '正念与放松', '自我关怀', '职业幸福感', '认知重构技术', '社会支持系统', '工作边界管理', '时间管理与优先级', '运动与营养', '睡眠质量提升', '积极心理暗示', '同理心疲劳预防', '心理资本建设', '职业倦怠干预'],
    coreValue: '本课程直面教师群体高职业倦怠、高心理压力的现实困境，响应《关于减轻中小学教师负担进一步营造教育教学良好环境的若干意见》精神。学员将建立对自身情绪与压力的觉察能力，掌握可操作的调节技术，学完能够形成个人化的压力管理方案，提升职业幸福感与教学效能感，实现教师职业的可持续发展。',
    keyDifficulties: '核心难点在于将心理调适知识转化为日常行为习惯。教师常见误区：1. 认为情绪问题是"软弱"的表现，回避或压抑负面情绪；2. 将压力管理等同于"休息放松"，缺乏系统性的认知-行为调整策略；3. 忽视社会支持系统的建设，独自承担压力；4. 过度投入工作，边界感模糊，导致工作-生活失衡。',
    tieredAdvice: '【新教师】建立教师职业心理健康基础认知，学会识别自身情绪信号与压力预警信号，掌握3-5种即时可用的情绪调节技巧（如深呼吸、正念等）；【骨干教师】系统构建个人压力管理体系，形成工作-生活平衡方案，能够为新教师提供心理支持，承担教研组心理健康主题活动组织任务；【资深教师】开展教师心理健康促进研究或校本课程开发，建立教师互助支持小组，引领学校教师关怀文化建设。'
  },
  {
    id: 'c8',
    name: '数字化教学评价工具应用',
    type: ['ct2', 'ct2-3'],
    typeName: '教学能力 / 教学评价',
    status: 'published',
    rootTypeName: '教学能力',
    instructor: '钱技术 / 教育信息化实验室',
    sections: 9,
    rating: 4.5,
    learners: 165,
    updateTime: '2025-04-28 11:00:00',
    cover: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop',
    description: '<p>介绍主流数字化教学评价工具的功能与使用场景...</p>',
    departments: ['o3', 'o2'],
    creator: '黄磊',
    creatorPhone: '13200132001',
    hours: 3.5,
    contentDescription: '<h4>课程内容简介</h4><p>本课程系统介绍主流数字化教学评价工具的功能、使用场景与数据分析方法。涵盖在线测验工具、课堂即时反馈系统、学习过程性数据平台、综合评价系统等，帮助教师从"经验评价"走向"数据评价"，实现评价反哺教学的闭环优化。</p><h4>课程学习目标</h4><ul><li>了解数字化教学评价工具的类型与功能特点</li><li>掌握主流评价工具的操作方法与数据分析技术</li><li>能够运用评价数据改进教学设计与实施</li></ul>',
    teacherIntro: '<h4>名师介绍</h4><p><strong>钱技术</strong>，教育信息化实验室评价技术部主任。从事教育评价技术研究10年，主持开发数字化教学评价系统3套，发表论文15篇，在评价数据驱动教学改进方面具有丰富的实践经验。</p>',
    knowledgeGraph: ['数字化评价概述', '在线测验工具', '即时反馈系统', '过程性数据平台', '综合评价系统', '数据分析方法', '评价反哺教学', '评价伦理', '学习分析技术', '电子档案袋', '同伴互评机制', '自评量表设计', '成长记录追踪', '诊断性评价', '表现性评价', '差异化评价策略', '评价结果可视化', '循证教学改进'],
    coreValue: '本课程破解"评价手段单一、反馈滞后、数据沉睡"的痛点，对接《深化新时代教育评价改革总体方案》及教育数字化战略行动要求。学员将掌握数字化评价工具的选择与使用能力、评价数据的解读与应用能力，学完能够设计并实施基于数据的评价方案，实现评价从"终结性"向"过程性"、从"选拔性"向"发展性"的转型，有效提升教学精准度。',
    keyDifficulties: '核心难点在于评价数据的深度解读与教学改进的精准对接。教师常见误区：1. 将数字化评价等同于"在线测验"，忽视过程性、表现性评价的数据采集；2. 数据解读停留在分数层面，缺乏对学生学习路径与思维过程的分析；3. 过度依赖数据，忽视教育情境的复杂性与评价的人文性；4. 评价工具使用碎片化，缺乏系统化的评价设计方案。',
    tieredAdvice: '【新教师】从1-2种基础评价工具入手（如在线测验或即时反馈系统），掌握基本操作与数据查看方法，在单节课中尝试应用；【骨干教师】系统学习多种评价工具的组合使用，能够基于评价数据调整教学设计，形成"评价-反馈-改进"的闭环实践案例；【资深教师】探索数字化评价与学科核心素养的对接路径，开发评价数据驱动的教学改进方案，承担学校评价改革课题，带动教研组评价素养整体提升。'
  }
];

const MOCK_COURSE_CATALOG = {
  c1: {
    chapters: [
      {
        id: 'ch1',
        name: '第一章 职业道德概述',
        sort: 1,
        children: [
          { id: 'cw1', name: '1.1 职业道德的定义与内涵', type: 'text', resources: [], materials: 2, allowDownload: true },
          { id: 'cw2', name: '1.2 教师职业道德的历史演变', type: 'video', resources: [], materials: 1, allowDownload: false }
        ]
      },
      {
        id: 'ch2',
        name: '第二章 职业道德规范',
        sort: 2,
        children: [
          { id: 'cw3', name: '2.1 爱国守法', type: 'text', resources: [], materials: 0, allowDownload: true },
          { id: 'cw4', name: '2.2 爱岗敬业', type: 'document', docType: 'word', resources: [], materials: 3, allowDownload: true }
        ]
      }
    ]
  },
  c2: {
    chapters: [
      {
        id: 'ch3',
        name: '第一章 智慧课堂基础',
        sort: 1,
        children: [
          { id: 'cw5', name: '1.1 什么是智慧课堂', type: 'video', resources: [], materials: 1, allowDownload: true },
          { id: 'cw6', name: '1.2 智慧课堂核心技术', type: 'text', resources: [], materials: 2, allowDownload: true },
          { id: 'cw7', name: '1.3 智慧课堂实践案例', type: 'document', docType: 'ppt', resources: [], materials: 2, allowDownload: true }
        ]
      }
    ]
  }
};

const MOCK_COURSE_STATS = {
  c1: {
    totalSections: 8,
    totalMaterials: 12,
    totalLearners: 342,
    completedLearners: 298,
    completionRate: 87.1
  },
  c2: {
    totalSections: 12,
    totalMaterials: 18,
    totalLearners: 256,
    completedLearners: 210,
    completionRate: 82.0
  }
};

const MOCK_SECTION_STATS = {
  c1: [
    { chapterName: '第一章 职业道德概述', sectionName: '1.1 职业道德的定义与内涵', type: '图文', materials: 2, learners: 340, rate: 99.4 },
    { chapterName: '第一章 职业道德概述', sectionName: '1.2 教师职业道德的历史演变', type: '视频', materials: 1, learners: 335, rate: 98.0 },
    { chapterName: '第二章 职业道德规范', sectionName: '2.1 爱国守法', type: '图文', materials: 0, learners: 330, rate: 96.5 },
    { chapterName: '第二章 职业道德规范', sectionName: '2.2 爱岗敬业', type: '文档', materials: 3, learners: 325, rate: 95.0 }
  ]
};

const MOCK_TEACHER_STATS = {
  c1: [
    { id: 't1', name: '张老师', phone: '13812345678', org: '语文教研组', stage: '初中', grade: '七年级', subject: '语文', progress: '8/8', status: 'completed', lastLearnTime: '2025-05-25 15:30:00' },
    { id: 't2', name: '李老师', phone: '13987654321', org: '数学教研组', stage: '初中', grade: '八年级', subject: '数学', progress: '7/8', status: 'incomplete', lastLearnTime: '2025-05-24 10:20:00' },
    { id: 't3', name: '王老师', phone: '13711112222', org: '英语教研组', stage: '小学', grade: '五年级', subject: '英语', progress: '5/8', status: 'incomplete', lastLearnTime: '2025-05-23 09:15:00' },
    { id: 't4', name: '赵老师', phone: '13622223333', org: '物理教研组', stage: '高中', grade: '高一', subject: '物理', progress: '8/8', status: 'completed', lastLearnTime: '2025-05-22 16:45:00' },
    { id: 't5', name: '刘老师', phone: '13533334444', org: '化学教研组', stage: '高中', grade: '高二', subject: '化学', progress: '3/8', status: 'incomplete', lastLearnTime: '2025-05-21 14:10:00' }
  ]
};

const MOCK_TEACHER_DETAIL = {
  t1: {
    name: '张老师',
    phone: '13812345678',
    totalSections: 8,
    learnedSections: 8,
    completionRate: 100,
    totalMaterials: 12,
    sectionDetails: [
      { chapterName: '第一章 职业道德概述', sectionName: '1.1 职业道德的定义与内涵', materials: 2, status: 'completed', lastTime: '2025-05-20 10:00:00', duration: '0时45分30秒' },
      { chapterName: '第一章 职业道德概述', sectionName: '1.2 教师职业道德的历史演变', materials: 1, status: 'completed', lastTime: '2025-05-21 14:20:00', duration: '1时20分15秒' },
      { chapterName: '第二章 职业道德规范', sectionName: '2.1 爱国守法', materials: 0, status: 'completed', lastTime: '2025-05-22 09:30:00', duration: '0时30分00秒' },
      { chapterName: '第二章 职业道德规范', sectionName: '2.2 爱岗敬业', materials: 3, status: 'completed', lastTime: '2025-05-23 16:00:00', duration: '0时55分45秒' }
    ]
  },
  t2: {
    name: '李老师',
    phone: '13987654321',
    totalSections: 8,
    learnedSections: 7,
    completionRate: 87.5,
    totalMaterials: 12,
    sectionDetails: [
      { chapterName: '第一章 职业道德概述', sectionName: '1.1 职业道德的定义与内涵', materials: 2, status: 'completed', lastTime: '2025-05-18 10:00:00', duration: '0时40分20秒' },
      { chapterName: '第一章 职业道德概述', sectionName: '1.2 教师职业道德的历史演变', materials: 1, status: 'completed', lastTime: '2025-05-19 14:20:00', duration: '1时15分00秒' },
      { chapterName: '第二章 职业道德规范', sectionName: '2.1 爱国守法', materials: 0, status: 'completed', lastTime: '2025-05-20 09:30:00', duration: '0时25分10秒' },
      { chapterName: '第二章 职业道德规范', sectionName: '2.2 爱岗敬业', materials: 3, status: 'incomplete', lastTime: '-', duration: '-' }
    ]
  }
};

const MOCK_COURSE_TYPE_TREE = [
  {
    id: 'ct1',
    name: '师德师风',
    courseCount: 12,
    children: [
      { id: 'ct1-1', name: '职业道德', courseCount: 5, children: [] },
      { id: 'ct1-2', name: '师风建设', courseCount: 7, children: [] }
    ]
  },
  {
    id: 'ct2',
    name: '教学能力',
    courseCount: 28,
    children: [
      { id: 'ct2-1', name: '教学设计', courseCount: 10, children: [] },
      { id: 'ct2-2', name: '课堂管理', courseCount: 8, children: [] },
      { id: 'ct2-3', name: '教学评价', courseCount: 10, children: [] }
    ]
  },
  {
    id: 'ct3',
    name: '信息技术',
    courseCount: 15,
    children: [
      { id: 'ct3-1', name: '智慧课堂', courseCount: 8, children: [] },
      { id: 'ct3-2', name: 'AI应用', courseCount: 7, children: [] }
    ]
  },
  {
    id: 'ct4',
    name: '心理健康',
    courseCount: 6,
    children: []
  }
];

const MOCK_TEACHERS = [
  { id: 't1', name: '张老师', phone: '13812345678', org: 'o1-1', orgName: '教学研究组', grade: '七年级', subject: '语文' },
  { id: 't2', name: '李老师', phone: '13987654321', org: 'o1-1', orgName: '教学研究组', grade: '八年级', subject: '数学' },
  { id: 't3', name: '王老师', phone: '13711112222', org: 'o1-1', orgName: '教学研究组', grade: '五年级', subject: '英语' },
  { id: 't4', name: '赵老师', phone: '13622223333', org: 'o1-2', orgName: '课程开发组', grade: '高一', subject: '物理' },
  { id: 't5', name: '刘老师', phone: '13533334444', org: 'o1-2', orgName: '课程开发组', grade: '高二', subject: '化学' },
  { id: 't6', name: '陈老师', phone: '13444445555', org: 'o2-1', orgName: '新教师培训部', grade: '三年级', subject: '语文' },
  { id: 't7', name: '杨老师', phone: '13355556666', org: 'o2-1', orgName: '新教师培训部', grade: '四年级', subject: '数学' },
  { id: 't8', name: '黄老师', phone: '13266667777', org: 'o2-2', orgName: '骨干教师培训部', grade: '九年级', subject: '英语' },
  { id: 't9', name: '周老师', phone: '13177778888', org: 'o2-2', orgName: '骨干教师培训部', grade: '高三', subject: '物理' },
  { id: 't10', name: '吴老师', phone: '13088889999', org: 'o3', orgName: '信息中心', grade: '六年级', subject: '信息技术' },
  { id: 't11', name: '郑老师', phone: '13800001111', org: 'o1-1', orgName: '教学研究组', grade: '七年级', subject: '历史' },
  { id: 't12', name: '孙老师', phone: '13800002222', org: 'o1-2', orgName: '课程开发组', grade: '八年级', subject: '地理' },
  { id: 't13', name: '马老师', phone: '13800003333', org: 'o2-1', orgName: '新教师培训部', grade: '一年级', subject: '语文' },
  { id: 't14', name: '朱老师', phone: '13800004444', org: 'o2-2', orgName: '骨干教师培训部', grade: '二年级', subject: '数学' },
  { id: 't15', name: '胡老师', phone: '13800005555', org: 'o3', orgName: '信息中心', grade: '高一', subject: '信息技术' }
];

const MOCK_ACTIVITIES = [
  {
    id: 'a1',
    name: '2025暑期教师专业能力提升培训',
    cover: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=225&fit=crop',
    startTime: '2025-06-15',
    endTime: '2025-08-31',
    status: 'ongoing',
    requireHours: 12.0,
    hasHours: true,
    studyMode: 'complete',
    participants: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10']
  },
  {
    id: 'a2',
    name: '信息化教学工具应用培训',
    cover: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&h=225&fit=crop',
    startTime: '2025-05-01',
    endTime: '2025-05-31',
    status: 'ended',
    requireHours: 8.0,
    hasHours: true,
    studyMode: 'view',
    participants: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8']
  },
  {
    id: 'a3',
    name: '新教师入职培训（2025春）',
    cover: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=225&fit=crop',
    startTime: '2025-09-01',
    endTime: '2025-10-15',
    status: 'upcoming',
    requireHours: 16.0,
    hasHours: true,
    studyMode: 'feedback',
    participants: ['t6', 't7', 't13']
  },
  {
    id: 'a4',
    name: '师德师风专题学习',
    cover: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=225&fit=crop',
    startTime: '2025-04-01',
    endTime: '2025-04-30',
    status: 'ended',
    requireHours: 4.0,
    hasHours: true,
    studyMode: 'complete',
    participants: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't12', 't13', 't14', 't15']
  },
  {
    id: 'a5',
    name: 'AI赋能教育创新研讨',
    cover: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=225&fit=crop',
    startTime: '2025-07-01',
    endTime: '2025-07-15',
    status: 'upcoming',
    hasHours: false,
    studyMode: 'view',
    participants: ['t1', 't2', 't3', 't4', 't5']
  }
];

const MOCK_ACTIVITY_COURSES = {
  a1: [
    { courseId: 'c1', name: '新时代教师职业道德规范', typeName: '师德师风 / 职业道德', instructor: '王晓明 / 教育部教师发展中心', hours: 3.0 },
    { courseId: 'c2', name: '智慧课堂教学设计与实践', typeName: '信息技术 / 智慧课堂', instructor: '张晓燕 / 智慧教育研究院', hours: 4.0 },
    { courseId: 'c4', name: '学生心理健康辅导技巧', typeName: '心理健康', instructor: '刘心理 / 心理咨询中心', hours: 2.0 },
    { courseId: 'c3', name: 'AI赋能教学创新', typeName: '信息技术 / AI应用', instructor: '陈技术 / AI教育实验室', hours: 3.0 }
  ],
  a2: [
    { courseId: 'c2', name: '智慧课堂教学设计与实践', typeName: '信息技术 / 智慧课堂', instructor: '张晓燕 / 智慧教育研究院', hours: 4.0 },
    { courseId: 'c3', name: 'AI赋能教学创新', typeName: '信息技术 / AI应用', instructor: '陈技术 / AI教育实验室', hours: 4.0 }
  ],
  a3: [
    { courseId: 'c1', name: '新时代教师职业道德规范', typeName: '师德师风 / 职业道德', instructor: '王晓明 / 教育部教师发展中心', hours: 4.0 },
    { courseId: 'c2', name: '智慧课堂教学设计与实践', typeName: '信息技术 / 智慧课堂', instructor: '张晓燕 / 智慧教育研究院', hours: 4.0 },
    { courseId: 'c4', name: '学生心理健康辅导技巧', typeName: '心理健康', instructor: '刘心理 / 心理咨询中心', hours: 4.0 },
    { courseId: 'c5', name: '高效课堂教学管理策略', typeName: '教学能力 / 课堂管理', instructor: '孙管理 / 教学管理研究所', hours: 4.0 }
  ],
  a4: [
    { courseId: 'c1', name: '新时代教师职业道德规范', typeName: '师德师风 / 职业道德', instructor: '王晓明 / 教育部教师发展中心', hours: 4.0 }
  ],
  a5: [
    { courseId: 'c3', name: 'AI赋能教学创新', typeName: '信息技术 / AI应用', instructor: '陈技术 / AI教育实验室', hours: 0 },
    { courseId: 'c2', name: '智慧课堂教学设计与实践', typeName: '信息技术 / 智慧课堂', instructor: '张晓燕 / 智慧教育研究院', hours: 0 }
  ]
};

const MOCK_ACTIVITY_PARTICIPANTS = {
  a1: [
    { teacherId: 't1', learnedCourses: 3, earnedHours: 9.0, completed: false, lastLearnTime: '2025-06-20 15:30:00' },
    { teacherId: 't2', learnedCourses: 4, earnedHours: 12.0, completed: true, lastLearnTime: '2025-06-22 10:20:00' },
    { teacherId: 't3', learnedCourses: 2, earnedHours: 5.0, completed: false, lastLearnTime: '2025-06-18 09:15:00' },
    { teacherId: 't4', learnedCourses: 4, earnedHours: 12.0, completed: true, lastLearnTime: '2025-06-21 16:45:00' },
    { teacherId: 't5', learnedCourses: 1, earnedHours: 2.0, completed: false, lastLearnTime: '2025-06-15 14:10:00' },
    { teacherId: 't6', learnedCourses: 3, earnedHours: 7.0, completed: false, lastLearnTime: '2025-06-19 11:30:00' },
    { teacherId: 't7', learnedCourses: 4, earnedHours: 12.0, completed: true, lastLearnTime: '2025-06-23 08:45:00' },
    { teacherId: 't8', learnedCourses: 2, earnedHours: 4.0, completed: false, lastLearnTime: '2025-06-17 13:20:00' },
    { teacherId: 't9', learnedCourses: 3, earnedHours: 8.0, completed: false, lastLearnTime: '2025-06-16 17:00:00' },
    { teacherId: 't10', learnedCourses: 4, earnedHours: 12.0, completed: true, lastLearnTime: '2025-06-22 09:00:00' }
  ],
  a2: [
    { teacherId: 't1', learnedCourses: 2, earnedHours: 8.0, completed: true, lastLearnTime: '2025-05-20 14:30:00' },
    { teacherId: 't2', learnedCourses: 2, earnedHours: 8.0, completed: true, lastLearnTime: '2025-05-18 10:20:00' },
    { teacherId: 't3', learnedCourses: 1, earnedHours: 4.0, completed: false, lastLearnTime: '2025-05-15 09:15:00' },
    { teacherId: 't4', learnedCourses: 2, earnedHours: 8.0, completed: true, lastLearnTime: '2025-05-22 16:45:00' },
    { teacherId: 't5', learnedCourses: 2, earnedHours: 8.0, completed: true, lastLearnTime: '2025-05-25 14:10:00' },
    { teacherId: 't6', learnedCourses: 1, earnedHours: 4.0, completed: false, lastLearnTime: '2025-05-12 11:30:00' },
    { teacherId: 't7', learnedCourses: 2, earnedHours: 8.0, completed: true, lastLearnTime: '2025-05-28 08:45:00' },
    { teacherId: 't8', learnedCourses: 2, earnedHours: 8.0, completed: true, lastLearnTime: '2025-05-26 13:20:00' }
  ],
  a3: [
    { teacherId: 't6', learnedCourses: 0, earnedHours: 0, completed: false, lastLearnTime: '-' },
    { teacherId: 't7', learnedCourses: 0, earnedHours: 0, completed: false, lastLearnTime: '-' },
    { teacherId: 't13', learnedCourses: 0, earnedHours: 0, completed: false, lastLearnTime: '-' }
  ],
  a4: [
    { teacherId: 't1', learnedCourses: 1, earnedHours: 4.0, completed: true, lastLearnTime: '2025-04-20 15:30:00' },
    { teacherId: 't2', learnedCourses: 1, earnedHours: 4.0, completed: true, lastLearnTime: '2025-04-18 10:20:00' },
    { teacherId: 't3', learnedCourses: 1, earnedHours: 4.0, completed: true, lastLearnTime: '2025-04-22 09:15:00' },
    { teacherId: 't4', learnedCourses: 1, earnedHours: 4.0, completed: true, lastLearnTime: '2025-04-25 16:45:00' },
    { teacherId: 't5', learnedCourses: 1, earnedHours: 4.0, completed: true, lastLearnTime: '2025-04-28 14:10:00' },
    { teacherId: 't6', learnedCourses: 1, earnedHours: 4.0, completed: true, lastLearnTime: '2025-04-15 11:30:00' },
    { teacherId: 't7', learnedCourses: 1, earnedHours: 4.0, completed: true, lastLearnTime: '2025-04-19 08:45:00' },
    { teacherId: 't8', learnedCourses: 1, earnedHours: 4.0, completed: true, lastLearnTime: '2025-04-21 13:20:00' },
    { teacherId: 't9', learnedCourses: 1, earnedHours: 4.0, completed: true, lastLearnTime: '2025-04-23 17:00:00' },
    { teacherId: 't10', learnedCourses: 1, earnedHours: 4.0, completed: true, lastLearnTime: '2025-04-24 09:00:00' },
    { teacherId: 't11', learnedCourses: 1, earnedHours: 4.0, completed: true, lastLearnTime: '2025-04-26 10:30:00' },
    { teacherId: 't12', learnedCourses: 1, earnedHours: 4.0, completed: true, lastLearnTime: '2025-04-27 14:00:00' },
    { teacherId: 't13', learnedCourses: 1, earnedHours: 4.0, completed: true, lastLearnTime: '2025-04-29 11:00:00' },
    { teacherId: 't14', learnedCourses: 1, earnedHours: 4.0, completed: true, lastLearnTime: '2025-04-30 15:00:00' },
    { teacherId: 't15', learnedCourses: 1, earnedHours: 4.0, completed: true, lastLearnTime: '2025-04-16 16:30:00' }
  ],
  a5: [
    { teacherId: 't1', learnedCourses: 0, earnedHours: 0, completed: false, lastLearnTime: '-' },
    { teacherId: 't2', learnedCourses: 0, earnedHours: 0, completed: false, lastLearnTime: '-' },
    { teacherId: 't3', learnedCourses: 0, earnedHours: 0, completed: false, lastLearnTime: '-' },
    { teacherId: 't4', learnedCourses: 0, earnedHours: 0, completed: false, lastLearnTime: '-' },
    { teacherId: 't5', learnedCourses: 0, earnedHours: 0, completed: false, lastLearnTime: '-' }
  ]
};

const MOCK_ACTIVITY_LEARNING_RECORDS = {
  a1: [
    { teacherId: 't1', courseName: '新时代教师职业道德规范', hours: 3.0, completeTime: '2025-06-18 10:00:00', feedback: '内容详实，受益匪浅' },
    { teacherId: 't1', courseName: '智慧课堂教学设计与实践', hours: 4.0, completeTime: '2025-06-20 15:30:00', feedback: '实用性强，对教学很有帮助' },
    { teacherId: 't1', courseName: '学生心理健康辅导技巧', hours: 2.0, completeTime: '2025-06-19 09:00:00', feedback: '' },
    { teacherId: 't2', courseName: '新时代教师职业道德规范', hours: 3.0, completeTime: '2025-06-16 14:00:00', feedback: '很好' },
    { teacherId: 't2', courseName: '智慧课堂教学设计与实践', hours: 4.0, completeTime: '2025-06-18 10:30:00', feedback: '非常有用' },
    { teacherId: 't2', courseName: '学生心理健康辅导技巧', hours: 2.0, completeTime: '2025-06-19 16:00:00', feedback: '' },
    { teacherId: 't2', courseName: 'AI赋能教学创新', hours: 3.0, completeTime: '2025-06-22 10:20:00', feedback: '前沿内容' }
  ],
  a2: [
    { teacherId: 't1', courseName: '智慧课堂教学设计与实践', hours: 4.0, completeTime: '2025-05-15 11:00:00', feedback: '' },
    { teacherId: 't1', courseName: 'AI赋能教学创新', hours: 4.0, completeTime: '2025-05-20 14:30:00', feedback: '很实用' },
    { teacherId: 't2', courseName: '智慧课堂教学设计与实践', hours: 4.0, completeTime: '2025-05-12 09:30:00', feedback: '' },
    { teacherId: 't2', courseName: 'AI赋能教学创新', hours: 4.0, completeTime: '2025-05-18 10:20:00', feedback: '' }
  ],
  a4: [
    { teacherId: 't1', courseName: '新时代教师职业道德规范', hours: 4.0, completeTime: '2025-04-20 15:30:00', feedback: '深刻理解了职业道德规范' },
    { teacherId: 't2', courseName: '新时代教师职业道德规范', hours: 4.0, completeTime: '2025-04-18 10:20:00', feedback: '受益匪浅' }
  ]
};
