import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export interface AnalyticsData {
  orders_today: number;
  revenue_today: number;
  orders_week: number;
  revenue_week: number;
  orders_month: number;
  revenue_month: number;
  top_products: Array<{
    name: string;
    count: number;
  }>;
  status_breakdown: Array<{
    status: string;
    count: number;
  }>;
  abandonment_rate: number;
}

export const analyticsService = {
  getSummary: async () => {
    // Perform client-side aggregation by pulling all orders.
    // In production, this should be a scheduled Cloud Function mapping to an analytics doc.
    const snapshot = await getDocs(collection(db, 'orders'));
    const orders = snapshot.docs.map(d => d.data());
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    let orders_today = 0, revenue_today = 0;
    let orders_week = 0, revenue_week = 0;
    let orders_month = 0, revenue_month = 0;
    const statusCounts: Record<string, number> = {};
    const productCounts: Record<string, number> = {};
    let abandoned = 0;

    orders.forEach((o: any) => {
      const orderDate = new Date(o.created_at || new Date());
      const amt = parseFloat(o.total_amount) || 0;
      const stat = o.status || 'unknown';
      
      statusCounts[stat] = (statusCounts[stat] || 0) + 1;
      if (stat === 'cancelled') abandoned++;

      if (o.created_at?.startsWith(todayStr)) {
        orders_today++;
        revenue_today += amt;
      }
      
      if (orderDate >= oneWeekAgo) {
        orders_week++;
        revenue_week += amt;
      }
      
      if (orderDate >= oneMonthAgo) {
        orders_month++;
        revenue_month += amt;
      }
      
      if (Array.isArray(o.items)) {
        o.items.forEach((item: any) => {
          productCounts[item.name] = (productCounts[item.name] || 0) + (item.quantity || 1);
        });
      }
    });

    const top_products = Object.entries(productCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const status_breakdown = Object.entries(statusCounts)
      .map(([status, count]) => ({ status, count }));

    const abandonment_rate = orders.length ? (abandoned / orders.length) * 100 : 0;

    const summary: AnalyticsData = {
      orders_today, revenue_today,
      orders_week, revenue_week,
      orders_month, revenue_month,
      top_products,
      status_breakdown,
      abandonment_rate
    };

    return { status: 'success', data: summary };
  },
  
  getOrderAnalytics: async () => {
    const res = await analyticsService.getSummary();
    return res;
  },
};