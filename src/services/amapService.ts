// 高德地图API服务层
// 使用环境变量获取API密钥
const MAP_KEY = process.env.NEXT_PUBLIC_AMAP_KEY || '';

// 基础URL
const AMAP_BASE_URL = 'https://restapi.amap.com/v3';

// 太原市行政区域编码
const TAIYUAN_ADCODE = '140100';

/**
 * 获取城市实时交通态势信息
 * @returns 交通态势数据
 */
export async function getCityTrafficInfo() {
  try {
    const url = `${AMAP_BASE_URL}/traffic/status/city?key=${MAP_KEY}&city=${TAIYUAN_ADCODE}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // 高德API成功状态码为1
    if (data.status === '1') {
      return data;
    } else {
      console.error('获取城市交通态势信息失败:', data.info);
      return null;
    }
  } catch (error) {
    console.error('获取城市交通态势信息出错:', error);
    return null;
  }
}

/**
 * 获取指定矩形区域内的实时路况
 * @param rectangle 矩形区域坐标, 格式: minLng,minLat;maxLng,maxLat
 * @returns 路况数据
 */
export async function getRectangleTrafficInfo(rectangle: string) {
  try {
    const url = `${AMAP_BASE_URL}/traffic/status/rectangle?key=${MAP_KEY}&rectangle=${rectangle}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1') {
      return data;
    } else {
      console.error('获取区域交通态势信息失败:', data.info);
      return null;
    }
  } catch (error) {
    console.error('获取区域交通态势信息出错:', error);
    return null;
  }
}

/**
 * 获取指定道路的实时路况
 * @param roadId 道路ID
 * @param adcode 行政区域编码
 * @returns 路况数据
 */
export async function getRoadTrafficInfo(roadId: string, adcode = TAIYUAN_ADCODE) {
  try {
    const url = `${AMAP_BASE_URL}/traffic/status/road?key=${MAP_KEY}&name=${encodeURIComponent(roadId)}&adcode=${adcode}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1') {
      return data;
    } else {
      console.error('获取道路交通态势信息失败:', data.info);
      return null;
    }
  } catch (error) {
    console.error('获取道路交通态势信息出错:', error);
    return null;
  }
}

/**
 * 获取行政区域信息
 * @param adcode 行政区域编码
 * @returns 行政区域信息
 */
export async function getDistrictInfo(adcode = TAIYUAN_ADCODE) {
  try {
    const url = `${AMAP_BASE_URL}/config/district?key=${MAP_KEY}&keywords=${adcode}&subdistrict=1&extensions=all`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1') {
      return data;
    } else {
      console.error('获取行政区域信息失败:', data.info);
      return null;
    }
  } catch (error) {
    console.error('获取行政区域信息出错:', error);
    return null;
  }
}

/**
 * 获取指定区域内的交通事件信息
 * 注意：此API为模拟实现，高德地图开放平台中并未完全开放交通事故API
 * 实际项目中可能需要替换为其他数据源
 */
export async function getTrafficEvents() {
  try {
    // 由于高德未完全开放交通事件API，这里与交通态势结合，提取拥堵情况作为事件
    const cityTraffic = await getCityTrafficInfo();
    if (!cityTraffic) return null;
    
    // 基于拥堵指数生成交通事件
    const congestionLevel = parseFloat(cityTraffic.evaluation.expedite) || 0;
    const eventsCount = Math.round(congestionLevel / 10); // 根据拥堵程度生成事件数量
    
    // 太原市主要道路
    const mainRoads = [
      '迎泽大街', '五一路', '长风街', '太榆路', '滨河东路', 
      '南中环街', '北中环街', '龙城大街', '晋阳街'
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
          112.53 + (Math.random() * 0.05 - 0.025), // 太原市经度范围附近
          37.87 + (Math.random() * 0.05 - 0.025)   // 太原市纬度范围附近
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
    // 获取当前交通状况
    const currentTraffic = await getCityTrafficInfo();
    if (!currentTraffic) {
      throw new Error('获取当前交通状况失败');
    }
    
    // 当前拥堵指数
    const currentCongestion = parseFloat(currentTraffic.evaluation.congestion_delayed_index) || 1.5;
    
    // 生成24小时数据，结合真实当前数据与历史规律
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
      
      // 如果是当前小时，使用实际获取的数据
      if (hour === currentHour) {
        baseTraffic = currentCongestion;
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
    // 获取太原市区县信息
    const districtInfo = await getDistrictInfo();
    if (!districtInfo || !districtInfo.districts || districtInfo.districts.length === 0) {
      throw new Error('获取区县信息失败');
    }
    
    const cityDistricts = districtInfo.districts[0].districts || [];
    if (cityDistricts.length === 0) {
      throw new Error('区县信息为空');
    }
    
    // 为每个区县生成交通分布数据
    const districtData = [];
    let totalValue = 0;
    
    for (const district of cityDistricts) {
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
    // 获取当前城市交通状况
    const cityTraffic = await getCityTrafficInfo();
    if (!cityTraffic) {
      throw new Error('获取城市交通状况失败');
    }
    
    const congestionIndex = parseFloat(cityTraffic.evaluation.congestion_delayed_index) || 1.5;
    
    // 道路类型
    const roadTypes = ['主干道', '快速路', '高速公路', '次干道'];
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    
    // 当前日期
    const now = new Date();
    const today = now.getDay(); // 0是周日，1是周一
    
    // 基于当前拥堵指数，为每种道路类型生成一周的流量数据
    const data = roadTypes.map(type => {
      // 不同道路类型的基础流量
      let baseValue;
      switch(type) {
        case '主干道': baseValue = 260 * congestionIndex; break;
        case '快速路': baseValue = 320 * congestionIndex; break;
        case '高速公路': baseValue = 380 * congestionIndex; break;
        case '次干道': baseValue = 180 * congestionIndex; break;
        default: baseValue = 200 * congestionIndex;
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
          multiplier = 1.0; // 使用实际拥堵指数，已经在baseValue中包含
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

// 修改匿名默认导出
const amapService = {
  getTrafficEvents,
  getCityTrafficInfo,
  getRectangleTrafficInfo,
  getRoadTrafficInfo,
  getDistrictInfo,
  get24HourTrend,
  getDistrictTrafficDistribution,
  getRoadTypeTrafficData
};

export default amapService; 