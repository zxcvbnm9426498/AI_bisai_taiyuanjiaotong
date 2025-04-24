'use client';

import { useEffect, useRef, useState } from 'react';
// 移除顶层导入，改为动态导入
// import AMapLoader from '@amap/amap-jsapi-loader';

// 从环境变量中获取API密钥
const MAP_KEY = process.env.NEXT_PUBLIC_AMAP_KEY || '';
const SECURITY_CODE = process.env.NEXT_PUBLIC_AMAP_SECURITY || '';

// 为window添加高德地图安全配置类型
declare global {
  interface Window {
    _AMapSecurityConfig?: {
      securityJsCode: string;
    };
  }
}

// 太原市主要路段拥堵点数据
const congestionPoints = [
  { position: [112.548879, 37.87059], name: '迎泽区中心', level: 'high' },
  { position: [112.558879, 37.86559], name: '南内环街', level: 'medium' },
  { position: [112.538879, 37.87559], name: '龙城大街', level: 'high' },
  { position: [112.563879, 37.88059], name: '晋阳街', level: 'medium' },
  { position: [112.528879, 37.86059], name: '新建路', level: 'low' },
  { position: [112.518879, 37.87259], name: '长风街', level: 'low' },
  { position: [112.553879, 37.85559], name: '马练营', level: 'medium' },
];

// 太原市主要道路线路数据
const roadLines = [
  {
    name: '南中环路',
    path: [
      [112.513879, 37.85059],
      [112.533879, 37.85059],
      [112.553879, 37.85059],
      [112.573879, 37.85059]
    ],
    level: 'medium',
    traffic: 120 // 交通流量
  },
  {
    name: '迎泽大街',
    path: [
      [112.548879, 37.85059],
      [112.548879, 37.86059],
      [112.548879, 37.87059],
      [112.548879, 37.88059]
    ],
    level: 'high',
    traffic: 180
  },
  {
    name: '龙城大街',
    path: [
      [112.538879, 37.86559],
      [112.538879, 37.87059],
      [112.538879, 37.87559],
      [112.538879, 37.88059]
    ],
    level: 'high',
    traffic: 160
  },
  {
    name: '晋阳街',
    path: [
      [112.563879, 37.86559],
      [112.563879, 37.87059],
      [112.563879, 37.87559],
      [112.563879, 37.88059]
    ],
    level: 'medium',
    traffic: 140
  }
];

// 交通事故点数据
const accidentPoints = [
  { position: [112.543879, 37.86259], time: new Date(), severity: 'medium' },
  { position: [112.558879, 37.87359], time: new Date(Date.now() - 1000 * 60 * 15), severity: 'high' }
];

// 预设地图视角数据
const mapViews = [
  { name: '迎泽区视角', center: [112.548879, 37.87059], zoom: 14, pitch: 35 },
  { name: '南中环视角', center: [112.543879, 37.85059], zoom: 15, pitch: 50 },
  { name: '西山区域视角', center: [112.523879, 37.86559], zoom: 13.5, pitch: 40 },
  { name: '城东区域视角', center: [112.568879, 37.87559], zoom: 14.5, pitch: 45 }
];

interface MapEvent {
  lnglat: [number, number];
  type: string;
  target: unknown;
}

interface Marker {
  setPosition: (position: [number, number]) => void;
  setLabel: (options: {content: string}) => void;
  setIcon: (options: {size: [number, number], imageOffset: [number, number], image: string}) => void;
}

interface Path {
  path: [number, number][];
}

interface Animation {
  start: () => void;
  resume: () => void;
  pause: () => void;
}

export default function TrafficMap() {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState('');
  const [keyDebug, setKeyDebug] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const [AMap, setAMap] = useState<any>(null);
  const vehicleMarkersRef = useRef<any[]>([]);
  const pulseMarkersRef = useRef<any[]>([]);
  const accidentMarkersRef = useRef<any[]>([]);
  const viewModeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [autoViewChange, setAutoViewChange] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextRefreshTime, setNextRefreshTime] = useState(30);

  // 检测设备类型
  useEffect(() => {
    const checkDeviceType = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    // 初始检测
    checkDeviceType();
    
    // 窗口大小变化时重新检测
    window.addEventListener('resize', checkDeviceType);
    
    return () => {
      window.removeEventListener('resize', checkDeviceType);
    };
  }, []);

  // 添加地图视角切换功能
  const changeMapView = (viewIndex: number, animated = true) => {
    if (!mapRef.current || viewIndex >= mapViews.length) return;
    
    const view = mapViews[viewIndex];
    
    if (animated) {
      mapRef.current.setStatus({
        animateEnable: true,
      });
      
      // 先改变中心点和缩放级别
      mapRef.current.setZoomAndCenter(view.zoom, view.center, false);
      
      // 然后改变俯仰角
      setTimeout(() => {
        mapRef.current.setPitch(view.pitch);
        // 随机旋转一个角度
        const randomRotation = Math.floor(Math.random() * 60) - 30;
        mapRef.current.setRotation(randomRotation);
      }, 600);
    } else {
      mapRef.current.setStatus({
        animateEnable: false,
      });
      mapRef.current.setZoomAndCenter(view.zoom, view.center);
      mapRef.current.setPitch(view.pitch);
    }
    
    setCurrentViewIndex(viewIndex);
  };
  
  // 切换自动视角变化
  const toggleAutoViewChange = () => {
    const newState = !autoViewChange;
    setAutoViewChange(newState);
    
    if (newState) {
      // 开启自动切换视角
      if (viewModeTimerRef.current) {
        clearInterval(viewModeTimerRef.current);
      }
      
      viewModeTimerRef.current = setInterval(() => {
        const nextViewIndex = (currentViewIndex + 1) % mapViews.length;
        changeMapView(nextViewIndex);
      }, 20000); // 每20秒切换一次视角
    } else {
      // 关闭自动切换视角
      if (viewModeTimerRef.current) {
        clearInterval(viewModeTimerRef.current);
        viewModeTimerRef.current = null;
      }
    }
  };
  
  // 在组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (viewModeTimerRef.current) {
        clearInterval(viewModeTimerRef.current);
      }
    };
  }, []);
  
  // 添加动画道路线的函数
  const addAnimatedRoads = (roads: typeof roadLines) => {
    if (!mapRef.current || !AMap) return;
    
    roads.forEach(road => {
      // 根据拥堵等级设置不同颜色
      let strokeColor = '#43e018'; // 低拥堵绿色
      let strokeOpacity = 0.9;
      let glowColor = 'rgba(67, 224, 24, 0.3)';
      
      if (road.level === 'high') {
        strokeColor = '#f83b3b'; // 高拥堵红色
        glowColor = 'rgba(248, 59, 59, 0.5)';
      } else if (road.level === 'medium') {
        strokeColor = '#ffcf13'; // 中度拥堵黄色
        glowColor = 'rgba(255, 207, 19, 0.4)';
      }
      
      // 创建基础线条
      const polyline = new AMap.Polyline({
        path: road.path,
        strokeColor: strokeColor,
        strokeOpacity: strokeOpacity,
        strokeWeight: 6,
        strokeStyle: 'solid',
        strokeDasharray: [10, 0],
        zIndex: 100,
        showDir: true,
        lineJoin: 'round',
        // 添加线条发光效果
        borderWeight: 1,
        outlineColor: glowColor
      });
      
      // 添加到地图
      mapRef.current.add(polyline);
      
      // 如果是拥堵路段，添加闪烁和流动效果
      if (road.level === 'medium' || road.level === 'high') {
        // 创建流动动画的线条
        const animatedLine = new AMap.Polyline({
          path: road.path,
          strokeColor: road.level === 'high' ? '#ffffff' : '#fff566',
          strokeOpacity: 0.5,
          strokeWeight: 2,
          strokeStyle: 'dashed',
          strokeDasharray: [5, 8],
          zIndex: 101,
          lineJoin: 'round'
        });
        
        mapRef.current.add(animatedLine);
        
        // 动画效果 - 通过定时器修改虚线偏移实现线条流动
        let dashOffset = 0;
        const speed = road.level === 'high' ? 40 : 80; // 高拥堵移动慢，低拥堵移动快
        
        const animate = () => {
          dashOffset -= 1;
          if (dashOffset < -20) dashOffset = 0;
          animatedLine.setOptions({
            strokeDashoffset: dashOffset
          });
          
          setTimeout(animate, speed);
        };
        
        animate();
        
        // 添加闪烁效果
        let isVisible = true;
        let opacity = strokeOpacity;
        // 根据拥堵程度设置闪烁频率
        const blinkInterval = road.level === 'high' ? 300 : 600; // 高拥堵闪烁更快
        
        const blink = () => {
          if (!polyline.getMap()) return; // 如果线条被移除，停止动画
          
          isVisible = !isVisible;
          opacity = isVisible ? strokeOpacity : (road.level === 'high' ? 0.3 : 0.5);
          
          polyline.setOptions({
            strokeOpacity: opacity
          });
          
          setTimeout(blink, blinkInterval);
        };
        
        // 开始闪烁动画
        setTimeout(blink, Math.random() * 500); // 随机延迟开始，避免所有线条同时闪烁
      }
      
      // 添加一个内发光的装饰线，增强视觉效果
      if (road.level === 'high') {
        // 为高拥堵路段添加额外的发光效果
        const glowLine = new AMap.Polyline({
          path: road.path,
          strokeColor: 'rgba(255, 0, 0, 0.2)',
          strokeOpacity: 0.7,
          strokeWeight: 12,
          strokeStyle: 'solid',
          zIndex: 99,
          lineJoin: 'round',
          strokeDasharray: [1, 0]
        });
        
        mapRef.current.add(glowLine);
        
        // 为发光线添加脉动效果
        let glowSize = 12;
        let increasing = false;
        
        const pulseGlow = () => {
          if (!glowLine.getMap()) return;
          
          if (increasing) {
            glowSize += 0.5;
            if (glowSize >= 16) {
              glowSize = 16;
              increasing = false;
            }
          } else {
            glowSize -= 0.5;
            if (glowSize <= 12) {
              glowSize = 12;
              increasing = true;
            }
          }
          
          glowLine.setOptions({
            strokeWeight: glowSize
          });
          
          setTimeout(pulseGlow, 100);
        };
        
        pulseGlow();
      }
    });
  };
  
  // 添加拥堵点标记
  const addCongestionMarkers = (points: typeof congestionPoints) => {
    if (!mapRef.current || !AMap) return;
    
    points.forEach(point => {
      const marker = new AMap.Marker({
        position: point.position,
        title: point.name,
        clickable: true,
      });
      
      // 根据拥堵等级设置不同颜色
      let color = '#3794ff'; // 低拥堵蓝色
      if (point.level === 'high') {
        color = '#ff5757'; // 高拥堵红色
      } else if (point.level === 'medium') {
        color = '#ff9800'; // 中度拥堵黄色
      }
      
      marker.setLabel({
        direction: 'right',
        offset: new AMap.Pixel(10, 0),
        content: `<div style="padding: 5px; border-radius: 4px; background-color: rgba(0,0,0,0.7); color: ${color}; font-size: 12px; border: 1px solid ${color};">${point.name}</div>`,
      });
      
      // 添加点击事件
      marker.on('click', () => {
        const infoWindow = new AMap.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 200px;">
              <h3 style="margin-bottom: 5px; font-size: 14px;">${point.name}</h3>
              <p style="margin: 0; color: ${color}; font-size: 12px;">拥堵等级: ${
                point.level === 'high' ? '严重拥堵' : point.level === 'medium' ? '中度拥堵' : '轻度拥堵'
              }</p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">实时路况状态，数据每30秒更新一次</p>
            </div>
          `,
          offset: new AMap.Pixel(0, -30),
        });
        infoWindow.open(mapRef.current, point.position);
      });
      
      mapRef.current.add(marker);
    });
  };
  
  // 更新热力图
  const updateHeatmap = (points: typeof congestionPoints) => {
    if (!mapRef.current || !AMap) return;
    
    // 生成热力图数据
    const heatmapData = [];
    points.forEach(point => {
      let weight = 0.3;
      if (point.level === 'high') {
        weight = 0.9;
      } else if (point.level === 'medium') {
        weight = 0.6;
      }
      
      heatmapData.push({
        lng: point.position[0],
        lat: point.position[1],
        count: weight * 100
      });
    });
    
    // 添加50个随机点扩展热图效果
    for (let i = 0; i < 50; i++) {
      const lng = 112.548879 + (Math.random() - 0.5) * 0.1;
      const lat = 37.87059 + (Math.random() - 0.5) * 0.1;
      const weight = Math.random() * 0.5;
      
      heatmapData.push({
        lng: lng,
        lat: lat,
        count: weight * 100
      });
    }
    
    // 添加热力图
    const heatmap = new AMap.HeatMap(mapRef.current, {
      radius: 25,
      opacity: [0, 0.8],
      gradient: {
        0.4: 'rgb(0, 255, 0)',
        0.65: 'rgb(255, 255, 0)',
        0.85: 'rgb(255, 0, 0)',
        1.0: 'rgb(255, 0, 0)'
      },
      zooms: [1, 20]
    });
    
    heatmap.setDataSet({
      data: heatmapData,
      max: 100
    });
  };
  
  // 添加交通车辆流动动画
  const addMovingVehicles = (roads: typeof roadLines) => {
    if (!mapRef.current || !AMap) return;
    
    // 清除之前的车辆标记
    if (vehicleMarkersRef.current.length > 0) {
      vehicleMarkersRef.current.forEach(marker => {
        mapRef.current.remove(marker);
      });
      vehicleMarkersRef.current = [];
    }
    
    roads.forEach(road => {
      const path = road.path;
      if (path.length < 2) return;
      
      // 根据交通流量和拥堵程度决定车辆数量
      let vehicleCount = Math.round(road.traffic / 40);
      if (road.level === 'high') {
        vehicleCount = Math.round(vehicleCount * 0.7); // 高拥堵路段车辆较少(拥着不动)
      }
      
      // 为每条路添加多个车辆
      for (let i = 0; i < vehicleCount; i++) {
        // 计算车辆在路径上的初始随机位置
        const segment = Math.floor(Math.random() * (path.length - 1));
        const start = path[segment];
        const end = path[segment + 1];
        
        // 计算两点之间的随机位置
        const randomPos = Math.random();
        const position = [
          start[0] + (end[0] - start[0]) * randomPos,
          start[1] + (end[1] - start[1]) * randomPos
        ];
        
        // 创建车辆图标
        const vehicleIcon = new AMap.Icon({
          size: new AMap.Size(16, 16),
          image: road.level === 'high' ? 
            'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-red.png' : 
            'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
          imageSize: new AMap.Size(16, 16)
        });
        
        // 创建车辆标记
        const marker = new AMap.Marker({
          position: position,
          icon: vehicleIcon,
          offset: new AMap.Pixel(-8, -8),
          zIndex: 90,
          autoRotation: true // 自动旋转
        });
        
        // 添加到地图
        mapRef.current.add(marker);
        vehicleMarkersRef.current.push(marker);
        
        // 设置车辆移动动画
        let currentSegment = segment;
        const moveToNext = true;
        const speed = road.level === 'high' ? 100 : (road.level === 'medium' ? 200 : 300); // 速度基于拥堵程度
        
        const moveVehicle = () => {
          if (!mapRef.current) return;
          
          if (moveToNext) {
            currentSegment = (currentSegment + 1) % (path.length - 1);
          }
          
          const currentStart = path[currentSegment];
          const currentEnd = path[currentSegment + 1];
          
          // 创建移动动画
          marker.moveTo(currentEnd, {
            duration: speed * Math.sqrt(
              Math.pow(currentEnd[0] - currentStart[0], 2) + 
              Math.pow(currentEnd[1] - currentStart[1], 2)
            ) * 10000, // 速度与距离成正比
            delay: Math.random() * 1000, // 随机延迟
            complete: () => {
              if (Math.random() > 0.9) {
                // 10%的概率车辆消失并在其他位置重新出现
                const newSegment = Math.floor(Math.random() * (path.length - 1));
                const newStart = path[newSegment];
                marker.setPosition(newStart);
                currentSegment = newSegment;
              }
              
              // 继续移动
              setTimeout(moveVehicle, Math.random() * 200);
            }
          });
        };
        
        // 启动移动
        setTimeout(moveVehicle, Math.random() * 1000);
      }
    });
  };
  
  // 添加拥堵点脉动效果
  const addPulsingMarkers = (points: typeof congestionPoints) => {
    if (!mapRef.current || !AMap) return;
    
    // 清除之前的脉动标记
    if (pulseMarkersRef.current.length > 0) {
      pulseMarkersRef.current.forEach(marker => {
        mapRef.current.remove(marker);
      });
      pulseMarkersRef.current = [];
    }
    
    points.forEach(point => {
      // 只为高拥堵和中度拥堵点添加脉动效果
      if (point.level === 'low') return;
      
      // 设置脉动圆圈的颜色
      const circleColor = point.level === 'high' ? '#ff5757' : '#ff9800';
      
      // 自定义脉动点样式
      const pulseMarker = new AMap.Marker({
        position: point.position,
        content: `
          <div class="pulse-marker-container">
            <div class="pulse-marker-core" style="background-color:${circleColor}"></div>
            <div class="pulse-marker-pulse" style="border-color:${circleColor}"></div>
          </div>
        `,
        offset: new AMap.Pixel(-15, -15),
        zIndex: 110
      });
      
      // 添加到地图
      mapRef.current.add(pulseMarker);
      pulseMarkersRef.current.push(pulseMarker);
    });
  };
  
  // 添加交通事故标记
  const addAccidentMarkers = (accidents: typeof accidentPoints) => {
    if (!mapRef.current || !AMap) return;
    
    // 清除之前的事故标记
    if (accidentMarkersRef.current.length > 0) {
      accidentMarkersRef.current.forEach(marker => {
        mapRef.current.remove(marker);
      });
      accidentMarkersRef.current = [];
    }
    
    accidents.forEach(accident => {
      // 根据严重程度设置不同样式
      const severity = accident.severity;
      const iconUrl = 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png';
      const iconSize = [25, 31];
      
      // 创建事故标记
      const marker = new AMap.Marker({
        position: accident.position,
        icon: new AMap.Icon({
          size: new AMap.Size(...iconSize),
          image: iconUrl,
          imageSize: new AMap.Size(...iconSize)
        }),
        offset: new AMap.Pixel(-16, -16),
        zIndex: 120,
        label: {
          direction: 'top',
          offset: new AMap.Pixel(0, -36),
          content: `<div class="accident-label ${severity}">事故处理中</div>`
        }
      });
      
      // 添加闪烁动画
      let opacity = 1;
      let fadeOut = true;
      
      const flashMarker = () => {
        if (!marker.getMap()) return; // 如果标记已被移除，停止动画
        
        if (fadeOut) {
          opacity -= 0.1;
          if (opacity <= 0.4) {
            opacity = 0.4;
            fadeOut = false;
          }
        } else {
          opacity += 0.1;
          if (opacity >= 1) {
            opacity = 1;
            fadeOut = true;
          }
        }
        
        marker.setOpacity(opacity);
        setTimeout(flashMarker, 100);
      };
      
      flashMarker();
      
      // 添加点击事件
      marker.on('click', () => {
        const timeAgo = Math.floor((Date.now() - accident.time.getTime()) / 60000);
        
        // 修改信息窗口内容，使用内联SVG替代外部图片
        const infoWindow = new AMap.InfoWindow({
          content: `
            <div style="padding:12px 18px; min-width:220px;">
              <h3 style="margin:0;font-size:16px;color:#ff4d4f;display:flex;align-items:center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <path d="M12 8v4"></path>
                  <path d="M12 16h.01"></path>
                </svg>
                交通事故
              </h3>
              <div style="background-color:rgba(255,77,79,0.1);border-left:3px solid #ff4d4f;padding:8px;margin-top:10px;border-radius:0 4px 4px 0;">
                <p style="margin-top:0;margin-bottom:4px;font-size:13px;display:flex;align-items:center;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>发生时间: <strong>${timeAgo > 0 ? `${timeAgo}分钟前` : '刚刚'}</strong></span>
                </p>
                <p style="margin-top:4px;margin-bottom:4px;font-size:13px;display:flex;align-items:center;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px;">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <span>严重程度: <strong>${severity === 'high' ? '严重' : '一般'}</strong></span>
                </p>
                <p style="margin-top:4px;margin-bottom:0;font-size:13px;display:flex;align-items:center;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px;">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>预计处理时间: <strong>${severity === 'high' ? '30-60分钟' : '15-30分钟'}</strong></span>
                </p>
              </div>
              <div style="display:flex;justify-content:flex-end;margin-top:10px;">
                <div style="background-color:rgba(255,77,79,0.1);color:#ff4d4f;font-size:12px;padding:3px 6px;border-radius:4px;">
                  ${severity === 'high' ? '请绕行' : '谨慎通行'}
                </div>
              </div>
            </div>
          `,
          offset: new AMap.Pixel(0, -32),
          anchor: 'bottom-center',
          closeWhenClickMap: true,    // 点击地图关闭
          autoMove: true              // 自动调整位置
        });
        
        infoWindow.open(mapRef.current, accident.position);
      });
      
      // 添加到地图
      mapRef.current.add(marker);
      accidentMarkersRef.current.push(marker);
    });
  };

  // 更新刷新倒计时
  useEffect(() => {
    if (!mapLoaded) return;
    
    const countdownTimer = setInterval(() => {
      setNextRefreshTime(prev => {
        if (prev <= 1) {
          return 30; // 重置为30秒
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(countdownTimer);
    };
  }, [mapLoaded]);

  // 修改updateTrafficData函数，增加刷新动画
  const updateTrafficData = () => {
    if (!mapRef.current || !AMap) return;
    
    console.log('更新交通数据...');
    setIsRefreshing(true);
    
    // 显示刷新动画2秒
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
    
    // 随机更新拥堵点的拥堵等级
    const updatedPoints = congestionPoints.map(point => {
      // 70%的概率保持不变，30%的概率改变
      if (Math.random() > 0.7) {
        const levels = ['low', 'medium', 'high'];
        const currentIndex = levels.indexOf(point.level as string);
        // 随机选择一个不同的等级
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * levels.length);
        } while (newIndex === currentIndex);
        
        return { ...point, level: levels[newIndex] };
      }
      return point;
    });
    
    // 随机更新道路的拥堵等级
    const updatedRoads = roadLines.map(road => {
      // 50%的概率更新道路状态
      if (Math.random() > 0.5) {
        const levels = ['low', 'medium', 'high'];
        const currentIndex = levels.indexOf(road.level as string);
        // 随机选择一个可能不同的等级，但有偏好
        let newIndex;
        const rand = Math.random();
        if (rand < 0.6) { // 60%的概率保持相邻状态
          newIndex = Math.max(0, Math.min(2, currentIndex + (Math.random() > 0.5 ? 1 : -1)));
        } else { // 40%的概率随机选择
          newIndex = Math.floor(Math.random() * levels.length);
        }
        
        // 同时更新交通流量
        const baseTraffic = road.traffic;
        const trafficChange = Math.floor(Math.random() * 40) - 20; // -20到20的变化
        const newTraffic = Math.max(60, Math.min(200, baseTraffic + trafficChange));
        
        return { ...road, level: levels[newIndex], traffic: newTraffic };
      }
      return road;
    });
    
    // 随机更新事故点
    const updatedAccidents = [...accidentPoints];
    
    // 10%的概率清除最旧的事故
    if (updatedAccidents.length > 0 && Math.random() < 0.1) {
      updatedAccidents.sort((a, b) => a.time.getTime() - b.time.getTime());
      updatedAccidents.shift(); // 移除最早的事故
    }
    
    // 5%的概率添加新事故
    if (Math.random() < 0.05) {
      // 在主要道路上随机选择一个点
      const randomRoad = roadLines[Math.floor(Math.random() * roadLines.length)];
      const randomPathIndex = Math.floor(Math.random() * (randomRoad.path.length - 1));
      const start = randomRoad.path[randomPathIndex];
      const end = randomRoad.path[randomPathIndex + 1];
      
      // 在路段上随机位置创建事故点
      const randomPos = Math.random();
      const position = [
        start[0] + (end[0] - start[0]) * randomPos,
        start[1] + (end[1] - start[1]) * randomPos
      ];
      
      // 添加新事故
      updatedAccidents.push({
        position,
        time: new Date(),
        severity: Math.random() < 0.3 ? 'high' : 'medium'
      });
    }
    
    // 清除已有标记和线路
    mapRef.current.clearMap();
    
    // 重新添加交通图层
    mapRef.current.add(new AMap.TileLayer.Traffic({
      zIndex: 10,
      autoRefresh: true,
      interval: 180,
    }));
    
    // 重新添加动画路线
    addAnimatedRoads(updatedRoads);
    
    // 重新添加拥堵点标记
    addCongestionMarkers(updatedPoints);
    
    // 重新添加脉动点效果
    addPulsingMarkers(updatedPoints);
    
    // 重新添加车辆流动动画
    addMovingVehicles(updatedRoads);
    
    // 重新添加事故标记
    addAccidentMarkers(updatedAccidents);
    
    // 更新热力图
    updateHeatmap(updatedPoints);
    
    setRefreshCount(prev => prev + 1);
    setNextRefreshTime(30); // 重置倒计时
  };

  useEffect(() => {
    // 确保代码只在客户端执行
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    
    // 显示当前使用的密钥（部分隐藏）
    if (MAP_KEY) {
      const maskedKey = MAP_KEY.substring(0, 4) + '...' + MAP_KEY.substring(MAP_KEY.length - 4);
      setKeyDebug(`使用的密钥: ${maskedKey}`);
    } else {
      setKeyDebug('未找到密钥');
    }
    
    // 初始化高德地图
    const initMap = async () => {
      try {
        // 检查API密钥是否有效
        if (!MAP_KEY || MAP_KEY === '你的高德地图API密钥') {
          setError('请在.env.local文件中配置有效的高德地图API密钥');
          return;
        }
        
        console.log('尝试加载地图，使用密钥:', MAP_KEY.substring(0, 4) + '***');
        
        // 定义安全配置
        window._AMapSecurityConfig = {
          securityJsCode: SECURITY_CODE,
        };
        
        // 动态导入AMapLoader
        const AMapLoaderModule = await import('@amap/amap-jsapi-loader');
        const AMapLoader = AMapLoaderModule.default;
        
        const AMapInstance = await AMapLoader.load({
          key: MAP_KEY, // 使用环境变量中的API密钥
          version: '2.0',
          plugins: [
            'AMap.ToolBar', 
            'AMap.Scale', 
            'AMap.MapType',
            'AMap.HeatMap',
            'AMap.Marker',
            'AMap.InfoWindow',
            'AMap.Polyline',
            'AMap.Geolocation' // 添加定位插件
          ],
        });
        
        // 保存AMap实例供组件中的其他函数使用
        setAMap(AMapInstance);
        
        // 创建地图实例，适配移动端
        const mapOptions = {
          viewMode: '3D',
          zoom: isMobile ? 12 : 13,
          center: [112.548879, 37.87059], // 太原市中心坐标
          mapStyle: 'amap://styles/dark',
          pitch: isMobile ? 30 : 35, // 移动端降低仰角
          rotateEnable: true,
          buildingAnimation: true, // 楼块出现是否带动画
          touchZoom: true,
          doubleClickZoom: true,
          keyboardEnable: !isMobile, // 移动端禁用键盘控制
          backgroundColor: '#000000', // 设置纯黑色背景
        };
        
        const map = new AMapInstance.Map(mapContainerRef.current, mapOptions);
        
        // 移动端添加定位控件
        if (isMobile) {
          const geolocation = new AMapInstance.Geolocation({
            enableHighAccuracy: true, // 是否使用高精度定位，默认:true
            timeout: 10000, // 超过10秒后停止定位，默认：5s
            position: 'RB', // 定位按钮的停靠位置
            offset: [10, 120], // 定位按钮与设置的停靠位置的偏移量
            zoomToAccuracy: true, // 定位成功后是否自动调整地图视野到定位点
            buttonPosition: 'RB',
            buttonOffset: new AMapInstance.Pixel(10, 20),
            showButton: true // 显示定位按钮
          });
          
          map.addControl(geolocation);
        } else {
          // PC端添加标准控件
          map.addControl(new AMapInstance.ToolBar({
            position: 'RB'
          }));
        }
        
        // 添加比例尺
        map.addControl(new AMapInstance.Scale());
        
        // 在地图完成加载后添加各种元素
        map.on('complete', () => {
          // 确保地图背景为黑色
          document.querySelector('.amap-maps')?.setAttribute('style', 'background-color: #000000 !important');
          
          // 1. 添加交通图层
          map.add(new AMapInstance.TileLayer.Traffic({
            zIndex: 10,
            autoRefresh: true, // 是否自动刷新，默认为false
            interval: 180, // 刷新间隔，默认180s
          }));
          
          // 保存地图实例
          mapRef.current = map;
          
          console.log('地图元素加载完成，准备初始化数据...');
          setMapLoaded(true);
          
          // 先确保组件状态更新
          setTimeout(() => {
            // 立即执行一次刷新，以便设置初始状态
            console.log('执行初始数据加载...');
            updateTrafficData();
            
            // 设置30秒自动刷新 - 确保只有一个计时器
            if (refreshTimerRef.current) {
              clearInterval(refreshTimerRef.current);
            }
            
            refreshTimerRef.current = setInterval(() => {
              console.log('执行30秒自动刷新');
              updateTrafficData();
            }, 30000); // 30秒刷新一次
          }, 500); // 等待500ms确保组件已完全挂载
          
          // 添加自定义样式到页面
          const style = document.createElement('style');
          style.textContent = `
            .pulse-marker-container {
              position: relative;
              width: 30px;
              height: 30px;
            }
            .pulse-marker-core {
              position: absolute;
              width: 12px;
              height: 12px;
              border-radius: 50%;
              top: 9px;
              left: 9px;
              z-index: 2;
            }
            .pulse-marker-pulse {
              position: absolute;
              top: 0;
              left: 0;
              width: 30px;
              height: 30px;
              border: 2px solid;
              border-radius: 50%;
              animation: pulse 1.5s infinite;
              z-index: 1;
            }
            @keyframes pulse {
              0% {
                transform: scale(0.5);
                opacity: 1;
              }
              100% {
                transform: scale(1.2);
                opacity: 0;
              }
            }
            .accident-label {
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 12px;
              color: white;
              background-color: rgba(255, 100, 97, 0.8);
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
              animation: blink 1s infinite;
            }
            .accident-label.high {
              background-color: rgba(255, 0, 0, 0.8);
            }
            @keyframes blink {
              0% { opacity: 1; }
              50% { opacity: 0.7; }
              100% { opacity: 1; }
            }
            /* 添加响应式样式 */
            @media (max-width: 768px) {
              .map-controls {
                font-size: 10px;
              }
              .map-controls button {
                padding: 3px 5px !important;
              }
              .map-indicator {
                font-size: 10px;
                padding: 3px 6px !important;
              }
              .view-buttons {
                max-width: 180px;
                flex-wrap: wrap;
              }
            }
            /* 刷新动画 */
            @keyframes refreshing {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .refresh-icon {
              display: inline-block;
              width: 14px;
              height: 14px;
              border: 2px solid rgba(0, 168, 255, 0.8);
              border-top-color: transparent;
              border-radius: 50%;
              margin-right: 4px;
            }
            .refreshing {
              animation: refreshing 1s linear infinite;
            }
          `;
          document.head.appendChild(style);
          
          // 返回清理函数
          return () => {
            if (refreshTimerRef.current) {
              clearInterval(refreshTimerRef.current);
            }
            if (viewModeTimerRef.current) {
              clearInterval(viewModeTimerRef.current);
            }
            document.head.removeChild(style);
          };
        });
      } catch (err) {
        console.error('地图加载失败:', err);
        setError(`地图加载失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    initMap();
    
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
      }
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      if (viewModeTimerRef.current) {
        clearInterval(viewModeTimerRef.current);
      }
    };
  }, [isMobile]);

  // 手动刷新函数
  const handleManualRefresh = () => {
    updateTrafficData();
  };

  // 创建一个响应式的容器类名
  const getContainerClassNames = () => {
    return `relative ${isMobile ? 'h-[400px]' : 'h-[500px]'} w-full`;
  };

  return (
    <div className={getContainerClassNames()} style={{ backgroundColor: '#000000' }}>
      {/* 添加全局样式 */}
      <style jsx global>{`
        .amap-container {
          background-color: #000000 !important;
        }
        .amap-maps {
          background-color: #000000 !important;
        }
      `}</style>
      
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <div className="text-[#ff5757] mb-2">{error}</div>
          <div className="text-[#00a8ff] text-xs mb-2">{keyDebug}</div>
          <div className="tech-card p-3 text-sm">
            <p>请在.env.local文件中配置有效的高德地图API密钥</p>
            <p className="mt-2 text-xs text-gray-400">现在显示的是模拟预览效果</p>
            <p className="mt-2 text-xs text-yellow-400">请确保密钥已设置正确的域名白名单(localhost)</p>
          </div>
          {/* 模拟地图界面 */}
          <div className="absolute inset-0 z-[-1] opacity-30">
            <div className="w-full h-full bg-[#021034]">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-[#0066cc] opacity-20"></div>
              <div className="absolute top-1/4 left-1/3 w-10 h-10 rounded-full bg-[#00a8ff] opacity-20"></div>
              <div className="absolute top-2/3 left-2/3 w-15 h-15 rounded-full bg-[#ff5757] opacity-20"></div>
              {/* 模拟道路 */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#1e3c68]"></div>
              <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-[#1e3c68]"></div>
              <div className="absolute top-1/4 left-1/4 w-1/2 h-1 bg-[#1e3c68] rotate-45 origin-left"></div>
            </div>
          </div>
        </div>
      ) : (
        <div ref={mapContainerRef} className="w-full h-full" style={{ backgroundColor: '#000000' }} />
      )}
      
      {/* 指示点和标记 - 响应式调整 */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-[rgba(0,0,0,0.5)] px-2 py-1 rounded text-xs map-indicator">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>畅通</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <span>轻度拥堵</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span>严重拥堵</span>
        </div>
      </div>
      
      {/* 刷新指示器 - 增加倒计时和刷新动画 */}
      {mapLoaded && (
        <div className="absolute top-3 right-3 bg-[rgba(0,0,0,0.5)] px-2 py-1 rounded text-xs flex items-center gap-1 map-indicator">
          <div className={`refresh-icon ${isRefreshing ? 'refreshing' : ''}`}></div>
          <span onClick={handleManualRefresh} className="cursor-pointer flex items-center">
            {isRefreshing ? '刷新中...' : `下次刷新: ${nextRefreshTime}秒`} 
            <span className="ml-1">(已刷新{refreshCount}次)</span>
          </span>
        </div>
      )}
      
      {/* 视角控制器 - 响应式调整 */}
      {mapLoaded && (
        <div className="absolute bottom-3 left-3 flex flex-col gap-2 map-controls">
          <div className="bg-[rgba(0,0,0,0.5)] p-2 rounded text-xs">
            <div className="text-white mb-1 flex items-center">
              <span>视角切换</span>
              <button 
                onClick={toggleAutoViewChange}
                className={`ml-2 px-2 py-1 rounded text-xs ${autoViewChange ? 'bg-blue-500' : 'bg-gray-600'}`}
              >
                {autoViewChange ? '自动中' : '自动'}
              </button>
              {!isMobile && (
                <button 
                  onClick={handleManualRefresh}
                  className="ml-2 px-2 py-1 rounded text-xs bg-green-600 hover:bg-green-500"
                >
                  刷新数据
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1 view-buttons">
              {mapViews.map((view, index) => (
                <button
                  key={index}
                  onClick={() => changeMapView(index)}
                  className={`px-2 py-1 rounded-sm text-xs ${
                    currentViewIndex === index ? 'bg-blue-500' : 'bg-gray-700'
                  }`}
                >
                  {view.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 