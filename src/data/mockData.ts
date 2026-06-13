import type { Candidate, TagTemplate, InterviewRecord } from '../types';

// [AI接入指引]
// 当前为 Mock 数据，实际应通过 API 从腾讯多维表格同步候选人信息。
// 接入步骤：
// 1. 在腾讯多维表格中维护候选人信息表（姓名、岗位、轮次、面试时间）。
// 2. 调用多维表格开放 API 的「获取记录列表」接口拉取数据。
// 3. 将返回数据映射为本组件的 candidate 数据结构即可。
export const mockCandidates: Candidate[] = [
  {
    id: 1,
    name: '李明',
    position: '前端工程师',
    round: '二面',
    date: '2026-06-14',
    time: '10:00',
    tags: ['React', 'TypeScript', '组件设计'],
    result: null,
  },
  {
    id: 2,
    name: '王芳',
    position: '产品经理',
    round: '一面',
    date: '2026-06-14',
    time: '14:00',
    tags: ['产品思维', '数据分析', '沟通能力'],
    result: null,
  },
  {
    id: 3,
    name: '张伟',
    position: '后端工程师',
    round: '三面',
    date: '2026-06-15',
    time: '16:30',
    tags: ['Go', '分布式', '系统设计'],
    result: null,
  },
  {
    id: 4,
    name: '陈静',
    position: '数据分析师',
    round: '一面',
    date: '2026-06-15',
    time: '11:30',
    tags: ['数据分析', 'SQL', '逻辑'],
    result: null,
  },
];

export const tagTemplates: TagTemplate[] = [
  {
    id: 'pm',
    name: '产品经理通用模板',
    tags: ['产品思维', '数据分析', '沟通能力', '项目管理', '用户洞察', '需求分析'],
  },
  {
    id: 'fe',
    name: '研发工程师模板',
    tags: ['技术深度', 'React', 'TypeScript', '算法', '系统设计', '代码质量', '工程化'],
  },
  {
    id: 'be',
    name: '后端工程师模板',
    tags: ['Go', '分布式', '数据库', '微服务', '性能优化', '系统设计', '代码质量'],
  },
  {
    id: 'da',
    name: '数据分析师模板',
    tags: ['数据分析', 'SQL', 'Python', '统计学', '逻辑', '数据可视化', '业务理解'],
  },
];

export const QUICK_TAGS = ['React', 'Go', '分布式', '逻辑', '沟通', '数据分析', '产品思维', 'TypeScript', '算法'];

// 评分刻度锚点文字
export const SCORE_ANCHORS: Record<number, string> = {
  '-5': '核心能力红线',
  '-3': '明显不足',
  '-1': '略低预期',
  '0': '符合预期',
  '1': '略超预期',
  '3': '明显亮点',
  '5': '极度惊艳',
};

// [AI接入指引]
// 当前为 Mock 数据，实际应调用腾讯元器（Yuanqi）Agent API。
// 接入步骤：
// 1. 在腾讯元器平台创建一个 Agent，将以下 System Prompt 配置进去：
//    "你是一名专业的面试反馈撰写助手。请根据面试官提供的【候选人姓名】【应聘岗位】
//     【各维度评分（格式：维度名:分值）】【备注标签】【面试结果（通过/未过）】，
//     生成一份对内面评和一份对外反馈。
//     对内面评：语气专业客观，总结亮点或淘汰原因。
//     对外反馈：若通过，输出《通关锦囊》；若未过，输出《成长建议书》。
//     所有涉及能力定性的关键名词请用 <tag> 包裹，定性结论词请用 <hl> 包裹。"
// 2. 获取 Agent 的 API endpoint 和 token。
// 3. 将面试官的打分数据序列化为 JSON，作为 user message 传入。
// 4. 解析返回的字符串，提取 <tag> 和 <hl> 标签渲染高亮。
// 参考文档：https://yuanqi.tencent.com/docs/api
export const mockFeedback = {
  pass: {
    internal: `候选人李明本次二面整体表现优秀，综合评分位于团队历次面试前20%区间。\n\n具体来看，候选人的 <tag>React</tag> 基础 <hl>非常扎实</hl>，能够清晰阐述 Fiber 架构与并发模式的设计原理，并结合实际项目经验给出有深度的见解。<tag>TypeScript</tag> 工程化实践 <hl>超出预期</hl>，对泛型约束、条件类型等高级特性应用自如，显示出扎实的工程素养。\n\n<tag>组件设计</tag> 方面，候选人展示了 <hl>较强的抽象能力</hl>，能从可复用性、可维护性角度出发设计组件边界，思路清晰。\n\n建议进入三面，重点考察系统架构设计与跨团队协作能力。`,
    external: `## 🎉 恭喜您顺利通过本轮面试！\n\n以下是您进入下一轮的专属通关锦囊：\n\n### 📌 下一轮考察侧重点\n\n三面将重点考察以下方向，建议提前准备：\n- **系统架构设计**：大规模前端应用的架构决策与演进思路\n- **跨团队协作**：如何推动技术标准落地、与产品/后端高效协作\n- **技术影响力**：您在团队中推动过哪些技术改进或基建建设\n\n### 💡 本轮低分维度改进建议\n\n<tag>组件设计</tag> 方面可进一步深化：在设计组件时，不妨思考如何平衡灵活性与简洁性，推荐研究 Headless UI 设计模式。\n\n### 📚 推荐阅读资料\n\n- [React 官方文档 - 深入架构理解](https://react.dev/learn)\n- [TypeScript Deep Dive（中文版）](https://jkchao.github.io/typescript-book-chinese/)\n- [前端工程化最佳实践](https://github.com/tencent/feflow)`,
  },
  fail: {
    internal: `候选人李明本次二面综合评估未达到岗位要求，主要短板集中在基础算法与系统设计层面。\n\n<tag>算法</tag> 能力 <hl>比较生疏</hl>，面试过程中在 LRU Cache 设计题上思路混乱，未能在有限时间内给出可行方案，考虑到该岗位对性能优化有较高要求，此项为关键扣分点。\n\n<tag>系统设计</tag> 方面 <hl>略低预期</hl>，对于高并发场景下的前端渲染优化策略缺乏系统性思考，回答较为碎片化。\n\n<tag>React</tag> 基础尚可，但 <hl>深度不足</hl>，对 Concurrent Mode 的理解停留在概念层面，无实际应用经验。\n\n综合以上，建议本轮不予通过，可在候选人算法基础与项目经验充实后再次邀约。`,
    external: `## 感谢您参与本次面试 💪\n\n我们非常欣赏您在面试中展现出的积极态度与学习潜力。以下是我们为您精心准备的成长建议书：\n\n### ✨ 您的亮点\n\n- <tag>React</tag> 基础理解 <hl>令人印象深刻</hl>，您对组件生命周期和状态管理的理解思路清晰\n- 面试过程中展现出良好的 <tag>沟通能力</tag>，表达流畅，逻辑 <hl>条理清晰</hl>\n- 对新技术保持积极的探索精神，这是优秀工程师最重要的特质之一\n\n### 🌱 成长建议\n\n**<tag>算法</tag>** 方面：不需要焦虑，算法是可以通过系统训练显著提升的技能。建议每天坚持 1-2 道 LeetCode 练习，从数组、链表等基础数据结构入手，循序渐进。\n\n**<tag>系统设计</tag>** 方面：可以尝试从实际项目出发，思考"如果流量增长10倍，当前方案会在哪里遇到瓶颈"，这是培养系统设计思维的有效方法。\n\n### 📚 学习资源推荐`,
  },
};

// [AI接入指引]
// 冲突检测：当前为 Mock 预设冲突案例，实际可在 System Prompt 中要求 AI 自检：
// "若某维度打分为负（<0），但你生成的对应定性词为正面语义，
//  请在该词前插入 <conflict> 标签以触发前端冲突预警。"
// 预设冲突案例：算法维度打分为正，但 AI 生成了负面定性词"比较生疏"
export const CONFLICT_WORD = '比较生疏';
export const CONFLICT_DIM = '算法';

// [AI接入指引]
// 当前为 Mock 数据，实际应通过腾讯元器知识库 API 动态抓取。
// 接入步骤：
// 1. 将腾讯课堂或内部学习平台的课程数据导入元器知识库。
// 2. 以候选人低分维度标签为 query，调用元器知识库检索接口。
// 3. 取返回结果的前 2~3 条渲染为推荐卡片。
export const learningResources = [
  {
    id: 1,
    icon: '⚡',
    title: '算法与数据结构系统课',
    desc: '从基础到进阶，涵盖数组、链表、树、图、动态规划等核心主题，含1000+题目精讲。',
    url: 'https://ke.qq.com',
  },
  {
    id: 2,
    icon: '🏗️',
    title: '前端系统设计实战',
    desc: '深入解析大规模前端应用架构设计，包含性能优化、工程化、微前端等实战案例。',
    url: 'https://ke.qq.com',
  },
  {
    id: 3,
    icon: '📘',
    title: 'React 进阶与原理解析',
    desc: '深入 React 底层实现，掌握 Fiber、Hooks、Concurrent Mode 等核心原理。',
    url: 'https://ke.qq.com',
  },
];

// 历史面试记录 Mock
export const mockArchiveRecords: InterviewRecord[] = [
  {
    id: 101,
    candidateId: 10,
    candidateName: '刘洋',
    position: '前端工程师',
    round: '一面',
    date: '2026-06-12',
    result: 'pass',
    dimensions: [
      { id: 'd1', label: 'React', score: 3 },
      { id: 'd2', label: '算法', score: 1 },
      { id: 'd3', label: '沟通能力', score: 2 },
    ],
    noteText: '候选人整体表现稳健，React 项目经验丰富，有 2 年大厂实习背景。',
    noteTags: ['React', '项目经验', '主动性强'],
    feedbackInternal: '候选人表现良好，React 基础扎实，建议晋级二面。',
    feedbackExternal: '恭喜通过一面！下一轮将重点考察系统设计能力，请提前准备。',
    sentAt: '2026-06-12 18:00',
  },
  {
    id: 102,
    candidateId: 11,
    candidateName: '赵雷',
    position: '后端工程师',
    round: '二面',
    date: '2026-06-11',
    result: 'fail',
    dimensions: [
      { id: 'd1', label: 'Go', score: -1 },
      { id: 'd2', label: '系统设计', score: -3 },
      { id: 'd3', label: '代码质量', score: 0 },
    ],
    noteText: 'Go 基础薄弱，系统设计思路不清晰，未能通过。',
    noteTags: ['Go', '系统设计', '需加强'],
    feedbackInternal: '候选人系统设计能力不足，暂不符合岗位要求。',
    feedbackExternal: '感谢参与面试，我们为您准备了专属成长建议，期待您未来再次挑战！',
    sentAt: '2026-06-11 17:30',
  },
];
