'use client';

import { useEffect, useState } from 'react';
import Header from './Header';
import TrafficMap from './TrafficMap';
import StatisticCard from './StatisticCard';
import StatusTable from './StatusTable';
import RouteSearch from './RouteSearch';
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
    <div className="flex flex-col gap-4 min-h-screen">
      <Header />
      
      {loading ? (
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-pulse text-[#00a8ff] text-xl">加载中...</div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4 flex-grow">
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
            
            <div className="tech-card flex-grow">
              <div className="tech-header">拥堵路段排行</div>
              <StatusTable />
            </div>
          </div>
          
          {/* 中间地图区域 */}
          <div className="col-span-6 tech-card blue-glow">
            <div className="tech-header">太原市交通实时监控</div>
            <div className="h-full">
              <TrafficMap />
            </div>
          </div>
          
          {/* 右侧统计和路线查询 */}
          <div className="col-span-3 flex flex-col gap-4">
            <div className="tech-card">
              <div className="tech-header">交通指数统计</div>
              <div className="grid grid-cols-2 gap-2 p-3">
                <StatisticCard title="今日拥堵" value={trafficData.congestionIndex} color="#3794ff" trend="up" />
                <StatisticCard title="事故数量" value={trafficData.accidentCount} color="#ff5757" trend="up" />
              </div>
            </div>
            
            <div className="tech-card flex-grow">
              <div className="tech-header">路线拥堵查询</div>
              <div className="p-4 h-full">
                <RouteSearch />
              </div>
            </div>
          </div>
          
          {/* 底部交通信息状态栏 */}
          <div className="col-span-12 tech-card mt-4">
            <div className="tech-header">交通实时状态</div>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#00af66]"></div>
                  <span className="text-sm text-gray-300">畅通路段: 78%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#ffbf00]"></div>
                  <span className="text-sm text-gray-300">缓行路段: 14%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff6600]"></div>
                  <span className="text-sm text-gray-300">拥堵路段: 5%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#ee0000]"></div>
                  <span className="text-sm text-gray-300">严重拥堵: 3%</span>
                </div>
              </div>
              <div className="text-[#00a8ff] text-sm">
                <span className="mr-2">系统更新时间:</span>
                <span>{new Date().toLocaleString('zh-CN', { hour12: false })}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 