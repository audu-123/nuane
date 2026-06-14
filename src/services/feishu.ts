import type { Candidate } from '../types';

// TODO: 请将以下配置替换为您自己的飞书应用配置
// 配置已经移至 .env.local 文件中，防止密钥泄露到代码仓库
export const FEISHU_CONFIG = {
  APP_ID: import.meta.env.VITE_FEISHU_APP_ID || '', 
  APP_SECRET: import.meta.env.VITE_FEISHU_APP_SECRET || '', 
  APP_TOKEN: import.meta.env.VITE_FEISHU_APP_TOKEN || '', 
  TABLE_ID: import.meta.env.VITE_FEISHU_TABLE_ID || '',  
};

async function getTenantAccessToken() {
  const response = await fetch('/feishu-api/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: FEISHU_CONFIG.APP_ID,
      app_secret: FEISHU_CONFIG.APP_SECRET,
    }),
  });
  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(data.msg || '获取 token 失败');
  }
  return data.tenant_access_token;
}

export async function fetchCandidatesFromFeishu(): Promise<Candidate[]> {
  try {
    if (!FEISHU_CONFIG.APP_ID || FEISHU_CONFIG.APP_ID === 'cli_...') {
      console.warn('⚠️ 飞书配置未填写，将使用本地 mock 数据');
      return [];
    }

    const token = await getTenantAccessToken();

    const response = await fetch(
      `/feishu-api/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${FEISHU_CONFIG.TABLE_ID}/records`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.code !== 0) {
      console.error('获取飞书数据失败:', data.msg);
      return [];
    }

    return data.data.items.map((item: any) => {
      const fields = item.fields;
      let dateStr = '';
      if (fields['面试日期']) {
        const d = new Date(fields['面试日期']);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      }

      // 如果有特殊类型（例如标签可能不是数组，轮次可能是对象等），这里做个保护
      let tags = [];
      if (Array.isArray(fields['标签'])) {
        tags = fields['标签'];
      } else if (typeof fields['标签'] === 'string') {
        tags = [fields['标签']];
      }

      let round = '一面';
      if (typeof fields['轮次'] === 'object' && fields['轮次']?.text) {
        round = fields['轮次'].text;
      } else if (typeof fields['轮次'] === 'string') {
        round = fields['轮次'];
      }

      return {
        id: item.record_id,
        name: fields['姓名'] || '未知',
        position: fields['岗位'] || '未知',
        round: round,
        date: dateStr,
        time: fields['面试时间'] || '10:00',
        tags: tags,
        result: null,
      } as Candidate;
    });
  } catch (error) {
    console.error('请求飞书接口发生异常:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 腾讯元器（Yuanqi）智能体 API 调用
// ─────────────────────────────────────────────────────────────────────────────
export const YUANQI_CONFIG = {
  APP_ID: import.meta.env.VITE_YUANQI_APP_ID || '',
  APP_KEY: import.meta.env.VITE_YUANQI_APP_KEY || '',
};

/**
 * 调用腾讯元器智能体 API，发送面试数据，获取 AI 生成的面评内容。
 * 接口文档：https://yuanqi.tencent.com/openapi/v1/agent/chat/completions
 */
export async function callYuanqiAI(payload: {
  result: 'pass' | 'fail';
  dimensions: { label: string; score: number | null }[];
  candidateName: string;
  position?: string;
  noteText?: string;
  department?: string;
}): Promise<{ internal: string; external: string }> {
  const { result, dimensions, candidateName, position, noteText, department } = payload;

  // 拼装 user message：将面试数据序列化为结构化文本
  // 只发送有实际打分的维度，未打分的标记为"未评分"
  const scoredDims = dimensions.filter((d) => d.score !== null);
  const unscoredDims = dimensions.filter((d) => d.score === null);

  let dimensionStr = '';
  if (scoredDims.length > 0) {
    dimensionStr = scoredDims.map((d) => `${d.label}:${d.score}`).join(', ');
  }
  if (unscoredDims.length > 0) {
    const unscoredLabels = unscoredDims.map((d) => d.label).join('、');
    dimensionStr += (dimensionStr ? '；' : '') + `以下维度未评分：${unscoredLabels}`;
  }
  if (!dimensionStr) {
    dimensionStr = '面试官未对任何维度进行打分';
  }

  const hasNote = noteText && noteText.trim().length > 0;

  const userMessage = [
    `候选人姓名：${candidateName}`,
    `应聘岗位：${position || '未知'}`,
    `维度评分：${dimensionStr}`,
    `备注：${hasNote ? noteText : '面试官未填写任何备注'}`,
    `面试结果：${result === 'pass' ? '通过' : '未过'}`,
    `投递部门标签：${department || '未知'}`,
    '',
    '【重要约束】请严格基于以上提供的数据生成面评。对于未评分的维度，不得编造具体表现描述。对于空白备注，不得虚构面试细节。如果数据不足，请如实说明"该维度未评分，暂无法给出具体评价"。',
  ].join('\n');

  const requestBody = {
    assistant_id: YUANQI_CONFIG.APP_ID,
    user_id: 'demo_interviewer',
    stream: false,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userMessage,
          },
        ],
      },
    ],
  };

  console.log('📡 正在调用元器智能体 API...', { userMessage });

  const response = await fetch('/yuanqi-api/v1/agent/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${YUANQI_CONFIG.APP_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`元器 API 调用失败: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ 元器智能体返回:', data);

  // 从 choices[0].message.content 中提取 AI 回复
  const aiReply: string = data?.choices?.[0]?.message?.content || '';

  // 尝试按多种标题格式分割对内面评和对外反馈
  // 支持格式如：### **[对内面评]**、## 对内面评、**对内面评**、【对内面评】等
  const internalMatch = aiReply.match(
    /(?:#{1,3}\s*\*{0,2}\s*[\[【]?\s*对内面评\s*[\]】]?\s*\*{0,2}|对内面评[：:])\s*\n([\s\S]*?)(?=(?:#{1,3}\s*\*{0,2}\s*[\[【]?\s*对外反馈)|$)/
  );
  const externalMatch = aiReply.match(
    /(?:#{1,3}\s*\*{0,2}\s*[\[【]?\s*对外反馈[^】\]]*[\]】]?\s*\*{0,2}|对外反馈[：:])\s*\n([\s\S]*)/
  );

  return {
    internal: internalMatch ? internalMatch[1].trim() : aiReply,
    external: externalMatch ? externalMatch[1].trim() : aiReply,
  };
}
