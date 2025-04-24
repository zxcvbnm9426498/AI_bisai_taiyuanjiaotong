'use client';

import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { get24HourTrend } from '@/services/amapService';

export default function LineChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<{ hours: string[], trafficData: number[], accidentData: number[] }>({ hours: [], trafficData: [], accidentData: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 获取高德地图API数据
  const fetchRealTimeData = async () => {
    try {
      setLoading(true);
      
      // 使用高德API服务获取实时数据
      const trendData = await get24HourTrend();
      
      if (trendData) {
        setChartData(trendData);
        setError(null);
      } else {
        throw new Error('获取交通趋势数据失败');
      }
    } catch (err) {
      console.error('获取交通趋势数据错误:', err);
      setError(err instanceof Error ? err.message : '未知错误');
      
      // 如果API调用失败，回退到模拟数据以确保UI正常显示
      fallbackToSimulatedData();
    } finally {
      setLoading(false);
    }
  };
  
  // 回退到模拟数据的函数（保留原有功能，防止API调用失败时界面空白）
  const fallbackToSimulatedData = () => {
    // 基础数据生成
    const trafficData = [];
    const accidentData = [];
    const hours = [];
    
    // 当前小时
    const now = new Date();
    const currentHour = now.getHours();
    
    // 生成24小时数据
    for (let i = 0; i < 24; i++) {
      const hour = (currentHour - 23 + i + 24) % 24;
      hours.push(`${hour}:00`);
      
      // 基础值 + 随机波动
      let baseTraffic = 100;
      
      // 早高峰 7-9点
      if (hour >= 7 && hour <= 9) {
        baseTraffic = 250 + Math.random() * 50;
      }
      // 晚高峰 17-19点
      else if (hour >= 17 && hour <= 19) {
        baseTraffic = 280 + Math.random() * 70;
      }
      // 中午小高峰 12-13点
      else if (hour >= 12 && hour <= 13) {
        baseTraffic = 180 + Math.random() * 40;
      }
      // 深夜 0-5点
      else if (hour >= 0 && hour <= 5) {
        baseTraffic = 50 + Math.random() * 30;
      }
      // 其他时间
      else {
        baseTraffic = 100 + Math.random() * 80;
      }
      
      // 拥堵指数
      trafficData.push(Math.round(baseTraffic));
      
      // 事故数量 (与拥堵相关但更少)
      const accidentBase = baseTraffic * 0.3;
      accidentData.push(Math.round(accidentBase + Math.random() * 15));
    }
    
    setChartData({ hours, trafficData, accidentData });
  };
  
  // 初始化数据
  useEffect(() => {
    fetchRealTimeData();
    
    // 每5分钟更新一次数据，模拟实时性
    const timer = setInterval(() => {
      fetchRealTimeData();
    }, 300000); // 5分钟更新
    
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    if (!chartRef.current || chartData.hours.length === 0) return;
    
    const chart = echarts.init(chartRef.current);
    
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: 'rgba(0, 168, 255, 0.3)',
            width: 1,
            type: 'solid'
          }
        }
      },
      legend: {
        data: ['拥堵指数', '事故数量'],
        textStyle: {
          color: '#6b778d',
          fontSize: 10
        },
        right: 10,
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: chartData.hours,
        axisLine: {
          lineStyle: {
            color: '#1e3c68'
          }
        },
        axisLabel: {
          color: '#6b778d',
          fontSize: 10,
          interval: 2
        }
      },
      yAxis: {
        type: 'value',
        splitLine: {
          lineStyle: {
            color: '#1e3c68',
            type: 'dashed'
          }
        },
        axisLabel: {
          color: '#6b778d',
          fontSize: 10
        }
      },
      series: [
        {
          name: '拥堵指数',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          data: chartData.trafficData,
          lineStyle: {
            width: 2,
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, 
                color: '#00a8ff'
              }, {
                offset: 1, 
                color: '#0066cc'
              }]
            }
          },
          areaStyle: {
            opacity: 0.3,
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0,
                color: 'rgba(0, 168, 255, 0.5)'
              }, {
                offset: 0.8,
                color: 'rgba(0, 168, 255, 0)'
              }]
            }
          },
          emphasis: {
            itemStyle: {
              color: '#00a8ff',
              borderColor: '#00a8ff',
              borderWidth: 2
            }
          }
        },
        {
          name: '事故数量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          data: chartData.accidentData,
          lineStyle: {
            width: 2,
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, 
                color: '#ff5757'
              }, {
                offset: 1, 
                color: '#cc0000'
              }]
            }
          },
          areaStyle: {
            opacity: 0.2,
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0,
                color: 'rgba(255, 87, 87, 0.3)'
              }, {
                offset: 0.8,
                color: 'rgba(255, 87, 87, 0)'
              }]
            }
          },
          emphasis: {
            itemStyle: {
              color: '#ff5757',
              borderColor: '#ff5757',
              borderWidth: 2
            }
          }
        }
      ]
    };
    
    chart.setOption(option);
    
    const handleResize = () => {
      chart.resize();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      chart.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, [chartData]);
  
  // 添加加载状态显示
  if (loading && chartData.hours.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-[#00a8ff] text-sm">加载交通数据中...</div>
      </div>
    );
  }
  
  // 添加错误状态显示
  if (error && chartData.hours.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-[#ff5757] text-sm">数据加载失败: {error}</div>
      </div>
    );
  }
  
  return <div ref={chartRef} className="w-full h-full" />;
} 