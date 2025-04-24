<!--
 * @Author: 择安网络
 * @Code function: 
 * @Date: 2025-04-23 22:19:05
 * @FilePath: /ai大赛项目/traffic-monitoring-dashboard/README.md
 * @LastEditTime: 2025-04-24 08:59:43
-->
# 智能城市交通监控预警平台

基于 Next.js 和 ECharts 开发的城市交通监控预警平台前端，适合在 Vercel 上部署。

## 功能特点

- 数据可视化大屏展示
- 太原市交通实时监控（需配置高德地图API）
- 拥堵路段分析与统计
- 交通指数趋势分析
- 全国城市拥堵对比

## 技术栈

- Next.js 14
- TypeScript
- Tailwind CSS 
- ECharts
- 高德地图 API

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 配置高德地图

项目使用环境变量来存储高德地图API密钥，避免将密钥直接硬编码在代码中。

1. 在项目根目录创建 `.env.local` 文件（这个文件不会被提交到版本控制系统）
2. 添加以下内容，将 "你的高德地图API密钥" 替换为你的实际密钥：

```
NEXT_PUBLIC_AMAP_KEY=你的高德地图API密钥
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. 重新启动开发服务器以加载环境变量：

```bash
npm run dev
```

## 部署到 Vercel

此项目可以直接部署到 Vercel 平台。在 Vercel 中导入此 GitHub 仓库即可自动构建和部署。

部署时，需要在 Vercel 项目设置中添加环境变量 `NEXT_PUBLIC_AMAP_KEY`。

## 定制化

- 界面风格：修改 `/src/app/global.css` 中的颜色变量
- 数据源：修改图表组件中的静态数据，或连接到实际 API

## 许可证

MIT
