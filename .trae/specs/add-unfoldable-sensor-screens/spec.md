# 传感器六面屏展开 Spec

## Why
当前传感器 3D 外观详情采用六面环绕屏设计，信息密度高但同时只能正对一面查看。需要提供“一键展开”能力，把六面屏以动画方式平铺展示，提升可读性与演示效果。

## What Changes
- 在“传感器 3D 外观详情”（`sensorDetail` / `ThreeScene`）增加“展开/收起屏幕”按钮，用于触发六面屏展开动画
- 为六面屏增加“折叠状态/展开状态”两套空间布局，并支持在两者间平滑过渡动画
- 优化传感器外壳建模观感（几何细节与材质参数），使其更接近工业设备质感且与展开动画不冲突
- **非目标**：引入外部模型文件、替换整体场景结构、改动其它视图（network/dashboard/webmap）的交互逻辑

## Impact
- Affected specs: 3D 传感器详情展示、交互控制、视觉表现
- Affected code: `ThreeScene.tsx`（传感器建模/动画）、`VisualizationPage.tsx`（状态传递）、`Controls.tsx`（按钮入口，或新增轻量控制组件）

## ADDED Requirements
### Requirement: 六面屏可展开
系统 SHALL 在传感器 3D 外观详情视图提供“展开/收起屏幕”控制，并通过动画完成布局切换。

#### Scenario: 展开成功
- **WHEN** 用户点击“展开屏幕”
- **THEN** 六个屏幕 SHALL 在可见范围内平铺展示，并保持屏幕内容持续动态更新
- **THEN** 动画 SHALL 采用平滑过渡（包含缓动），避免瞬间跳变

#### Scenario: 收起成功
- **WHEN** 用户再次点击“收起屏幕”
- **THEN** 六个屏幕 SHALL 平滑回到环绕六边形外壳的原始布局

### Requirement: 展开布局定义
系统 SHALL 提供一种清晰可读的平铺布局，默认采用“竖向展开”的屏幕墙形式。

#### Scenario: 竖向展开屏幕墙
- **WHEN** 展开动画完成
- **THEN** 六面屏 SHALL 面向相机，呈 2 列 × 3 行的平铺布局（从上到下优先）
- **THEN** 每个屏幕 SHALL 保持原有尺寸比例与内容方向（不倒置、不镜像）

### Requirement: 外壳观感优化
系统 SHALL 在不引入外部模型文件的前提下，提升传感器外壳的工业质感与层次。

#### Scenario: 视觉效果改进
- **WHEN** 用户进入传感器 3D 外观详情
- **THEN** 传感器外壳 SHALL 具备更明确的结构层次（例如倒角/分件/边缘高光或微细发光点缀）
- **THEN** 不应造成明显性能退化（相对当前实现不增加高频每帧计算）

## MODIFIED Requirements
### Requirement: 传感器屏幕动态更新
原有屏幕内容动态刷新机制 SHALL 在展开/收起两种布局下保持一致，且不引入新的内存泄漏点。

## REMOVED Requirements
无
