'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function BMIChart({ chartData }: { chartData: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
        <YAxis domain={['dataMin - 2', 'dataMax + 2']} axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(212,175,106,0.2)', borderRadius: '1rem', color: '#fff' }}
          itemStyle={{ color: '#D4AF6A', fontWeight: 'bold' }}
        />
        <Line 
          type="monotone" 
          dataKey="weight" 
          name="Weight (kg)"
          stroke="#D4AF6A" 
          strokeWidth={3}
          dot={{ r: 4, fill: '#111', stroke: '#D4AF6A', strokeWidth: 2 }}
          activeDot={{ r: 6, fill: '#D4AF6A' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
