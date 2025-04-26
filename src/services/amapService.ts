// 高德地图API服务层
// 使用环境变量获取API密钥
const MAP_KEY = 'tcjeRJ4R8YwcSGYvXWL6dUwG8e6G4cDu';

// 基础URL
const AMAP_BASE_URL = 'https://restapi.amap.com/v3';

// 北京市行政区域编码
const BEIJING_ADCODE = '110100'; // 北京市代码

/**
 * 获取城市实时交通态势信息
 * @returns 交通态势数据
 */
export async function getCityTrafficInfo() {
  // Always return mock data instead of making an API call
  return {
    status: '1',
    info: 'OK',
    evaluation: {
      congestion_delayed_index: '1.75', // 拥堵指数，1-2之间表示轻度拥堵
      expedite: '60',                  // 畅通指数
    }
  };
}

/**
 * 获取指定矩形区域内的实时路况
 * @param rectangle 矩形区域坐标, 格式: minLng,minLat;maxLng,maxLat
 * @returns 路况数据
 */
export async function getRectangleTrafficInfo(rectangle: string) {
  // Return mock data
  return {
    status: '1',
    info: 'OK',
    trafficinfo: {
      evaluation: {
        expedite: '60',
        congested: '20',
        blocked: '10',
        unknown: '10',
        status: '畅通'
      }
    }
  };
}

/**
 * 获取指定道路的实时路况
 * @param roadId 道路ID
 * @param adcode 行政区域编码
 * @returns 路况数据
 */
export async function getRoadTrafficInfo(roadId: string, adcode = BEIJING_ADCODE) {
  // Return mock data
  return {
    status: '1',
    info: 'OK',
    trafficinfo: {
      evaluation: {
        status: '缓行',
        expedite: '50',
        congested: '30',
        blocked: '20',
        description: '道路整体畅通一般'
      }
    }
  };
}

/**
 * 获取行政区域信息
 * @param adcode 行政区域编码
 * @returns 行政区域信息
 */
export async function getDistrictInfo(adcode = BEIJING_ADCODE) {
  // Return mock data for Beijing districts
  return {
    status: '1',
    info: 'OK',
    districts: [
      {
        name: '北京市',
        adcode: '110100',
        districts: [
          { name: '东城区', adcode: '110101' },
          { name: '西城区', adcode: '110102' },
          { name: '朝阳区', adcode: '110105' },
          { name: '海淀区', adcode: '110108' },
          { name: '丰台区', adcode: '110106' },
          { name: '石景山区', adcode: '110107' },
          { name: '通州区', adcode: '110112' },
          { name: '顺义区', adcode: '110113' }
        ]
      }
    ]
  };
}

/**
 * 获取指定区域内的交通事件信息
 * 注意：此API为模拟实现，高德地图开放平台中并未完全开放交通事故API
 * 实际项目中可能需要替换为其他数据源
 */
export async function getTrafficEvents() {
  // 模拟交通事件数据
  const mainRoads = [
    '长安街', '建国路', '三环路', '四环路', '五环路', 
    '北三环', '南二环', '东直门', '西直门'
  ];
  
  const events = [];
  const eventsCount = 5; // 固定生成5个事件
  
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
        116.404 + (Math.random() * 0.05 - 0.025), // 北京市经度范围附近
        39.915 + (Math.random() * 0.05 - 0.025)   // 北京市纬度范围附近
      ]
    });
  }
  
  return {
    status: '1',
    info: 'OK',
    count: events.length,
    events: events
  };
}

/**
 * 将历史数据与实时数据结合，生成24小时趋势数据
 * @returns 24小时趋势数据
 */
export async function get24HourTrend() {
  // 生成24小时模拟数据
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
}

/**
 * 获取不同区域的交通分布数据
 * @returns 交通分布数据
 */
export async function getDistrictTrafficDistribution() {
  // 模拟北京各区的交通分布数据
  const districts = [
    { name: '朝阳区', adcode: '110105' },
    { name: '海淀区', adcode: '110108' },
    { name: '东城区', adcode: '110101' },
    { name: '西城区', adcode: '110102' },
    { name: '丰台区', adcode: '110106' },
    { name: '石景山区', adcode: '110107' },
    { name: '通州区', adcode: '110112' },
    { name: '顺义区', adcode: '110113' }
  ];
  
  // 为每个区县生成交通分布数据
  const districtData = [];
  let totalValue = 0;
  
  for (const district of districts) {
    // 根据区县名称设置不同的交通权重
    let weight;
    const name = district.name;
    
    if (name.includes('朝阳') || name.includes('海淀')) {
      weight = 0.8 + Math.random() * 0.4; // 市中心区域权重较高
    } else if (name.includes('东城') || name.includes('西城')) {
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
}

/**
 * 获取道路类型流量数据
 * @returns 道路类型流量数据
 */
export async function getRoadTypeTrafficData() {
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
      
      // 添加随机波动
      return Math.round(baseValue * multiplier * (0.85 + Math.random() * 0.3));
    });
  });
  
  return {
    days,
    roadTypes,
    data
  };
}

/**
 * 获取两点之间的路线和交通状况
 * @param origin 起点坐标，格式：lng,lat
 * @param destination 终点坐标，格式：lng,lat
 * @param strategy 导航策略，默认为最快路线
 * @returns 路线和交通状况信息
 */
export async function getRouteInfo(origin: string, destination: string, strategy = 0) {
  // 模拟不同路段的交通状况
  const roadSections = [
    { roadName: '长安街', distance: 3500, level: '畅通', color: '#00af66', status: '1' },
    { roadName: '建国门', distance: 1200, level: '缓行', color: '#ffbf00', status: '2' },
    { roadName: '东三环', distance: 5400, level: '拥堵', color: '#ff6600', status: '3' },
    { roadName: '国贸桥', distance: 800, level: '严重拥堵', color: '#ee0000', status: '4' },
    { roadName: '朝阳路', distance: 2300, level: '畅通', color: '#00af66', status: '1' }
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
    polyline: '116.404,39.915;116.410,39.920;116.415,39.910',
    toll: '0',
    totalTrafficLights: '8'
  };
}

/**
 * 搜索地址并转换为坐标
 * @param keyword 关键词或地址
 * @param city 城市名称或编码，默认为北京
 * @returns 搜索结果
 */
export async function searchAddress(keyword: string, city = '北京') {
  // 返回模拟的地址搜索结果
  return {
    status: '1',
    info: 'OK',
    pois: [
      {
        name: `${keyword}附近地点1`,
        location: '116.404,39.915',
        address: '北京市东城区',
      },
      {
        name: `${keyword}附近地点2`,
        location: '116.410,39.920',
        address: '北京市朝阳区',
      },
      {
        name: `${keyword}相关地点`,
        location: '116.415,39.910',
        address: '北京市海淀区',
      }
    ],
    count: 3
  };
}

// 修改匿名默认导出
const amapService = {
  getTrafficEvents,
  getCityTrafficInfo,
  getRectangleTrafficInfo,
  getRoadTrafficInfo,
  getDistrictInfo,
  get24HourTrend,
  getDistrictTrafficDistribution,
  getRoadTypeTrafficData,
  getRouteInfo,
  searchAddress
};

export default amapService; 