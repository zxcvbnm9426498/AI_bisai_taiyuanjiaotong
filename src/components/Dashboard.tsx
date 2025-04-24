'use client';

import { useEffect, useState } from 'react';
import Header from './Header';
import TrafficMap from './TrafficMap';
import StatisticCard from './StatisticCard';
import LineChart from './charts/LineChart';
import PieChart from './charts/PieChart';
import BarChart from './charts/BarChart';
import StatusTable from './StatusTable';
import { getCityTrafficInfo, getTrafficEvents } from '@/services/amapService';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [trafficData, setTrafficData] = useState({
    congestionIndex: '0',
    accidentCount: '0'
  });

  useEffect(() => {
    // 获取实时交通数据
    const fetchTrafficData = async () => {
      try {
        // 获取城市交通态势信息
        const cityTraffic = await getCityTrafficInfo();
        
        // 获取交通事件信息
        const trafficEvents = await getTrafficEvents();
        
        if (cityTraffic && trafficEvents) {
          // 拥堵指数
          const congestionIndex = Math.round(
            parseFloat(cityTraffic.evaluation.congestion_delayed_index || '0') * 100
          ).toString();
          
          // 事故数量
          const accidentCount = trafficEvents.count.toString();
          
          setTrafficData({
            congestionIndex,
            accidentCount
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('获取交通数据失败:', error);
        setLoading(false);
      }
    };
    
    fetchTrafficData();
    
    // 每分钟更新一次数据
    const timer = setInterval(fetchTrafficData, 60000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Header />
      
      {loading ? (
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-pulse text-[#00a8ff] text-xl">加载中...</div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {/* 左侧统计卡片 */}
          <div className="col-span-3 flex flex-col gap-4">
            <div className="tech-card">
              <div className="tech-header">城市设备统计</div>
              <div className="grid grid-cols-2 gap-2 p-3">
                <StatisticCard title="检测设备" value="2190" color="#3794ff" />
                <StatisticCard title="交通监控" value="190" color="#3794ff" />
                <StatisticCard title="区域监控" value="3001" color="#3794ff" />
                <StatisticCard title="其他设备" value="108" color="#ff5757" />
              </div>
            </div>
            
            <div className="tech-card h-[300px]">
              <div className="tech-header">拥堵路段排行</div>
              <StatusTable />
            </div>
          </div>
          
          {/* 中间地图区域 */}
          <div className="col-span-6 tech-card blue-glow">
            <div className="tech-header">太原市交通实时监控</div>
            <TrafficMap />
          </div>
          
          {/* 右侧统计和图表 */}
          <div className="col-span-3 flex flex-col gap-4">
            <div className="tech-card">
              <div className="tech-header">交通指数统计</div>
              <div className="grid grid-cols-2 gap-2 p-3">
                <StatisticCard title="今日拥堵" value={trafficData.congestionIndex} color="#3794ff" trend="up" />
                <StatisticCard title="事故数量" value={trafficData.accidentCount} color="#ff5757" trend="up" />
              </div>
            </div>
            
            <div className="tech-card h-[200px]">
              <div className="tech-header">拥堵指数趋势</div>
              <div className="p-2 h-full">
                <LineChart />
              </div>
            </div>
            
            <div className="tech-card">
              <div className="tech-header">交通分布</div>
              <div className="grid grid-cols-2">
                <div className="p-2 h-[200px]">
                  <PieChart />
                </div>
                <div className="p-2 flex flex-col items-center justify-center">
                  <div className="text-[#00a8ff] text-2xl font-bold">75<span className="text-base">%</span></div>
                  <div className="text-xs text-gray-400">一季度拥堵率</div>
                  <div className="mt-2">
                    <div className="text-[#00a8ff] text-sm">1321<span className="text-xs ml-1">高峰警报</span></div>
                    <div className="text-[#ff5757] text-sm">150%<span className="text-xs ml-1">同比增长</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 底部统计图表 */}
          <div className="col-span-4 tech-card">
            <div className="tech-header">区域分布统计</div>
            <div className="p-2 h-[200px]">
              <PieChart />
            </div>
          </div>
          
          <div className="col-span-8 tech-card">
            <div className="tech-header">全国拥堵分布统计</div>
            <div className="p-2 h-[200px]">
              <BarChart />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 