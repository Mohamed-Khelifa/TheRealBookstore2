import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Star, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Activity {
  id: string;
  name: string;
  city: string;
  action: 'bought' | 'reviewed';
  book: string;
  timestamp: string;
}

export const SocialProof = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
    let mounted = true;
    const fetchRecentActivity = async () => {
      try {
        const [ordersRes, reviewsRes] = await Promise.all([
          supabase.from('orders').select('id, customer_name, wilaya, items, created_at').order('created_at', { ascending: false }).limit(3),
          supabase.from('reviews').select('id, user_name, book_id, created_at').order('created_at', { ascending: false }).limit(3)
        ]);

        if (!mounted) return;
        
        let acts: Activity[] = [];
        
        if (ordersRes.data) {
          ordersRes.data.forEach((o: any) => {
            acts.push({
              id: o.id,
              name: o.customer_name?.split(' (')[0] || 'Someone',
              city: o.wilaya || 'Algeria',
              action: 'bought',
              book: typeof o.items === 'string' ? (JSON.parse(o.items)[0]?.title || 'a book') : (o.items?.[0]?.title || 'a book'),
              timestamp: o.created_at
            });
          });
        }
        
        if (reviewsRes.data && reviewsRes.data.length > 0) {
          // We need book titles for reviews. We can skip it to save egress or fetch it.
          // To save egress, just say "a book"
          reviewsRes.data.forEach((r: any) => {
            acts.push({
              id: r.id,
              name: r.user_name || 'A reader',
              city: 'A reader',
              action: 'reviewed',
              book: 'a book',
              timestamp: r.created_at
            });
          });
        }

        acts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(acts.slice(0, 5));
        
        if (acts.length > 0) {
          setCurrentIndex(0);
          setIsVisible(true);
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          hideTimerRef.current = setTimeout(() => {
            setIsVisible(false);
          }, 7000);
        }
      } catch (err) {}
    };

    fetchRecentActivity();

    return () => {
      mounted = false;
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (activities.length === 0) return null;

  const activity = activities[currentIndex];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -50, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -50, y: 20 }}
          className="fixed bottom-6 left-6 z-[100] hidden md:flex items-center space-x-4 bg-ink/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl max-w-xs pointer-events-none"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
            {activity.action === 'bought' ? (
              <ShoppingBag className="w-5 h-5 text-primary-light" />
            ) : (
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-white font-medium">
              <span className="font-bold text-primary-light">{activity.name}</span> 
              {activity.city !== 'A reader' ? ` from ${activity.city}` : ''}
            </p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
              Just {activity.action} <span className="text-white">"{activity.book}"</span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
