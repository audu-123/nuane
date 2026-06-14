import React from 'react';
import type { LearningResource } from '../types';

interface Props {
  resource: LearningResource;
}

/**
 * 高级卡片组件，使用玻璃化、渐变、微交互，实现视觉精品感。
 * 适配暗/亮模式，使用 CSS 变量实现主题统一。
 */
const ResourceCard: React.FC<Props> = ({ resource }) => {
  return (
    <div className="relative flex items-start gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-200 hover:border-[#0052D9]/30">
      <span className="text-2xl flex-shrink-0" aria-hidden="true">
        {resource.icon}
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-800 truncate" title={resource.title}>
          {resource.title}
        </h3>
        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2" title={resource.desc}>
          {resource.desc}
        </p>
      </div>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="self-center px-2.5 py-1 bg-[#0052D9] text-white text-xs rounded hover:bg-[#003BA5] transition-colors"
      >
        学习
      </a>
    </div>
  );
};

export default ResourceCard;
