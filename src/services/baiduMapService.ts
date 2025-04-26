// 百度地图API服务层
// 您需要在百度地图开放平台(https://lbsyun.baidu.com/)申请密钥

// API密钥
const MAP_KEY = 'tcjeRJ4R8YwcSGYvXWL6dUwG8e6G4cDu'; // 请替换为您的百度地图API密钥

// 太原市代码
const TAIYUAN_CODE = '140100';

import { message } from 'antd';

// Baidu Map API key
export const BMAP_API_KEY = 'tcjeRJ4R8YwcSGYvXWL6dUwG8e6G4cDu';

// 太原市中心坐标
export const TAIYUAN_CENTER: [number, number] = [112.549, 37.857];

// Load Baidu Map API
export const loadBMapAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.BMapGL) {
      resolve();
      return;
    }

    // Define global callback function for the script
    window.initBMap = () => {
      resolve();
    };

    // Create script element to load Baidu Maps API
    const script = document.createElement('script');
    script.type = 'text/javascript';
    // Using the correct API URL format for Baidu Maps
    script.src = `https://api.map.baidu.com/api?v=3.0&ak=${BMAP_API_KEY}&callback=initBMap`;
    script.onerror = () => {
      message.error('百度地图加载失败，请检查网络连接或API密钥');
      reject(new Error('Failed to load Baidu Map API'));
    };
    document.head.appendChild(script);
  });
};

// Parse coordinates string to BMap point
export const parseCoordinates = (coordStr: string): BMapGL.Point | null => {
  if (!coordStr) return null;
  const [lng, lat] = coordStr.split(',').map(Number);
  if (isNaN(lng) || isNaN(lat)) return null;
  return new BMapGL.Point(lng, lat);
};

// Convert array of coordinates to array of BMap points
export const convertToPoints = (coordinates: string[]): BMapGL.Point[] => {
  return coordinates
    .map(parseCoordinates)
    .filter((point): point is BMapGL.Point => point !== null);
};

// Create marker with custom icon
export const createMarker = (
  map: BMapGL.Map,
  position: BMapGL.Point,
  iconUrl: string,
  size: [number, number],
  title?: string
): BMapGL.Marker => {
  const icon = new BMapGL.Icon(
    iconUrl,
    new BMapGL.Size(size[0], size[1])
  );
  
  const marker = new BMapGL.Marker(position, { 
    icon,
    title 
  });
  
  marker.setAnimation(BMapGL.BMAP_ANIMATION_DROP);
  map.addOverlay(marker);
  
  return marker;
};

// Create polyline from array of points
export const createPolyline = (
  map: BMapGL.Map,
  points: BMapGL.Point[],
  color = '#3388ff',
  weight = 5,
  opacity = 0.8
): BMapGL.Polyline => {
  const polyline = new BMapGL.Polyline(points, {
    strokeColor: color,
    strokeWeight: weight,
    strokeOpacity: opacity
  });
  
  map.addOverlay(polyline);
  return polyline;
};

// Initialize map with custom style
export const initializeMap = (
  container: string,
  center: BMapGL.Point,
  zoom = 14
): BMapGL.Map => {
  const map = new BMapGL.Map(container);
  map.centerAndZoom(center, zoom);
  
  // Add map controls
  map.addControl(new BMapGL.ScaleControl());
  map.addControl(new BMapGL.ZoomControl());
  map.addControl(new BMapGL.NavigationControl());
  
  // Enable map interactions
  map.enableScrollWheelZoom();
  
  // Apply dark map style
  map.setMapStyleV2({
    styleJson: [
      {
        "featureType": "all",
        "elementType": "all",
        "stylers": {
          "lightness": -20,
          "saturation": -50
        }
      }
    ]
  });
  
  return map;
};

// Clear all overlays from map
export const clearMapOverlays = (map: BMapGL.Map): void => {
  map.clearOverlays();
};

// Calculate the appropriate zoom level to fit all points
export const calculateZoomLevel = (points: BMapGL.Point[]): number => {
  if (points.length === 0) return 14;
  if (points.length === 1) return 16;
  
  // Simple calculation - more sophisticated logic could be implemented
  return 14;
};

/**
 * 获取城市实时交通态势信息
 * @returns 交通态势数据
 */
export async function getCityTrafficInfo() {
  try {
    // 尝试从API获取数据
    // 这里应该是您调用实际API的代码
    // const response = await fetch(`https://your-api-endpoint?city=${TAIYUAN_CODE}`);
    // if (!response.ok) throw new Error('API request failed');
    // const data = await response.json();
    // return data;
    
    // 由于API可能失败，返回太原的模拟数据
    console.log('使用太原交通态势模拟数据');
    return {
      status: '1',
      info: 'OK',
      evaluation: {
        congestion_delayed_index: '1.95', // 拥堵指数，1-2之间表示轻度拥堵
        expedite: '55',                  // 畅通指数
      }
    };
  } catch (error) {
    console.error('获取城市交通态势信息失败:', error);
    // 返回太原的模拟数据作为后备
    return {
      status: '1',
      info: 'OK',
      evaluation: {
        congestion_delayed_index: '1.95', // 拥堵指数，1-2之间表示轻度拥堵
        expedite: '55',                  // 畅通指数
      }
    };
  }
}

/**
 * 获取指定区域内的交通事件信息
 * 注意：此API为模拟实现
 */
export async function getTrafficEvents() {
  try {
    // 尝试从API获取数据
    // const response = await fetch(`...`);
    // if (!response.ok) throw new Error('API request failed');
    // const data = await response.json();
    // return data;
    
    // 生成一些太原的随机交通事件数据
    const eventsCount = Math.floor(Math.random() * 5) + 1; // 1-5个事件
    
    // 太原市主要道路
    const mainRoads = [
      '迎泽大街', '长风街', '南内环街', '北内环街', '滨河西路', 
      '建设南路', '解放路', '尖草坪街', '双塔西街'
    ];
    
    const events = [];
    for (let i = 0; i < eventsCount; i++) {
      const road = mainRoads[Math.floor(Math.random() * mainRoads.length)];
      const now = new Date();
      const timeOffset = Math.floor(Math.random() * 60); // 0-60分钟前
      const eventTime = new Date(now.getTime() - timeOffset * 60 * 1000);
      
      events.push({
        id: `event-${i}`,
        type: Math.random() > 0.7 ? 'accident' : 'congestion',
        road: road,
        description: Math.random() > 0.7 ? `${road}交通事故` : `${road}严重拥堵`,
        time: eventTime,
        severity: Math.random() > 0.7 ? 'high' : 'medium',
        position: [
          TAIYUAN_CENTER[0] + (Math.random() * 0.05 - 0.025), // 太原市经度范围附近
          TAIYUAN_CENTER[1] + (Math.random() * 0.05 - 0.025)   // 太原市纬度范围附近
        ]
      });
    }
    
    return {
      status: '1',
      info: 'OK',
      count: events.length,
      events: events
    };
  } catch (error) {
    console.error('获取交通事件信息出错:', error);
    return null;
  }
}

/**
 * 将历史数据与实时数据结合，生成24小时趋势数据
 * @returns 24小时趋势数据
 */
export async function get24HourTrend() {
  try {
    // 生成模拟的24小时趋势数据
    const hours = [];
    const trafficData = [];
    const accidentData = [];
    
    // 当前小时
    const now = new Date();
    const currentHour = now.getHours();
    
    for (let i = 0; i < 24; i++) {
      const hour = (currentHour - 23 + i + 24) % 24;
      hours.push(`${hour}:00`);
      
      // 基于一般交通规律的基础值
      let baseTraffic;
      
      // 早高峰 7-9点
      if (hour >= 7 && hour <= 9) {
        baseTraffic = 2.0 + Math.random() * 0.5;
      }
      // 晚高峰 17-19点
      else if (hour >= 17 && hour <= 19) {
        baseTraffic = 2.2 + Math.random() * 0.7;
      }
      // 中午小高峰 12-13点
      else if (hour >= 12 && hour <= 13) {
        baseTraffic = 1.7 + Math.random() * 0.4;
      }
      // 深夜 0-5点
      else if (hour >= 0 && hour <= 5) {
        baseTraffic = 1.0 + Math.random() * 0.3;
      }
      // 其他时间
      else {
        baseTraffic = 1.5 + Math.random() * 0.5;
      }
      
      // 转换为0-100的指数，方便图表显示
      const trafficIndex = Math.round(baseTraffic * 50);
      trafficData.push(trafficIndex);
      
      // 事故数量与拥堵指数相关
      const accidentBase = trafficIndex * 0.2;
      accidentData.push(Math.round(accidentBase + Math.random() * 5));
    }
    
    return { hours, trafficData, accidentData };
  } catch (error) {
    console.error('获取24小时趋势数据出错:', error);
    return null;
  }
}

/**
 * 获取不同区域的交通分布数据
 * @returns 交通分布数据
 */
export async function getDistrictTrafficDistribution() {
  try {
    // 太原市各区县
    const districts = [
      { name: '小店区', adcode: '140105' },
      { name: '迎泽区', adcode: '140106' },
      { name: '杏花岭区', adcode: '140107' },
      { name: '尖草坪区', adcode: '140108' },
      { name: '万柏林区', adcode: '140109' },
      { name: '晋源区', adcode: '140110' },
      { name: '清徐县', adcode: '140121' },
      { name: '阳曲县', adcode: '140122' }
    ];
    
    // 为每个区县生成交通分布数据
    const districtData = [];
    let totalValue = 0;
    
    for (const district of districts) {
      // 根据区县名称设置不同的交通权重
      let weight;
      const name = district.name;
      
      if (name.includes('迎泽') || name.includes('小店')) {
        weight = 0.8 + Math.random() * 0.4; // 市中心区域权重较高
      } else if (name.includes('杏花岭') || name.includes('万柏林')) {
        weight = 0.6 + Math.random() * 0.3;
      } else {
        weight = 0.3 + Math.random() * 0.3;
      }
      
      const value = Math.round(weight * 100);
      totalValue += value;
      
      districtData.push({
        name: district.name,
        value: value,
        adcode: district.adcode
      });
    }
    
    // 归一化数据，使总和为100
    return districtData.map(item => ({
      ...item,
      value: Math.round((item.value / totalValue) * 100)
    }));
  } catch (error) {
    console.error('获取区域交通分布数据出错:', error);
    return null;
  }
}

/**
 * 获取道路类型流量数据
 * @returns 道路类型流量数据
 */
export async function getRoadTypeTrafficData() {
  try {
    // 道路类型
    const roadTypes = ['主干道', '快速路', '高速公路', '次干道'];
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    
    // 当前日期
    const now = new Date();
    const today = now.getDay(); // 0是周日，1是周一
    
    // 为每种道路类型生成模拟数据
    const data = roadTypes.map(type => {
      // 不同道路类型的基础流量
      let baseValue;
      switch(type) {
        case '主干道': baseValue = 260; break;
        case '快速路': baseValue = 320; break;
        case '高速公路': baseValue = 380; break;
        case '次干道': baseValue = 180; break;
        default: baseValue = 200;
      }
      
      // 为一周的每一天生成数据
      return days.map((_, index) => {
        const dayOfWeek = (index + 1) % 7; // 转换为0-6，其中0是周日
        
        // 工作日流量较大
        let multiplier = 1.0;
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // 周一到周五
          multiplier = 1.2;
        } else { // 周末
          multiplier = 0.8;
        }
        
        // 当前日期数据使用更准确的倍率
        if ((dayOfWeek === today) || 
            (dayOfWeek === 0 && today === 0) || 
            (dayOfWeek === 6 && today === 6)) {
          multiplier = 1.0;
        }
        
        // 添加随机波动
        return Math.round(baseValue * multiplier * (0.85 + Math.random() * 0.3));
      });
    });
    
    return {
      days,
      roadTypes,
      data
    };
  } catch (error) {
    console.error('获取道路类型流量数据出错:', error);
    return null;
  }
}

/**
 * 搜索地址并转换为坐标
 * @param keyword 关键词或地址
 * @param city 城市名称或编码，默认为太原
 * @returns 搜索结果
 */
export async function searchAddress(keyword: string, city = '太原') {
  try {
    // 返回模拟的地址搜索结果
    return {
      status: '1',
      info: 'OK',
      pois: [
        {
          name: `${keyword}附近地点1`,
          location: '112.549,37.857',
          address: '太原市小店区',
        },
        {
          name: `${keyword}附近地点2`,
          location: '112.560,37.870',
          address: '太原市迎泽区',
        },
        {
          name: `${keyword}相关地点`,
          location: '112.535,37.835',
          address: '太原市万柏林区',
        }
      ],
      count: 3
    };
  } catch (error) {
    console.error('地址搜索出错:', error);
    return null;
  }
}

/**
 * 获取两点之间的路线和交通状况
 * @param origin 起点坐标，格式：lng,lat
 * @param destination 终点坐标，格式：lng,lat
 * @returns 路线和交通状况信息
 */
export async function getRouteInfo(origin: string, destination: string) {
  try {
    // 模拟不同路段的交通状况
    const roadSections = [
      { roadName: '迎泽大街', distance: 3500, level: '畅通', color: '#00af66', status: '1' },
      { roadName: '柳巷', distance: 1200, level: '缓行', color: '#ffbf00', status: '2' },
      { roadName: '长风街', distance: 5400, level: '拥堵', color: '#ff6600', status: '3' },
      { roadName: '府西街', distance: 800, level: '严重拥堵', color: '#ee0000', status: '4' },
      { roadName: '南内环街', distance: 2300, level: '畅通', color: '#00af66', status: '1' }
    ];
    
    // 计算总距离和拥堵路段总长度
    const totalDistance = roadSections.reduce((acc, section) => acc + section.distance, 0);
    const congestionSections = roadSections.filter(section => ['2', '3', '4'].includes(section.status));
    const congestionDistance = congestionSections.reduce((acc, section) => acc + section.distance, 0);
    
    // 计算拥堵比例
    const congestionRatio = Math.round((congestionDistance / totalDistance) * 100);
    
    // 估算时间，考虑拥堵影响
    const baseTime = totalDistance / 500; // 基础时间：每公里2分钟
    const congestionFactor = 1 + (congestionRatio / 100) * 1.5; // 拥堵因子
    const duration = Math.round(baseTime * congestionFactor * 60); // 转为秒
    
    return {
      status: '1',
      info: 'OK',
      origin: origin,
      destination: destination,
      distance: totalDistance.toString(),
      duration: duration.toString(),
      congestionRatio: congestionRatio,
      congestionInfo: roadSections,
      polyline: '112.549,37.857;112.560,37.870;112.535,37.835',
      toll: '0',
      totalTrafficLights: '8'
    };
  } catch (error) {
    console.error('获取路线信息出错:', error);
    return null;
  }
}

// 创建纯色SVG图标作为后备
export const createSvgMarker = (map: any, position: any, color: string, title?: string) => {
  // 创建一个包含SVG的HTML元素
  const svgMarker = document.createElement('div');
  svgMarker.style.width = '24px';
  svgMarker.style.height = '24px';
  svgMarker.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="#fff" stroke-width="2"/>
    </svg>
  `;

  // 使用百度地图的自定义覆盖物
  const customOverlay = new window.BMap.Marker(position, {
    // 自定义图标
    icon: new window.BMap.Icon('data:image/svg+xml;charset=utf-8,' + 
      encodeURIComponent(svgMarker.innerHTML), new window.BMap.Size(24, 24))
  });

  // 添加到地图
  map.addOverlay(customOverlay);
  
  return customOverlay;
};

const baiduMapService = {
  loadBMapAPI,
  parseCoordinates,
  convertToPoints,
  createMarker,
  createPolyline,
  initializeMap,
  clearMapOverlays,
  calculateZoomLevel,
  getTrafficEvents,
  getCityTrafficInfo,
  get24HourTrend,
  getDistrictTrafficDistribution,
  getRoadTypeTrafficData,
  getRouteInfo,
  searchAddress,
  createSvgMarker
};

export default baiduMapService; 