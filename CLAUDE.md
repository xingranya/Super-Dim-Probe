# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based application with two distinct parts:
1. **Visualization App** (`/`) - A 3D cable inspection probe simulation using Three.js with physics-based fault visualization
2. **SmartTech Backend** (`/smart-tech/*`) - A dashboard/management system for XLPE cable monitoring

The app uses **React 19**, **Vite**, **TypeScript**, and loads dependencies via **ESM CDN** (esm.sh) directly in the browser.

## Commands

```bash
npm install     # Install dependencies
npm run dev     # Start dev server on port 3000
npm run build   # Production build
npm run preview # Preview production build
```

**Environment Variables:** Create `.env.local` with `GEMINI_API_KEY` for AI features.

## Architecture

### Dual-App Structure

```
/                   → VisualizationPage (3D simulation)
/smart-tech/*       → SmartTechApp (dashboard system)
```

### Key Files

- `src/App.tsx` - Root router with two sub-apps
- `src/smart-tech/SmartTechApp.tsx` - SmartTech routing and layout
- `src/pages/VisualizationPage.tsx` - Main 3D visualization orchestrator
- `src/components/ThreeScene.tsx` - Core 3D scene with cable, sensors, shaders
- `src/components/CableNetwork3D.tsx` - 3D cable network overview
- `src/services/geminiService.ts` - Gemini AI integration

### 3D Scene Architecture

The ThreeScene component is the core 3D rendering engine:
- Uses **OrbitControls** for camera manipulation
- **EffectComposer** with **UnrealBloomPass** for post-processing
- Custom **Canvas textures** for sensor display screens
- **Shader materials** for fault effects (thermal, electric tree, energy flow)
- Performance optimizations: pixel ratio capping, update frequency throttling, conditional rendering via `active` prop

### View Modes in VisualizationPage

Four mutually exclusive views managed by state:
1. `network` - 3D cable network overview (default)
2. `dashboard` - Sensor monitoring dashboard
3. `sensorDetail` - Individual sensor 3D view with HUD
4. `signalFlow` - Signal flow demonstration modal

### SmartTech Dashboard Pages

Located in `src/smart-tech/pages/dashboard/`:
- `XLPEMonitoringPage.tsx` - Main XLPE monitoring overview
- `XLPEAnalysisPage.tsx` - XLPE detailed analysis
- `ElectricalMonitoringPage.tsx` - Electrical monitoring
- `AcousticMonitoringPage.tsx` - Acoustic monitoring
- `ThermalMonitoringPage.tsx` - Thermal monitoring
- `VibrationMonitoringPage.tsx` - Vibration monitoring

### Technology Stack

- **React 19** with functional components and hooks
- **React Router v7** for routing
- **Three.js r182** for 3D rendering
- **Tailwind CSS** via CDN (configured in index.html)
- **ECharts** and **Recharts** for data visualization
- **Google Gemini API** for AI diagnostics
- **Lucide React** for icons

### Performance Considerations

- 3D rendering uses `active` prop to pause when not visible
- Canvas texture updates throttled (every 5-15 frames)
- Pixel ratio capped at 1.5
- Body styles (`overflow`, `touchAction`) managed per-page for 3D vs dashboard modes
