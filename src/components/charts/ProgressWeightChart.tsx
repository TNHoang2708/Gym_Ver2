'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function ProgressWeightChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis dataKey="log_date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="#666" fontSize={10} tickLine={false} axisLine={false} dy={10} />
        <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#666" fontSize={10} tickLine={false} axisLine={false} dx={-10} tickFormatter={(v) => `${v}kg`} />
        <Tooltip 
          contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(212,175,106,0.3)', borderRadius: '12px', backdropFilter: 'blur(10px)' }} 
          itemStyle={{ color: '#D4AF6A', fontWeight: 'bold' }}
          labelStyle={{ color: '#888', marginBottom: '4px' }}
          formatter={(value: number) => [`${value} kg`, 'Weight']}
        />
        <Line type="monotone" dataKey="weight_kg" stroke="#D4AF6A" strokeWidth={3} dot={{ fill: '#000', stroke: '#D4AF6A', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#D4AF6A' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
