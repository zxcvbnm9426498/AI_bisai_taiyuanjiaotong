'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button, Tooltip, notification } from 'antd';
import { ReloadOutlined, EnvironmentOutlined, DashboardOutlined, WarningOutlined } from '@ant-design/icons';
import Script from 'next/script';
import baiduMapService from '../services/baiduMapService';

// 百度地图API密钥
const BMAP_AK = "tcjeRJ4R8YwcSGYvXWL6dUwG8e6G4cDu";

// 太原市中心坐标
const TAIYUAN_CENTER: [number, number] = [112.549, 37.857];

// 类型定义
type CongestionPoint = {
  id: string;
  name: string;
  level: 1 | 2 | 3; // 1-轻度, 2-中度, 3-严重
  position: [number, number]; // 经纬度坐标
  description: string;
  updateTime: string;
};

type RoadLine = {
  id: string;
  name: string;
  path: [number, number][]; // 经纬度坐标数组
  level: 1 | 2 | 3; // 1-畅通, 2-缓行, 3-拥堵
  speed: number;
};

type AccidentPoint = {
  id: string;
  title: string;
  position: [number, number]; // 经纬度坐标
  type: 'accident' | 'construction' | 'control'; // 事故类型:事故/施工/管制
  severity: 1 | 2 | 3; // 严重程度
  time: string;
  description: string;
  estimated_clear_time?: string;
};

// 道路数据(太原地区示例数据)
const roadLineData: RoadLine[] = [
  {
    id: 'road1',
    name: '迎泽大街',
    path: [
      [112.559, 37.8571],
      [112.574, 37.8571],
      [112.589, 37.8574]
    ],
    level: 3,
    speed: 15
  },
  {
    id: 'road2',
    name: '南内环街',
    path: [
      [112.530, 37.8465],
      [112.559, 37.8466],
      [112.589, 37.8466],
      [112.613, 37.8465]
    ],
    level: 2,
    speed: 35
  },
  {
    id: 'road3',
    name: '解放路',
    path: [
      [112.5599, 37.8586],
      [112.5613, 37.8697],
      [112.5613, 37.8802]
    ],
    level: 1,
    speed: 55
  },
  {
    id: 'road4',
    name: '滨河西路',
    path: [
      [112.5224, 37.8683],
      [112.5384, 37.8723],
      [112.5492, 37.8734],
      [112.5573, 37.8795]
    ],
    level: 2,
    speed: 40
  }
];

// 拥堵点数据(太原地区示例)
const congestionPointData: CongestionPoint[] = [
  {
    id: 'cp1',
    name: '柳巷交叉口',
    level: 3,
    position: [112.563, 37.873],
    description: '南北方向严重拥堵，预计需要20分钟通过',
    updateTime: '2023-05-15 08:21:33'
  },
  {
    id: 'cp2',
    name: '五一广场',
    level: 2,
    position: [112.576, 37.857],
    description: '东西方向中度拥堵，车流量大',
    updateTime: '2023-05-15 08:22:15'
  },
  {
    id: 'cp3',
    name: '桃园交叉口',
    level: 3,
    position: [112.547, 37.870],
    description: '全方向严重拥堵，施工占道导致',
    updateTime: '2023-05-15 08:19:45'
  },
  {
    id: 'cp4',
    name: '长风街交叉口',
    level: 1,
    position: [112.532, 37.864],
    description: '交通畅通，偶有缓行',
    updateTime: '2023-05-15 08:18:40'
  }
];

// 交通事故数据
const accidentPointData: AccidentPoint[] = [
  {
    id: 'acc1',
    title: '车辆追尾事故',
    position: [112.558, 37.858],
    type: 'accident',
    severity: 2,
    time: '2023-05-15 07:44:21',
    description: '两车追尾，占用辅路车道，正在处理中',
    estimated_clear_time: '2023-05-15, 09:00'
  },
  {
    id: 'acc2',
    title: '道路维修施工',
    position: [112.543, 37.883],
    type: 'construction',
    severity: 2,
    time: '2023-05-15 00:00:00',
    description: '道路施工养护，占用内侧车道，持续到5月17日',
    estimated_clear_time: '2023-05-17 18:00:00'
  },
  {
    id: 'acc3',
    title: '临时交通管制',
    position: [112.567, 37.871],
    type: 'control',
    severity: 1,
    time: '2023-05-15 08:00:00',
    description: '重要活动临时管制，建议绕行',
    estimated_clear_time: '2023-05-15 12:00:00'
  }
];

// 获取设备类型
const getDeviceType = () => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1200) return 'tablet';
  return 'desktop';
};

// 主组件
const TrafficMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<string>('overall');
  const deviceType = getDeviceType();
  const [markers, setMarkers] = useState<any[]>([]);
  const [polylines, setPolylines] = useState<any[]>([]);
  
  // 初始化地图
  useEffect(() => {
    // 动态加载百度地图脚本
    const loadBaiduMapScript = async () => {
      try {
        await baiduMapService.loadBMapAPI();
        if (mapContainerRef.current) {
          initMap();
        }
      } catch (error) {
        console.error('百度地图加载失败:', error);
        notification.error({
          message: '地图加载失败',
          description: '百度地图服务加载失败，请刷新页面重试'
        });
      }
    };
    
    // 初始化地图
    const initMap = () => {
      try {
        console.log('初始化地图...');
        // @ts-ignore - 百度地图的全局变量
        const BMap = window.BMap;
        
        if (!BMap) {
          console.error('BMap未定义，地图初始化失败');
          return;
        }
        
        // 创建地图实例
        const map = new BMap.Map(mapContainerRef.current!);
        
        // 创建点坐标 - 太原市中心
        const taiyuanPoint = new BMap.Point(TAIYUAN_CENTER[0], TAIYUAN_CENTER[1]);
        
        // 初始化地图，设置中心点坐标和地图缩放级别
        map.centerAndZoom(taiyuanPoint, 12);
        
        // 开启鼠标滚轮缩放
        map.enableScrollWheelZoom(true);
        
        // 添加控件
        map.addControl(new BMap.ScaleControl());
        map.addControl(new BMap.NavigationControl());
        
        // 设置地图样式
        map.setMapStyleV2({
          styleId: '2d51ff09422dc18176c955a2821af5cf' // 深色主题样式ID
        });
        
        console.log('地图已初始化');
        setMapInstance(map);
        setMapLoaded(true);
      } catch (error) {
        console.error('地图初始化错误:', error);
        notification.error({
          message: '地图初始化失败',
          description: '初始化过程出错，请刷新页面重试'
        });
      }
    };
    
    console.log('加载地图...');
    if (window.BMap) {
      console.log('BMap已存在，直接初始化');
      initMap();
    } else {
      console.log('BMap不存在，加载脚本');
      loadBaiduMapScript();
    }
    
    return () => {
      // 清理地图资源
      if (mapInstance) {
        clearMarkers();
        clearPolylines();
      }
    };
  }, []);
  
  // 地图加载完成后添加路线和标记
  useEffect(() => {
    if (mapLoaded && mapInstance) {
      addRoads();
      addCongestionMarkers();
      addAccidentMarkers();
      
      // 设置30秒刷新一次
      const refreshInterval = setInterval(() => {
        refreshMapData();
      }, 30000);
      
      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [mapLoaded, mapInstance]);
  
  // 清除所有标记点
  const clearMarkers = () => {
    if (mapInstance && markers.length) {
      markers.forEach(marker => {
        mapInstance.removeOverlay(marker);
      });
      setMarkers([]);
    }
  };
  
  // 清除所有线条
  const clearPolylines = () => {
    if (mapInstance && polylines.length) {
      polylines.forEach(line => {
        mapInstance.removeOverlay(line);
      });
      setPolylines([]);
    }
  };
  
  // 添加道路线条
  const addRoads = () => {
    if (!mapInstance) return;
    
    // 清除现有路线
    clearPolylines();
    
    const newPolylines: any[] = [];
    
    roadLineData.forEach(road => {
      // 创建百度地图点数组
      const points = road.path.map(point => new BMap.Point(point[0], point[1]));
      
      // 根据拥堵程度设置颜色
      let strokeColor = '#4CAF50'; // 畅通-绿色
      if (road.level === 2) strokeColor = '#FF9800'; // 缓行-橙色
      if (road.level === 3) strokeColor = '#F44336'; // 拥堵-红色
      
      // 创建折线
      const polyline = new BMap.Polyline(points, {
        strokeColor,
        strokeWeight: 5,
        strokeOpacity: 0.8
      });
      
      // 添加点击事件
      polyline.addEventListener('click', function() {
        const infoWindow = new BMap.InfoWindow(
          `<div>
            <p>道路名称: ${road.name}</p>
            <p>当前车速: ${road.speed} km/h</p>
            <p>拥堵状态: ${road.level === 1 ? '畅通' : road.level === 2 ? '缓行' : '拥堵'}</p>
          </div>`,
          {
            width: 250,
            title: road.name
          }
        );
        
        // 计算折线的中点作为信息窗口的位置
        const middlePointIndex = Math.floor(points.length / 2);
        mapInstance.openInfoWindow(infoWindow, points[middlePointIndex]);
      });
      
      mapInstance.addOverlay(polyline);
      newPolylines.push(polyline);
    });
    
    setPolylines(newPolylines);
  };
  
  // 添加拥堵点标记
  const addCongestionMarkers = () => {
    if (!mapInstance) return;
    
    const newMarkers: any[] = [];
    
    congestionPointData.forEach(point => {
      // 创建标记点
      const markerPoint = new BMap.Point(point.position[0], point.position[1]);
      
      // 自定义图标 - 使用SVG图片
      let iconUrl;
      
      // 使用内置的Icon类型
      if (point.level === 1) {
        iconUrl = '/icons/warning_green.svg'; // 轻度拥堵
      } else if (point.level === 2) {
        iconUrl = '/icons/warning_yellow.svg'; // 中度拥堵
      } else {
        iconUrl = '/icons/warning_red.svg'; // 严重拥堵
      }
      
      try {
        // 创建图标对象
        const icon = new BMap.Icon(iconUrl, new BMap.Size(24, 24), {
          // 图片偏移
          imageOffset: new BMap.Size(0, 0),
          // 设置图片大小
          imageSize: new BMap.Size(24, 24)
        });
        
        // 创建标记
        const marker = new BMap.Marker(markerPoint, { icon });
        
        // 创建信息窗口内容
        const infoWindow = new BMap.InfoWindow(
          `<div>
            <p>位置: ${point.name}</p>
            <p>拥堵程度: ${point.level === 1 ? '轻度' : point.level === 2 ? '中度' : '严重'}</p>
            <p>详情: ${point.description}</p>
            <p>更新时间: ${point.updateTime}</p>
          </div>`,
          {
            width: 250,
            title: point.name
          }
        );
        
        // 添加点击事件
        marker.addEventListener('click', function() {
          mapInstance.openInfoWindow(infoWindow, markerPoint);
        });
        
        mapInstance.addOverlay(marker);
        newMarkers.push(marker);
      } catch (error) {
        console.error(`加载拥堵点标记图标失败: ${error}`);
        // 使用SVG标记作为后备
        let color = '#4CAF50'; // 默认绿色
        if (point.level === 2) color = '#FF9800'; // 缓行-橙色
        if (point.level === 3) color = '#F44336'; // 拥堵-红色
        
        try {
          // 使用SVG创建标记
          const svgMarker = baiduMapService.createSvgMarker(mapInstance, markerPoint, color);
          
          // 添加点击事件
          svgMarker.addEventListener('click', function() {
            mapInstance.openInfoWindow(new BMap.InfoWindow(
              `<div>
                <p>位置: ${point.name}</p>
                <p>拥堵程度: ${point.level === 1 ? '轻度' : point.level === 2 ? '中度' : '严重'}</p>
                <p>详情: ${point.description}</p>
                <p>更新时间: ${point.updateTime}</p>
              </div>`,
              {
                width: 250,
                title: point.name
              }
            ), markerPoint);
          });
          
          newMarkers.push(svgMarker);
        } catch (e) {
          // 如果SVG也失败，使用默认标记
          const defaultMarker = new BMap.Marker(markerPoint);
          defaultMarker.addEventListener('click', function() {
            mapInstance.openInfoWindow(new BMap.InfoWindow(
              `<div>
                <p>位置: ${point.name}</p>
                <p>拥堵程度: ${point.level === 1 ? '轻度' : point.level === 2 ? '中度' : '严重'}</p>
                <p>详情: ${point.description}</p>
                <p>更新时间: ${point.updateTime}</p>
              </div>`,
              {
                width: 250,
                title: point.name
              }
            ), markerPoint);
          });
          
          mapInstance.addOverlay(defaultMarker);
          newMarkers.push(defaultMarker);
        }
      }
    });
    
    setMarkers(prev => [...prev, ...newMarkers]);
  };
  
  // 添加事故点标记
  const addAccidentMarkers = () => {
    if (!mapInstance) return;
    
    const newMarkers: any[] = [];
    
    accidentPointData.forEach(point => {
      // 创建标记点
      const markerPoint = new BMap.Point(point.position[0], point.position[1]);
      
      // 使用自定义图标
      let iconUrl;
      if (point.type === 'accident') {
        iconUrl = '/icons/accident.svg'; // 事故
      } else if (point.type === 'construction') {
        iconUrl = '/icons/construction.svg'; // 施工
        } else {
        iconUrl = '/icons/control.svg'; // 管制
      }
      
      try {
        // 创建图标对象
        const icon = new BMap.Icon(iconUrl, new BMap.Size(24, 24), {
          // 图片偏移
          imageOffset: new BMap.Size(0, 0),
          // 设置图片大小
          imageSize: new BMap.Size(24, 24)
        });
        
        // 创建标记
        const marker = new BMap.Marker(markerPoint, { icon });
        
        // 创建信息窗口内容
        const infoWindow = new BMap.InfoWindow(
          `<div>
            <p>事件类型: ${
              point.type === 'accident' ? '交通事故' : 
              point.type === 'construction' ? '道路施工' : '交通管制'
            }</p>
            <p>严重程度: ${point.severity === 1 ? '轻微' : point.severity === 2 ? '中等' : '严重'}</p>
            <p>发生时间: ${point.time}</p>
            <p>详情: ${point.description}</p>
            ${point.estimated_clear_time ? `<p>预计结束时间: ${point.estimated_clear_time}</p>` : ''}
          </div>`,
          {
            width: 250,
            title: point.title
          }
        );
        
        // 添加点击事件
        marker.addEventListener('click', function() {
          mapInstance.openInfoWindow(infoWindow, markerPoint);
        });
        
        mapInstance.addOverlay(marker);
        newMarkers.push(marker);
      } catch (error) {
        console.error(`加载事故点标记图标失败: ${error}`);
        // 使用SVG标记作为后备
        let color = '#F44336'; // 事故-红色
        if (point.type === 'construction') color = '#FFC107'; // 施工-黄色
        if (point.type === 'control') color = '#2196F3'; // 管制-蓝色
        
        try {
          // 使用SVG创建标记
          const svgMarker = baiduMapService.createSvgMarker(mapInstance, markerPoint, color);
          
          // 添加点击事件
          svgMarker.addEventListener('click', function() {
            mapInstance.openInfoWindow(new BMap.InfoWindow(
              `<div>
                <p>事件类型: ${
                  point.type === 'accident' ? '交通事故' : 
                  point.type === 'construction' ? '道路施工' : '交通管制'
                }</p>
                <p>严重程度: ${point.severity === 1 ? '轻微' : point.severity === 2 ? '中等' : '严重'}</p>
                <p>发生时间: ${point.time}</p>
                <p>详情: ${point.description}</p>
                ${point.estimated_clear_time ? `<p>预计结束时间: ${point.estimated_clear_time}</p>` : ''}
              </div>`,
              {
                width: 250,
                title: point.title
              }
            ), markerPoint);
          });
          
          newMarkers.push(svgMarker);
        } catch (e) {
          // 如果SVG也失败，使用默认标记
          const defaultMarker = new BMap.Marker(markerPoint);
          defaultMarker.addEventListener('click', function() {
            mapInstance.openInfoWindow(new BMap.InfoWindow(
              `<div>
                <p>事件类型: ${
                  point.type === 'accident' ? '交通事故' : 
                  point.type === 'construction' ? '道路施工' : '交通管制'
                }</p>
                <p>严重程度: ${point.severity === 1 ? '轻微' : point.severity === 2 ? '中等' : '严重'}</p>
                <p>发生时间: ${point.time}</p>
                <p>详情: ${point.description}</p>
                ${point.estimated_clear_time ? `<p>预计结束时间: ${point.estimated_clear_time}</p>` : ''}
              </div>`,
              {
                width: 250,
                title: point.title
              }
            ), markerPoint);
          });
          
          mapInstance.addOverlay(defaultMarker);
          newMarkers.push(defaultMarker);
        }
      }
    });
    
    setMarkers(prev => [...prev, ...newMarkers]);
  };
  
  // 刷新地图数据
  const refreshMapData = () => {
    if (!mapInstance) return;
    
    setRefreshing(true);
    
    // 模拟数据刷新
          setTimeout(() => {
      clearMarkers();
      clearPolylines();
      addRoads();
      addCongestionMarkers();
      addAccidentMarkers();
      setRefreshing(false);
    }, 1000);
  };
  
  // 切换地图视角
  const changeMapView = (viewType: string) => {
    if (!mapInstance) return;
    
    setCurrentView(viewType);
    
    switch (viewType) {
      case 'overall':
        mapInstance.centerAndZoom(new BMap.Point(TAIYUAN_CENTER[0], TAIYUAN_CENTER[1]), 12);
        break;
      case 'downtown':
        mapInstance.centerAndZoom(new BMap.Point(112.563, 37.873), 14);
        break;
      case 'north':
        mapInstance.centerAndZoom(new BMap.Point(112.555, 37.905), 13);
        break;
      case 'east':
        mapInstance.centerAndZoom(new BMap.Point(112.595, 37.857), 13);
        break;
      case 'congestion':
        // 找到最严重的拥堵点并居中
        const worstPoint = congestionPointData.sort((a, b) => b.level - a.level)[0];
        if (worstPoint) {
          mapInstance.centerAndZoom(
            new BMap.Point(worstPoint.position[0], worstPoint.position[1]), 
            15
          );
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* 地图容器 */}
      <div ref={mapContainerRef} className="map-container" style={{ width: '100%', height: '100%', minHeight: '500px' }} />
      
      {/* 地图控制按钮 */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
        <div className="tech-card p-2 map-controls">
          <div className="flex flex-col space-y-1">
            <div className="text-xs font-semibold text-blue-300 mb-1">区域视图</div>
            <div className="view-buttons flex flex-wrap gap-1">
              <Button 
                type={currentView === 'overall' ? 'primary' : 'default'} 
                size="small" 
                onClick={() => changeMapView('overall')}
                className="!bg-blue-900 hover:!bg-blue-800 border-blue-700"
              >
                全局
              </Button>
              <Button 
                type={currentView === 'downtown' ? 'primary' : 'default'} 
                size="small" 
                onClick={() => changeMapView('downtown')}
                className="!bg-blue-900 hover:!bg-blue-800 border-blue-700"
              >
                市中心
              </Button>
              <Button 
                type={currentView === 'north' ? 'primary' : 'default'} 
                size="small" 
                onClick={() => changeMapView('north')}
                className="!bg-blue-900 hover:!bg-blue-800 border-blue-700"
              >
                北部
              </Button>
              <Button 
                type={currentView === 'east' ? 'primary' : 'default'} 
                size="small" 
                onClick={() => changeMapView('east')}
                className="!bg-blue-900 hover:!bg-blue-800 border-blue-700"
              >
                东部
              </Button>
              <Button 
                type={currentView === 'congestion' ? 'primary' : 'default'} 
                size="small" 
                onClick={() => changeMapView('congestion')}
                className="!bg-blue-900 hover:!bg-blue-800 border-blue-700"
                icon={<WarningOutlined />}
              >
                最拥堵
              </Button>
          </div>
            </div>
          </div>
        
        {/* 图例 */}
        <div className="tech-card p-2">
          <div className="text-xs font-semibold text-blue-300 mb-1">图例</div>
          <div className="grid grid-cols-1 gap-1 text-xs">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
              <span className="text-white">畅通</span>
        </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-orange-500 mr-2"></span>
              <span className="text-white">缓行</span>
        </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
              <span className="text-white">拥堵</span>
        </div>
            <div className="flex items-center mt-1">
              <EnvironmentOutlined className="text-red-500 mr-2" />
              <span className="text-white">事故</span>
      </div>
            <div className="flex items-center">
              <DashboardOutlined className="text-blue-500 mr-2" />
              <span className="text-white">管制</span>
        </div>
          </div>
        </div>
      </div>
      
      {/* 刷新按钮 */}
      <div className="absolute top-4 right-4 z-10">
        <Tooltip title="刷新交通数据">
          <Button 
            className="tech-card !bg-blue-900 hover:!bg-blue-800 border-blue-700"
            type="primary" 
            icon={<ReloadOutlined spin={refreshing} />} 
            onClick={refreshMapData}
            loading={refreshing}
          >
            {deviceType !== 'mobile' && '刷新数据'}
          </Button>
        </Tooltip>
            </div>

      {/* 统计指标 */}
      <div className="absolute bottom-4 right-4 z-10 tech-card p-2">
        <div className="flex flex-col space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-300">总道路:</span>
            <span className="text-white font-semibold">{roadLineData.length}条</span>
            </div>
          <div className="flex justify-between">
            <span className="text-gray-300">拥堵点:</span>
            <span className="text-white font-semibold">{congestionPointData.length}处</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">事故/施工:</span>
            <span className="text-white font-semibold">{accidentPointData.length}处</span>
        </div>
          <div className="flex justify-between">
            <span className="text-gray-300">更新时间:</span>
            <span className="text-white font-semibold">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficMap; 