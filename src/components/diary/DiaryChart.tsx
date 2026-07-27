'use client'

import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function DiaryChart({ chartData }: { chartData: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D84315" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#D84315" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} />
        <Tooltip 
          contentStyle={{ backgroundColor: 'rgba(20,20,25,0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(216, 67, 21, 0.2)', borderRadius: '1rem', padding: '12px' }}
          itemStyle={{ color: '#D84315', fontWeight: 'bold' }}
          formatter={(value: any) => [`${value} kg`, 'Volume']}
          labelStyle={{ color: '#888', marginBottom: '4px' }}
        />
        <Area type="monotone" dataKey="volume" stroke="#D84315" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
