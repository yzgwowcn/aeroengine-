import React from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { StationResult } from '../types';

interface Props {
  stations: StationResult[];
}

export const StationChart: React.FC<Props> = ({ stations }) => {
  // Filter and map stations for the chart, using labels like "2", "3" etc as x-axis
  const data = stations.map(s => ({
    name: s.label,
    pressure: s.pressure / 1000, // kPa
    temp: s.temp, // K
    fullName: s.name
  }));

  return (
    <div className="w-full h-[400px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            
            <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={{stroke: '#cbd5e1'}}>
                 <Label value="发动机截面序号 (Station ID)" offset={0} position="insideBottom" style={{fill: '#64748b', fontSize: 12, marginTop: 10}} />
            </XAxis>
            
            <YAxis 
                yAxisId="pressure" 
                orientation="left" 
                stroke="#2563eb"
                tick={{fill: '#2563eb', fontSize: 12}}
                axisLine={{stroke: '#2563eb'}}
                label={{ value: '总压 Total Pressure (kPa)', angle: -90, position: 'insideLeft', fill: '#2563eb', fontSize: 12 }}
            />
            <YAxis 
                yAxisId="temp" 
                orientation="right" 
                stroke="#dc2626"
                tick={{fill: '#dc2626', fontSize: 12}}
                axisLine={{stroke: '#dc2626'}}
                label={{ value: '总温 Total Temperature (K)', angle: 90, position: 'insideRight', fill: '#dc2626', fontSize: 12 }}
            />
            
            <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                }}
                labelFormatter={(label) => `Station ${label}`}
            />
            
            <Line 
                yAxisId="pressure"
                type="monotone" 
                dataKey="pressure" 
                stroke="#2563eb" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                name="总压 (Pt)"
            />
            <Line 
                yAxisId="temp"
                type="monotone" 
                dataKey="temp" 
                stroke="#dc2626" 
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#dc2626', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                name="总温 (Tt)"
            />
        </ComposedChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-blue-600 rounded-full"></div>
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                <span className="text-sm text-blue-700 font-medium">总压 (Pt)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-red-600 rounded-full border-t border-dashed"></div>
                <div className="w-2 h-2 rounded-full bg-red-600"></div>
                <span className="text-sm text-red-700 font-medium">总温 (Tt)</span>
            </div>
        </div>
    </div>
  );
};