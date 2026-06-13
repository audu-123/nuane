// 候选人信息
export interface Candidate {
  id: number;
  name: string;
  position: string;
  round: string;
  time: string;
  tags: string[];
  result?: 'pass' | 'fail' | null;
}

// 评分维度
export interface ScoringDimension {
  id: string;
  label: string;
  score: number | null;
}

// 模板
export interface TagTemplate {
  id: string;
  name: string;
  tags: string[];
}

// 面试记录
export interface InterviewRecord {
  id: number;
  candidateId: number;
  candidateName: string;
  position: string;
  round: string;
  date: string;
  result: 'pass' | 'fail';
  dimensions: ScoringDimension[];
  noteText: string;
  noteTags: string[];
  feedbackInternal: string;
  feedbackExternal: string;
  sentAt: string;
}

// 高亮穿梭词对
export interface HighlightPair {
  id: string;
  tagWord: string;       // 能力名词 (tag)
  hlWord: string;        // 定性结论词 (hl)
  status: 'pending' | 'confirmed' | 'skipped';
  hasConflict?: boolean;
  tagIndex: number;      // 在原文中的位置索引
  hlIndex: number;
}

// 页面路由
export type Page = 'queue' | 'scoring' | 'candidate' | 'archive';

// 发送策略
export type SendStrategy = 'immediate' | 'delay2h' | 'custom';
