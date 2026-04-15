# Tasks
- [x] Task 1: 梳理现有传感器六面屏建模与更新机制，明确可复用的对象引用与布局切换点
  - [x] SubTask 1.1: 定位六面屏 Mesh 的创建位置、当前坐标系与朝向修正逻辑
  - [x] SubTask 1.2: 定义“折叠布局”与“展开布局”的目标变换数据结构（position/rotation/scale）

- [x] Task 2: 增加展开状态管理与按钮入口
  - [x] SubTask 2.1: 在 `sensorDetail` 视图增加 `isScreenUnfolded` 状态，并向 `ThreeScene` 传递
  - [x] SubTask 2.2: 在控制面板增加“展开屏幕/收起屏幕”按钮（中文文案可直接上线）

- [x] Task 3: 在 ThreeScene 实现六面屏展开/收起动画
  - [x] SubTask 3.1: 为六面屏建立可索引的引用数组，并记录折叠态初始变换
  - [x] SubTask 3.2: 计算 2×3 平铺布局的目标变换（面向相机、间距一致、内容不倒置/不镜像）
  - [x] SubTask 3.3: 在动画循环中基于进度做插值（带缓动），并兼容 OrbitControls 与自动演示
  - [x] SubTask 3.4: 处理边界：快速连续点击、切换视图时的清理、StrictMode 双挂载不重复绑定

- [x] Task 4: 优化传感器外壳观感（不引入外部模型）
  - [x] SubTask 4.1: 增加轻量几何细节（例如端盖/细边框/浅倒角替代方案）或结构分件层次
  - [x] SubTask 4.2: 调整外壳材质参数与灯光/后处理匹配，避免过曝与反光刺眼

- [x] Task 5: 验证与回归
  - [x] SubTask 5.1: 验证展开/收起的方向、顺序、屏幕内容方向正确
  - [x] SubTask 5.2: 验证自动演示、故障模式切换、HUD 显示与屏幕刷新不受影响
  - [x] SubTask 5.3: 进行 TypeScript 类型检查（`npx tsc --noEmit`）并修复问题

# Task Dependencies
- Task 3 depends on Task 1
- Task 2 depends on Task 1
- Task 4 depends on Task 1
- Task 5 depends on Task 2, Task 3, Task 4
