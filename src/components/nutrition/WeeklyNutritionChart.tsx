'use client'

import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

export default function WeeklyNutritionChart({ weekData }: { weekData: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={weekData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} dy={8} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
        <Tooltip
          cursor={{ fill: 'rgba(212,175,106,0.1)' }}
          contentStyle={{ backgroundColor: 'rgba(15,15,15,0.95)', border: '1px solid rgba(212,175,106,0.2)', borderRadius: '1rem', color: '#fff', fontSize: 12 }}
          itemStyle={{ fontWeight: 700 }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
        {/* Stacked Bars representing calories from each macro */}
        <Bar dataKey="protein_cal" name="Protein (kcal)" stackId="a" fill="#D4AF6A" radius={[0, 0, 4, 4]} />
        <Bar dataKey="carbs_cal" name="Carbs (kcal)" stackId="a" fill="#3b82f6" />
        <Bar dataKey="fat_cal" name="Fat (kcal)" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
