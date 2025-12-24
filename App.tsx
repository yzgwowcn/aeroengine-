import React, { useState, useRef } from 'react';
import { EngineInputs } from './types';
import { calculateCycle, calculateTrends, calculateEnvelope, calculateFanTrends, calculateBypassTrends } from './services/engineService';
import { InputSection } from './components/InputSection';
import { ResultsSection } from './components/ResultsSection';

// 默认参数设置：参考 GE90-115B 等现代大涵道比涡扇发动机的巡航工况
// 参考数据: 高度~10700m (35000ft), Ma 0.83, 巡航推力~70-90kN, OPR~40-42, BPR~9
const DEFAULT_INPUTS: EngineInputs = {
  altitude: 10.7, // 典型巡航高度 (km)
  mach: 0.83,     // 典型巡航马赫数
  massFlow: 1350.0, // 典型起飞最大流量 (kg/s)
  
  bypassRatio: 9.0, // 高涵道比
  overallPressureRatio: 42.0, // 高总压比
  fanPressureRatio: 1.65, 
  turbineEntryTemp: 1650, // 巡航 TIT (低于起飞时的 1800K+)
  
  heatingValue: 43.1, // 航空煤油 Jet A-1 热值 (MJ/kg)
  
  // 部件绝热效率 (采用现代技术水平估值)
  efficiencyFan: 0.92,
  efficiencyLPC: 0.90,
  efficiencyHPC: 0.90,
  efficiencyBurner: 0.995,
  efficiencyHPT: 0.92,
  efficiencyLPT: 0.93,
  
  // 总压恢复系数
  pressureRecoveryInlet: 0.98,
  pressureRecoveryBurner: 0.96,
  pressureRecoveryNozzle: 0.99,
  
  // 机械效率
  mechEfficiencyHigh: 0.99,
  mechEfficiencyLow: 0.99,
};

function App() {
  const [inputs, setInputs] = useState<EngineInputs>(DEFAULT_INPUTS);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // 初始化计算状态，确保页面加载时有数据
  const [calculationData, setCalculationData] = useState(() => ({
    cycleResult: calculateCycle(DEFAULT_INPUTS),
    trendData: calculateTrends(DEFAULT_INPUTS),
    fanTrendData: calculateFanTrends(DEFAULT_INPUTS),
    bypassTrendData: calculateBypassTrends(DEFAULT_INPUTS),
    envelopeData: calculateEnvelope(DEFAULT_INPUTS)
  }));

  // 点击“开始计算”按钮时的处理函数
  const handleCalculate = () => {
    const cycleResult = calculateCycle(inputs);
    const trendData = calculateTrends(inputs);
    const fanTrendData = calculateFanTrends(inputs);
    const bypassTrendData = calculateBypassTrends(inputs);
    const envelopeData = calculateEnvelope(inputs);
    setCalculationData({ cycleResult, trendData, fanTrendData, bypassTrendData, envelopeData });

    // 移动端体验优化：点击计算后自动滚动到结果区域
    if (window.innerWidth < 1024 && resultsRef.current) {
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-[#F3F4F6] font-sans">
        {/* 左侧边栏：参数输入 
            移动端：自然流布局，位于顶部
            桌面端：固定侧边栏
        */}
        <aside className="w-full lg:w-80 flex-shrink-0 shadow-xl z-30 relative lg:h-full border-b lg:border-b-0 lg:border-r border-slate-200 bg-white">
            <InputSection 
                inputs={inputs} 
                onChange={setInputs} 
                onCalculate={handleCalculate}
            />
        </aside>

        {/* 主内容区：结果展示 
            移动端：位于下方，页面级滚动
            桌面端：独立滚动区域
        */}
        <main className="flex-grow lg:overflow-y-auto custom-scrollbar bg-slate-50">
            <div ref={resultsRef} className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6 pb-20 lg:pb-6">
                <ResultsSection 
                  result={calculationData.cycleResult} 
                  inputs={inputs} 
                  trendData={calculationData.trendData}
                  fanTrendData={calculationData.fanTrendData}
                  bypassTrendData={calculationData.bypassTrendData}
                  envelopeData={calculationData.envelopeData}
                />
            </div>
        </main>
        
        {/* 悬浮图标 - 仅桌面端显示，移动端避免遮挡内容 */}
        <div className="fixed bottom-6 right-6 z-50 hidden lg:flex">
             <div className="w-12 h-12 bg-blue-600 rounded-full text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors cursor-default select-none" title="AeroEngine App">
                <span className="font-bold text-lg">AE</span>
             </div>
        </div>
    </div>
  );
}

export default App;