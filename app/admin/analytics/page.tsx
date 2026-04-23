'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';

export default function AnalyticsPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:8000/analytics/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
      return;
    }
    if (token) {
      fetchData();
      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
    }
  }, [token, authLoading, router]);

  if (isLoading || authLoading) return <div className="p-10 font-headline font-bold">Loading Insights...</div>;

  const COLORS = ['#745b00', '#f5c518', '#006c45', '#a53c00', '#1c1b1b'];

  return (
    <div className="bg-surface min-h-screen p-6 md:p-10 space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="font-headline font-bold text-3xl">Business Intelligence</h1>
          <p className="text-outline font-body text-sm mt-1">Real-time performance metrics</p>
        </div>
        <button className="bg-on-surface text-surface px-6 py-3 rounded-full font-label font-bold text-xs uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">download</span>
          Export CSV
        </button>
      </header>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Orders Today" value={data.orders_today} />
        <StatCard label="Revenue Today" value={`₦${data.revenue_today.toLocaleString()}`} />
        <StatCard label="Orders (Monthly)" value={data.orders_month} />
        <StatCard label="Abandonment Rate" value={`${Math.round(data.abandonment_rate)}%`} color="text-error" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant/10">
          <h3 className="font-headline font-bold text-lg mb-8">Top 5 Products</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_products}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#f5c518" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant/10">
          <h3 className="font-headline font-bold text-lg mb-8">Order Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.status_breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                >
                  {data.status_breakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "text-on-surface" }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-outline-variant/10 shadow-sm">
      <p className="font-label text-[10px] uppercase font-bold text-outline tracking-widest">{label}</p>
      <p className={`text-3xl font-headline font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}
