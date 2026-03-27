import type { NodeType } from '@/types/map';

/**
 * 节点图标配置 - 使用 SVG data URL 作为 IconLayer 图标源
 * 每种节点类型有独特的图标形状和配色
 */

// 节点颜色配置 (用于 SVG 填充)
export const NODE_COLORS: Record<NodeType, { primary: string; glow: string; stroke: string }> = {
  substation: { primary: '#5b6e82', glow: '#8ea1b4', stroke: '#d4dde6' },
  joint: { primary: '#5c6672', glow: '#87919c', stroke: '#d4dbe2' },
  switch_station: { primary: '#677181', glow: '#909aac', stroke: '#d7dce4' },
  user_station: { primary: '#60707d', glow: '#91a0ab', stroke: '#d7dee5' },
  grounding: { primary: '#6d675c', glow: '#9a907f', stroke: '#e4dccb' },
};

// 状态颜色 (用于状态光点和光晕)
export const STATUS_COLOR_MAP = {
  normal: { fill: '#3bc08b', glow: 'rgba(59,192,139,0.24)' },
  warning: { fill: '#e6a23c', glow: 'rgba(230,162,60,0.3)' },
  fault: { fill: '#e85d75', glow: 'rgba(232,93,117,0.36)' },
} as const;

/**
 * 生成变电站图标 SVG - 方形建筑 + ⚡符号
 */
function createSubstationSVG(colors: typeof NODE_COLORS.substation): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <defs>
      <linearGradient id="grad-s" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${colors.glow}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${colors.primary}" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <!-- 主体方形建筑：保持留白，避免缩小时看起来像被截断 -->
    <rect x="15" y="15" width="34" height="34" rx="9" fill="url(#grad-s)" stroke="${colors.stroke}" stroke-width="2"/>
    <rect x="19" y="19" width="26" height="26" rx="6" fill="none" stroke="${colors.stroke}" stroke-width="1.2" opacity="0.32"/>
    <!-- 中心电力符号：改为更粗、更短的闪电，缩小时仍可辨识 -->
    <path d="M34 21L26.5 33H31L28.5 43L38 30.5H33.5L36.5 21Z" fill="white" opacity="0.98"/>
  </svg>`;
}

/**
 * 生成接头井图标 SVG - 圆形井盖 + 同心圆纹理
 */
function createJointSVG(colors: typeof NODE_COLORS.joint): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <defs>
      <radialGradient id="grad-j" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="${colors.glow}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${colors.primary}" stop-opacity="1"/>
      </radialGradient>
    </defs>
    <!-- 最外圆 -->
    <circle cx="32" cy="32" r="18" fill="url(#grad-j)" stroke="${colors.stroke}" stroke-width="1.5"/>
    <!-- 同心圆纹理 -->
    <circle cx="32" cy="32" r="12" fill="none" stroke="${colors.stroke}" stroke-width="0.8" opacity="0.5"/>
    <circle cx="32" cy="32" r="7" fill="none" stroke="${colors.stroke}" stroke-width="0.8" opacity="0.4"/>
    <circle cx="32" cy="32" r="3" fill="none" stroke="${colors.stroke}" stroke-width="0.8" opacity="0.3"/>
    <!-- 中心点 -->
    <circle cx="32" cy="32" r="2.5" fill="white" opacity="0.9"/>
    <!-- 十字标记 -->
    <line x1="32" y1="16" x2="32" y2="21" stroke="white" stroke-width="1" opacity="0.4"/>
    <line x1="32" y1="43" x2="32" y2="48" stroke="white" stroke-width="1" opacity="0.4"/>
    <line x1="16" y1="32" x2="21" y2="32" stroke="white" stroke-width="1" opacity="0.4"/>
    <line x1="43" y1="32" x2="48" y2="32" stroke="white" stroke-width="1" opacity="0.4"/>
  </svg>`;
}

/**
 * 生成用户站图标 SVG - 房屋建筑轮廓
 */
function createUserStationSVG(colors: typeof NODE_COLORS.user_station): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <defs>
      <linearGradient id="grad-u" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${colors.glow}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${colors.primary}" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <!-- 底座圆 -->
    <circle cx="32" cy="32" r="16" fill="url(#grad-u)" stroke="${colors.stroke}" stroke-width="1.5"/>
    <!-- 建筑轮廓：用高对比白色描边，避免缩小时出现“被切半”的错觉 -->
    <path d="M23 41V29l9-7 9 7v12" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.96"/>
    <path d="M28.5 41v-6h7v6" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/>
    <line x1="27" y1="31" x2="37" y2="31" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.9"/>
    <line x1="40.5" y1="27" x2="40.5" y2="41" stroke="white" stroke-width="2.2" stroke-linecap="round" opacity="0.92"/>
  </svg>`;
}

/**
 * 生成接地箱图标 SVG - 六边形 + 接地符号
 */
function createGroundingSVG(colors: typeof NODE_COLORS.grounding): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <defs>
      <linearGradient id="grad-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${colors.glow}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${colors.primary}" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <!-- 六边形主体 -->
    <polygon points="32,14 46,22 46,42 32,50 18,42 18,22" fill="url(#grad-g)" stroke="${colors.stroke}" stroke-width="1.5"/>
    <!-- 内部六边形 -->
    <polygon points="32,18 42,24 42,40 32,46 22,40 22,24" fill="none" stroke="${colors.stroke}" stroke-width="0.6" opacity="0.3"/>
    <!-- 接地符号 ⏚ -->
    <line x1="32" y1="20" x2="32" y2="34" stroke="white" stroke-width="2.5" opacity="0.9"/>
    <line x1="22" y1="34" x2="42" y2="34" stroke="white" stroke-width="2.5" opacity="0.9"/>
    <line x1="25" y1="39" x2="39" y2="39" stroke="white" stroke-width="2" opacity="0.7"/>
    <line x1="28" y1="44" x2="36" y2="44" stroke="white" stroke-width="1.5" opacity="0.5"/>
  </svg>`;
}

/**
 * 生成开关站图标 SVG - 方形 + 开关符号
 */
function createSwitchStationSVG(colors: typeof NODE_COLORS.switch_station): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <defs>
      <linearGradient id="grad-sw" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${colors.glow}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${colors.primary}" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <!-- 圆角方形主体 -->
    <rect x="16" y="16" width="32" height="32" rx="8" fill="url(#grad-sw)" stroke="${colors.stroke}" stroke-width="1.5"/>
    <!-- 开关符号 -->
    <circle cx="24" cy="38" r="3" fill="white" opacity="0.9"/>
    <circle cx="40" cy="24" r="3" fill="white" opacity="0.9"/>
    <line x1="26" y1="37" x2="38" y2="25" stroke="white" stroke-width="2.5" opacity="0.9"/>
    <!-- 连接点标记 -->
    <line x1="16" y1="38" x2="21" y2="38" stroke="white" stroke-width="1.5" opacity="0.6"/>
    <line x1="43" y1="24" x2="48" y2="24" stroke="white" stroke-width="1.5" opacity="0.6"/>
  </svg>`;
}

/**
 * SVG 转为 data URL
 */
function svgToDataUrl(svg: string): string {
  const encoded = encodeURIComponent(svg.replace(/\n\s*/g, ''));
  return `data:image/svg+xml,${encoded}`;
}

/** 图标映射配置 - deck.gl IconLayer 使用 */
export interface IconMappingEntry {
  url: string;
  width: number;
  height: number;
  anchorY: number;
}

// 预生成所有节点类型的图标 data URL
const ICON_URLS: Record<NodeType, string> = {
  substation: svgToDataUrl(createSubstationSVG(NODE_COLORS.substation)),
  joint: svgToDataUrl(createJointSVG(NODE_COLORS.joint)),
  switch_station: svgToDataUrl(createSwitchStationSVG(NODE_COLORS.switch_station)),
  user_station: svgToDataUrl(createUserStationSVG(NODE_COLORS.user_station)),
  grounding: svgToDataUrl(createGroundingSVG(NODE_COLORS.grounding)),
};

/** 获取节点图标 URL */
export function getNodeIconUrl(nodeType: NodeType): string {
  return ICON_URLS[nodeType] || ICON_URLS.joint;
}

/** 节点渲染尺寸配置 (像素) */
export const NODE_ICON_SIZES: Record<NodeType, number> = {
  substation: 52,
  switch_station: 36,
  joint: 30,
  user_station: 28,
  grounding: 28,
};

// 兼容旧接口 - 保留 NODE_ICONS 导出
export const NODE_ICONS: Record<NodeType, string> = {
  substation: '⚡',
  joint: '⬤',
  switch_station: '⏹',
  user_station: '🏭',
  grounding: '⏚',
};

/** 获取节点图标配置 (兼容旧代码) */
export function getNodeIconConfig(nodeType: NodeType, status: string) {
  const colors = NODE_COLORS[nodeType];
  const statusColors = STATUS_COLOR_MAP[status as keyof typeof STATUS_COLOR_MAP] || STATUS_COLOR_MAP.normal;

  return {
    icon: NODE_ICONS[nodeType],
    color: colors.primary,
    size: NODE_ICON_SIZES[nodeType],
    strokeColor: colors.stroke,
    strokeWidth: 2,
    statusFill: statusColors.fill,
    statusGlow: statusColors.glow,
  };
}
