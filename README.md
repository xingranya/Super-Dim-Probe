# Super-Dim Probe

一个基于 React + Vite + Three.js 的电缆传感器网络可视化项目，当前包含两套互相关联的前端应用：

- `#/`：电缆网络 3D 总览、传感器详情、监测仪表盘、信号流演示、卫星地图
- `#/smart-tech/`：SmartTech 智能业务平台与后台监测子应用

当前仓库更适合作为可视化演示与前端原型基础，而不是已经接入真实后端的数据平台。

## 项目概览

主应用围绕城市电缆网络监测展开，提供从宏观网络到单个传感器的多层级可视化体验：

- 3D 电缆网络总览：展示建筑、道路、电缆路径、传感器节点与区域标签
- 传感器监测仪表盘：展示局放、温度、振动、声学、磁场等模拟监测指标
- 传感器 3D 详情：展示六面体传感器模型、故障模式切换与自动演示
- 信号流演示：用流程动画展示监测与分析链路
- WebGIS 卫星地图：基于 Mapbox、react-map-gl 与 deck.gl 展示电缆和节点分布

SmartTech 子应用则补充了业务展示与后台导航：

- 官网式页面：首页、产品中心、产品详情、SaaS 方案、服务、生态、登录、支付
- 后台页面：综合状态监测、电学分析、声学分析、热学分析、振动分析、XLPE 状态分析

## 路由结构

项目使用 `HashRouter`，本地开发和部署后都以 `#/` 形式访问。

```text
#/
├─ /                     电缆可视化主页面
└─ /smart-tech/
   ├─ /                  SmartTech 首页
   ├─ /products          产品列表
   ├─ /products/:id      产品详情
   ├─ /saas              SaaS 方案
   ├─ /services          服务页
   ├─ /ecosystem         生态合作
   ├─ /login             登录页
   ├─ /payment           支付流程页
   └─ /dashboard/*
      ├─ /monitor        综合状态监测
      ├─ /electrical     电学状态分析
      ├─ /acoustic       声学状态分析
      ├─ /thermal        热学状态分析
      ├─ /vibration      振动状态分析
      ├─ /analysis       XLPE 状态分析
      ├─ /devices        设备管理（占位）
      └─ /users          用户管理（占位）
```

## 技术栈

- React 19
- React Router 7
- Vite 6
- TypeScript
- Three.js
- react-map-gl
- Mapbox GL
- deck.gl
- ECharts 与 `echarts-for-react`
- lucide-react
- recharts
- clsx
- tailwind-merge

样式主要采用 Tailwind 风格类名，主题色与字体在 [index.html](./index.html) 中通过 CDN 方式配置，而不是独立的 Tailwind 构建链。

## 目录说明

```text
src/
├─ App.tsx                      顶层路由入口
├─ index.tsx                    应用挂载与 HashRouter 配置
├─ pages/                       主应用页面
├─ components/                  3D 场景、HUD、仪表盘、控制器等组件
├─ components/webmap/           地图子系统
├─ smart-tech/                  SmartTech 子应用
├─ data/                        本地模拟地理数据
├─ constants/                   场景与性能常量
├─ services/                    服务层（当前 AI 服务为占位）
├─ types.ts                     主应用共享类型
└─ types/                       地图相关类型
```

## 本地开发

### 依赖要求

- Node.js 18 或更高版本

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

默认开发服务器配置为 `0.0.0.0:3000`。

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 环境变量

### 必需项

地图视图依赖 Mapbox Token。缺失时，卫星地图页面会直接提示加载失败。

推荐在项目根目录创建 `.env.local`：

```bash
VITE_MAPBOX_TOKEN=你的_mapbox_token
```

### 历史遗留项

仓库里仍保留了 `GEMINI_API_KEY` 的注入配置，但当前 `src/services/geminiService.ts` 已经是空实现，README 不再将其视为当前可用能力。

## 当前实现重点

### 1. 电缆网络 3D 总览

- 使用 Three.js 渲染城市级电缆网络、道路、建筑、树木和传感器节点
- 支持相机状态保留、节点悬停与点击交互
- 可从网络视图跳转到监测仪表盘、传感器详情和 SmartTech 子应用

### 2. 传感器 3D 详情

- 支持局部放电、结构损伤、热负荷、绝缘老化等模式切换
- 通过着色器、后处理和动态屏幕模拟故障表现
- 内置自动演示模式与信号流演示入口

### 3. 监测仪表盘

- 展示局放、热学、振动、声学、磁场等维度的综合状态
- 集成 ECharts 图表和 3D 电缆截面可视化
- 面板文案与布局已面向演示场景优化

### 4. 卫星地图与拓扑

- 使用 Mapbox 卫星底图叠加电缆、节点、脉冲效果与 HUD
- 支持节点详情浮层与回跳监测仪表盘
- 地图数据由本地 mock 生成器构造，不依赖实时 GIS 接口

### 5. SmartTech 后台分析

- 提供综合监测、电学、声学、热学、振动、XLPE 分析等多种分析页
- 多个页面通过动态图表和模拟数据演示状态分析流程
- 适合作为智能运维后台界面原型

## 已知限制

- 当前大量数据为本地模拟数据，尚未接入真实后端接口
- `SensorDashboard` 的实时指标主要由前端定时器和随机数生成
- WebGIS 数据由 `generateMockMapData()` 生成，不是实时地图服务数据
- `devices` 与 `users` 路由仍为“开发中”占位页
- AI 诊断服务已移除，仅保留空实现占位
- 项目暂未提供独立的测试脚本或 lint 脚本

## 开发建议

- 如果新增故障模式，优先同步更新 `src/types.ts`
- 如果新增 SmartTech 页面，优先同步更新 `src/smart-tech/SmartTechApp.tsx`
- 如果接入真实地图数据，建议先替换 `src/components/webmap/utils/mockData.ts`
- 如果恢复 AI 能力，建议先补全 `src/services/geminiService.ts` 与对应 README 说明

## 说明

当前 README 仅同步仓库中已经存在并可从代码确认的行为，不包含 wiki，也不描述尚未在代码中落地的能力。
