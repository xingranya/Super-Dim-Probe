# AI 代理开发人员指南

本代码库是一个 React + Vite + Three.js 应用程序，用于可视化电缆传感器网络和故障检测。

## 1. 构建与执行

### 命令
- **安装依赖：** `npm install`
- **开发服务器：** `npm run dev`
- **构建：** `npm run build`
- **预览构建：** `npm run preview`

### 测试与 Lint
- **测试：** 目前 `package.json` 中未配置测试运行器（Jest/Vitest）。
  - *操作：* 如果被要求编写测试，请检查是否已添加运行器。如果没有，建议添加 Vitest。
- **Lint：** 未定义明确的 `lint` 脚本，但在 `tsconfig.json` 中配置了 TypeScript。
  - *标准：* 假设启用严格类型检查（`strict: true` 或等效项）。
  - *类型检查：* 可以运行 `npx tsc --noEmit` 来验证类型安全性。

## 2. 代码风格与规范

### 结构
- **组件：** `components/` 目录下的函数式组件，使用 `React.FC`。
- **逻辑：** 业务逻辑位于 `services/`（注意：`geminiService` 目前是存根）。
- **工具：** 辅助函数位于 `utils/`。
- **类型：** `types.ts` 中的共享接口和枚举。
- **入口：** `App.tsx` 是管理顶层状态（`viewMode`）的主要入口点。

### 命名与语言
- **语言：** **简体中文**用于所有代码注释和 UI 文本。保持一致性。
- **文件：** React 组件使用 PascalCase（例如 `CableNetwork3D.tsx`），工具函数使用 camelCase（例如 `textureFactory.ts`）。
- **变量/函数：** camelCase（例如 `handleSensorClick`, `viewMode`）。
- **类型/接口：** PascalCase（例如 `SensorData`, `ModeConfig`）。
- **枚举：** PascalCase 名称，UPPER_CASE 键（例如 `FaultMode.XLPE_TREEING`）。

### TypeScript 与 React 模式
- **类型：** 对状态和 props 使用显式类型。
  - 示例：`const [viewMode, setViewMode] = useState<ViewMode>('network');`
- **Hooks：** 广泛使用 `useCallback` 处理事件处理程序，使用 `useMemo` 处理昂贵的计算以优化渲染，这对于 3D 可视化环境尤为重要。
- **导入：**
  1. React/第三方库（React, Three 等）
  2. 本地组件（`./components/...`）
  3. 类型与常量（`./types`）
  - 即使可能配置了 `@/`别名，也请使用现有的相对路径（例如 `./components/HUD`）。
- **空值处理：** 显式处理 `undefined`（例如 `cameraState` 可以是 `undefined`）。

### 样式
- **CSS：** Tailwind CSS 是主要的样式解决方案（例如 `bg-slate-800`, `absolute inset-0`）。
- **3D：** 使用 Three.js 进行可视化。

## 3. 修改规则

- **现有文件：** 匹配现有的缩进（2 个空格）和格式（使用分号）。
- **新功能：** 如果添加新的视觉模式，请更新 `types.ts`（`FaultMode`）并在 `App.tsx` 中处理新模式。
- **注释：** 添加简短清晰的中文注释，解释复杂逻辑的*原因*。

## 4. 特定上下文
- **3D 可视化：** 应用程序围绕 `CableNetwork3D` 和 `ThreeScene` 展开。性能是关键。
- **传感器数据：** 数据从 `App.tsx` 向下流向组件。`SensorData` 接口控制数据结构。
