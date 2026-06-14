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
