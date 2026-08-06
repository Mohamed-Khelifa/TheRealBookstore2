import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Order } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, TrendingDown, BookOpen, MapPin, AlertCircle, CheckCircle, Package, Calendar, Clock, Users } from 'lucide-react';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f43f5e', '#84cc16'];

export default function ManageAnalytics() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7D' | '30D' | '90D' | '1Y' | 'ALL'>('30D');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error('Error fetching orders for analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const data = useMemo(() => {
    if (!orders.length) return null;

    const now = new Date();
    const getStartDate = (range: string) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      if (range === '7D') d.setDate(d.getDate() - 7);
      else if (range === '30D') d.setDate(d.getDate() - 30);
      else if (range === '90D') d.setDate(d.getDate() - 90);
      else if (range === '1Y') d.setFullYear(d.getFullYear() - 1);
      else return new Date(0); // ALL
      return d;
    };

    const startDate = getStartDate(dateRange);
    const rangeDuration = now.getTime() - startDate.getTime();
    const prevPeriodStart = new Date(startDate.getTime() - rangeDuration);

    // Precise State Tracking
    const isDeliveredPaid = (o: Order) => o.order_state === 'DELIVERED_PAID';
    const isReturned = (o: Order) => o.order_state === 'DELIVERED_RETURNED';
    const isCancelled = (o: Order) => o.status === 'CANCELLED';
    const isPending = (o: Order) => !isDeliveredPaid(o) && !isReturned(o) && !isCancelled(o);

    // Track user order history for "Repeat Customer" metric
    const userFirstOrder: Record<string, number> = {};
    const sortedOrders = [...orders].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    sortedOrders.forEach(o => {
      const id = o.phone || o.customer_name;
      if (id && !userFirstOrder[id]) {
        userFirstOrder[id] = new Date(o.created_at).getTime();
      }
    });

    const isRepeat = (o: Order) => {
      const id = o.phone || o.customer_name;
      if (!id) return false;
      return new Date(o.created_at).getTime() > userFirstOrder[id];
    };

    // Current Period Orders
    const currentOrders = orders.filter(o => new Date(o.created_at) >= startDate);
    
    // Previous Period Orders (for trends)
    const prevOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= prevPeriodStart && d < startDate;
    });

    const calculateMetrics = (dataset: Order[]) => {
      const deliveredPaid = dataset.filter(isDeliveredPaid);
      const returned = dataset.filter(isReturned);
      const cancelled = dataset.filter(isCancelled);
      const pending = dataset.filter(isPending);
      
      const repeatOrdersCount = dataset.filter(isRepeat).length;
      const repeatPercent = dataset.length > 0 ? (repeatOrdersCount / dataset.length) * 100 : 0;

      return {
        totalOrders: dataset.length,
        netSales: deliveredPaid.reduce((sum, o) => sum + (o.total_price || 0), 0),
        pendingRevenue: pending.reduce((sum, o) => sum + (o.total_price || 0), 0),
        returnedVolume: returned.reduce((sum, o) => sum + (o.total_price || 0), 0),
        deliveredPaidOrders: deliveredPaid.length,
        pendingOrders: pending.length,
        returnedOrders: returned.length,
        cancelledOrders: cancelled.length,
        repeatPercent,
      };
    };

    const currentMetrics = calculateMetrics(currentOrders);
    const prevMetrics = calculateMetrics(prevOrders);

    const getGrowth = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return ((current - prev) / prev) * 100;
    };

    // Time Series Data (Grouped by Cycle: Sat - Fri)
    const timeSeriesMap: Record<string, { name: string, NetSales: number, Orders: number, timestamp: number }> = {};
    
    // Helper to get the Saturday that starts this week's cycle
    const getCycleStart = (d: Date) => {
      const date = new Date(d);
      date.setHours(0,0,0,0);
      const day = date.getDay(); // 0 = Sun, 6 = Sat
      const diff = day === 6 ? 0 : day + 1; // Days to subtract to reach the most recent Saturday
      date.setDate(date.getDate() - diff);
      return date;
    };

    const startDateRounded = getCycleStart(startDate);
    const endWeek = getCycleStart(new Date());

    for (let d = new Date(startDateRounded); d <= endWeek; d.setDate(d.getDate() + 7)) {
       const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
       timeSeriesMap[key] = { name: `Sat ${key}`, NetSales: 0, Orders: 0, timestamp: d.getTime() };
    }

    currentOrders.forEach(o => {
      if (isDeliveredPaid(o)) {
        const cycleStart = getCycleStart(new Date(o.created_at));
        const key = cycleStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (timeSeriesMap[key]) {
          timeSeriesMap[key].NetSales += (o.total_price || 0);
          timeSeriesMap[key].Orders += 1;
        } else {
          timeSeriesMap[key] = { name: `Sat ${key}`, NetSales: (o.total_price || 0), Orders: 1, timestamp: cycleStart.getTime() };
        }
      }
    });

    const timeSeriesData = Object.values(timeSeriesMap).sort((a, b) => a.timestamp - b.timestamp);

    // Top Products (Based on Net Sales / Delivered & Paid)
    const productSales: Record<string, { title: string, qty: number, netRevenue: number, totalOrdered: number }> = {};
    currentOrders.forEach(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(item => {
          const title = item.title || 'Unknown';
          const qty = parseInt(item.qty) || 1;
          const price = parseFloat(item.price) || 0;
          if (!productSales[title]) {
            productSales[title] = { title, qty: 0, netRevenue: 0, totalOrdered: 0 };
          }
          productSales[title].totalOrdered += qty;
          if (isDeliveredPaid(o)) {
            productSales[title].qty += qty;
            productSales[title].netRevenue += (qty * price);
          }
        });
      }
    });

    const topProductsData = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    // Top Wilayas (Based on Net Sales)
    const wilayaMap: Record<string, { name: string, NetSales: number, Orders: number }> = {};
    currentOrders.forEach(o => {
      if (isDeliveredPaid(o) && o.wilaya) {
        if (!wilayaMap[o.wilaya]) wilayaMap[o.wilaya] = { name: o.wilaya, NetSales: 0, Orders: 0 };
        wilayaMap[o.wilaya].NetSales += (o.total_price || 0);
        wilayaMap[o.wilaya].Orders += 1;
      }
    });
    
    const topWilayasData = Object.values(wilayaMap)
      .sort((a, b) => b.NetSales - a.NetSales)
      .slice(0, 8);

    // Funnel / Conversion Data
    const funnelData = [
      { name: 'Delivered (Net)', value: currentMetrics.deliveredPaidOrders },
      { name: 'Pending/In Transit', value: currentMetrics.pendingOrders },
      { name: 'Returned', value: currentMetrics.returnedOrders },
      { name: 'Cancelled', value: currentMetrics.cancelledOrders },
    ];

    return {
      currentMetrics,
      prevMetrics,
      timeSeriesData,
      topProductsData,
      topWilayasData,
      funnelData,
      getGrowth
    };
  }, [orders, dateRange]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const { currentMetrics, prevMetrics, timeSeriesData, topProductsData, topWilayasData, funnelData, getGrowth } = data;
  
  const netGrowth = getGrowth(currentMetrics.netSales, prevMetrics.netSales);
  const pendingGrowth = getGrowth(currentMetrics.pendingRevenue, prevMetrics.pendingRevenue);
  const repeatGrowth = currentMetrics.repeatPercent - prevMetrics.repeatPercent;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary-light" />
            Enterprise Analytics
          </h2>
          <p className="text-white/50 text-sm mt-1">High-fidelity metrics. Net sales are exclusively mapped to delivered and paid orders.</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-2xl p-1">
          {['7D', '30D', '90D', '1Y', 'ALL'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                dateRange === range 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 backdrop-blur-xl border border-green-500/20 p-6 rounded-3xl shadow-xl shadow-green-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-24 h-24 text-green-400" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-green-400/80 uppercase tracking-widest flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Net Sales (Delivered & Paid)</p>
            <h3 className="text-3xl font-bold text-white mt-2">{currentMetrics.netSales.toLocaleString()} DA</h3>
            <p className="text-sm mt-2 flex items-center font-medium">
              <span className={netGrowth >= 0 ? 'text-green-400' : 'text-red-400'}>
                {netGrowth >= 0 ? '+' : ''}{netGrowth.toFixed(1)}%
              </span>
              <span className="text-white/40 ml-2">vs prev period</span>
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 backdrop-blur-xl border border-blue-500/20 p-6 rounded-3xl shadow-xl shadow-blue-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package className="w-24 h-24 text-blue-400" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-blue-400/80 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3"/> Pending Revenue</p>
            <h3 className="text-3xl font-bold text-white mt-2">{currentMetrics.pendingRevenue.toLocaleString()} DA</h3>
            <p className="text-sm mt-2 flex items-center font-medium">
              <span className={pendingGrowth >= 0 ? 'text-green-400' : 'text-red-400'}>
                {pendingGrowth >= 0 ? '+' : ''}{pendingGrowth.toFixed(1)}%
              </span>
              <span className="text-white/40 ml-2">in transit / processing</span>
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 backdrop-blur-xl border border-purple-500/20 p-6 rounded-3xl shadow-xl shadow-purple-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-24 h-24 text-purple-400" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-purple-400/80 uppercase tracking-widest flex items-center gap-1"><Users className="w-3 h-3"/> Repeat Customer %</p>
            <h3 className="text-3xl font-bold text-white mt-2">{currentMetrics.repeatPercent.toFixed(1)}%</h3>
            <p className="text-sm mt-2 flex items-center font-medium">
              <span className={repeatGrowth >= 0 ? 'text-green-400' : 'text-red-400'}>
                {repeatGrowth >= 0 ? '+' : ''}{repeatGrowth.toFixed(1)}%
              </span>
              <span className="text-white/40 ml-2">vs prev period</span>
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-red-500/5 backdrop-blur-xl border border-red-500/20 p-6 rounded-3xl shadow-xl shadow-red-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertCircle className="w-24 h-24 text-red-400" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-red-400/80 uppercase tracking-widest flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Returned Orders</p>
            <h3 className="text-3xl font-bold text-white mt-2">{currentMetrics.returnedVolume.toLocaleString()} DA</h3>
            <p className="text-sm mt-2 text-white/50 font-medium">
              {currentMetrics.returnedOrders} returned out of {currentMetrics.totalOrders} total
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time Series Chart */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-light" />
            Weekly Cycle Net Sales (Sat - Fri)
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="colorNetSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} tickFormatter={(value) => `${value / 1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="NetSales" stroke="#10b981" fillOpacity={1} fill="url(#colorNetSales)" name="Net Sales (DA)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel Chart */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Order Conversion Flow</h3>
          <div className="flex-1 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={funnelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#ef4444', '#f59e0b'][index]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center text-white/70"><div className="w-3 h-3 rounded-full bg-green-500 mr-2"/> Delivered & Paid</span>
                <span className="font-bold text-white">{currentMetrics.deliveredPaidOrders}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center text-white/70"><div className="w-3 h-3 rounded-full bg-blue-500 mr-2"/> Pending / In Transit</span>
                <span className="font-bold text-white">{currentMetrics.pendingOrders}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center text-white/70"><div className="w-3 h-3 rounded-full bg-red-500 mr-2"/> Returned</span>
                <span className="font-bold text-white">{currentMetrics.returnedOrders}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center text-white/70"><div className="w-3 h-3 rounded-full bg-amber-500 mr-2"/> Cancelled</span>
                <span className="font-bold text-white">{currentMetrics.cancelledOrders}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Table */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl overflow-hidden flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-light" />
            Top Performing Books (Net Sales)
          </h3>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-4 font-bold text-white/40 uppercase tracking-widest text-xs">Title</th>
                  <th className="py-3 px-4 font-bold text-white/40 uppercase tracking-widest text-xs text-right">Delivered Units</th>
                  <th className="py-3 px-4 font-bold text-white/40 uppercase tracking-widest text-xs text-right">Net Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProductsData.map((product, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-3 px-4 text-white font-medium max-w-[200px] truncate">{product.title}</td>
                    <td className="py-3 px-4 text-white/70 text-right">
                      {product.qty} <span className="text-white/30 text-xs ml-1 opacity-0 group-hover:opacity-100 transition-opacity">({product.totalOrdered} ordered)</span>
                    </td>
                    <td className="py-3 px-4 text-white font-bold text-right text-primary-light">{product.netRevenue.toLocaleString()} DA</td>
                  </tr>
                ))}
                {topProductsData.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-white/40">No net sales data found for this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Wilayas Chart */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            Top Net Revenue by Wilaya
          </h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topWilayasData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} tickFormatter={(val) => `${val/1000}k`} />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.8)', fontSize: 12}} width={100} />
                <RechartsTooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }}
                />
                <Bar dataKey="NetSales" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {topWilayasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
