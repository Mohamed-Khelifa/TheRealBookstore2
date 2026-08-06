import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, CheckCircle, XCircle, Clock, RefreshCw, Copy, 
  Search, ExternalLink, MessageCircle, AlertTriangle, 
  DollarSign, Activity, Check, Package, X
} from 'lucide-react';
import { Order } from '../types';
import { supabase } from '../lib/supabase';
import { fetchAllRows } from '../lib/api';

export default function LiveDeliveryFeed() {
  const [activeTab, setActiveTab] = useState<'IN_TRANSIT' | 'DELIVERED' | 'RETURNED' | 'PENDING'>('IN_TRANSIT');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real-time notifications state
  const [liveNotification, setLiveNotification] = useState<{ id: string, title: string, message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const fetchOrders = async () => {
    setRefreshing(true);
    try {
      const { data: ordersData } = await fetchAllRows('orders', '*', 'created_at', false);
      if (ordersData) {
        setOrders(ordersData);
      }
    } catch (err) {
      console.error('Error fetching live delivery data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('live-delivery-feed')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new as Order;
          const oldOrder = payload.old as Order;
          
          setOrders(prev => {
            const exists = prev.find(o => o.id === newOrder.id);
            if (exists) {
              return prev.map(o => o.id === newOrder.id ? newOrder : o);
            }
            return [newOrder, ...prev];
          });
          
          // Detect newly delivered
          if (
            (newOrder.order_state === 'DELIVERED_PAID' || newOrder.status === 'DELIVERED') &&
            (oldOrder.order_state !== 'DELIVERED_PAID' && oldOrder.status !== 'DELIVERED')
          ) {
            triggerNotification(newOrder, 'DELIVERED');
          } else if (
            (newOrder.order_state === 'DELIVERED_RETURNED' || newOrder.status === 'CANCELLED') &&
            (oldOrder.order_state !== 'DELIVERED_RETURNED' && oldOrder.status !== 'CANCELLED')
          ) {
            triggerNotification(newOrder, 'RETURNED');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const triggerNotification = (order: Order, type: 'DELIVERED' | 'RETURNED') => {
    if (type === 'DELIVERED') {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
      audio.play().catch(() => {});
      
      setLiveNotification({
        id: Math.random().toString(),
        type: 'success',
        title: '🎉 Order Delivered!',
        message: `${order.customer_name} just received their order (${order.total_price} DA).`
      });
    } else {
      setLiveNotification({
        id: Math.random().toString(),
        type: 'error',
        title: '⚠️ Order Returned/Failed',
        message: `Delivery failed for ${order.customer_name}.`
      });
    }
    
    setTimeout(() => setLiveNotification(null), 8000);
  };

  const filteredOrders = orders.filter(o => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        (o.customer_name?.toLowerCase() || '').includes(q) ||
        (o.phone || '').includes(q) ||
        (o.tracking_code || '').includes(q) ||
        (o.id?.toString() || '').includes(q) ||
        (o.client_note?.toLowerCase() || '').includes(q);
      
      if (!matchSearch) return false;
    }
    
    switch(activeTab) {
      case 'IN_TRANSIT':
        return o.status === 'SHIPPED' || o.order_state === 'READY_NOT_DELIVERED' || o.order_state === 'SHIPPED';
      case 'DELIVERED':
        return o.status === 'DELIVERED' || o.order_state === 'DELIVERED_PAID';
      case 'RETURNED':
        return o.status === 'CANCELLED' || o.order_state === 'DELIVERED_RETURNED' || o.order_state === 'CANCELLED';
      case 'PENDING':
        return o.status === 'PENDING' || o.order_state === 'PENDING' || o.order_state === 'DID_NOT_ARRIVE';
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <AnimatePresence>
        {liveNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 right-8 z-[100] p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-start gap-4 max-w-sm ${
              liveNotification.type === 'success' 
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100'
                : 'bg-red-500/20 border-red-500/30 text-red-100'
            }`}
          >
            <div className="flex-1 space-y-1">
              <h4 className="font-bold text-sm flex items-center gap-2">
                {liveNotification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {liveNotification.title}
              </h4>
              <p className="text-xs opacity-80">{liveNotification.message}</p>
            </div>
            <button onClick={() => setLiveNotification(null)} className="opacity-50 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Delivery Management</h1>
          <p className="text-white/50 text-sm mt-1">Live tracking and status updates</p>
        </div>
        <button 
          onClick={fetchOrders}
          className={`p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white transition-all ${refreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab('IN_TRANSIT')}
          className={`pb-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'IN_TRANSIT' ? 'border-primary text-primary-light' : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" />
          In Transit
        </button>
        <button
          onClick={() => setActiveTab('DELIVERED')}
          className={`pb-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'DELIVERED' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Delivered
        </button>
        <button
          onClick={() => setActiveTab('RETURNED')}
          className={`pb-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'RETURNED' ? 'border-red-500 text-red-400' : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <XCircle className="w-4 h-4" />
          Returned / Failed
        </button>
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`pb-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'PENDING' ? 'border-amber-500 text-amber-400' : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending Pick-up
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, tracking code, or phone..."
              className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary"
            />
          </div>
          <div className="text-xs text-white/40 font-mono">
            Showing {filteredOrders.length} orders
          </div>
        </div>

        <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-black/20">
                  <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">Order & Tracking</th>
                  <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">Customer Info</th>
                  <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">Status & Note</th>
                  <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">Total</th>
                  <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-white/40">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto opacity-50" />
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
                      <p className="text-white/40 text-sm">No orders found for this status.</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => {
                    const tracking = order.tracking_code;
                    const statusText = order.guepex_status || order.status || order.order_state || 'N/A';
                    
                    return (
                      <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="text-white font-bold text-sm">#{order.id}</span>
                            {tracking ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                  {tracking}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-white/30 italic">No tracking</span>
                            )}
                            <div className="text-[10px] text-white/30">
                              {new Date(order.created_at).toLocaleString()}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-bold text-white/90">{order.customer_name}</div>
                          <div className="text-xs text-white/50 font-mono mt-0.5">{order.phone}</div>
                          <div className="text-xs text-white/40 mt-1 line-clamp-1 max-w-[200px]">
                            {order.wilaya}{order.commune ? `, ${order.commune}` : ''}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border mb-1
                            ${activeTab === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 
                              activeTab === 'RETURNED' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 
                              activeTab === 'IN_TRANSIT' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 
                              'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}
                          >
                            {statusText}
                          </div>
                          {order.guepex_reason && (
                            <div className="text-[10px] text-red-300/80 mt-1 line-clamp-1">{order.guepex_reason}</div>
                          )}
                          {order.client_note && (
                            <div className="text-xs text-amber-200/60 italic mt-1 line-clamp-2 max-w-[200px]">
                              Note: {order.client_note}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-bold text-emerald-400">
                            {order.total_price} DA
                          </div>
                          <div className="text-[10px] text-white/40 mt-0.5">
                            {Array.isArray(order.items) ? `${order.items.length} item(s)` : 'Unknown'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-2">
                            {tracking && (
                              <a
                                href={`https://guepex.com/tracking?tracking=${tracking}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border border-white/10 transition-all"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Track
                              </a>
                            )}
                            <a
                              href={`https://wa.me/213${(order.phone || '').replace(/^0/, '')}?text=${encodeURIComponent(`Bonjour ${order.customer_name}, concernant votre commande BigDeal Bookstore (${tracking || order.id}): Le statut actuel est "${statusText}".`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-all"
                            >
                              <MessageCircle className="w-3 h-3" />
                              Contact
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
