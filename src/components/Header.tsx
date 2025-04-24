'use client';

import { useEffect, useState } from 'react';

export default function Header() {
  const [currentTime, setCurrentTime] = useState('');
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const dateString = now.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      setCurrentTime(`${dateString} ${timeString}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex justify-center items-center py-3">
      <div className="absolute left-4 text-sm text-[#00a8ff]">{currentTime}</div>
      <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0066cc] to-[#00a8ff] bg-clip-text text-transparent">
        智能城市交通监控预警平台
      </h1>
      <div className="absolute right-4 flex gap-2">
        <div className="px-2 py-1 bg-[#041836] rounded text-xs border border-[#1e3c68]">
          系统状态: <span className="text-[#0f0]">正常</span>
        </div>
      </div>
    </div>
  );
} 