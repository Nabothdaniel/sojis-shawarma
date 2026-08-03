'use client';

import React, { useEffect, useState } from 'react';
import { analyticsService, AnalyticsData } from '@/lib/api/analytics.service';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import useAdminGuard from '@/hooks/useAdminGuard';
import { AdminAnalyticsSkeleton } from '@/components/ui/AdminSkeletons';
import { AdminSection, AdminPageHeader } from '@/components/admin/ui/AdminContainers';
import { AdminButton } from '@/components/admin/ui/AdminButton';

export default function AnalyticsPage() {
  const { token, authLoading, isAdmin } = useAdminGuard();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin || !token) {
      return;
    }

    let active = true;

    const fetchData = async () => {
      try {
        const response = await analyticsService.getSummary();
        if (active) {
          setData(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch analytics');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isAdmin, token]);

  if (authLoading || (isAdmin && isLoading)) return <AdminAnalyticsSkeleton />;

  if (!isAdmin) return null;

  if (!data) return <div className="p-10 font-headline font-bold">No data available</div>;

  const COLORS = ['#745b00', '#f5c518', '#006c45', '#a53c00', '#1c1b1b'];

  return (
    <div className="bg-surface min-h-screen p-6 md:p-10 space-y-10">
      <AdminPageHeader title="Business Intelligence" subtitle="Real-time performance metrics">
        <AdminButton variant="primary">
          <span className="material-symbols-outlined text-sm">download</span>
          Export CSV
        </AdminButton>
      </AdminPageHeader>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Orders Today" value={data.orders_today} />
        <StatCard label="Revenue Today" value={`₦${data.revenue_today.toLocaleString()}`} />
        <StatCard label="Orders (Monthly)" value={data.orders_month} />
        <StatCard label="Abandonment Rate" value={`${Math.round(data.abandonment_rate)}%`} color="text-error" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Products */}
        <AdminSection>
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
        </AdminSection>

        {/* Status Breakdown */}
        <AdminSection>
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
        </AdminSection>
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
