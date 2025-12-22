import React from 'react';
import { EngineInputs } from '../types';

interface Props {
  inputs: EngineInputs;
  onChange: (newInputs: EngineInputs) => void;
  onCalculate: () => void;
}

const SliderInput: React.FC<{
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  className?: string;
}> = ({ label, value, unit, min, max, step, onChange, className }) => (
  <div className={`mb-3 ${className}`}>
    <div className="flex justify-between items-center mb-1">
      <label className="text-[11px] font-medium text-slate-600">{label}</label>
      <span className="text-[11px] font-bold text-slate-800 font-mono">{value.toFixed(step < 0.01 ? 3 : 2)} <span className="text-slate-400 font-normal">{unit}</span></span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500"
    />
  </div>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-3 mt-6 first:mt-2 pb-1 border-b border-slate-100 col-span-full">
    <span className="text-slate-500">{icon}</span>
    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">{title}</h3>
  </div>
);

export const InputSection: React.FC<Props> = ({ inputs, onChange, onCalculate }) => {
  const update = (key: keyof EngineInputs, value: number) => {
    onChange({ ...inputs, [key]: value });
  };

  return (
    <div className="flex flex-col lg:h-full h-auto bg-white relative">
      {/* 标题区域*/}
      <div className="sticky top-0 z-40 lg:static p-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm lg:bg-slate-50/50">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">AeroEngine <span className="text-blue-600 font-light">民航版</span></h1>
                <p className="text-xs text-slate-400 mt-1">航空发动机循环分析与优化</p>
            </div>
            <a 
                href="https://aero.systemwow.top" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2 py-1.5 mt-0.5 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-all group"
                title="跳转到混流版"
            >
                <span className="text-[10px] font-bold tracking-tight">混流版</span>
                <svg className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            </a>
        </div>
      </div>

      {/* 滑动输入 */}
      {/* 
          移动端和桌面端均优化输入区域
      */}
      <div className="flex-grow lg:overflow-y-auto overflow-visible px-4 py-2 custom-scrollbar">
        
        {/* 平板显示优化 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-x-6">

            {/* 飞行条件 */}
            <SectionHeader 
            title="飞行条件 (Flight Conditions)" 
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>} 
            />
            <SliderInput label="高度 (H)" value={inputs.altitude} unit="km" min={0} max={20} step={0.5} onChange={v => update('altitude', v)} />
            <SliderInput label="马赫数 (Ma)" value={inputs.mach} unit="" min={0} max={3.0} step={0.05} onChange={v => update('mach', v)} />
            <SliderInput label="设计流量 (W)" value={inputs.massFlow} unit="kg/s" min={10} max={2000} step={10} onChange={v => update('massFlow', v)} />

            {/* 核心循环参数 */}
            <SectionHeader 
            title="核心循环 (Cycle Parameters)" 
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} 
            />
            <SliderInput label="涵道比 (B)" value={inputs.bypassRatio} unit="" min={0} max={15} step={0.1} onChange={v => update('bypassRatio', v)} />
            <SliderInput label="风扇压比 (FPR)" value={inputs.fanPressureRatio} unit="" min={1.1} max={4.0} step={0.05} onChange={v => update('fanPressureRatio', v)} />
            <SliderInput label="总压比 (OPR)" value={inputs.overallPressureRatio} unit="" min={10} max={60} step={1} onChange={v => update('overallPressureRatio', v)} />
            <SliderInput label="涡轮前温度 (Tt4)" value={inputs.turbineEntryTemp} unit="K" min={1000} max={2200} step={10} onChange={v => update('turbineEntryTemp', v)} />

            {/* 杂项参数 */}
            <SectionHeader 
            title="杂项参数 (Efficiencies & Losses)" 
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} 
            />
            
            <div className="bg-slate-50 p-3 rounded border border-slate-100 mb-2 col-span-full">
                <div className="text-[10px] text-slate-400 font-bold mb-2 uppercase">部件绝热效率 (Adiabatic Eff)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-4">
                    <SliderInput label="风扇 (Fan)" value={inputs.efficiencyFan} min={0.8} max={0.99} step={0.01} onChange={v => update('efficiencyFan', v)} />
                    <SliderInput label="高压压气机 (HPC)" value={inputs.efficiencyHPC} min={0.8} max={0.99} step={0.01} onChange={v => update('efficiencyHPC', v)} />
                    <SliderInput label="高压涡轮 (HPT)" value={inputs.efficiencyHPT} min={0.8} max={0.99} step={0.01} onChange={v => update('efficiencyHPT', v)} />
                    <SliderInput label="低压涡轮 (LPT)" value={inputs.efficiencyLPT} min={0.8} max={0.99} step={0.01} onChange={v => update('efficiencyLPT', v)} />
                </div>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-100 col-span-full">
                <div className="text-[10px] text-slate-400 font-bold mb-2 uppercase">总压恢复系数 (Pressure Recovery)</div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-4">
                    <SliderInput label="进气道 (Inlet)" value={inputs.pressureRecoveryInlet} min={0.8} max={1.0} step={0.005} onChange={v => update('pressureRecoveryInlet', v)} />
                    <SliderInput label="燃烧室 (Burner)" value={inputs.pressureRecoveryBurner} min={0.9} max={0.99} step={0.005} onChange={v => update('pressureRecoveryBurner', v)} />
                    <SliderInput label="喷管 (Nozzle)" value={inputs.pressureRecoveryNozzle} min={0.9} max={0.99} step={0.005} onChange={v => update('pressureRecoveryNozzle', v)} />
                </div>
            </div>

        </div>
      </div>

      {/* Footer Action - Sticky bottom on mobile for easy access */}
      <div className="sticky bottom-0 z-40 lg:static p-4 border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={onCalculate}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
          开始计算 (Calculate)
        </button>
      </div>
    </div>
  );
};