import React from 'react';

type StatisticCardProps = {
  title: string;
  value: string;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
};

export default function StatisticCard({ title, value, color = '#00a8ff', trend }: StatisticCardProps) {
  return (
    <div className="p-2 flex flex-col">
      <div className="text-gray-400 text-xs mb-1">{title}</div>
      <div className="flex items-center">
        <div 
          style={{ color }}
          className="text-xl font-bold"
        >
          {value}
        </div>
        {trend && (
          <div className="ml-1">
            {trend === 'up' && <span className="text-red-500 text-xs">↑</span>}
            {trend === 'down' && <span className="text-green-500 text-xs">↓</span>}
            {trend === 'stable' && <span className="text-gray-500 text-xs">-</span>}
          </div>
        )}
      </div>
    </div>
  );
} 