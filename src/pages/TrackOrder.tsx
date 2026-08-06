import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, CheckCircle, Clock, Package, AlertCircle, ArrowLeft, RefreshCw, XCircle, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatOrderRef } from '../lib/utils';
import { Order } from '../types';

export default function TrackOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [guepexData, setGuepexData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (id) {
      fetchTrackingData(id);

      // Real-time listener for live order updates from Supabase
      const channel = supabase
        .channel(`order-updates-${id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload) => {
            if (payload.new && (payload.new.id === id || payload.new.tracking_code === id)) {
              fetchTrackingData(id);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  const fetchTrackingData = async (trackingId: string) => {
    setLoading(true);
    setError('');
    setOrder(null);
    setGuepexData(null);
    
    try {
      let isGuepexId = trackingId.toLowerCase().startsWith('yal-');
      let orderData = null;
      
      // Query Supabase orders table by ID or by tracking_code
      let query = supabase.from('orders').select('*');
      if (!isNaN(Number(trackingId))) {
        query = query.or(`id.eq.${Number(trackingId)},tracking_code.eq.${trackingId}`);
      } else {
        query = query.eq('tracking_code', trackingId);
      }
      const { data } = await query.maybeSingle();
        
      if (data) {
        orderData = data;
        setOrder(data as Order);
      }

      // Fetch tracking info from Guepex
      // If it's a Guepex ID, fetch by tracking. Otherwise, fetch by order_id
      const queryParam = isGuepexId ? `tracking=${trackingId}` : `order_id=${trackingId}`;
      const res = await fetch(`/api/guepex-parcels?${queryParam}`);
      
      let json;
      try {
        json = await res.json();
      } catch (err) {
        throw new Error("Received an invalid response from the server. If on Vercel, ensure the backend API is deployed correctly.");
      }

      if (!res.ok) throw new Error(json?.error || "Failed to fetch tracking data.");
      if (json && json.data && json.data.length > 0) {
        setGuepexData(json.data[0]);
      } else {
        if (!orderData) {
          throw new Error("Order not found in our records or Guepex.");
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/track/${searchInput.trim()}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'livré': return <CheckCircle className="w-8 h-8 text-green-400" />;
      case 'annulé':
      case 'echèc livraison':
      case 'retourné au centre':
      case 'retour vers vendeur':
        return <XCircle className="w-8 h-8 text-red-500" />;
      case 'sorti en livraison':
      case 'en transit':
      case 'vers wilaya':
        return <Truck className="w-8 h-8 text-blue-400" />;
      case 'pas encore expédié':
      case 'en préparation':
        return <Package className="w-8 h-8 text-yellow-400" />;
      default:
        return <Clock className="w-8 h-8 text-white/40" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'livré': return 'text-green-400';
      case 'annulé':
      case 'echèc livraison':
      case 'retourné au centre':
      case 'retour vers vendeur':
        return 'text-red-500';
      case 'sorti en livraison':
      case 'en transit':
      case 'vers wilaya':
        return 'text-blue-400';
      case 'pas encore expédié':
      case 'en préparation':
        return 'text-yellow-400';
      default:
        return 'text-white/60';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-bold text-sm">Back</span>
      </button>

      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-serif font-bold text-white tracking-tight">Track Your Order</h1>
        {id && !loading && !error && (
          <p className="text-white/60 font-medium">Tracking Code: <span className="text-white tracking-wider font-mono bg-white/10 px-2 py-1 rounded">{id}</span></p>
        )}
      </div>

      {!id && (
        <div className="max-w-lg mx-auto bg-white/5 border border-white/10 p-8 rounded-[2rem] text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Truck className="w-48 h-48 text-primary" />
          </div>
          <div className="relative z-10">
            <Package className="w-12 h-12 text-primary-light mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">Find your package</h3>
            <p className="text-white/60 text-sm mb-8">Enter your tracking code (e.g. yal-12345) to see the live status of your delivery.</p>
            
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                placeholder="yal-xxxxx"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-grow bg-ink border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-center sm:text-left"
              />
              <button 
                type="submit"
                disabled={!searchInput.trim()}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Search className="w-4 h-4" /> Track
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/40 space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="font-bold tracking-wider">Locating package...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-red-400 font-bold">{error}</p>
        </div>
      ) : id && order && !guepexData ? (
        <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] text-center space-y-6">
          <Package className="w-16 h-16 text-white/20 mx-auto" />
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Order is being processed</h3>
            <p className="text-white/60">Your order is confirmed and our team is preparing it for shipping. Tracking details will appear here soon.</p>
          </div>
          <div className="pt-6 border-t border-white/10">
            <button onClick={() => fetchTrackingData(id)} className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors inline-flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>
      ) : id && guepexData ? (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-sm text-white/40 font-bold uppercase tracking-widest mb-1">Tracking Number</p>
              <p className="text-2xl font-mono text-white tracking-widest">{guepexData.tracking}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm text-white/40 font-bold uppercase tracking-widest mb-1">Total Amount Due</p>
              <p className="text-2xl font-black text-primary-light">
                {order ? order.total_price : guepexData.price} DA
              </p>
              <p className="text-xs text-white/50 mt-1">Includes books & delivery fee</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
            <h3 className="text-xl font-bold text-white mb-8 border-b border-white/10 pb-4">Tracking History</h3>
            <div className="relative pl-4 md:pl-8 space-y-8">
              {/* Vertical Line */}
              <div className="absolute left-8 md:left-12 top-2 bottom-2 w-0.5 bg-white/10" />

              {(() => {
                const currentStatus = (guepexData.last_status || '').toLowerCase();
                let currentStepIndex = 0;
                
                const isFailed = ['echèc', 'retour', 'annulé', 'échouée'].some(k => currentStatus.includes(k));
                const isDelivered = currentStatus === 'livré';

                if (isDelivered || isFailed) currentStepIndex = 3;
                else if (currentStatus.includes('sorti en livraison')) currentStepIndex = 2;
                else if (['vers wilaya', 'en transit', 'reçu au centre'].some(k => currentStatus.includes(k))) currentStepIndex = 1;

                const steps = [
                  { title: 'Order Confirmed', description: 'Package is being prepared', icon: Package, date: guepexData.date_creation },
                  { title: 'In Transit', description: guepexData.current_center_name || 'Package is on its way', icon: Truck, date: currentStepIndex >= 1 ? (currentStepIndex === 1 ? guepexData.date_last_status : '...') : null },
                  { title: 'Out for Delivery', description: 'Courier is delivering your package', icon: Clock, date: currentStepIndex >= 2 ? (currentStepIndex === 2 ? guepexData.date_last_status : '...') : null },
                  { 
                    title: isFailed ? 'Delivery Failed / Returned' : 'Delivered', 
                    description: isFailed ? (guepexData.reason || 'Package could not be delivered') : 'Package has been delivered successfully', 
                    icon: isFailed ? XCircle : CheckCircle, 
                    date: currentStepIndex === 3 ? guepexData.date_last_status : null,
                    isFailed: isFailed
                  }
                ];

                return steps.map((step, idx) => {
                  const isCompleted = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  const isPending = idx > currentStepIndex;

                  let dotColor = 'bg-ink border-white/20';
                  let iconColor = 'text-white/20';
                  
                  if (isCompleted || (isCurrent && idx === 3 && !step.isFailed)) {
                    dotColor = 'bg-green-500 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]';
                    iconColor = 'text-white';
                  } else if (isCurrent) {
                    if (step.isFailed) {
                      dotColor = 'bg-red-500 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]';
                      iconColor = 'text-white';
                    } else {
                      dotColor = 'bg-yellow-400 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]';
                      iconColor = 'text-ink';
                    }
                  }

                  const Icon = step.icon;

                  return (
                    <div key={idx} className="relative flex items-start gap-6">
                      <div className={`relative z-10 w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${dotColor}`}>
                        <Icon className={`w-4 h-4 md:w-5 md:h-5 ${iconColor}`} />
                      </div>
                      <div className={`flex-grow pt-1 md:pt-2 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
                          <h4 className={`text-lg font-bold ${isCurrent && !step.isFailed ? 'text-yellow-400' : isCurrent && step.isFailed ? 'text-red-400' : isCompleted || (isCurrent && idx===3) ? 'text-green-400' : 'text-white'}`}>
                            {step.title}
                          </h4>
                          {step.date && step.date !== '...' && (
                            <span className="text-xs font-mono text-white/40 whitespace-nowrap">{step.date}</span>
                          )}
                        </div>
                        <p className="text-sm text-white/60 mt-1">{step.description}</p>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          
          {order && order.items && order.items.length > 0 && (
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
              <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Order Summary</h4>
              <div className="space-y-3">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-white/80">{item.qty}x {item.title}</span>
                    <span className="text-white/60 font-mono">{(item.price * item.qty).toFixed(0)} DA</span>
                  </div>
                ))}
                {(() => {
                  const booksTotal = order.items.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0);
                  const deliveryPrice = (order.total_price || 0) - booksTotal;
                  return (
                    <>
                      {deliveryPrice > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-white/80">Delivery</span>
                          <span className="text-white/60 font-mono">+{deliveryPrice.toFixed(0)} DA</span>
                        </div>
                      )}
                      <div className="pt-3 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                        <span className="text-white">Total</span>
                        <span className="text-primary-light font-mono text-base">{order.total_price} DA</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Destination</h4>
            <p className="text-white font-medium">{guepexData.to_wilaya_name}, {guepexData.to_commune_name}</p>
            {guepexData.address && <p className="text-white/60 text-sm mt-1">{guepexData.address}</p>}
            {guepexData.is_stopdesk && (
               <p className="text-white/60 text-sm mt-2 inline-flex items-center gap-2">
                 <span className="bg-primary/20 text-primary-light px-2 py-0.5 rounded-full text-xs">Stop Desk</span> 
                 {guepexData.stopdesk_name}
               </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

