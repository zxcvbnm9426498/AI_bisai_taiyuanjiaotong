'use client';

import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { getRoadTypeTrafficData } from '@/services/amapService';

// 修改EChartsOptionType定义，添加itemStyle属性
interface EChartsOptionType {
  color: string[];
  tooltip: {
    trigger: string;
    axisPointer: {
      type: string;
    };
  };
  grid: {
    left: string;
    right: string;
    bottom: string;
    top: string;
    containLabel: boolean;
  };
  legend: {
    data: string[];
    textStyle: {
      color: string;
    };
    icon: string;
    right: string;
  };
  xAxis: {
    type: string;
    data: string[];
    axisTick: {
      show: boolean;
    };
    axisLine: {
      lineStyle: {
        color: string;
      };
    };
    axisLabel: {
      color: string;
    };
  };
  yAxis: {
    type: string;
    splitLine: {
      lineStyle: {
        color: string;
      };
    };
    axisTick: {
      show: boolean;
    };
    axisLine: {
      lineStyle: {
        color: string;
      };
    };
    axisLabel: {
      color: string;
    };
  };
  series: Array<{
    name: string;
    type: string;
    data: number[];
    barWidth: string;
    itemStyle?: {
      normal?: {
        color?: string | {
          type: string;
          x: number;
          y: number;
          x2: number;
          y2: number;
          colorStops: Array<{
            offset: number;
            color: string;
          }>;
          global: boolean;
        };
      };
    };
  }>;
}

export default function BarChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<{
    days: string[],
    roadTypes: string[],
    values: number[][]
  }>({
    days: [],
    roadTypes: [],
    values: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取高德地图API数据
  const fetchRealTimeData = async () => {
    try {
      setLoading(true);
      
      // 使用高德API服务获取道路类型交通数据
      const roadData = await getRoadTypeTrafficData();
      
      if (roadData) {
        // 调整数据结构以匹配组件状态
        setData({
          days: roadData.days,
          roadTypes: roadData.roadTypes,
          values: roadData.data
        });
        setError(null);
      } else {
        throw new Error('获取道路类型交通数据失败');
      }
    } catch (err) {
      console.error('获取道路类型交通数据错误:', err);
      setError(err instanceof Error ? err.message : '未知错误');
      
      // 如果API调用失败，回退到模拟数据以确保UI正常显示
      fallbackToSimulatedData();
    } finally {
      setLoading(false);
    }
  };

  // 回退到模拟数据的函数
  const fallbackToSimulatedData = () => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const roadTypes = ['高速公路', '主干道', '次干道', '支路'];
    
    // 生成模拟数据
    const values = roadTypes.map(type => {
      // 不同路类型基础流量不同
      let baseValue = 0;
      switch (type) {
        case '高速公路':
          baseValue = 2000;
          break;
        case '主干道':
          baseValue = 1500;
          break;
        case '次干道':
          baseValue = 1000;
          break;
        case '支路':
          baseValue = 500;
          break;
      }
      
      return days.map((day, index) => {
        // 周末的流量模式与工作日不同
        const isWeekend = index >= 5;
        
        // 高速公路在周末流量可能更高，而市区道路在工作日可能更高
        let modifier = 1;
        
        if (type === '高速公路' || type === '主干道') {
          modifier = isWeekend ? 1.2 : 1.0;
        } else {
          modifier = isWeekend ? 0.8 : 1.1;
        }
        
        // 为每天添加一些随机波动
        return Math.round(baseValue * modifier * (0.9 + Math.random() * 0.2));
      });
    });
    
    setData({
      days,
      roadTypes,
      values
    });
  };

  // 初始化数据
  useEffect(() => {
    fetchRealTimeData();
    
    // 每5分钟更新一次数据
    const timer = setInterval(() => {
      fetchRealTimeData();
    }, 300000);
    
    return () => clearInterval(timer);
  }, [fetchRealTimeData]); // 添加fetchRealTimeData作为依赖项
  
  useEffect(() => {
    if (!chartRef.current || !data.days.length) return;
    
    const chart = echarts.init(chartRef.current);
    
    const series = data.roadTypes.map((type, index) => ({
      name: type,
      type: 'bar',
      data: data.values[index],
      barWidth: '10px',
      barGap: '10%',
      itemStyle: {
        borderRadius: [2, 2, 0, 0]
      }
    }));
    
    // 为不同道路类型设置不同颜色
    const colors = [
      ['#00a8ff', '#0066cc'], // 高速公路
      ['#32ccbc', '#109e8f'], // 主干道
      ['#ffaa00', '#cc7700'], // 次干道
      ['#8a5fff', '#6030cc']  // 支路
    ];
    
    // 为每个系列设置颜色
    series.forEach((item, index) => {
      if (index < colors.length) {
        item.itemStyle = {
          ...item.itemStyle,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: colors[index][0]
            }, {
              offset: 1,
              color: colors[index][1]
            }]
          }
        } as EChartsOptionType['series'][0]['itemStyle'];
      }
    });
    
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: data.roadTypes,
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
        data: data.days,
        axisLine: {
          lineStyle: {
            color: '#1e3c68'
          }
        },
        axisLabel: {
          color: '#6b778d',
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        name: '流量',
        nameTextStyle: {
          color: '#6b778d',
          fontSize: 10
        },
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
      series
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
  }, [data]);
  
  // 添加加载状态显示
  if (loading && !data.days.length) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-[#00a8ff] text-sm">加载道路交通数据中...</div>
      </div>
    );
  }
  
  // 添加错误状态显示
  if (error && !data.days.length) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-[#ff5757] text-sm">数据加载失败: {error}</div>
      </div>
    );
  }
  
  return <div ref={chartRef} className="w-full h-full" />;
}