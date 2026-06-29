'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function ProgressVolumeChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="log_date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="#666" fontSize={10} tickLine={false} axisLine={false} dy={10} />
        <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} dx={-10} tickFormatter={(v) => `${(v/1000).toFixed(1)}k`} />
        <Tooltip 
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(212,175,106,0.3)', borderRadius: '12px', backdropFilter: 'blur(10px)' }} 
          itemStyle={{ color: '#D4AF6A', fontWeight: 'bold' }} 
          labelStyle={{ color: '#888', marginBottom: '4px' }}
          formatter={(value: number) => [`${value} kg`, 'Volume']}
        />
        <Bar dataKey="volume_kg" fill="#D4AF6A" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
