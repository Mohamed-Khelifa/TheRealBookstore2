import { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, CheckCircle, XCircle, Clock, RefreshCw, Copy, 
  Search, ExternalLink, MessageCircle, AlertTriangle, 
  DollarSign, Activity, Check, Package, X
} from 'lucide-react';
import { Order } from '../types';
import { supabase } from '../lib/supabase';
import { fetchAllRows } from '../lib/api';
import { DELIVERY_DEFAULTS } from './ManageWhatsApp';

export default function LiveDeliveryFeed() {
  const [activeTab, setActiveTab] = useState<string>('Tous');
  const [orders, setOrders] = useState<Order[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [waTemplates, setWaTemplates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real-time notifications state
  const [liveNotification, setLiveNotification] = useState<{ id: string, title: string, message: string, type: 'success' | 'error' | 'info' } | null>(null);

    
  const getWhatsAppMessage = (order: Order, tracking: string, status: string, templates: Record<string, string>) => {
    const name = order.customer_name || 'Client';
    const orderRef = tracking || order.id || 'N/A';
    const price = order.total_price ? `${order.total_price} DA` : '';
    const s = (status || '').toLowerCase().trim();
    
    let templateKey = 'wa_delivery_default';
    if (s === 'sorti en livraison') templateKey = 'wa_delivery_sorti';
    else if (s === 'en attente du client' || s === 'en attente') templateKey = 'wa_delivery_attente';
    else if (s === 'en alerte' || s === 'en alert') templateKey = 'wa_delivery_alerte';
    else if (['tentative échouée', 'echèc livraison'].includes(s)) templateKey = 'wa_delivery_failed';
    else if (['expédié', 'centre', 'vers wilaya', 'en localisation'].includes(s)) templateKey = 'wa_delivery_transit';
    else if (s.includes('retour')) templateKey = 'wa_delivery_retour';
    else if (s === 'livré' || s === 'livre') templateKey = 'wa_delivery_livre';

    let message = templates[templateKey] || DELIVERY_DEFAULTS[templateKey] || '';
    
    // Replace variables
    message = message
      .replace(/\{\{customerName\}\}/g, name)
      .replace(/\{\{orderRef\}\}/g, orderRef)
      .replace(/\{\{totalPrice\}\}/g, price)
      .replace(/\{\{status\}\}/g, status);
    
    return encodeURIComponent(message);
  };

  const fetchOrders = async () => {
    setRefreshing(true);
    try {
      const [settingsRes, ordersRes, parcelsRes] = await Promise.all([
        supabase.from('site_settings').select('*').in('key', ['wa_delivery_sorti', 'wa_delivery_attente', 'wa_delivery_alerte', 'wa_delivery_failed', 'wa_delivery_transit', 'wa_delivery_retour', 'wa_delivery_livre', 'wa_delivery_default']),
        fetchAllRows('orders', '*', 'created_at', false),
        fetch('/api/guepex-parcels?page_size=500').catch(() => null)
      ]);
      
      if (settingsRes && settingsRes.data) {
        const templates: Record<string, string> = {};
        settingsRes.data.forEach((s: any) => templates[s.key] = s.value);
        setWaTemplates(templates);
      }
      
      let parcelsMap: Record<string, any> = {};
      if (parcelsRes && parcelsRes.ok) {
         const pData = await parcelsRes.json().catch(() => null);
         const parcelArray = pData?.data || [];
         parcelArray.forEach((p: any) => {
           if (p.order_id) parcelsMap[String(p.order_id).toLowerCase()] = p;
           if (p.tracking) parcelsMap[String(p.tracking).toLowerCase()] = p;
         });
      }
      
      if (ordersRes && ordersRes.data) {
        const merged = ordersRes.data.map((o: any) => {
          const parcel = parcelsMap[String(o.id).toLowerCase()] || parcelsMap[String(o.tracking_code || '').toLowerCase()];
          if (parcel) {
            return {
              ...o,
              tracking_code: parcel.tracking || o.tracking_code,
              guepex_status: parcel.last_status || parcel.status,
              guepex_reason: parcel.reason
            };
          }
          return o;
        });
        setOrders(merged);
      }
      
      if (activeTab === 'WEBHOOKS') {
        await fetchWebhookLogs();
      }
    } catch (err) {
      console.error('Error fetching live delivery data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchWebhookLogs = async () => {
    setLoadingWebhooks(true);
    try {
      const res = await fetch('/api/guepex-webhook?logs=true');
      if (!res.ok) throw new Error('Failed to fetch webhook logs');
      const data = await res.json();
      if (data.success && data.logs) {
        setWebhookLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching webhook logs:', err);
    } finally {
      setLoadingWebhooks(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);
  
  useEffect(() => {
    if (activeTab === 'WEBHOOKS' && webhookLogs.length === 0) {
      fetchWebhookLogs();
    }
  }, [activeTab]);

  useEffect(() => {
    const channel = supabase
      .channel('live-delivery-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order;
            setOrders(prev => [newOrder, ...prev]);
            return;
          }

          if (payload.eventType === 'DELETE') {
            const oldOrder = payload.old as Order;
            setOrders(prev => prev.filter(o => o.id !== oldOrder.id));
            return;
          }

          if (payload.eventType === 'UPDATE') {
            const newOrder = payload.new as Order;
            const oldOrder = payload.old as Order;
            
            setOrders(prev => {
              const exists = prev.find(o => o.id === newOrder.id);
              if (exists) {
                return prev.map(o => o.id === newOrder.id ? { ...newOrder, guepex_status: o.guepex_status, tracking_code: o.tracking_code, guepex_reason: o.guepex_reason } : o);
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const triggerNotification = (order: Order, type: 'DELIVERED' | 'RETURNED') => {
    if (type === 'DELIVERED') {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        }
      } catch (e) {
        // ignore audio failure
      }
      
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

  const matchOrderStatus = (o: Order, tab: string) => {
    if (tab === 'WEBHOOKS') return true;
    if (tab === 'Tous' || tab === 'All') return true;

    const guepexStatus = (o.guepex_status || '').trim();
    const orderStatus = (o.status || '').trim();
    const orderState = (o.order_state || '').trim();

    const statusStr = (guepexStatus || orderStatus || orderState).toLowerCase();
    const tabLower = tab.toLowerCase().trim();

    if (tabLower === 'en alerte') {
      return statusStr === 'en alerte' || statusStr === 'en alert' || statusStr === 'alerte';
    }
    if (tabLower === 'en attente du client' || tabLower === 'en attente') {
      return statusStr === 'en attente du client' || statusStr === 'en attente' || statusStr === 'attente';
    }
    if (tabLower === 'sorti en livraison') {
      return statusStr === 'sorti en livraison' || statusStr === 'sorti';
    }
    if (tabLower === 'livré' || tabLower === 'livre') {
      return statusStr === 'livré' || statusStr === 'livre' || statusStr === 'delivered' || statusStr === 'delivered_paid';
    }
    if (tabLower === 'expédié' || tabLower === 'expedie') {
      return statusStr === 'expédié' || statusStr === 'expedie' || statusStr === 'shipped' || statusStr === 'ready_not_delivered';
    }
    if (tabLower === 'tentative échouée' || tabLower === 'echec livraison') {
      return statusStr === 'tentative échouée' || statusStr === 'echèc livraison' || statusStr === 'echec livraison';
    }
    if (tabLower === 'retourné au vendeur') {
      return statusStr.includes('retourné au vendeur') || statusStr.includes('retourne au vendeur');
    }

    return statusStr === tabLower;
  };

  const filteredOrders = orders.filter(o => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        (o.customer_name?.toLowerCase() || '').includes(q) ||
        (o.phone || '').includes(q) ||
        (o.tracking_code || '').includes(q) ||
        (o.id?.toString() || '').includes(q) ||
        (o.client_note?.toLowerCase() || '').includes(q) ||
        (o.wilaya?.toLowerCase() || '').includes(q);
      
      if (!matchSearch) return false;
    }
    
    return matchOrderStatus(o, activeTab);
  });

  const inTransitOrders = orders.filter(o => o.status === 'SHIPPED' || o.order_state === 'READY_NOT_DELIVERED');
  const theoreticalRevenue = inTransitOrders.reduce((sum, order) => {
    const subtotal = order.items?.reduce((s: number, item: any) => s + ((item.price || 0) * (item.qty || 1)), 0) || 0;
    return sum + subtotal;
  }, 0);

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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Delivery Management</h1>
          <p className="text-white/50 text-sm mt-1">Live tracking and status updates</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2 flex flex-col">
            <span className="text-[10px] text-primary-light/70 font-bold uppercase tracking-wider">In Transit Revenue</span>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary-light" />
              <span className="text-lg font-bold text-primary-light">{theoreticalRevenue.toLocaleString()} DA</span>
            </div>
          </div>
          <button 
            onClick={fetchOrders}
            className={`p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white transition-all ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 border-b border-white/10 scrollbar-hide">
        {[
          "Tous",
          "Sorti en livraison",
          "En alerte",
          "En attente du client",
          "Livré",
          "Vers Wilaya",
          "Centre",
          "En préparation",
          "Expédié",
          "Tentative échouée",
          "Retour vers centre",
          "Retourné au centre",
          "Retourné au vendeur",
          "WEBHOOKS"
        ].map(status => {
          const count = status === 'WEBHOOKS' ? webhookLogs.length : status === 'Tous' ? orders.length : orders.filter(o => matchOrderStatus(o, status)).length;
          
          let colorClass = 'border-transparent text-white/50 hover:text-white bg-white/5';
          let activeClass = 'border-primary text-primary-light bg-primary/10';
          
          if (['Sorti en livraison', 'Expédié'].includes(status)) activeClass = 'border-blue-500 text-blue-400 bg-blue-500/10';
          else if (['En alerte', 'Tentative échouée', 'Echèc livraison', 'Retour vers centre', 'Retourné au centre', 'Retour à retirer'].includes(status)) activeClass = 'border-red-500 text-red-400 bg-red-500/10';
          else if (status === 'WEBHOOKS') activeClass = 'border-purple-500 text-purple-400 bg-purple-500/10';

          const isActive = activeTab === status;
          
          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 border transition-all ${isActive ? activeClass : colorClass}`}
            >
              {status}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-white/20' : 'bg-black/30'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'WEBHOOKS' ? "Search logs..." : "Search by name, tracking code, or phone..."}
              className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary"
            />
          </div>
          <div className="text-xs text-white/40 font-mono">
            {activeTab === 'WEBHOOKS' ? `Showing ${webhookLogs.filter(l => (l.message || '').toLowerCase().includes(searchQuery.toLowerCase())).length} logs` : `Showing ${filteredOrders.length} orders`}
          </div>
        </div>

        <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            {activeTab === 'WEBHOOKS' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-black/20">
                    <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">Timestamp</th>
                    <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">Type & Status</th>
                    <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">Message</th>
                    <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider w-1/3">Data Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingWebhooks ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-white/40">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto opacity-50" />
                      </td>
                    </tr>
                  ) : webhookLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center">
                        <Activity className="w-12 h-12 text-white/10 mx-auto mb-3" />
                        <p className="text-white/40 text-sm">No webhook logs available.</p>
                      </td>
                    </tr>
                  ) : (
                    webhookLogs
                      .filter(l => (l.message || '').toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4 whitespace-nowrap text-xs text-white/50 font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border mb-1
                            ${log.success ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}
                          >
                            {log.type}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-white/80">
                          {log.message}
                        </td>
                        <td className="p-4">
                          {log.data ? (
                            <pre className="text-[10px] text-white/40 font-mono max-h-24 overflow-y-auto bg-black/40 p-2 rounded-lg border border-white/5">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          ) : (
                            <span className="text-xs text-white/20 italic">No data</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
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
                            {order.wilaya}{order.baladia ? `, ${order.baladia}` : ''}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border mb-1
                            ${['En alerte', 'Tentative échouée', 'Echèc livraison', 'Retour vers centre', 'Retourné au centre', 'Retour à retirer'].includes(statusText) 
                              ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                              : ['Sorti en livraison', 'Expédié'].includes(statusText) 
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}
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
                          <div className="text-[10px] text-white/50 mt-1">
                            Sub: {(order.items?.reduce((sum: number, item: any) => sum + ((item.price || 0) * (item.qty || 1)), 0) || 0).toFixed(0)} DA
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
                              href={`https://wa.me/213${(order.phone || '').replace(/^0/, '')}?text=${getWhatsAppMessage(order, tracking || '', statusText, waTemplates)}`}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
