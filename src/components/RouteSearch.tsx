'use client';

import React, { useState } from 'react';
import { Input, Button, List, Spin, Empty, message, Modal } from 'antd';
import { SearchOutlined, ArrowRightOutlined } from '@ant-design/icons';

interface LocationItem {
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface RouteInfoData {
  distance?: string;
  duration?: string;
  startLocation?: string;
  endLocation?: string;
  congestionLevel?: string;
  congestionDescription?: string;
}

// 添加AI建议接口
interface AIRecommendation {
  alternateRoute?: string;
  bestTimeToTravel?: string;
  transportationTip?: string;
  safetyTip?: string;
}

// DeepSeek API Key
const DEEPSEEK_API_KEY = 'sk-1d869120a8464d9e9aec4d9dfed6f153';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const RouteSearch: React.FC = () => {
  // 状态管理
  const [startValue, setStartValue] = useState<string>('');
  const [endValue, setEndValue] = useState<string>('');
  const [startSearchResults, setStartSearchResults] = useState<LocationItem[]>([]);
  const [endSearchResults, setEndSearchResults] = useState<LocationItem[]>([]);
  const [startLoading, setStartLoading] = useState<boolean>(false);
  const [endLoading, setEndLoading] = useState<boolean>(false);
  const [routeLoading, setRouteLoading] = useState<boolean>(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfoData | null>(null);
  const [startSearch, setStartSearch] = useState<boolean>(false);
  const [endSearch, setEndSearch] = useState<boolean>(false);
  const [selectedStart, setSelectedStart] = useState<LocationItem | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<LocationItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingContent, setStreamingContent] = useState<{
    alternateRoute: string;
    bestTimeToTravel: string;
    transportationTip: string;
    safetyTip: string;
  }>({
    alternateRoute: "",
    bestTimeToTravel: "",
    transportationTip: "",
    safetyTip: ""
  });

  // 搜索起点位置
  const handleStartSearch = async () => {
    if (!startValue.trim()) {
      message.warning('请输入起点位置');
      return;
    }
    
    setStartLoading(true);
    setStartSearch(true);
    setError(null);
    
    try {
      // 调用百度地图服务搜索地址
      const results = await searchAddress(startValue);
      setStartSearchResults(results);
      if (results.length === 0) {
        message.info('没有找到匹配的起点位置');
      }
    } catch (err) {
      console.error('搜索起点位置失败:', err);
      setError('搜索起点位置失败，请重试');
    } finally {
      setStartLoading(false);
    }
  };

  // 搜索终点位置
  const handleEndSearch = async () => {
    if (!endValue.trim()) {
      message.warning('请输入终点位置');
      return;
    }
    
    setEndLoading(true);
    setEndSearch(true);
    setError(null);
    
    try {
      // 调用百度地图服务搜索地址
      const results = await searchAddress(endValue);
      setEndSearchResults(results);
      if (results.length === 0) {
        message.info('没有找到匹配的终点位置');
      }
    } catch (err) {
      console.error('搜索终点位置失败:', err);
      setError('搜索终点位置失败，请重试');
    } finally {
      setEndLoading(false);
    }
  };

  // 搜索地址的模拟函数（实际项目中应使用百度地图API）
  const searchAddress = async (keyword: string): Promise<LocationItem[]> => {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 对于太原南站的模拟结果
    if (keyword.includes('太原南站')) {
      return [
        { 
          name: '太原南站', 
          address: '山西省太原市小店区太榆路',
          location: { lat: 37.7683, lng: 112.563 } 
        },
        { 
          name: '太原南站公交站', 
          address: '山西省太原市小店区',
          location: { lat: 37.7672, lng: 112.5645 } 
        }
      ];
    }
    
    // 对于北格镇的模拟结果
    if (keyword.includes('北格')) {
      return [
        { 
          name: '北格镇', 
          address: '山西省晋中市榆次区',
          location: { lat: 37.856, lng: 112.75 } 
        },
        { 
          name: '北格镇政府', 
          address: '山西省晋中市榆次区北格镇',
          location: { lat: 37.858, lng: 112.753 } 
        }
      ];
    }
    
    // 其他通用模拟结果
    return [
      { 
        name: `${keyword}`, 
        address: `山西省太原市附近的${keyword}`,
        location: { lat: 37.87 + Math.random() * 0.1, lng: 112.55 + Math.random() * 0.1 } 
      },
      { 
        name: `${keyword}附近`, 
        address: `太原市${keyword}附近的位置`,
        location: { lat: 37.87 + Math.random() * 0.1, lng: 112.55 + Math.random() * 0.1 } 
      }
    ];
  };

  // 选择起点
  const handleSelectStart = (item: LocationItem) => {
    setSelectedStart(item);
    setStartSearch(false);
  };

  // 选择终点
  const handleSelectEnd = (item: LocationItem) => {
    setSelectedEnd(item);
    setEndSearch(false);
  };

  // 模拟获取路线信息的函数
  const getRouteInfo = (): RouteInfoData => {
    // 模拟路线信息数据
    const distances = ['5.2公里', '12.7公里', '8.5公里', '15.3公里', '3.8公里'];
    const durations = ['15分钟', '35分钟', '25分钟', '45分钟', '10分钟'];
    const congestionLevels = ['轻度拥堵', '中度拥堵', '严重拥堵', '畅通', '轻微拥堵'];
    const congestionDescriptions = [
      '道路通行基本正常，局部地区略有缓行',
      '主要路段车流量大，通行速度较慢',
      '多处路段严重拥堵，通行极为缓慢',
      '道路通行顺畅，无明显拥堵',
      '部分路段有轻微拥堵，整体通行良好'
    ];
    
    const randomIndex = Math.floor(Math.random() * distances.length);
    
    return {
      distance: distances[randomIndex],
      duration: durations[randomIndex],
      congestionLevel: congestionLevels[randomIndex],
      congestionDescription: congestionDescriptions[randomIndex]
    };
  };

  // 调用DeepSeek API获取AI建议 (流式输出)
  const fetchAIRecommendation = async (routeData: RouteInfoData): Promise<AIRecommendation> => {
    try {
      setIsStreaming(true);
      setStreamingContent({
        alternateRoute: "",
        bestTimeToTravel: "",
        transportationTip: "",
        safetyTip: ""
      });

      const prompt = `
作为一个交通AI助手，根据以下路线信息提供出行建议：
- 起点: ${routeData.startLocation}
- 终点: ${routeData.endLocation}
- 距离: ${routeData.distance}
- 预计时间: ${routeData.duration}
- 拥堵程度: ${routeData.congestionLevel}
- 拥堵状况: ${routeData.congestionDescription}

请提供以下几个方面的建议，每项建议限制在50字以内：
1. 备选路线建议
2. 最佳出行时间建议
3. 出行方式建议
4. 安全提示

请直接以JSON格式回复，不要有其他内容，格式如下：
{
  "alternateRoute": "备选路线建议",
  "bestTimeToTravel": "最佳出行时间建议",
  "transportationTip": "出行方式建议",
  "safetyTip": "安全提示"
}
`;

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
          stream: true // 启用流式输出
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported');
      }

      // 读取流
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let fullResponse = "";

      // 临时变量来存储流式结果
      const result: AIRecommendation = {
        alternateRoute: "",
        bestTimeToTravel: "", 
        transportationTip: "",
        safetyTip: ""
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // 解码当前块
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          fullResponse += chunk;

          // 处理数据行
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.substring(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices[0]?.delta?.content;
                
                if (delta) {
                  // 尝试捕获JSON部分并更新流式内容
                  try {
                    fullResponse += delta;
                    
                    // 尝试从累积的响应中提取JSON
                    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                      const jsonStr = jsonMatch[0];
                      try {
                        const partialJson = JSON.parse(jsonStr);
                        
                        // 更新流式内容状态
                        setStreamingContent(prev => ({
                          alternateRoute: partialJson.alternateRoute || prev.alternateRoute,
                          bestTimeToTravel: partialJson.bestTimeToTravel || prev.bestTimeToTravel,
                          transportationTip: partialJson.transportationTip || prev.transportationTip,
                          safetyTip: partialJson.safetyTip || prev.safetyTip
                        }));
                        
                        // 也更新结果对象
                        result.alternateRoute = partialJson.alternateRoute || result.alternateRoute;
                        result.bestTimeToTravel = partialJson.bestTimeToTravel || result.bestTimeToTravel;
                        result.transportationTip = partialJson.transportationTip || result.transportationTip;
                        result.safetyTip = partialJson.safetyTip || result.safetyTip;
                      } catch (e) {
                        // 解析部分JSON失败，继续等待更多数据
                      }
                    }
                  } catch (e) {
                    // 解析流式更新失败，继续尝试
                  }
                }
              } catch (e) {
                // 解析行失败，继续处理
              }
            }
          }
        }
      } catch (streamError) {
        console.error('Stream reading error:', streamError);
      } finally {
        reader.releaseLock();
        setIsStreaming(false);
      }

      // 尝试从完整响应中解析最终JSON
      try {
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const finalJson = JSON.parse(jsonMatch[0]);
          return finalJson;
        }
      } catch (parseError) {
        console.error('Failed to parse complete AI response:', parseError);
      }
      
      // 如果部分解析成功，返回结果
      if (result.alternateRoute || result.bestTimeToTravel || 
          result.transportationTip || result.safetyTip) {
        return result;
      }
      
      // 所有解析都失败时，使用备用建议
      return getFallbackRecommendation(routeData.congestionLevel || '未知');
    } catch (error) {
      console.error('Error fetching AI recommendation:', error);
      setIsStreaming(false);
      // API调用失败时返回备用建议
      return getFallbackRecommendation(routeData.congestionLevel || '未知');
    }
  };

  // 备用的建议生成函数，当API调用失败时使用
  const getFallbackRecommendation = (congestionLevel: string): AIRecommendation => {
    // 根据拥堵程度给出不同的建议
    if (congestionLevel === '严重拥堵') {
      return {
        alternateRoute: '建议改走环城高速绕行，虽然距离增加2公里，但可节省15分钟。',
        bestTimeToTravel: '建议推迟1小时后出发，届时拥堵将减轻。',
        transportationTip: '如有条件可考虑地铁出行，地铁2号线可到达目的地附近。',
        safetyTip: '严重拥堵路段请保持车距，避免频繁变道。'
      };
    } else if (congestionLevel === '中度拥堵') {
      return {
        alternateRoute: '可考虑从太榆路转入学府街，避开主要拥堵路段。',
        bestTimeToTravel: '当前为交通高峰期，建议30分钟后出发。',
        transportationTip: '共享单车+公交联程可能更快捷。',
        safetyTip: '注意前方可能有临时管制，请留意交通广播。'
      };
    } else if (congestionLevel === '轻度拥堵' || congestionLevel === '轻微拥堵') {
      return {
        alternateRoute: '当前路线基本通畅，无需绕行。',
        bestTimeToTravel: '当前为出行较佳时段。',
        transportationTip: '建议驾车出行，路况良好。',
        safetyTip: '部分路段可能有限速，请遵守交通规则。'
      };
    } else {
      return {
        alternateRoute: '当前路线畅通，是最优选择。',
        bestTimeToTravel: '全天路况良好，可随时出发。',
        transportationTip: '各种交通方式均可选择，驾车最为便捷。',
        safetyTip: '路况良好，请保持安全车速。'
      };
    }
  };

  // 查询路线信息
  const handleQueryRoute = () => {
    if (!selectedStart || !selectedEnd) {
      message.warning('请先选择起点和终点');
      return;
    }
    
    setRouteLoading(true);
    setAiRecommendation(null); // 清除之前的AI建议
    
    // 模拟API请求
    setTimeout(async () => {
      const data = getRouteInfo();
      data.startLocation = selectedStart.name;
      data.endLocation = selectedEnd.name;
      setRouteInfo(data);
      
      try {
        // 调用DeepSeek AI API获取建议
        const recommendation = await fetchAIRecommendation(data);
        setAiRecommendation(recommendation);
      } catch (error) {
        console.error('获取AI建议失败:', error);
        message.error('获取AI建议失败，显示默认建议');
        // 使用备用建议
        if (data.congestionLevel) {
          const fallbackRecommendation = getFallbackRecommendation(data.congestionLevel);
          setAiRecommendation(fallbackRecommendation);
        }
      } finally {
        setRouteLoading(false);
      }
    }, 500);
  };

  // 格式化路线信息
  const formatRouteInfo = (data: RouteInfoData) => {
    return (
      <div className="space-y-2">
        <div className="text-lg font-medium">路线信息</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-gray-400">起点：</div>
          <div>{selectedStart?.name || '未选择'}</div>
          <div className="text-gray-400">终点：</div>
          <div>{selectedEnd?.name || '未选择'}</div>
          {data.distance && (
            <>
              <div className="text-gray-400">距离：</div>
              <div>{data.distance}</div>
            </>
          )}
          {data.duration && (
            <>
              <div className="text-gray-400">预计时间：</div>
              <div>{data.duration}</div>
            </>
          )}
          {data.congestionLevel && (
            <>
              <div className="text-gray-400">拥堵程度：</div>
              <div className={
                data.congestionLevel === '严重拥堵' ? 'text-red-500 font-bold' :
                data.congestionLevel === '中度拥堵' ? 'text-orange-500 font-medium' :
                data.congestionLevel === '轻度拥堵' || data.congestionLevel === '轻微拥堵' ? 'text-yellow-500' :
                'text-green-500'
              }>{data.congestionLevel}</div>
            </>
          )}
          {data.congestionDescription && (
            <>
              <div className="text-gray-400">拥堵状况：</div>
              <div>{data.congestionDescription}</div>
            </>
          )}
        </div>
      </div>
    );
  };

  // 格式化AI建议
  const formatAIRecommendation = (recommendation: AIRecommendation) => {
    return (
      <div className="space-y-2 mt-4">
        <div className="text-lg font-medium flex items-center">
          <span className="text-blue-400 mr-2">AI</span>
          <span>智能建议</span>
          {isStreaming && <Spin size="small" className="ml-2" />}
        </div>
        <div className="bg-[#142345] rounded-md p-3 space-y-3">
          <div className="flex">
            <div className="min-w-[20px] mr-2 text-blue-400">
              <ArrowRightOutlined />
            </div>
            <div>
              <div className="text-blue-300 text-sm">备选路线</div>
              <div className="text-white text-sm">
                {isStreaming 
                  ? streamingContent.alternateRoute || "正在生成建议..." 
                  : recommendation.alternateRoute}
              </div>
            </div>
          </div>
          
          <div className="flex">
            <div className="min-w-[20px] mr-2 text-blue-400">
              <ArrowRightOutlined />
            </div>
            <div>
              <div className="text-blue-300 text-sm">最佳出行时间</div>
              <div className="text-white text-sm">
                {isStreaming 
                  ? streamingContent.bestTimeToTravel || "正在生成建议..." 
                  : recommendation.bestTimeToTravel}
              </div>
            </div>
          </div>
          
          <div className="flex">
            <div className="min-w-[20px] mr-2 text-blue-400">
              <ArrowRightOutlined />
            </div>
            <div>
              <div className="text-blue-300 text-sm">出行方式建议</div>
              <div className="text-white text-sm">
                {isStreaming 
                  ? streamingContent.transportationTip || "正在生成建议..." 
                  : recommendation.transportationTip}
              </div>
            </div>
          </div>
          
          <div className="flex">
            <div className="min-w-[20px] mr-2 text-blue-400">
              <ArrowRightOutlined />
            </div>
            <div>
              <div className="text-blue-300 text-sm">安全提示</div>
              <div className="text-white text-sm">
                {isStreaming 
                  ? streamingContent.safetyTip || "正在生成建议..." 
                  : recommendation.safetyTip}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="route-search flex flex-col h-full">
      {/* 起点搜索 */}
      <div className="mb-3">
        <div className="text-white text-sm mb-1">起点</div>
        <div className="flex gap-2">
          <Input
            placeholder="输入起点位置"
            value={startValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartValue(e.target.value)}
            className="flex-grow"
          />
          <Button 
            type="primary" 
            icon={<SearchOutlined />} 
            onClick={handleStartSearch}
            loading={startLoading}
            className="!bg-blue-600 hover:!bg-blue-500"
          >
            搜索
          </Button>
        </div>
        
        {startSearch && !startLoading && (
          <div className="mt-2 border border-[#244673] rounded max-h-[100px] overflow-auto">
            {startSearchResults.length > 0 ? (
              <List
                size="small"
                dataSource={startSearchResults}
                renderItem={(item: LocationItem) => (
                  <List.Item 
                    className="cursor-pointer hover:bg-[#1a365d] px-2 py-1"
                    onClick={() => handleSelectStart(item)}
                  >
                    <div className="text-sm">
                      <div className="text-white">{item.name}</div>
                      <div className="text-gray-400 text-xs">{item.address}</div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未找到结果" className="p-2" />
            )}
          </div>
        )}
        
        {selectedStart && (
          <div className="mt-1 text-sm text-green-400">
            已选择: {selectedStart.name}
          </div>
        )}
      </div>
      
      {/* 终点搜索 */}
      <div className="mb-3">
        <div className="text-white text-sm mb-1">终点</div>
        <div className="flex gap-2">
          <Input
            placeholder="输入终点位置"
            value={endValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndValue(e.target.value)}
            className="flex-grow"
          />
          <Button 
            type="primary" 
            icon={<SearchOutlined />} 
            onClick={handleEndSearch}
            loading={endLoading}
            className="!bg-blue-600 hover:!bg-blue-500"
          >
            搜索
          </Button>
        </div>
        
        {endSearch && !endLoading && (
          <div className="mt-2 border border-[#244673] rounded max-h-[100px] overflow-auto">
            {endSearchResults.length > 0 ? (
              <List
                size="small"
                dataSource={endSearchResults}
                renderItem={(item: LocationItem) => (
                  <List.Item 
                    className="cursor-pointer hover:bg-[#1a365d] px-2 py-1"
                    onClick={() => handleSelectEnd(item)}
                  >
                    <div className="text-sm">
                      <div className="text-white">{item.name}</div>
                      <div className="text-gray-400 text-xs">{item.address}</div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未找到结果" className="p-2" />
            )}
          </div>
        )}
        
        {selectedEnd && (
          <div className="mt-1 text-sm text-green-400">
            已选择: {selectedEnd.name}
          </div>
        )}
      </div>
      
      {/* 查询按钮 */}
      <div className="mb-4">
        <Button 
          type="primary" 
          className="w-full mt-4"
          onClick={handleQueryRoute}
          disabled={!selectedStart || !selectedEnd}
        >
          查询路线拥堵情况
        </Button>
      </div>
      
      {/* 错误信息 */}
      {error && (
        <div className="text-red-500 text-sm mb-4">
          {error}
        </div>
      )}
      
      {/* 查询路线拥堵情况 区域标题 */}
      <div className="text-white text-base font-medium mb-2 mt-4">
        查询路线拥堵情况
      </div>
      
      {/* 路线信息结果 */}
      {routeLoading ? (
        <div className="flex justify-center py-4">
          <Spin tip="获取路线信息中..." />
        </div>
      ) : routeInfo ? (
        <div className="bg-[#0c1931] border border-[#244673] rounded-md p-3">
          {formatRouteInfo(routeInfo)}
          {(aiRecommendation || isStreaming) && formatAIRecommendation(aiRecommendation || {} as AIRecommendation)}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-4">
          请选择起点和终点并点击查询按钮
        </div>
      )}
    </div>
  );
};

export default RouteSearch; 