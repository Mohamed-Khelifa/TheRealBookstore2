import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    // Realtime subscription for orders
    const orderChannel = supabase
      .channel('social-proof-orders')
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'orders' }, 
        (payload) => {
          const newOrder = payload.new as any;
          const activity: Activity = {
            id: newOrder.id,
            name: newOrder.customer_name.split(' (')[0],
            city: newOrder.wilaya,
            action: 'bought',
            book: newOrder.items?.[0]?.title || 'a book',
            timestamp: newOrder.created_at
          };
          
          setActivities(prev => [activity, ...prev].slice(0, 5));
          setCurrentIndex(0);
          setIsVisible(true);

          // Auto-hide after 7 seconds
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          hideTimerRef.current = setTimeout(() => {
            setIsVisible(false);
          }, 7000);
        }
      )
      .subscribe();

    // Realtime subscription for reviews
    const reviewChannel = supabase
      .channel('social-proof-reviews')
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'reviews' }, 
        async (payload) => {
          const newReview = payload.new as any;
          const { data: book } = await supabase.from('books').select('title').eq('id', newReview.book_id).single();
          
          const activity: Activity = {
            id: newReview.id,
            name: newReview.user_name,
            city: 'A reader',
            action: 'reviewed',
            book: book?.title || 'a book',
            timestamp: newReview.created_at
          };
          
          setActivities(prev => [activity, ...prev].slice(0, 5));
          setCurrentIndex(0);
          setIsVisible(true);

          // Auto-hide after 7 seconds
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          hideTimerRef.current = setTimeout(() => {
            setIsVisible(false);
          }, 7000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(reviewChannel);
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
