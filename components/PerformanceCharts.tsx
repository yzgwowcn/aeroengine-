import React, { useState } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';
import { ChartPoint, FanTrendPoint, BypassTrendPoint, EngineInputs } from '../types';

interface Props {
  trendData: ChartPoint[];
  fanTrendData: FanTrendPoint[];
  bypassTrendData: BypassTrendPoint[];
  inputs: EngineInputs;
}

export const PerformanceCharts: React.FC<Props> = ({ trendData, fanTrendData, bypassTrendData, inputs }) => {
  const [chartType, setChartType] = useState<'opr' | 'fpr' | 'bpr'>('fpr');

  let data: any[] = [];
  let xKey = '';
  let xLabel = '';
  let currentVal = 0;

  // 根据当前选择的图表类型加载数据
  switch (chartType) {
    case 'opr':
        data = trendData;
        xKey = 'opr';
        xLabel = '总压比 (OPR)';
        currentVal = inputs.overallPressureRatio;
        break;
    case 'fpr':
        data = fanTrendData;
        xKey = 'fpr';
        xLabel = '风扇压比 (FPR)';
        currentVal = inputs.fanPressureRatio;
        break;
    case 'bpr':
        data = bypassTrendData;
        xKey = 'bpr';
        xLabel = '涵道比 (BPR)';
        currentVal = inputs.bypassRatio;
        break;
  }

  // 寻找最接近当前输入值的点，用于在图表上标记
  const closestPoint = data.reduce((prev, curr) => {
    return (Math.abs(curr[xKey] - currentVal) < Math.abs(prev[xKey] - currentVal) ? curr : prev);
  }, data[0] || {});

  // 判断当前值是否在数据范围内，决定是否显示标记点
  const showDots = data.length > 0 && Math.abs(closestPoint[xKey] - currentVal) < (chartType === 'bpr' ? 1.0 : 0.5);

  // 定义颜色常量，保持高级感和一致性
  const COLOR_THRUST = "#2563eb"; // Blue 600 - 与主色调一致，代表推力/做功
  const COLOR_SFC = "#ea580c";    // Orange 600 - 鲜明对比，代表消耗/热量

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col h-[520px]">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="text-center sm:text-left">
             <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                循环参数优化分析
             </h3>
             <p className="text-xs text-slate-400 mt-1">探究 OPR、FPR、BPR 对发动机单位推力和耗油率的影响</p>
        </div>
        
        {/* 分段控制器风格的切换按钮 */}
        <div className="flex bg-slate-100/80 p-1 rounded-lg border border-slate-200/50">
            {[
                { id: 'fpr', label: '风扇压比' },
                { id: 'bpr', label: '涵道比' },
                { id: 'opr', label: '总压比' }
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setChartType(tab.id as any)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                        chartType === tab.id 
                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
      </div>
      
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            {/* 网格线淡化处理，仅保留水平线 */}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            
            <XAxis 
              dataKey={xKey} 
              type="number"
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              label={{ value: xLabel, position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 11 }}
              height={50}
            />

            {/* 左侧Y轴: 单位推力 */}
            <YAxis 
              yAxisId="left"
              orientation="left"
              stroke={COLOR_THRUST}
              tick={{ fill: COLOR_THRUST, fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={60}
              domain={['auto', 'auto']}
              label={{ value: '单位推力 Fs (N·s/kg)', angle: -90, position: 'insideLeft', fill: COLOR_THRUST, fontSize: 11, offset: 10 }}
            />

            {/* 右侧Y轴: 耗油率 */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke={COLOR_SFC}
              tick={{ fill: COLOR_SFC, fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={60}
              domain={['auto', 'auto']}
              label={{ value: '耗油率 SFC (kg/(N·h))', angle: 90, position: 'insideRight', fill: COLOR_SFC, fontSize: 11, offset: 10 }}
            />

            <Tooltip 
              contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  fontSize: '12px',
                  padding: '10px 14px'
              }}
              formatter={(value: number, name: string) => {
                  if (name.includes('耗油率')) return [value.toFixed(4), name];
                  return [value.toFixed(1), name];
              }}
              labelFormatter={(label) => `${xKey.toUpperCase()}: ${typeof label === 'number' ? label.toFixed(2) : label}`}
              cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            
            <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
            
            {/* 蓝色曲线: 单位推力 - 平滑曲线，加粗 */}
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="specificThrust" 
              name="单位推力 (Fs)" 
              stroke={COLOR_THRUST}
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6, fill: COLOR_THRUST, stroke: '#fff', strokeWidth: 2 }}
            />
            
            {/* 橙色曲线: 耗油率 - 平滑曲线，加粗 */}
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="sfc" 
              name="耗油率 (SFC)" 
              stroke={COLOR_SFC}
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6, fill: COLOR_SFC, stroke: '#fff', strokeWidth: 2 }}
            />
            
            {/* 当前工作点标记线 */}
            <ReferenceLine x={currentVal} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: '当前点', fill: '#94a3b8', fontSize: 10 }} />
            
            {/* 当前工作点高亮空心圆点 */}
            {showDots && (
                <>
                    <ReferenceDot x={closestPoint[xKey]} y={closestPoint.specificThrust} yAxisId="left" r={5} fill="#fff" stroke={COLOR_THRUST} strokeWidth={2} />
                    <ReferenceDot x={closestPoint[xKey]} y={closestPoint.sfc} yAxisId="right" r={5} fill="#fff" stroke={COLOR_SFC} strokeWidth={2} />
                </>
            )}

          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};