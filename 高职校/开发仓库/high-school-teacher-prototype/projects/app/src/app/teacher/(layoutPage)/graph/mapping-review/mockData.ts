// 映射审核工作台 · 原型 mock 数据
// 说明：数据在模块加载时以固定种子确定性生成，保证 SSR 与客户端水合一致。

export type Mastery = '了解' | '掌握' | '精通';
export type MappingStatus = 'pending' | 'confirmed' | 'rejected';
export type AbilityPointStatus = 'active' | 'deprecated' | 'new';

export type KnowledgePoint = {
  id: string;
  name: string;
};

export type KnowledgeSection = {
  id: string;
  name: string;
  points: KnowledgePoint[];
};

export type KnowledgeModule = {
  id: string;
  name: string;
  sections: KnowledgeSection[];
};

export type AbilityPoint = {
  code: string;
  name: string;
  status: AbilityPointStatus;
  versionTag?: string;
};

export type AbilityDomain = {
  code: string;
  name: string;
  points: AbilityPoint[];
};

export type GovernanceHint = {
  deprecatedVersion: string;
  suggestedCode: string;
  suggestedName: string;
  suggestedConfidence: number;
  ignored?: boolean;
};

export type Mapping = {
  id: string;
  knowledgeId: string;
  knowledgeName: string;
  moduleName: string;
  sectionName: string;
  abilityCode: string;
  abilityName: string;
  confidence: number;
  mastery: Mastery;
  weight: number;
  aiReason: string;
  status: MappingStatus;
  rejectReason?: string;
  governance?: GovernanceHint;
  /** 已通过治理待办一键改绑 */
  rebound?: boolean;
};

export const COURSE_INFO = {
  name: '动力电池管理系统检修',
  major: '新能源汽车技术',
  knowledgeCount: 132
};

export const TARGET_GRAPH = {
  postName: '动力电池维修技师',
  graphName: '岗位能力图谱',
  version: 'v2.3',
  abilityCount: 59
};

export const AI_FINISHED_AT = '2026-08-27 14:32';
export const AI_PIPELINE = 'pgvector Top-5 召回 → GPT-4o 精排';

const moduleSeeds: { id: string; name: string; sections: { id: string; name: string; points: string[] }[] }[] = [
  {
    id: 'm1',
    name: '模块1 · 动力电池认知',
    sections: [
      {
        id: 's11',
        name: '1.1 电池化学体系',
        points: ['三元锂电池特性', '磷酸铁锂电池特性', '电芯充放电原理', '电池一致性基础', '能量密度与功率密度', '循环寿命影响因素', '低温性能与衰减', '电化学安全边界']
      },
      {
        id: 's12',
        name: '1.2 电池结构与封装',
        points: ['电芯形态与选型', '模组结构设计', '电池包壳体与密封', '高压电气连接', '低压线束布局', '熔断器与继电器', '预充回路组成', '泄压阀与防爆设计', '电池包装配工艺']
      },
      {
        id: 's13',
        name: '1.3 关键性能参数',
        points: ['额定容量与标称电压', '内阻与倍率性能', 'SOC 与 SOH 定义', '自放电特性', '温度窗口与热特性', '绝缘电阻要求', '参数测量仪器认知']
      }
    ]
  },
  {
    id: 'm2',
    name: '模块2 · BMS 系统检修',
    sections: [
      {
        id: 's21',
        name: '2.1 BMS 硬件架构',
        points: ['主控板功能与架构', '从控板通信协议（CAN）', '单体电压采样电路', '温度采样电路', '高压互锁回路检测', '电流检测传感器', '绝缘监测模块', '继电器驱动电路', '均衡电路原理', '电源管理单元', 'BMS 接插件检修', '硬件在环测试认知']
      },
      {
        id: 's22',
        name: '2.2 状态估算与均衡',
        points: ['SOC 估算方法', 'SOH 估算模型', '均衡策略与触发', '被动均衡与主动均衡', '充放电效率计算', '故障码体系解读', '数据流读取与分析', '冻结帧与历史数据', 'BMS 软件刷写', '参数标定与匹配', '休眠与唤醒逻辑', '绝缘报警阈值设定']
      },
      {
        id: 's23',
        name: '2.3 安全保护机制',
        points: ['过压欠压保护', '过流与短路保护', '过温保护策略', '热失控预警处理', '继电器粘连诊断', '绝缘故障保护', '碰撞断电保护', '防水防尘等级', '高压互锁保护逻辑', '充电互锁机制', '故障降级策略', '安全保护措施验证']
      }
    ]
  },
  {
    id: 'm3',
    name: '模块3 · 热管理检修',
    sections: [
      {
        id: 's31',
        name: '3.1 热管理系统原理',
        points: ['热管理系统原理', '液冷回路组成', '风冷系统设计', '热泵空调耦合', '冷却液选型与更换', '电子水泵工作原理', '温度传感器布局', '热管理控制策略', '低温加热回路', '余热利用设计']
      },
      {
        id: 's32',
        name: '3.2 冷却回路检修',
        points: ['冷却液压力测试', '回路密封性检测', '水泵性能检测', '节温器故障排查', '散热器清洗维护', '冷却管路更换', '冷却系统排气', '温度异常诊断', '冷却液冰点检测', '热交换器检修']
      }
    ]
  },
  {
    id: 'm4',
    name: '模块4 · 充电系统检修',
    sections: [
      {
        id: 's41',
        name: '4.1 交流充电系统',
        points: ['交流充电桩结构', '充电枪接口标准', 'CC/CP 信号原理', '充电握手时序', '车载充电机原理', 'OBC 检测与更换', '慢充故障排查', '充电计量与计费', '接地故障检测', '充电线缆检修', '充电安全联锁']
      },
      {
        id: 's42',
        name: '4.2 直流快充系统',
        points: ['直流快充桩结构', '快充通信协议', '充电模块工作原理', '绝缘监测与保护', '快充温度管理', '充电模块更换', '快充故障码分析', '充电兼容性测试', '充电曲线分析', '充电桩巡检规范', '快充安全应急']
      }
    ]
  },
  {
    id: 'm5',
    name: '模块5 · 故障诊断综合实训',
    sections: [
      {
        id: 's51',
        name: '5.1 诊断仪综合应用',
        points: ['诊断仪连接与配置', '故障码读取与清除', '数据流对比分析', '执行器动作测试', '示波器波形分析', '绝缘电阻表使用', '诊断报告编写', '远程诊断认知', '诊断流程规范']
      },
      {
        id: 's52',
        name: '5.2 综合故障案例',
        points: ['无法充电案例', '续航骤降案例', '绝缘报警案例', '高压不上电案例', '充电中断案例', '电池过热案例', '通信丢失案例', '均衡失效案例', '热失控应急演练']
      }
    ]
  },
  {
    id: 'm6',
    name: '模块6 · 高压安全与防护',
    sections: [
      {
        id: 's61',
        name: '6.1 高压操作规范',
        points: ['高压作业许可流程', '断电验电五步操作', '个人防护装备穿戴', '高压警示标识', '作业隔离与看护', '工器具绝缘要求']
      },
      {
        id: 's62',
        name: '6.2 绝缘与防护',
        points: ['绝缘电阻检测方法', '绝缘工具校验', '防护装备检查', '漏电应急处置', '电弧防护知识', '安全规范考核']
      }
    ]
  }
];

export const knowledgeTree: KnowledgeModule[] = moduleSeeds.map((mod) => ({
  id: mod.id,
  name: mod.name,
  sections: mod.sections.map((sec) => ({
    id: sec.id,
    name: sec.name,
    points: sec.points.map((name, idx) => ({ id: `${sec.id}-p${idx}`, name }))
  }))
}));

export const abilityTree: AbilityDomain[] = [
  {
    code: 'A',
    name: '能力域 A · 电池系统检测',
    points: [
      { code: 'A1', name: '绝缘性能检测', status: 'active' },
      { code: 'A2', name: '电压一致性检测', status: 'active' },
      { code: 'A3', name: '电池均衡维护', status: 'active' },
      { code: 'A4', name: '高压安全操作', status: 'active' },
      { code: 'A5', name: 'CAN 总线故障排查', status: 'active' },
      { code: 'A6', name: '内阻测试与评估', status: 'active' },
      { code: 'A7', name: '容量标定测试', status: 'active' },
      { code: 'A8', name: '自放电率检测', status: 'active' },
      { code: 'A9', name: '温度传感器校验', status: 'active' },
      { code: 'A10', name: '采样线束检修', status: 'active' },
      { code: 'A11', name: '电池气密性检测', status: 'active' },
      { code: 'A12', name: '外观与机械损伤检查', status: 'active' },
      { code: 'A13', name: '荷电状态估算', status: 'active' },
      { code: 'A14', name: '健康状态评估', status: 'active' }
    ]
  },
  {
    code: 'B',
    name: '能力域 B · 故障诊断与排除',
    points: [
      { code: 'B1', name: '常见故障诊断', status: 'active' },
      { code: 'B2', name: '主回路检修', status: 'active' },
      { code: 'B3', name: '热失控预警处理', status: 'deprecated', versionTag: 'v2.4 已废弃' },
      { code: 'B4', name: '冷却系统检修', status: 'active' },
      { code: 'B5', name: '热失控应急处置', status: 'new', versionTag: 'v2.4 新增' },
      { code: 'B6', name: '充电故障排查', status: 'active' },
      { code: 'B7', name: '绝缘故障定位', status: 'active' },
      { code: 'B8', name: '接触器故障检修', status: 'active' },
      { code: 'B9', name: '预充回路检修', status: 'active' },
      { code: 'B10', name: '传感器故障诊断', status: 'active' },
      { code: 'B11', name: '通信中断排查', status: 'active' },
      { code: 'B12', name: '过压欠压处理', status: 'active' },
      { code: 'B13', name: '过温故障处理', status: 'active' },
      { code: 'B14', name: '漏电检测与处置', status: 'active' },
      { code: 'B15', name: '诊断仪综合应用', status: 'active' },
      { code: 'B16', name: '故障码解读与清除', status: 'active' }
    ]
  },
  {
    code: 'C',
    name: '能力域 C · 电池评估与维护',
    points: [
      { code: 'C1', name: '电池状态评估', status: 'active' },
      { code: 'C2', name: '退役电池检测', status: 'active' },
      { code: 'C3', name: '梯次利用分选', status: 'active' },
      { code: 'C4', name: '电池维护保养', status: 'active' },
      { code: 'C5', name: '存储与运输规范', status: 'active' },
      { code: 'C6', name: '衰减分析报告', status: 'active' },
      { code: 'C7', name: '电池档案管理', status: 'active' },
      { code: 'C8', name: '质保判定流程', status: 'active' },
      { code: 'C9', name: '回收处置规范', status: 'active' },
      { code: 'C10', name: '维护计划制定', status: 'active' },
      { code: 'C11', name: '备件选型与更换', status: 'active' },
      { code: 'C12', name: '客户沟通与解释', status: 'active' }
    ]
  },
  {
    code: 'D',
    name: '能力域 D · 充电设施维护',
    points: [
      { code: 'D1', name: '交流充电桩维护', status: 'active' },
      { code: 'D2', name: '直流快充桩维护', status: 'active' },
      { code: 'D3', name: '充电模块更换', status: 'active' },
      { code: 'D4', name: '充电设施巡检', status: 'active' },
      { code: 'D5', name: '充电计量校验', status: 'active' },
      { code: 'D6', name: '充电网络配置', status: 'active' },
      { code: 'D7', name: '设施接地检测', status: 'active' },
      { code: 'D8', name: '充电故障应急', status: 'active' },
      { code: 'D9', name: '设施升级改造', status: 'active' }
    ]
  },
  {
    code: 'E',
    name: '能力域 E · 安全规范与应急',
    points: [
      { code: 'E1', name: '高压作业许可', status: 'active' },
      { code: 'E2', name: '个人防护装备', status: 'active' },
      { code: 'E3', name: '断电验电流程', status: 'active' },
      { code: 'E4', name: '应急救援预案', status: 'active' },
      { code: 'E5', name: '消防器材使用', status: 'active' },
      { code: 'E6', name: '事故上报流程', status: 'active' },
      { code: 'E7', name: '安全标识识别', status: 'active' },
      { code: 'E8', name: '作业风险评估', status: 'active' }
    ]
  }
];

export const abilityIndex: Record<string, AbilityPoint> = abilityTree.reduce<Record<string, AbilityPoint>>((acc, domain) => {
  domain.points.forEach((p) => {
    acc[p.code] = p;
  });
  return acc;
}, {});

/** 这些能力点不参与自动映射，用于演示「未覆盖」质检信号 */
const uncoveredCodes = new Set(['C2', 'D8', 'E6']);

const assignablePool = abilityTree
  .flatMap((d) => d.points)
  .filter((p) => p.status === 'active' && !uncoveredCodes.has(p.code));

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const reasonTemplates = [
  (k: string, code: string, name: string, conf: string) =>
    `知识点「${k}」与能力点 ${code}「${name}」在操作对象与考核要求上语义一致，语义相似度 ${conf}，建议按当前掌握要求执行。`,
  (k: string, code: string, name: string, conf: string) =>
    `「${k}」覆盖 ${code}「${name}」的核心作业步骤与工具使用要点，向量召回得分 ${conf}，与岗位任务描述匹配良好。`,
  (k: string, code: string, name: string, conf: string) =>
    `该知识点的教学目标与 ${code}「${name}」的能力描述高度相关（相似度 ${conf}），实训考核点基本一致，建议确认。`,
  (k: string, code: string, name: string, conf: string) =>
    `「${k}」为 ${code}「${name}」的前置理论知识，精排模型判定两者存在稳定支撑关系，语义相似度 ${conf}。`
];

function masteryOf(confidence: number, rand: number): Mastery {
  if (confidence >= 0.9) return rand > 0.25 ? '精通' : '掌握';
  if (confidence >= 0.75) return rand > 0.3 ? '掌握' : '精通';
  return rand > 0.5 ? '了解' : '掌握';
}

function buildMappings(): Mapping[] {
  const rand = mulberry32(20260828);

  type Flat = { id: string; name: string; moduleName: string; sectionName: string };
  const flat: Flat[] = knowledgeTree.flatMap((mod) =>
    mod.sections.flatMap((sec) =>
      sec.points.map((p) => ({ id: p.id, name: p.name, moduleName: mod.name, sectionName: sec.name }))
    )
  );

  const showcaseNames = new Set([
    '热失控预警处理',
    '主控板功能与架构',
    '从控板通信协议（CAN）',
    '热管理系统原理',
    '绝缘电阻检测方法',
    '单体电压采样电路',
    '继电器粘连诊断'
  ]);

  const showcase: Flat[] = [];
  const rest: Flat[] = [];
  flat.forEach((item) => (showcaseNames.has(item.name) ? showcase : rest).push(item));

  // 打乱剩余知识点，按数量切片分配审核状态：待审核 37 / 已确认 84 / 已驳回 4
  const shuffled = [...rest];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const statusPlan: MappingStatus[] = [
    ...Array<MappingStatus>(37).fill('pending'),
    ...Array<MappingStatus>(84).fill('confirmed'),
    ...Array<MappingStatus>(4).fill('rejected')
  ];

  // 待审核中再切出 17 条高置信度（加上「主控板功能与架构」共 18 条）
  let highConfBudget = 17;

  const restMappings: Mapping[] = shuffled.map((item, idx) => {
    const status = statusPlan[idx];
    const ability = assignablePool[Math.floor(rand() * assignablePool.length)];

    let confidence: number;
    if (status === 'pending') {
      if (highConfBudget > 0) {
        confidence = round2(0.9 + rand() * 0.07);
        highConfBudget -= 1;
      } else {
        confidence = round2(0.62 + rand() * 0.27);
      }
    } else if (status === 'confirmed') {
      confidence = round2(0.8 + rand() * 0.19);
    } else {
      confidence = round2(0.5 + rand() * 0.2);
    }

    const mastery = masteryOf(confidence, rand());
    const weight = Math.min(1, Math.max(0.3, Math.round(confidence * 10) / 10));
    const confText = confidence.toFixed(2);
    const aiReason = reasonTemplates[idx % reasonTemplates.length](
      item.name,
      ability.code,
      ability.name,
      confText
    );

    return {
      id: `map-${item.id}`,
      knowledgeId: item.id,
      knowledgeName: item.name,
      moduleName: item.moduleName,
      sectionName: item.sectionName,
      abilityCode: ability.code,
      abilityName: ability.name,
      confidence,
      mastery,
      weight,
      aiReason,
      status,
      ...(status === 'rejected'
        ? { rejectReason: '推荐目标与实训考核要点不一致，已在备课组内讨论后驳回。' }
        : {})
    };
  });

  const showcaseMappings: Mapping[] = showcase.map((item) => {
    const base = {
      id: `map-${item.id}`,
      knowledgeId: item.id,
      knowledgeName: item.name,
      moduleName: item.moduleName,
      sectionName: item.sectionName
    };
    switch (item.name) {
      case '热失控预警处理':
        return {
          ...base,
          abilityCode: 'B3',
          abilityName: '热失控预警处理',
          confidence: 0.81,
          mastery: '精通',
          weight: 0.8,
          status: 'pending',
          aiReason:
            '知识点讲解热失控特征参数识别与预警阈值设定，与 B3 能力描述吻合；但 B3 已在 v2.4 废弃，需确认改绑目标。',
          governance: {
            deprecatedVersion: 'v2.4',
            suggestedCode: 'B5',
            suggestedName: '热失控应急处置',
            suggestedConfidence: 0.86
          }
        };
      case '主控板功能与架构':
        return {
          ...base,
          abilityCode: 'A2',
          abilityName: '电压一致性检测',
          confidence: 0.92,
          mastery: '精通',
          weight: 0.9,
          status: 'pending',
          aiReason:
            '该知识点讲解主控板对单体电压的采样、比对与均衡触发逻辑，与能力点 A2「独立完成电压一致性检测并判定偏差等级」的能力描述高度吻合，语义相似度 0.92。'
        };
      case '从控板通信协议（CAN）':
        return {
          ...base,
          abilityCode: 'A5',
          abilityName: 'CAN 总线故障排查',
          confidence: 0.88,
          mastery: '掌握',
          weight: 0.8,
          status: 'pending',
          aiReason:
            '知识点覆盖 CAN 帧结构、波特率配置与常见通信中断排查，对应 A5 能力项中「使用诊断仪定位 CAN 通信故障」的考核要求，语义相似度 0.88。'
        };
      case '热管理系统原理':
        return {
          ...base,
          abilityCode: 'B4',
          abilityName: '冷却系统检修',
          confidence: 0.79,
          mastery: '掌握',
          weight: 0.6,
          status: 'pending',
          aiReason:
            '知识点讲解液冷/风冷回路与温控策略，与 B4「冷却系统密封性检测与维护」相关，但未覆盖实操考核要点，建议掌握要求设为「掌握」。'
        };
      case '绝缘电阻检测方法':
        return {
          ...base,
          abilityCode: 'A1',
          abilityName: '绝缘性能检测',
          confidence: 0.97,
          mastery: '精通',
          weight: 1.0,
          status: 'confirmed',
          aiReason:
            '知识点完整覆盖绝缘电阻表选型、测量步骤与判定标准，与 A1「独立完成整车绝缘性能检测」一致，语义相似度 0.97。'
        };
      case '单体电压采样电路':
        return {
          ...base,
          abilityCode: 'A2',
          abilityName: '电压一致性检测',
          confidence: 0.93,
          mastery: '掌握',
          weight: 0.8,
          status: 'confirmed',
          aiReason:
            '采样电路原理是电压一致性检测的基础，与 A2 的「采样回路故障定位」考核点对应，语义相似度 0.93。'
        };
      default:
        // 继电器粘连诊断
        return {
          ...base,
          abilityCode: 'B1',
          abilityName: '常见故障诊断',
          confidence: 0.68,
          mastery: '掌握',
          weight: 0.7,
          status: 'rejected',
          rejectReason: '推荐不准确，应映射至 B2 主回路检修（已手动改绑，待 AI 重新学习）。',
          aiReason: 'AI 初判与 B1 相关，但继电器粘连属于主回路检修范畴，推荐置信度偏低。'
        };
    }
  });

  return [...showcaseMappings, ...restMappings];
}

export const initialMappings: Mapping[] = buildMappings();

/** 知识点 id → 映射，用于左侧知识树状态角标 */
export const mappingByKnowledgeId: Record<string, Mapping> = initialMappings.reduce<
  Record<string, Mapping>
>((acc, m) => {
  acc[m.knowledgeId] = m;
  return acc;
}, {});
