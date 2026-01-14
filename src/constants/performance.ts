/**
 * 性能优化配置常量
 * 集中管理所有性能相关的参数，便于调优
 */

export const PERFORMANCE_CONFIG = {
  // 渲染器配置
  RENDERER: {
    MAX_PIXEL_RATIO: 1.5, // 限制像素比提升性能
    ENABLE_STENCIL: false, // 禁用模板缓冲
    SHADOW_MAP_TYPE: 'PCFSoft' as const, // 阴影类型
  },

  // 后处理配置
  POST_PROCESSING: {
    BLOOM_STRENGTH: {
      DEFAULT: 0.6,
      OVERHEAT: 1.0,
      TREEING: 0.8,
    },
    BLOOM_RADIUS: 0.3,
    BLOOM_THRESHOLD: 0.85,
  },

  // 粒子系统配置
  PARTICLES: {
    COUNT: 150, // 从200降低到150
    EMISSION_RATE: 0.03,
    UPDATE_THRESHOLD: 3, // 每3帧更新一次
  },

  // 更新频率配置
  UPDATE_INTERVALS: {
    SENSOR_DATA: 15, // 每15帧更新一次传感器数据
    SCREEN_DISPLAY: 10, // 每10帧更新一次屏幕显示
    LED_ANIMATION: 3, // 每3帧更新一次LED动画
    ANTENNA_BLINK: 3, // 每3帧更新一次天线闪烁
  },

  // 传感器数据防抖阈值
  SENSOR_THRESHOLDS: {
    TEMPERATURE: 0.5, // 温度变化阈值（°C）
    PARTIAL_DISCHARGE: 5, // 局部放电阈值（pC）
    VOLTAGE: 0.1, // 电压变化阈值（kV）
    CURRENT: 1, // 电流变化阈值（A）
  },

  // 纹理配置
  TEXTURE: {
    SIZES: {
      HIGH: 512,
      MEDIUM: 256,
      LOW: 128,
    },
    ENABLE_CACHE: true,
  },

  // 场景配置
  SCENE: {
    FOG_NEAR: 5,
    FOG_FAR: 25,
    CAMERA_FOV: 35,
    CAMERA_NEAR: 0.1,
    CAMERA_FAR: 100,
  },

  // 性能监控配置
  MONITORING: {
    ENABLED_IN_DEV: true,
    FPS_TARGET: 60,
    FPS_WARNING: 30,
    MEMORY_WARNING_MB: 250,
  },
} as const;

/**
 * 几何体复用配置
 * 避免重复创建相同的几何体
 */
export const GEOMETRY_CACHE_CONFIG = {
  CYLINDER: {
    radius: 0.26,
    length: 1.2,
    segments: 64,
  },
  SPHERE: {
    radius: 0.015,
    widthSegments: 16,
    heightSegments: 16,
  },
  LED_SPHERE: {
    radius: 0.015,
    segments: 12, // 降低LED球体分段数
  },
} as const;

/**
 * 动画配置
 */
export const ANIMATION_CONFIG = {
  // 打字机效果
  TYPEWRITER: {
    CHARS_PER_FRAME: 3,
    FRAME_TIME_MS: 16, // 约60fps
  },

  // 时间戳更新频率（秒）
  TIMESTAMP_UPDATE_INTERVAL: 1,
} as const;
