import React from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label, ReferenceLine, ReferenceDot } from 'recharts';
import { ChartPoint } from '../types';

interface Props {
  data: ChartPoint[];
  currentOpr: number;
}

export const PerformanceCharts: React.FC<Props> = ({ data, currentOpr }) => {
  const closestPoint = data.reduce((prev, curr) => {
    return (Math.abs(curr.opr - currentOpr) < Math.abs(prev.opr - currentOpr) ? curr : prev);
  }, data[0]);

  // 如果当前设计点与数据点非常接近，显示点
  const showDots = Math.abs(closestPoint.opr - currentOpr) < 5;

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-slate-200 flex flex-col h-[500px]">
      <div className="mb-4 text-center">
        <h3 className="text-sm font-bold text-slate-700 uppercase">循环参数优化分析 (Cycle Optimization)</h3>
        <p className="text-xs text-slate-500">耗油率 (SFC) 与 单位推力 (Fs) 随总压比 (OPR) 的变化趋势</p>
      </div>
      
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            
            <XAxis 
              dataKey="opr" 
              type="number"
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 12 }}
            >
               <Label value="总压比 (Overall Pressure Ratio)" offset={-5} position="insideBottom" style={{fill: '#64748b', fontSize: 12}} />
            </XAxis>

            {/* Left Axis: SFC */}
            <YAxis 
              yAxisId="left"
              orientation="left"
              stroke="#059669"
              tick={{fill: '#059669', fontSize: 12}}
              width={60}
              domain={['auto', 'auto']}
            >
                <Label value="耗油率 SFC (kg/N/h)" angle={-90} position="insideLeft" style={{fill: '#059669', fontSize: 12}} />
            </YAxis>

            {/* Right Axis: Specific Thrust */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#2563eb"
              tick={{fill: '#2563eb', fontSize: 12}}
              width={60}
              domain={['auto', 'auto']}
            >
                <Label value="单位推力 Fs (N/kg/s)" angle={90} position="insideRight" style={{fill: '#2563eb', fontSize: 12}} />
            </YAxis>

            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              formatter={(value: number, name: string) => {
                  if (name.includes('SFC')) return [value.toFixed(4), name];
                  return [value.toFixed(1), name];
              }}
              labelFormatter={(label) => `OPR: ${label}`}
            />
            
            <Legend verticalAlign="top" height={36} iconType="plainline"/>
            
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="sfc" 
              name="耗油率 (SFC)" 
              stroke="#059669" 
              strokeWidth={3} 
              dot={false}
            />
            
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="specificThrust" 
              name="单位推力 (Fs)" 
              stroke="#2563eb" 
              strokeWidth={3} 
              dot={false}
            />
            
            {/* 当前设计点 */}
            <ReferenceLine x={currentOpr} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: '当前设计点', fill: '#f59e0b', fontSize: 12 }} />
            
            {showDots && (
                <>
                    <ReferenceDot x={closestPoint.opr} y={closestPoint.sfc} yAxisId="left" r={5} fill="#059669" stroke="white" strokeWidth={2} />
                    <ReferenceDot x={closestPoint.opr} y={closestPoint.specificThrust} yAxisId="right" r={5} fill="#2563eb" stroke="white" strokeWidth={2} />
                </>
            )}

          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};