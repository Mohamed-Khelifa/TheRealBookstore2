import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NotificationState {
  id: string;
  name: string;
  numBooks: number;
  timestamp: string;
}

export function OrderNotification() {
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [minutesAgo, setMinutesAgo] = useState<number>(0);

  const processOrder = (newOrder: any) => {
    if (newOrder && newOrder.customer_name && newOrder.items) {
      const rawName = newOrder.customer_name as string;
      const personName = rawName.split(' (')[0] || 'Someone';
      
      let numBooks = 0;
      let rawItems: any = newOrder.items;
      try {
        if (typeof rawItems === 'string') {
          rawItems = JSON.parse(rawItems);
        }
        if (Array.isArray(rawItems)) {
          numBooks = rawItems.reduce((acc, item) => acc + (parseInt(item.qty as any) || 1), 0);
        }
      } catch (e) {
        numBooks = 1;
      }
      
      const orderTime = new Date(newOrder.created_at || Date.now()).getTime();
      const now = Date.now();
      const diffMinutes = Math.floor((now - orderTime) / 60000);
      
      if (diffMinutes <= 10) {
        const dismissed = JSON.parse(localStorage.getItem('dismissed_orders') || '[]');
        if (!dismissed.includes(newOrder.id)) {
          setNotification({
            id: newOrder.id,
            name: personName,
            numBooks: numBooks || 1,
            timestamp: newOrder.created_at || new Date().toISOString()
          });
          setMinutesAgo(diffMinutes);
        }
      }
    }
  };

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (data && data.length > 0) {
          processOrder(data[0]);
        }
      } catch (err) {}
    };
    fetchLatest();

    const channel = supabase.channel('public:orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          processOrder(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!notification) return;

    const interval = setInterval(() => {
      const orderTime = new Date(notification.timestamp).getTime();
      const diffMinutes = Math.floor((Date.now() - orderTime) / 60000);
      
      if (diffMinutes > 10) {
        setNotification(null);
      } else {
        setMinutesAgo(diffMinutes);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [notification]);

  const handleDismiss = () => {
    if (notification) {
      try {
        const dismissed = JSON.parse(localStorage.getItem('dismissed_orders') || '[]');
        dismissed.push(notification.id);
        if (dismissed.length > 50) dismissed.shift();
        localStorage.setItem('dismissed_orders', JSON.stringify(dismissed));
      } catch (e) {}
      setNotification(null);
    }
  };

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, x: -50, y: 50 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -50, y: 50, transition: { duration: 0.3 } }}
          className="fixed bottom-6 left-6 z-[100] max-w-sm mt-4 p-4 bg-ink/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(139,92,246,0.3)] flex items-start gap-4 cursor-pointer overflow-hidden group"
          onClick={handleDismiss}
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          
          <div className="bg-primary/20 p-2 rounded-xl border border-primary/30 shrink-0 mt-1.5">
            <ShoppingBag className="w-6 h-6 text-primary-light" />
          </div>

          <div className="flex-1 min-w-0 pr-6 space-y-1">
            <p className="text-sm text-white/90 font-medium">
              <span className="font-bold text-white pr-1">{notification.name}</span>
              just bought
            </p>
            <p className="text-sm font-bold text-primary-light leading-snug break-words">
              {notification.numBooks} book{notification.numBooks !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-white/40 pt-1">
              {minutesAgo === 0 ? 'Just now' : `${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`}
            </p>
          </div>

          <button 
            className="absolute top-2 right-2 p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
