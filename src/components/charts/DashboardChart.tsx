'use client'

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} dy={5} />
        <Tooltip 
          cursor={false}
          contentStyle={{ backgroundColor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(140,224,255,0.2)', borderRadius: '0.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
          itemStyle={{ color: '#8CE0FF', fontWeight: 'bold' }}
          formatter={(value: any) => [`${value} kg`, 'Volume']}
        />
        <Bar dataKey="volume" fill="#8CE0FF" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
