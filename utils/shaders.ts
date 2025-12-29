import * as THREE from 'three';

/**
 * 自定义 GLSL 着色器集合
 * 用于高压电缆接头监测系统的高级视觉效果
 */

// ============================================
// 热力学着色器 - 根据温度显示颜色渐变
// ============================================
export const ThermalShader = {
  uniforms: {
    time: { value: 0.0 },
    temperature: { value: 0.0 },  // 0.0 = 冷 (蓝色), 1.0 = 热 (红色)
    baseColor: { value: new THREE.Color(0x222222) },
    pulseIntensity: { value: 0.3 },
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform float time;
    uniform float temperature;
    uniform vec3 baseColor;
    uniform float pulseIntensity;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    // 温度颜色映射：蓝 -> 青 -> 绿 -> 黄 -> 橙 -> 红
    vec3 temperatureToColor(float t) {
      vec3 cold = vec3(0.0, 0.3, 1.0);      // 蓝色
      vec3 cool = vec3(0.0, 0.8, 0.8);      // 青色
      vec3 warm = vec3(1.0, 0.8, 0.0);      // 黄色
      vec3 hot = vec3(1.0, 0.2, 0.0);       // 红色
      
      if (t < 0.33) {
        return mix(cold, cool, t * 3.0);
      } else if (t < 0.66) {
        return mix(cool, warm, (t - 0.33) * 3.0);
      } else {
        return mix(warm, hot, (t - 0.66) * 3.0);
      }
    }
    
    void main() {
      // 基础热力颜色
      vec3 thermalColor = temperatureToColor(temperature);
      
      // 添加脉冲波纹效果
      float pulse = sin(vPosition.x * 10.0 + time * 3.0) * 0.5 + 0.5;
      pulse *= sin(vPosition.y * 8.0 - time * 2.0) * 0.5 + 0.5;
      
      // 混合基础颜色和热力颜色
      vec3 finalColor = mix(baseColor, thermalColor, temperature);
      finalColor += thermalColor * pulse * pulseIntensity * temperature;
      
      // 边缘发光效果
      float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
      finalColor += thermalColor * fresnel * temperature * 0.5;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

// ============================================
// 能量流动着色器 - 电流沿电缆流动效果
// ============================================
export const EnergyFlowShader = {
  uniforms: {
    time: { value: 0.0 },
    flowSpeed: { value: 2.0 },
    flowColor: { value: new THREE.Color(0x00f3ff) },
    baseColor: { value: new THREE.Color(0x111111) },
    flowIntensity: { value: 0.8 },
    flowWidth: { value: 0.15 },
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform float time;
    uniform float flowSpeed;
    uniform vec3 flowColor;
    uniform vec3 baseColor;
    uniform float flowIntensity;
    uniform float flowWidth;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      // 计算流动位置
      float flow = fract(vUv.x * 3.0 - time * flowSpeed);
      
      // 创建多条流动光带
      float band1 = smoothstep(0.0, flowWidth, flow) * smoothstep(flowWidth * 2.0, flowWidth, flow);
      float band2 = smoothstep(0.0, flowWidth, fract(flow + 0.33)) * smoothstep(flowWidth * 2.0, flowWidth, fract(flow + 0.33));
      float band3 = smoothstep(0.0, flowWidth, fract(flow + 0.66)) * smoothstep(flowWidth * 2.0, flowWidth, fract(flow + 0.66));
      
      float flowMask = (band1 + band2 * 0.6 + band3 * 0.3) * flowIntensity;
      
      // 添加脉动效果
      flowMask *= 0.7 + 0.3 * sin(time * 5.0);
      
      vec3 finalColor = mix(baseColor, flowColor, flowMask);
      
      // 添加边缘高光
      float edge = pow(abs(vUv.y - 0.5) * 2.0, 0.5);
      finalColor += flowColor * (1.0 - edge) * 0.2 * flowMask;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

// ============================================
// 电树放电着色器 - 分支状放电效果
// ============================================
export const ElectricTreeShader = {
  uniforms: {
    time: { value: 0.0 },
    intensity: { value: 1.0 },
    treeColor: { value: new THREE.Color(0x00f2ff) },
    glowColor: { value: new THREE.Color(0x8844ff) },
    noiseScale: { value: 3.0 },
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform float time;
    uniform float intensity;
    uniform vec3 treeColor;
    uniform vec3 glowColor;
    uniform float noiseScale;
    
    varying vec2 vUv;
    
    // 简化的噪声函数
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    
    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
    
    void main() {
      vec2 uv = vUv - 0.5;
      
      // 创建放射状电树图案
      float angle = atan(uv.y, uv.x);
      float radius = length(uv);
      
      // 使用噪声创建分支效果
      float branches = fbm(vec2(angle * noiseScale, radius * 5.0 - time * 2.0));
      branches += fbm(vec2(angle * noiseScale * 2.0, radius * 8.0 + time * 1.5)) * 0.5;
      
      // 闪烁效果
      float flicker = 0.5 + 0.5 * sin(time * 15.0 + angle * 3.0);
      flicker *= 0.7 + 0.3 * sin(time * 23.0);
      
      // 从中心向外衰减
      float falloff = 1.0 - smoothstep(0.0, 0.5, radius);
      
      // 组合效果
      float tree = branches * falloff * flicker * intensity;
      tree = pow(tree, 1.5); // 增加对比度
      
      // 颜色混合
      vec3 color = mix(glowColor, treeColor, tree);
      float alpha = tree * 0.8;
      
      // 添加核心发光
      float coreGlow = exp(-radius * 8.0) * intensity;
      color += treeColor * coreGlow;
      alpha += coreGlow * 0.5;
      
      gl_FragColor = vec4(color, alpha);
    }
  `
};

// ============================================
// 扫描波着色器 - 环形扩散波纹效果
// ============================================
export const ScanWaveShader = {
  uniforms: {
    time: { value: 0.0 },
    waveColor: { value: new THREE.Color(0x00f3ff) },
    waveSpeed: { value: 1.0 },
    waveCount: { value: 3.0 },
    fadeDistance: { value: 2.0 },
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform float time;
    uniform vec3 waveColor;
    uniform float waveSpeed;
    uniform float waveCount;
    uniform float fadeDistance;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      float dist = length(vPosition.xz);
      
      // 创建多个波纹
      float wave = 0.0;
      for (float i = 0.0; i < 3.0; i++) {
        float offset = i / waveCount;
        float wavePos = fract(time * waveSpeed * 0.5 + offset);
        float waveDist = wavePos * fadeDistance;
        
        float ring = 1.0 - abs(dist - waveDist) * 10.0;
        ring = max(0.0, ring);
        ring *= 1.0 - wavePos; // 淡出
        
        wave += ring;
      }
      
      vec3 color = waveColor * wave;
      float alpha = wave * 0.6;
      
      gl_FragColor = vec4(color, alpha);
    }
  `
};

// ============================================
// 全息显示着色器 - 科幻风格的全息效果
// ============================================
export const HologramShader = {
  uniforms: {
    time: { value: 0.0 },
    hologramColor: { value: new THREE.Color(0x00f3ff) },
    scanLineIntensity: { value: 0.3 },
    glitchIntensity: { value: 0.1 },
    fresnelPower: { value: 2.0 },
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,

  fragmentShader: /* glsl */ `
    uniform float time;
    uniform vec3 hologramColor;
    uniform float scanLineIntensity;
    uniform float glitchIntensity;
    uniform float fresnelPower;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    void main() {
      // 菲涅尔边缘发光
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), fresnelPower);
      
      // 扫描线效果
      float scanLine = sin(vUv.y * 200.0 + time * 10.0) * 0.5 + 0.5;
      scanLine = pow(scanLine, 8.0) * scanLineIntensity;
      
      // 故障/闪烁效果
      float glitch = step(0.99 - glitchIntensity, random(vec2(time * 0.1, floor(vUv.y * 20.0))));
      
      // 组合效果
      float alpha = fresnel * 0.8 + scanLine + glitch * 0.3;
      alpha = clamp(alpha, 0.0, 1.0);
      
      vec3 color = hologramColor * (1.0 + scanLine + fresnel * 0.5);
      
      // 添加微妙的颜色变化
      color.r += sin(time * 2.0) * 0.1;
      color.b += cos(time * 1.5) * 0.1;
      
      gl_FragColor = vec4(color, alpha * 0.7);
    }
  `
};

/**
 * 创建使用自定义着色器的材质
 */
export function createThermalMaterial(temperature: number = 0.0): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...ThermalShader.uniforms,
      temperature: { value: temperature },
    },
    vertexShader: ThermalShader.vertexShader,
    fragmentShader: ThermalShader.fragmentShader,
    side: THREE.DoubleSide,
  });
}

export function createEnergyFlowMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { ...EnergyFlowShader.uniforms },
    vertexShader: EnergyFlowShader.vertexShader,
    fragmentShader: EnergyFlowShader.fragmentShader,
    transparent: true,
  });
}

export function createElectricTreeMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { ...ElectricTreeShader.uniforms },
    vertexShader: ElectricTreeShader.vertexShader,
    fragmentShader: ElectricTreeShader.fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

export function createScanWaveMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { ...ScanWaveShader.uniforms },
    vertexShader: ScanWaveShader.vertexShader,
    fragmentShader: ScanWaveShader.fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

export function createHologramMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { ...HologramShader.uniforms },
    vertexShader: HologramShader.vertexShader,
    fragmentShader: HologramShader.fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}
