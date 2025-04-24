'use client';

import { useEffect, useState } from 'react';
import { getTrafficEvents, getRoadTrafficInfo } from '@/services/amapService';

// 定义道路数据类型
interface RoadData {
  id: string | number;
  name: string;
  district: string;
  level: number;
}

export default function StatusTable() {
  const [roads, setRoads] = useState<RoadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取拥堵等级对应的样式和文字
  const getLevelStyle = (level: number) => {
    if (level >= 85) {
      return { color: '#ff5757', text: '严重' };
    } else if (level >= 70) {
      return { color: '#ff9800', text: '中度' };
    } else {
      return { color: '#3794ff', text: '轻度' };
    }
  };

  useEffect(() => {
    const fetchRoadData = async () => {
      try {
        setLoading(true);
        
        // 获取交通事件数据
        const eventsData = await getTrafficEvents();
        
        if (!eventsData) {
          throw new Error('获取交通事件数据失败');
        }
        
        // 获取拥堵路段数据
        const roadDataItems: RoadData[] = [];
        
        // 使用交通事件数据中的路段信息
        for (const event of eventsData.events) {
          // 只处理拥堵类型的事件
          if (event.type === 'congestion') {
            // 检查是否已存在同名路段
            const existingRoad = roadDataItems.find(road => road.name === event.road);
            
            if (!existingRoad) {
              // 生成拥堵等级 (根据事件严重程度)
              let level = 60;
              if (event.severity === 'high') {
                level = 85 + Math.floor(Math.random() * 15);
              } else if (event.severity === 'medium') {
                level = 70 + Math.floor(Math.random() * 15);
              } else {
                level = 60 + Math.floor(Math.random() * 10);
              }
              
              roadDataItems.push({
                id: event.id,
                name: event.road,
                district: event.description.includes('区') ? 
                  event.description.split('区')[0] + '区' : '市中心',
                level
              });
            }
          }
        }
        
        // 如果数据不足10条，补充一些模拟数据
        const defaultRoads = [
          { id: 'r1', name: '迎泽', district: '迎泽区', level: 90 },
          { id: 'r2', name: '南内环', district: '小店区', level: 87 },
          { id: 'r3', name: '龙城', district: '尖草坪区', level: 85 },
          { id: 'r4', name: '晋阳街', district: '高新区', level: 83 },
          { id: 'r5', name: '新建路', district: '杏花岭区', level: 77 },
          { id: 'r6', name: '长风街', district: '万柏林区', level: 75 },
          { id: 'r7', name: '马练营', district: '小店区', level: 72 },
          { id: 'r8', name: '滨河东路', district: '杏花岭区', level: 70 },
          { id: 'r9', name: '府西街', district: '迎泽区', level: 68 },
          { id: 'r10', name: '康乐街', district: '杏花岭区', level: 65 },
        ];
        
        // 合并实际数据和默认数据，确保有足够的数据显示
        let combinedData = [...roadDataItems];
        
        // 如果实际数据不足10条，补充默认数据
        for (let i = 0; combinedData.length < 10 && i < defaultRoads.length; i++) {
          // 确保不重复添加
          if (!combinedData.some(road => road.name === defaultRoads[i].name)) {
            combinedData.push(defaultRoads[i]);
          }
        }
        
        // 按拥堵等级排序
        combinedData.sort((a, b) => b.level - a.level);
        
        // 只取前10条记录
        setRoads(combinedData.slice(0, 10));
        setError(null);
      } catch (err) {
        console.error('获取道路数据错误:', err);
        setError(err instanceof Error ? err.message : '未知错误');
        
        // 如果API调用失败，回退到模拟数据
        fallbackToSimulatedData();
      } finally {
        setLoading(false);
      }
    };
    
    // 回退到模拟数据的函数
    const fallbackToSimulatedData = () => {
      setRoads([
        { id: 1, name: '迎泽', district: '迎泽区', level: 90 },
        { id: 2, name: '南内环', district: '小店区', level: 87 },
        { id: 3, name: '龙城', district: '尖草坪区', level: 85 },
        { id: 4, name: '晋阳街', district: '高新区', level: 83 },
        { id: 5, name: '新建路', district: '杏花岭区', level: 77 },
        { id: 6, name: '长风街', district: '万柏林区', level: 75 },
        { id: 7, name: '马练营', district: '小店区', level: 72 },
        { id: 8, name: '滨河东路', district: '杏花岭区', level: 70 },
        { id: 9, name: '府西街', district: '迎泽区', level: 68 },
        { id: 10, name: '康乐街', district: '杏花岭区', level: 65 },
      ]);
    };
    
    fetchRoadData();
    
    // 每3分钟更新一次数据
    const timer = setInterval(fetchRoadData, 180000);
    
    return () => clearInterval(timer);
  }, []);

  if (loading && roads.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-[#00a8ff] text-sm">加载道路数据中...</div>
      </div>
    );
  }
  
  if (error && roads.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-[#ff5757] text-sm">数据加载失败: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-2 h-full overflow-auto scrollbar-hide">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#1e3c68]">
            <th className="py-2 text-left">路名</th>
            <th className="py-2 text-left">区域</th>
            <th className="py-2 text-right">拥堵值</th>
          </tr>
        </thead>
        <tbody>
          {roads.map(road => {
            const levelStyle = getLevelStyle(road.level);
            return (
              <tr key={road.id} className="border-b border-[#1e3c68]/30">
                <td className="py-2">{road.name}</td>
                <td className="py-2 text-gray-400">{road.district}</td>
                <td className="py-2 text-right">
                  <span style={{ color: levelStyle.color }}>{road.level}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
} 