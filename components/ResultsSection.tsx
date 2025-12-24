import React, { useState } from 'react';
import { CalculationResult, EngineInputs, ChartPoint, EnvelopePoint, FanTrendPoint, BypassTrendPoint } from '../types';
import { StationChart } from './StationChart';
import { PerformanceCharts } from './PerformanceCharts';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ZAxis, ReferenceLine, Cell } from 'recharts';

interface Props {
  result: CalculationResult;
  inputs: EngineInputs;
  trendData: ChartPoint[];
  fanTrendData: FanTrendPoint[];
  bypassTrendData: BypassTrendPoint[];
  envelopeData: EnvelopePoint[];
}

const MetricCard: React.FC<{ 
  title: string; 
  value: string; 
  unit?: string; 
  subValue?: string;
  extraInfo?: string; // 新增额外信息字段
  icon?: React.ReactNode;
}> = ({ title, value, unit, subValue, extraInfo, icon }) => (
  <div className="bg-white p-4 lg:p-5 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden hover:shadow-md transition-shadow group">
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs lg:text-sm font-semibold text-slate-500">{title}</span>
      <span className="text-slate-300 group-hover:text-blue-500 transition-colors scale-75 lg:scale-100 origin-top-right">{icon}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">{value}</span>
      {unit && <span className="text-xs lg:text-sm text-slate-500 font-medium">{unit}</span>}
    </div>
    <div className="mt-2 flex flex-col gap-0.5">
      {subValue && <span className="text-xs text-slate-400">{subValue}</span>}
      {extraInfo && <span className="text-[10px] text-slate-400 font-mono opacity-80">{extraInfo}</span>}
    </div>
  </div>
);

// Custom Rect Shape for high-res heatmap tiling
const HeatmapRect = (props: any) => {
    const { cx, cy, fill } = props;
    const w = 18; 
    const h = 12;
    return <rect x={cx - w/2} y={cy - h/2} width={w} height={h} fill={fill} shapeRendering="crispEdges" />;
};

const FlightEnvelopeHeatmap: React.FC<{ data: EnvelopePoint[], currentMach: number, currentAlt: number }> = ({ data, currentMach, currentAlt }) => {
    // Find min/max SFC for color scaling
    const sfcs = data.map(d => d.sfc);
    const minSfc = Math.min(...sfcs);
    const maxSfc = Math.max(...sfcs);

    // Simple color interpolation: Blue (Best) -> Green -> Yellow -> Red (Worst)
    const getColor = (sfc: number) => {
        const t = (sfc - minSfc) / (maxSfc - minSfc || 1);
        if (t < 0.25) return `rgb(0, ${Math.floor(t*4*255)}, 255)`; // Blue to Cyan
        if (t < 0.5) return `rgb(0, 255, ${Math.floor((0.5-t)*4*255)})`; // Cyan to Green
        if (t < 0.75) return `rgb(${Math.floor((t-0.5)*4*255)}, 255, 0)`; // Green to Yellow
        return `rgb(255, ${Math.floor((1-t)*4*255)}, 0)`; // Yellow to Red
    };

    return (
        <div className="h-[350px] md:h-[500px] w-full p-2 lg:p-4 flex flex-col">
            <div className="flex justify-between items-center mb-2 px-2">
                 <div className="text-[10px] lg:text-xs text-slate-500 font-medium">
                    <span className="inline-block w-2 h-2 lg:w-3 lg:h-3 bg-blue-500 mr-1 rounded-sm align-middle"></span>低 SFC
                    <span className="inline-block w-2 h-2 lg:w-3 lg:h-3 bg-green-500 ml-2 lg:ml-3 mr-1 rounded-sm align-middle"></span>中
                    <span className="inline-block w-2 h-2 lg:w-3 lg:h-3 bg-red-500 ml-2 lg:ml-3 mr-1 rounded-sm align-middle"></span>高 SFC
                 </div>
                 <div className="text-[10px] lg:text-xs text-slate-400">分辨率: 50x40</div>
            </div>
             <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                        type="number" 
                        dataKey="mach" 
                        name="Mach" 
                        label={{ value: '马赫数 (Ma)', position: 'insideBottom', offset: -10 }} 
                        domain={[0, 2.5]} 
                    />
                    <YAxis 
                        type="number" 
                        dataKey="altitude" 
                        name="Altitude" 
                        label={{ value: '高度 (km)', angle: -90, position: 'insideLeft' }} 
                        domain={[0, 20]} 
                    />
                    <RechartsTooltip 
                        cursor={{ strokeDasharray: '3 3' }} 
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-white/95 p-3 border border-slate-200 rounded-lg text-xs shadow-xl backdrop-blur-sm z-50">
                                        <p className="font-semibold text-slate-700 mb-1">Ma {data.mach?.toFixed(2)} / Alt {data.altitude?.toFixed(1)} km</p>
                                        {data.sfc !== undefined && (
                                            <>
                                            <p className="font-bold text-blue-600 text-sm">SFC: {data.sfc.toFixed(4)} <span className="text-[10px] font-normal text-slate-400">kg/(N·h)</span></p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">≈ {(data.sfc / 0.10197).toFixed(3)} lb/(lbf·h)</p>
                                            <p className="font-medium text-slate-600 mt-1 border-t border-slate-100 pt-1">推力 Fn: {(data.thrust / 1000).toFixed(1)} kN</p>
                                            </>
                                        )}
                                        {data.sfc === undefined && (
                                            <p className="text-slate-500 italic mt-1">当前设计点 (Current Point)</p>
                                        )}
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    
                    {/* The Heatmap Rectangles */}
                    <Scatter data={data} shape={<HeatmapRect />}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getColor(entry.sfc)} />
                        ))}
                    </Scatter>

                    {/* Current Operating Point (On top) */}
                    <Scatter 
                        data={[{ mach: currentMach, altitude: currentAlt }]} 
                        fill="black" 
                        shape={(props: any) => {
                            const { cx, cy } = props;
                            if (!cx || !cy) return null;
                            return (
                                <g style={{pointerEvents: 'none'}}>
                                    <circle cx={cx} cy={cy} r={8} fill="white" fillOpacity={0.2} stroke="black" strokeWidth={2} />
                                    <circle cx={cx} cy={cy} r={3} fill="#f59e0b" stroke="none" />
                                    <line x1={cx-12} y1={cy} x2={cx+12} y2={cy} stroke="black" strokeWidth={1} />
                                    <line x1={cx} y1={cy-12} x2={cx} y2={cy+12} stroke="black" strokeWidth={1} />
                                </g>
                            );
                        }}
                        name="当前点"
                    />

                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};

export const ResultsSection: React.FC<Props> = ({ result, inputs, trendData, fanTrendData, bypassTrendData, envelopeData }) => {
  const [activeTab, setActiveTab] = useState<'station' | 'optimization' | 'envelope'>('station');
  const { specificThrust, sfc, thrust, overallEfficiency, fanPressureRatio, hpcPressureRatio, isValid } = result.performance;

  // 单位转换辅助显示
  const sfcImperial = (sfc / 0.10197).toFixed(3); // lb/(lbf·h)
  const sfcMilitary = (sfc * 1000 / 3.6).toFixed(1); // g/(kN·s)

  if (!isValid) {
      return (
          <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-center text-red-800">
              <h2 className="text-xl font-bold mb-2">循环参数无效</h2>
              <p>当前输入的循环参数导致物理上不可能的工况。</p>
          </div>
      )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <MetricCard 
          title="单位推力 (Fs)" 
          value={specificThrust.toFixed(1)} 
          unit="N/(kg/s)"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        />
        <MetricCard 
          title="耗油率 (SFC)" 
          value={sfc.toFixed(4)} 
          unit="kg/(N·h)"
          extraInfo={`≈ ${sfcImperial} lb/(lbf·h) | ${sfcMilitary} g/(kN·s)`}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <MetricCard 
          title="净推力 (Fn)" 
          value={(thrust / 1000).toFixed(1)} 
          unit="kN"
          subValue={`推进效率: ${(result.performance.propulsiveEfficiency*100).toFixed(1)}%`}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <MetricCard 
          title="总压比 (OPR)" 
          value={inputs.overallPressureRatio.toFixed(2)} 
          subValue={`风扇: ${fanPressureRatio.toFixed(1)} × 高压: ${hpcPressureRatio.toFixed(2)}`}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
        />
      </div>

      {/* Main Analysis Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 min-h-[400px] lg:min-h-[550px]">
        
        {/* Tabs inside Card - Horizontal Scrollable on mobile */}
        <div className="flex border-b border-slate-100 px-4 lg:px-6 pt-4 gap-6 overflow-x-auto no-scrollbar whitespace-nowrap">
            <button 
                onClick={() => setActiveTab('station')}
                className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors flex-shrink-0 ${activeTab === 'station' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                截面分析 (Station)
            </button>
            <button 
                onClick={() => setActiveTab('optimization')}
                className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors flex-shrink-0 ${activeTab === 'optimization' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
            >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                 循环优化 (Optimization)
            </button>
             <button 
                onClick={() => setActiveTab('envelope')}
                className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors flex-shrink-0 ${activeTab === 'envelope' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
            >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                 飞行包线 (Envelope)
            </button>
        </div>

        <div className="p-4 lg:p-6">
            {activeTab === 'station' && (
                <>
                    <h3 className="text-base lg:text-lg font-bold text-slate-800 mb-2">热力学截面参数分析</h3>
                    <StationChart stations={result.stations} />
                    
                    {/* Data Grid for Stations */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-3 mt-4 lg:mt-8">
                        {result.stations.map((s, i) => (
                            <div key={i} className="border border-slate-100 rounded-lg p-2 lg:p-3 text-center bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all">
                                <div className="text-[10px] lg:text-xs font-semibold text-slate-500 mb-1">截面 {s.label}</div>
                                <div className="text-xs lg:text-sm font-bold text-slate-800">{(s.pressure/1000).toFixed(0)} <span className="text-[10px] font-normal text-slate-400">kPa</span></div>
                                <div className="text-[10px] lg:text-xs text-slate-400">{s.temp.toFixed(0)} K</div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {activeTab === 'optimization' && (
                <div className="h-full">
                     <PerformanceCharts 
                        trendData={trendData} 
                        fanTrendData={fanTrendData}
                        bypassTrendData={bypassTrendData}
                        inputs={inputs} 
                     />
                </div>
            )}

            {activeTab === 'envelope' && (
                <div className="h-full">
                     <h3 className="text-base lg:text-lg font-bold text-slate-800 mb-2">飞行包线性能热力图 (SFC Heatmap)</h3>
                     <FlightEnvelopeHeatmap data={envelopeData} currentMach={inputs.mach} currentAlt={inputs.altitude} />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};