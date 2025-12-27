import { GoogleGenAI } from "@google/genai";
import { FaultMode, MODES, SensorData } from '../types';

// Lazy initialization prevents crash on load if env is missing
let ai: GoogleGenAI | null = null;

const getAIClient = () => {
  if (!ai) {
    // Fallback to empty string if undefined to prevent crash, user will get auth error which is better than white screen
    const key = process.env.API_KEY || ''; 
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
};

export const analyzeFault = async (mode: FaultMode, sensorData: SensorData): Promise<string> => {
  const modeConfig = MODES.find(m => m.id === mode);
  const modeName = modeConfig ? modeConfig.name : "Unknown Fault";
  
  let readingString = "";
  if (mode === FaultMode.XLPE_TREEING) readingString = `PD Level=${sensorData.pd.toFixed(0)} pC`;
  else if (mode === FaultMode.PVC_DAMAGE) readingString = `Vibration=${sensorData.vib.toFixed(2)} g`;
  else if (mode === FaultMode.JOINT_OVERHEAT) readingString = `Core Temp=${sensorData.temp.toFixed(1)} °C`;
  else if (mode === FaultMode.WATER_TREEING) readingString = `Dielectric Loss=${sensorData.loss.toFixed(2)} %`;

  const prompt = `
    Role: Expert Electrical Engineer specializing in High Voltage Cable Diagnostics.
    Task: Analyze the provided simulation sensor data and generate a fault diagnosis report.
    
    Context:
    - Fault Type: ${modeName}
    - Sensor Reading: ${readingString}
    
    Output Requirements:
    - Language: Chinese (Simplified)
    - Tone: Professional, Technical, Concise.
    - Format: Markdown (Use headers ###, bold **, bullet points -).
    - Do NOT wrap the output in markdown code blocks.
    
    Structure:
    ### 1. 故障机理
    [Briefly explain the microscopic physical process (e.g., electrical treeing initiation, thermal degradation).]
    
    ### 2. 发展趋势
    [Predict the consequence if untreated (e.g., insulation breakdown, flashover).]
    
    ### 3. 处理建议
    [Provide maintenance actions based on IEC standards (e.g., localization, partial replacement, further testing).]
    
    Constraint: Keep the total response concise (under 200 words).
  `;

  try {
    const client = getAIClient();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-preview-09-2025',
      contents: prompt,
    });
    
    return response.text || "诊断完成，未返回详细文本。";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    if (error.message?.includes("API_KEY")) {
       return "配置错误：未检测到 API Key。请在构建环境中设置 process.env.API_KEY。";
    }
    
    return "错误：无法连接到 AI 诊断服务，请检查网络配置。";
  }
};