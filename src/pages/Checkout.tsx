import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Plus, Minus, CreditCard, Truck, MapPin, User, CheckCircle, ShoppingCart, Sparkles, Copy, MessageSquare, Trophy, Gift, Instagram, Facebook, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { useCart } from '../store/useCart';
import { ShippingRate } from '../types';
import { supabase } from '../lib/supabase';
import { formatOrderRef } from '../lib/utils';

import { HolographicReceipt } from '../components/HolographicReceipt';
import wilayaCommunes from '../../public/wilaya_communes.json';
import { LazyImage } from '../components/ui/lazy-image';
import { ECONOMIC_RATES, getEconomicRate } from '../data/shippingRates';
import { trackInitiateCheckout, trackAddPaymentInfo, trackPurchase } from '../lib/metaPixel';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, updateQty, removeItem, subtotal, clearCart } = useCart();
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [orderComplete, setOrderComplete] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string, percent: number, id?: string, one_time_use?: boolean } | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [discountRules, setDiscountRules] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    wilaya: '',
    baladia: '',
    agency: '',
    phone: '',
    phone2: '',
    instagram_account: '',
    email: '',
    notes: '',
    shipping_method: 'direct' as 'direct' | 'office'
  });
  const [agencies, setAgencies] = useState<{center_id: number, name: string, commune_name: string}[]>([]);
  const [isLoadingAgencies, setIsLoadingAgencies] = useState(false);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [isFetchingPoints, setIsFetchingPoints] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive active communes and wilayas based on shipping method
  const activeCommunesMap = wilayaCommunes as Record<string, string[]>;
  const activeWilayas = Object.keys(activeCommunesMap);

  useEffect(() => {
    if (items.length > 0) {
      trackInitiateCheckout(items, subtotal());
    }
  }, []);

  useEffect(() => {
    const fetchPoints = async () => {
      const normalizedPhone = formData.phone.trim().replace(/\s/g, '');
      if (normalizedPhone.length >= 9) { // Basic validation to avoid too many calls
        setIsFetchingPoints(true);
        try {
          const { data, error } = await supabase
            .from('loyalty_points')
            .select('points')
            .eq('phone', normalizedPhone)
            .maybeSingle();
          
          if (!error && data) {
            setUserPoints(data.points);
          } else {
            setUserPoints(0);
          }
        } catch (err) {
          console.error('Error fetching points:', err);
        } finally {
          setIsFetchingPoints(false);
        }
      } else {
        setUserPoints(null);
        setSelectedReward(null);
      }
    };

    const timer = setTimeout(fetchPoints, 500);
    return () => clearTimeout(timer);
  }, [formData.phone]);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setIsApplyingDiscount(true);
    try {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('code', discountCode.trim().toUpperCase())
        .single();

      if (error || !data) {
        alert('Invalid discount code');
        setAppliedDiscount(null);
      } else if (data.one_time_use && data.used) {
        alert('This discount code has already been used.');
        setAppliedDiscount(null);
      } else {
        setAppliedDiscount({ 
          code: data.code, 
          percent: data.percent,
          id: data.id,
          one_time_use: data.one_time_use 
        });
      }
    } catch (err) {
      console.error('Error applying discount:', err);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await supabase.from('shipping_rates').upsert(ECONOMIC_RATES, { onConflict: 'wilaya' });
      } catch (e) {
        console.warn('Auto-sync rates warning:', e);
      }

      const { data: ratesData } = await supabase.from('shipping_rates').select('*');
      if (ratesData && ratesData.length > 0) {
        setRates(ratesData);
      } else {
        setRates(ECONOMIC_RATES);
      }
      
      const { data: rulesData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'discount_rules')
        .maybeSingle();
      if (rulesData) setDiscountRules(rulesData.value);
      
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchAgencies = async () => {
      if (formData.shipping_method === 'office' && formData.wilaya) {
        setIsLoadingAgencies(true);
        try {
          const res = await fetch(`/api/guepex-centers?wilaya_name=${encodeURIComponent(formData.wilaya)}`);
          if (res.ok) {
            const data = await res.json();
            const agencyList = data.data || [];
            setAgencies(agencyList);
            if (agencyList.length > 0) {
              const currentAgency = agencyList.find((a: any) => String(a.center_id) === String(formData.agency));
              if (currentAgency) {
                if (currentAgency.commune_name) {
                  setFormData(prev => ({ ...prev, baladia: currentAgency.commune_name }));
                }
              } else {
                const first = agencyList[0];
                setFormData(prev => ({
                  ...prev,
                  agency: String(first.center_id),
                  baladia: first.commune_name || prev.baladia
                }));
              }
            } else {
              setFormData(prev => ({ ...prev, agency: '' }));
            }
          }
        } catch (e) {
          console.error("Failed to fetch agencies", e);
        } finally {
          setIsLoadingAgencies(false);
        }
      } else {
        setAgencies([]);
        setFormData(prev => ({ ...prev, agency: '' }));
      }
    };
    fetchAgencies();
  }, [formData.wilaya, formData.shipping_method]);

  const FREE_SHIPPING_THRESHOLD = 10000;
  const subtotalVal = subtotal();
  const currentRate = getEconomicRate(formData.wilaya) || rates.find(r => r.wilaya.toLowerCase().trim() === formData.wilaya.toLowerCase().trim());
  
  // Calculate Loyalty Rewards
  let loyaltyDiscount = 0;
  let isFreeShipping = subtotalVal >= FREE_SHIPPING_THRESHOLD;

  if (selectedReward === 'free_shipping' && userPoints !== null && userPoints >= 200) {
    isFreeShipping = true;
  } else if (selectedReward === 'discount_15' && userPoints !== null && userPoints >= 500) {
    loyaltyDiscount = subtotalVal * 0.15;
  } else if (selectedReward === 'free_novel' && userPoints !== null && userPoints >= 800) {
    const eligibleBook = items.find(item => item.price <= 2000);
    if (eligibleBook) {
      loyaltyDiscount = eligibleBook.price;
    }
  }

  const shippingCost = currentRate 
    ? (formData.shipping_method === 'direct' ? currentRate.rate_per_item : currentRate.office_pickup_rate)
    : 0;
  
  const finalShippingCost = isFreeShipping ? 0 : shippingCost;
  const discountAmount = appliedDiscount ? (subtotalVal * (appliedDiscount.percent / 100)) : 0;
  const total = Math.max(0, subtotalVal - discountAmount - loyaltyDiscount + finalShippingCost);

  const getValidationClass = (value: string) => {
    return value.trim() ? 'mandatory-filled' : 'mandatory-empty';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (items.length === 0) return alert('Your cart is empty. Please add books to your cart first.');
    if (!formData.full_name.trim()) return alert('Please enter your full name.');
    if (!formData.phone.trim()) return alert('Please enter your primary phone number.');
    if (!formData.wilaya) return alert('Please select your Wilaya.');
    
    // For office delivery, force commune to follow the selected agency's commune
    if (formData.shipping_method === 'office' && formData.agency && agencies.length > 0) {
      const chosenAgency = agencies.find(a => String(a.center_id) === String(formData.agency));
      if (chosenAgency && chosenAgency.commune_name) {
        formData.baladia = chosenAgency.commune_name;
      }
    }

    if (!formData.baladia.trim()) return alert('Please enter or select your Commune (Baladia).');
    if (formData.shipping_method === 'office' && !formData.agency) return alert('Please select a StopDesk Agency for office pickup.');
    if (!currentRate) return alert('Shipping rate not found for the selected Wilaya. Please re-select your Wilaya.');

    setIsSubmitting(true);
    trackAddPaymentInfo(items, total, {
      phone: formData.phone,
      full_name: formData.full_name,
      wilaya: formData.wilaya,
      baladia: formData.baladia
    });

    try {
        const userPhone = formData.phone.trim().replace(/\s/g, '');
        
        // 1. Handle Unregistered Direct Referral Link Usage
        try {
          const storedReferralCode = localStorage.getItem('bigdeal_referral_code');
          if (storedReferralCode && storedReferralCode !== userPhone) {
            // Check if referral connection already exists
            const { data: existingRef } = await supabase
              .from('referrals')
              .select('*')
              .eq('referred_phone', userPhone)
              .maybeSingle();

            if (!existingRef) {
               // Create referral and automatically award visit points (10) + purchase points (20)
               await supabase.from('referrals').insert([{
                  referrer_phone: storedReferralCode,
                  referred_phone: userPhone,
                  visit_points_awarded: true,
                  purchase_points_awarded: true
               }]);

               // Give referrer 30 points (10 visit + 20 purchase)
               const { data: referrerPoints } = await supabase
                 .from('loyalty_points')
                 .select('points')
                 .eq('phone', storedReferralCode)
                 .maybeSingle();

               const currentRefPts = referrerPoints?.points || 0;
               await supabase
                 .from('loyalty_points')
                 .upsert({ phone: storedReferralCode, points: currentRefPts + 30 }, { onConflict: 'phone' });
               
               // Clear to avoid double usage
               localStorage.removeItem('bigdeal_referral_code');
            }
          }

          // 1.5 Handle standard Referral Purchase Points (20 pts) in case they already visited/registered via link
          const { data: referral } = await supabase
            .from('referrals')
            .select('*')
            .eq('referred_phone', userPhone)
            .eq('purchase_points_awarded', false)
            .maybeSingle();

          if (referral) {
            // Award 20 points to referrer
            const { data: referrerPoints } = await supabase
              .from('loyalty_points')
              .select('points')
              .eq('phone', referral.referrer_phone)
              .maybeSingle();

            const currentPoints = referrerPoints?.points || 0;
            await supabase
              .from('loyalty_points')
              .upsert({ phone: referral.referrer_phone, points: currentPoints + 20 }, { onConflict: 'phone' });

            // Mark as awarded
            await supabase
              .from('referrals')
              .update({ purchase_points_awarded: true })
              .eq('id', referral.id);
          }
        } catch (refErr) {
          console.warn('Referral sync warning:', refErr);
        }

        // 2. Ensure user exists and handle reward deductions
        let finalPoints = 0;
        try {
          const { data: existingPoints } = await supabase
            .from('loyalty_points')
            .select('points')
            .eq('phone', userPhone)
            .maybeSingle();

          const currentPoints = existingPoints?.points || 0;
          finalPoints = currentPoints;

          if (selectedReward) {
            // Deduct points for reward
            let pointsToDeduct = 0;
            if (selectedReward === 'free_shipping') pointsToDeduct = 200;
            else if (selectedReward === 'discount_15') pointsToDeduct = 500;
            else if (selectedReward === 'free_novel') pointsToDeduct = 800;

            finalPoints = Math.max(0, finalPoints - pointsToDeduct);
          }

          await supabase
            .from('loyalty_points')
            .upsert({ phone: userPhone, points: finalPoints }, { onConflict: 'phone' });
        } catch (pointsErr) {
          console.warn('Points sync warning:', pointsErr);
        }

        // 3. Handle One-Time Use Promo Code
        try {
          if (appliedDiscount && appliedDiscount.one_time_use && appliedDiscount.id) {
            await supabase
              .from('discounts')
              .update({ used: true })
              .eq('id', appliedDiscount.id);
          }
        } catch (discErr) {
          console.warn('Discount update warning:', discErr);
        }

        // Determine Next-Purchase Discount Tier based on subtotalVal
        let nextPercent = 0;
        if (subtotalVal > 20000) {
          nextPercent = 21;
        } else if (subtotalVal > 15000) {
          nextPercent = 17;
        } else if (subtotalVal > 7000) {
          nextPercent = 10;
        }

        let generatedCouponCode = '';
        if (nextPercent > 0) {
          try {
            const clientNameSafe = formData.full_name.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'CLIENT';
            const randomNum = Math.floor(100 + Math.random() * 900);
            generatedCouponCode = `${clientNameSafe}${randomNum}`;

            await supabase.from('discounts').insert([{
              code: generatedCouponCode,
              percent: nextPercent,
              one_time_use: true,
              used: false
            }]);
          } catch (couponErr) {
            console.warn('Coupon generation warning:', couponErr);
          }
        }

        // 4. Submit Order
        const safeTotal = isNaN(total) ? 0 : total;
        const selectedAgencyObj = agencies.find(a => a.center_id.toString() === formData.agency);
        const agencyName = selectedAgencyObj ? `${selectedAgencyObj.name} (${selectedAgencyObj.commune_name})` : formData.agency;
        
        const initialNoteParts = [
          formData.shipping_method === 'office' && agencyName ? `Agency / StopDesk: ${agencyName}` : '',
          formData.notes ? formData.notes : ''
        ];
        if (generatedCouponCode) {
          initialNoteParts.push(`PROMO CODE: ${generatedCouponCode} (${nextPercent}% OFF)`);
        }
        const initialNote = initialNoteParts.filter(Boolean).join(' | ');

        const { data: maybeOrderData, error } = await supabase
          .from('orders')
          .insert([{
            items: items.map(i => ({ 
              book_id: i.book_id, 
              title: i.title, 
              author: i.author, 
              price: parseFloat(i.price as any) || 0, 
              qty: parseInt(i.qty as any) || 1 
            })),
            customer_name: `${formData.full_name}${formData.instagram_account ? ` (IG: @${formData.instagram_account})` : ''}${formData.phone2 ? ` (Alt: ${formData.phone2})` : ''}`,
            wilaya: formData.wilaya,
            baladia: formData.baladia,
            phone: formData.phone,
            shipping_method: formData.shipping_method,
            total_price: safeTotal,
            client_note: initialNote,
            status: 'PENDING',
            order_state: 'DID_NOT_ARRIVE'
          }])
          .select()
          .maybeSingle();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      const orderData = maybeOrderData;
      if (!orderData || !orderData.id) {
        throw new Error('Failed to create order in database');
      }

      if (orderData) {
        localStorage.setItem('bigdeal_user_phone', userPhone);
        
        let trackingId = '';
        let guepexSynced = false;
        
        try {
          // Sync with Guepex Express to get real tracking code
          const nameParts = formData.full_name.trim().split(' ');
          const firstname = nameParts[0] || 'Client';
          const familyname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '.';

          const res = await fetch('/api/guepex-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: orderData.id,
              firstname,
              familyname,
              contact_phone: [formData.phone, formData.phone2].filter(Boolean).map(p => p.replace(/\s+/g, '')).join(','),
              address: `${formData.wilaya}, ${formData.baladia}`,
              to_commune_name: formData.baladia,
              to_wilaya_name: formData.wilaya,
              price: safeTotal,
              product_list: items.map(i => `${i.qty}x ${i.title}`).join(', '),
              is_stopdesk: formData.shipping_method === 'office',
              stopdesk_id: formData.shipping_method === 'office' && formData.agency ? parseInt(formData.agency) : null
            })
          });
          
          const json = await res.json().catch(() => null);

          if (res.ok) {
            const guepexResponseData = json?.data;
            const parcelData = guepexResponseData?.[orderData.id] || 
                              (Array.isArray(guepexResponseData) ? guepexResponseData.find((p: any) => p.tracking) : null) || 
                              (guepexResponseData && typeof guepexResponseData === 'object' ? Object.values(guepexResponseData)[0] : null);

            if (parcelData && (parcelData.tracking || parcelData.tracking_code)) {
              trackingId = parcelData.tracking || parcelData.tracking_code;
              guepexSynced = true;
            }
          } else {
            console.warn('Guepex sync warning response:', json);
          }
        } catch (guepexErr) {
          console.warn('Guepex sync network or parse exception:', guepexErr);
        }

        if (!trackingId) {
          trackingId = `BD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        }

        // Update Supabase to store generated promo discount code in client_note
        const finalNoteParts = [
          formData.shipping_method === 'office' && agencyName ? `Agency / StopDesk: ${agencyName}` : '',
          formData.notes ? formData.notes : ''
        ];
        if (generatedCouponCode) {
          finalNoteParts.push(`PROMO CODE: ${generatedCouponCode} (${nextPercent}% OFF)`);
        }
        const finalNote = finalNoteParts.filter(Boolean).join(' | ');

        await supabase.from('orders').update({
          client_note: finalNote,
          tracking_code: trackingId
        }).eq('id', orderData.id);

        // Track Purchase event via Meta Pixel & Conversions API (CAPI) with order ID deduplication
        trackPurchase(
          {
            id: String(orderData.id),
            total_price: total,
            items: items
          },
          {
            phone: formData.phone,
            full_name: formData.full_name,
            wilaya: formData.wilaya,
            baladia: formData.baladia
          }
        );

        // Send notification to Telegram
        fetch('/api/notify-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderData.id,
            order_ref: formatOrderRef(orderData.id),
            tracking_code: trackingId,
            customer_name: `${formData.full_name}${formData.instagram_account ? ` (IG: @${formData.instagram_account})` : ''}`,
            total_price: safeTotal,
            wilaya: formData.wilaya,
            baladia: formData.baladia,
            phone: formData.phone,
            shipping_method: formData.shipping_method === 'office' ? 'StopDesk / Agency' : 'Home Delivery',
            notes: finalNote,
            items: items
          })
        }).catch(err => console.error('Notification failed:', err));

        setOrderComplete(trackingId);
        clearCart();
      }
    } catch (err: any) {
      console.error('Order submission error:', err);
      let errMsg = 'Unknown error';
      if (typeof err === 'string') {
        errMsg = err;
      } else if (err instanceof Error) {
        errMsg = err.message;
      } else if (err && typeof err === 'object') {
        if (typeof err.message === 'string') {
          errMsg = err.message;
        } else if (err.error) {
          errMsg = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
        } else if (err.details) {
          errMsg = typeof err.details === 'string' ? err.details : (typeof err.details === 'object' ? JSON.stringify(err.details, null, 2) : String(err.details));
        } else {
          try {
            errMsg = JSON.stringify(err, null, 2);
          } catch {
            errMsg = String(err);
          }
        }
      }
      alert(`Failed to place order: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (orderComplete) {
      // Use a small timeout to ensure the DOM has updated and scroll to top
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }, 50);
    }
  }, [orderComplete]);

  if (orderComplete) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 md:py-20 relative z-10 min-h-[60vh]">
        <ConfettiOverlay />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-2xl rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-2xl border border-white/10 text-center space-y-6 md:space-y-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-primary-light to-primary" />
          
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ delay: 0.2, type: 'spring' }}
            className="flex justify-center"
          >
            <div className="bg-green-500/20 p-8 rounded-full shadow-inner border border-green-500/30">
              <CheckCircle className="w-24 h-24 text-green-400" />
            </div>
          </motion.div>

          <div className="space-y-4 max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-serif font-bold purplish-text-gradient">
              A New Adventure Awaits <span className="text-red-500">❤</span>
            </h1>
            <p className="text-lg md:text-2xl text-white/80 font-serif italic leading-relaxed">
              "Every book chosen is a doorway opened, a quiet universe waiting to unfold. Thank you from the bottom of our hearts for trusting BigDeal Bookstore with your literary journey."
            </p>
            <div className="bg-emerald-500/15 border border-emerald-500/35 rounded-2xl p-4 md:p-6 text-center space-y-2 max-w-xl mx-auto shadow-xl backdrop-blur-md mt-4">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-base md:text-lg">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <span>Important Order Confirmation</span>
              </div>
              <p className="text-white/90 text-sm md:text-base leading-relaxed font-medium">
                Please keep an eye on your phone! You will receive a <strong className="text-emerald-300 font-bold underline decoration-emerald-400/50 underline-offset-4">confirmation WhatsApp message or a call this Friday</strong> regarding your order delivery.
              </p>
            </div>
          </div>

          <HolographicReceipt 
            orderId={orderComplete} 
            fullName={formData.full_name} 
            date={new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} 
          />

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
          >
            <Link 
              to={`/track/${orderComplete}`}
              className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors shadow-lg shadow-primary/20 w-full sm:w-auto relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              <Truck className="w-5 h-5 relative z-10" /> 
              <span className="relative z-10">Track Order</span>
            </Link>
            <Link 
              to="/"
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
            >
              Continue Shopping
            </Link>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 text-white p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-4 shadow-xl relative group mt-8"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-lg md:text-xl font-bold flex flex-col items-center justify-center gap-2">
              <span className="text-center">If you like the book and service, consider sending a review on our Instagram page!</span>
              <span className="text-2xl">😊</span>
            </p>
            <a 
              href="https://www.instagram.com/bigdealbookstore/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-primary-light hover:underline text-lg font-bold notranslate mt-2"
            >
              @bigdealbookstore
            </a>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-primary/10 via-primary-light/5 to-primary/10 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-2 border-white/10 space-y-6 md:space-y-8 relative overflow-hidden group"
          >
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
            
            <div className="space-y-3 relative z-10">
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-white">Don't Pay for Your Next Book! 📚</h3>
              <p className="text-white/60 text-base md:text-lg max-w-xl mx-auto">
                You've just joined the most exclusive circle of readers in Algeria. 
                Why stop here? Share the magic with your friends and get your next masterpiece <span className="text-primary-light font-bold underline decoration-wavy underline-offset-4">entirely on us.</span>
              </p>
            </div>
            
            <div className="flex flex-col space-y-4 relative z-10">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="bg-white/5 backdrop-blur-xl px-6 py-4 rounded-2xl border-2 border-white/10 font-mono text-sm text-primary-light font-bold shadow-inner w-full max-w-md text-center">
                  {window.location.origin}?ref={formData.phone}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}?ref=${formData.phone}`);
                      alert('Link copied! Go spread the word! 🚀');
                    }}
                    className="bg-white/10 text-white px-4 py-4 rounded-2xl font-bold hover:bg-white/20 transition-all shadow-xl border border-white/10 flex items-center justify-center gap-2 group/btn w-full"
                  >
                    <Copy className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                    <span>Copy Link</span>
                  </button>
                  <a 
                    href={`https://wa.me/?text=${encodeURIComponent(`Check out BigDeal Bookstore! I just ordered some amazing books. Use my link to get exclusive rewards: ${window.location.origin}?ref=${formData.phone}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366] text-white px-4 py-4 rounded-2xl font-bold hover:bg-[#128C7E] transition-all shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 w-full"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>WhatsApp</span>
                  </a>
                  <a 
                    href={`https://www.facebook.com/dialog/send?link=${encodeURIComponent(`${window.location.origin}?ref=${formData.phone}`)}&app_id=257711807931668&redirect_uri=${encodeURIComponent(`${window.location.origin}?ref=${formData.phone}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#0084FF] text-white px-4 py-4 rounded-2xl font-bold hover:bg-[#0073E6] transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 w-full"
                  >
                    <Facebook className="w-5 h-5" />
                    <span>Messenger</span>
                  </a>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}?ref=${formData.phone}`);
                      alert('Link copied! You can now paste it in your Instagram Story or Bio! 📸');
                    }}
                    className="bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white px-4 py-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl shadow-pink-500/20 flex items-center justify-center gap-2 w-full"
                  >
                    <Instagram className="w-5 h-5" />
                    <span>Instagram</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10">
              <div className="flex flex-wrap justify-center gap-6 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-primary-light" /> 10 pts per visit</span>
                <span className="flex items-center gap-1.5"><Trophy className="w-3 h-3 text-primary-light" /> 20 pts per first buy</span>
                <span className="flex items-center gap-1.5"><Gift className="w-3 h-3 text-primary-light" /> Free books at 800 pts</span>
              </div>
            </div>
          </motion.div>

          <div className="pt-8">
            <button 
              onClick={() => navigate('/')} 
              className="bg-primary text-white px-12 py-5 rounded-full font-bold hover:bg-primary-light transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)] text-lg"
            >
              Return to Shop
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 relative z-20">
      <h1 className="text-4xl font-serif font-bold mb-12 text-white">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {/* Unified Cart & Next-Order VIP Reward Program Panel */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-950/90 via-black/90 to-indigo-950/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-yellow-500/40 shadow-[0_0_50px_rgba(139,92,246,0.3)] space-y-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header & Subtotal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center shadow-[0_0_25px_rgba(250,204,21,0.6)]">
                  <Trophy className="w-7 h-7 text-black animate-bounce" />
                </div>
                <div>
                  <span className="text-[11px] font-black text-yellow-300 uppercase tracking-widest bg-yellow-400/10 px-3.5 py-1 rounded-full border border-yellow-400/30">Your Cart & VIP Rewards</span>
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-white mt-1.5">
                    {subtotalVal > 20000 
                      ? "👑 Tier 3 Unlocked! 21% OFF Your Next Order!" 
                      : subtotalVal > 15000 
                      ? "🔥 Tier 2 Unlocked! (17% OFF for Next Order)" 
                      : subtotalVal > 7000 
                      ? "🚀 Tier 1 Unlocked! (10% OFF for Next Order)" 
                      : "💡 Unlock VIP Next-Order Discounts Below!"}
                  </h3>
                </div>
              </div>
              <div className="text-right bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
                <span className="text-[10px] text-white/50 uppercase tracking-wider block font-bold">Cart Subtotal</span>
                <span className="text-2xl font-black font-mono text-yellow-300">{subtotalVal.toLocaleString()} DA</span>
              </div>
            </div>

            {/* High-End Symmetric Next-Order VIP Reward Progress Bar */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 w-full relative backdrop-blur-md space-y-6 relative z-10 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left w-full">
                <div className="w-full sm:w-auto flex-1">
                  <span className="inline-block text-[10px] uppercase tracking-widest font-black text-yellow-300 bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20 mb-2">
                    ⭐ Next-Order VIP Reward Milestones
                  </span>
                  <p className="text-sm font-medium text-white/90">
                    {subtotalVal > 20000 
                      ? "Maximum VIP Tier Reached! You have secured 21% OFF your entire next purchase." 
                      : subtotalVal > 15000 
                      ? "Add " + (20000 - subtotalVal).toLocaleString() + " DA more to upgrade from 17% to 21% OFF your next order!" 
                      : subtotalVal > 7000 
                      ? "Add " + (15000 - subtotalVal).toLocaleString() + " DA more to upgrade from 10% to 17% OFF your next order!" 
                      : "Add " + (7000 - subtotalVal).toLocaleString() + " DA more to unlock your first 10% OFF next-order voucher!"}
                  </p>
                </div>
                <div className="text-right bg-black/40 px-4 py-2 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest block font-bold">Milestone Progress</span>
                  <span className="text-lg font-mono font-black text-yellow-300">
                    {Math.min(100, Math.round((subtotalVal / 20000) * 100))}%
                  </span>
                </div>
              </div>

              {/* Symmetric Centered Progress Bar with Precise Milestone Markers */}
              <div className="space-y-6 pt-4 pb-2">
                <div className="relative pt-2 pb-6 px-1">
                  {/* Track */}
                  <div className="w-full h-5 bg-black/70 rounded-full overflow-hidden p-1 border border-white/20 shadow-inner relative flex items-center">
                    {/* Fill */}
                    <motion.div 
                      className={`h-full rounded-full relative transition-all duration-700 ${subtotalVal >= 20000 ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.9)]' : subtotalVal >= 7000 ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 shadow-[0_0_20px_rgba(250,204,21,0.8)]' : 'bg-gradient-to-r from-amber-600 to-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(3, (subtotalVal / 20000) * 100))}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                    </motion.div>

                    {/* Milestone Marker Pins positioned precisely at 35% (7k), 75% (15k), and 100% (20k) */}
                    <div className="absolute inset-0 w-full flex justify-between items-center px-4 pointer-events-none z-10">
                      {/* 7,000 DA (35%) */}
                      <div className="absolute left-[35%] -translate-x-1/2 flex flex-col items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500 shadow-md ${subtotalVal >= 7000 ? 'bg-emerald-400 text-black border-2 border-white shadow-[0_0_20px_#34d399] scale-110' : 'bg-yellow-400 text-black border-2 border-black/50 shadow-[0_0_10px_#facc15]'}`}>
                          <span className="text-[10px] font-black">{subtotalVal >= 7000 ? '✓' : '•'}</span>
                        </div>
                      </div>

                      {/* 15,000 DA (75%) */}
                      <div className="absolute left-[75%] -translate-x-1/2 flex flex-col items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500 shadow-md ${subtotalVal >= 15000 ? 'bg-emerald-400 text-black border-2 border-white shadow-[0_0_20px_#34d399] scale-110' : 'bg-yellow-400 text-black border-2 border-black/50 shadow-[0_0_10px_#facc15]'}`}>
                          <span className="text-[10px] font-black">{subtotalVal >= 15000 ? '✓' : '•'}</span>
                        </div>
                      </div>

                      {/* 20,000 DA (100%) */}
                      <div className="absolute right-2 -translate-x-1/2 flex flex-col items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500 shadow-md ${subtotalVal >= 20000 ? 'bg-emerald-400 text-black border-2 border-white shadow-[0_0_25px_#34d399] scale-125' : 'bg-yellow-400 text-black border-2 border-black/50 shadow-[0_0_10px_#facc15]'}`}>
                          <span className="text-[10px] font-black">{subtotalVal >= 20000 ? '👑' : '•'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Labels Below Track */}
                  <div className="flex justify-between items-center text-xs pt-3 px-2">
                    <div className="text-left">
                      <span className={`font-bold block ${subtotalVal >= 7000 ? 'text-emerald-300 font-black' : 'text-yellow-300'}`}>7,000 DA</span>
                      <span className={`text-[10px] font-bold ${subtotalVal >= 7000 ? 'text-emerald-400' : 'text-white/70'}`}>10% Next-Order OFF</span>
                    </div>

                    <div className="text-center">
                      <span className={`font-bold block ${subtotalVal >= 15000 ? 'text-emerald-300 font-black' : 'text-yellow-300'}`}>15,000 DA</span>
                      <span className={`text-[10px] font-bold ${subtotalVal >= 15000 ? 'text-emerald-400' : 'text-white/70'}`}>17% Next-Order OFF</span>
                    </div>

                    <div className="text-right">
                      <span className={`font-bold block ${subtotalVal >= 20000 ? 'text-emerald-300 font-black' : 'text-yellow-300'}`}>20,000 DA</span>
                      <span className={`text-[10px] font-bold ${subtotalVal >= 20000 ? 'text-emerald-400' : 'text-white/70'}`}>21% Next-Order OFF</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tiers Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${subtotalVal > 7000 ? 'bg-gradient-to-br from-yellow-500/20 to-primary/40 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'bg-white/5 border-white/10 opacity-70'}`}>
                  <div>
                    <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-widest block">&gt; 7k DA Spend</span>
                    <span className="text-base font-black text-white">10% Next-Order OFF</span>
                  </div>
                  {subtotalVal > 7000 ? (
                    <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow">UNLOCKED</span>
                  ) : (
                    <span className="text-[10px] font-mono text-yellow-300/80 bg-black/40 px-2 py-0.5 rounded-lg border border-yellow-500/20">{(7000 - subtotalVal).toLocaleString()} DA left</span>
                  )}
                </div>

                <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${subtotalVal > 15000 ? 'bg-gradient-to-br from-yellow-500/20 to-primary/40 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'bg-white/5 border-white/10 opacity-70'}`}>
                  <div>
                    <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-widest block">&gt; 15k DA Spend</span>
                    <span className="text-base font-black text-white">17% Next-Order OFF</span>
                  </div>
                  {subtotalVal > 15000 ? (
                    <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow">UNLOCKED</span>
                  ) : (
                    <span className="text-[10px] font-mono text-yellow-300/80 bg-black/40 px-2 py-0.5 rounded-lg border border-yellow-500/20">{(15000 - subtotalVal).toLocaleString()} DA left</span>
                  )}
                </div>

                <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${subtotalVal > 20000 ? 'bg-gradient-to-br from-yellow-500/20 to-primary/40 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'bg-white/5 border-white/10 opacity-70'}`}>
                  <div>
                    <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-widest block">&gt; 20k DA Spend</span>
                    <span className="text-base font-black text-white">21% Next-Order OFF</span>
                  </div>
                  {subtotalVal > 20000 ? (
                    <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow">UNLOCKED</span>
                  ) : (
                    <span className="text-[10px] font-mono text-yellow-300/80 bg-black/40 px-2 py-0.5 rounded-lg border border-yellow-500/20">{(20000 - subtotalVal).toLocaleString()} DA left</span>
                  )}
                </div>
              </div>
            </div>

            {/* Cart Items List inside the same panel */}
            <div className="border-t border-white/10 pt-6 space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-primary-light">
                  <ShoppingCart className="w-4 h-4" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Cart Items ({items.length})</h4>
                </div>
                <span className="text-xs font-bold text-white/50">Modify Quantities Below</span>
              </div>

              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div 
                      key={item.book_id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center space-x-4 bg-white/5 p-3.5 rounded-2xl border border-white/5 group"
                    >
                      <div className="w-14 h-18 flex-shrink-0 rounded-lg overflow-hidden shadow-sm border border-white/10">
                        <LazyImage src={item.cover_image_url || 'https://picsum.photos/seed/book/100/150'} className="w-full h-full object-cover" alt={item.title} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="notranslate font-bold text-xs truncate text-white">{item.title}</h3>
                        <p className="text-primary-light font-bold text-xs">{item.price.toFixed(2)} DA</p>
                        
                        <div className="flex items-center space-x-4 mt-1.5">
                          <div className="flex items-center bg-white/5 rounded-full px-2.5 py-0.5 border border-white/10 relative z-30">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQty(item.book_id, Math.max(1, item.qty - 1));
                              }} 
                              className="p-1 hover:text-primary-light text-white/60 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="mx-2 text-xs font-bold w-4 text-center text-white">{item.qty}</span>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQty(item.book_id, item.qty + 1);
                              }} 
                              className="p-1 hover:text-primary-light text-white/60 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeItem(item.book_id)}
                        className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {items.length === 0 && (
                  <div className="text-center py-8 space-y-3">
                    <p className="text-white/30 text-xs font-medium">Your cart is empty.</p>
                    <button onClick={() => navigate('/')} className="text-primary-light text-xs font-bold hover:underline">Go back to shopping</button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/5 p-3.5 rounded-2xl border border-yellow-500/20 text-xs text-white/90 flex items-center gap-3 relative z-10 backdrop-blur-sm">
              <Gift className="w-5 h-5 text-yellow-300 flex-shrink-0 animate-bounce" />
              <p><strong>Note:</strong> The discount applies on your whole next checkout list (NOT ONLY ONE BOOK)! Your secret coupon code will be automatically included in your order notes upon confirmation.</p>
            </div>
          </motion.div>

          <section className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-white/10 space-y-6">
            <div className="flex items-center space-x-3 text-primary-light"><User className="w-5 h-5" /><h2 className="text-xl font-bold text-white">Contact Info</h2></div>
            
            {/* Loyalty Points Info */}
            {userPoints !== null && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary-light" />
                    <span className="font-bold text-white notranslate">BigDeal Loyalty Points: <span className="text-primary-light">{userPoints} pts</span></span>
                  </div>
                  {isFetchingPoints && <span className="text-[10px] font-bold text-primary-light animate-pulse uppercase">Updating...</span>}
                </div>

                {userPoints >= 200 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Redeem Your Rewards</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedReward(selectedReward === 'free_shipping' ? null : 'free_shipping')}
                        disabled={userPoints < 200}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${selectedReward === 'free_shipping' ? 'border-primary bg-primary/20' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                      >
                        <p className="text-xs font-bold text-white">Free Shipping</p>
                        <p className="text-[10px] text-white/40">200 pts</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedReward(selectedReward === 'discount_15' ? null : 'discount_15')}
                        disabled={userPoints < 500}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${selectedReward === 'discount_15' ? 'border-primary bg-primary/20' : 'border-white/5 bg-white/5 hover:border-white/20'} ${userPoints < 500 ? 'opacity-40 grayscale' : ''}`}
                      >
                        <p className="text-xs font-bold text-white">15% Discount</p>
                        <p className="text-[10px] text-white/40">500 pts</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const hasEligibleBook = items.some(i => i.price <= 2000);
                          if (!hasEligibleBook && selectedReward !== 'free_novel') {
                            alert('To redeem a free book, you must have at least one book in your cart priced 2000 DA or less.');
                            return;
                          }
                          setSelectedReward(selectedReward === 'free_novel' ? null : 'free_novel');
                        }}
                        disabled={userPoints < 800}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${selectedReward === 'free_novel' ? 'border-primary bg-primary/20' : 'border-white/5 bg-white/5 hover:border-white/20'} ${userPoints < 800 ? 'opacity-40 grayscale' : ''}`}
                      >
                        <p className="text-xs font-bold text-white">Free Book</p>
                        <p className="text-[10px] text-white/40">800 pts (Max 2000DA)</p>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Full Name</label>
                <input type="text" required placeholder="Full Name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary/40 outline-none transition-all ${getValidationClass(formData.full_name)}`} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Primary Phone (Required)</label>
                <input type="tel" required placeholder="XXXXXXXXXX" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary/40 outline-none transition-all ${getValidationClass(formData.phone)}`} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Secondary Phone (Optional)</label>
                <input type="tel" placeholder="XXXXXXXXXX" value={formData.phone2} onChange={e => setFormData({...formData, phone2: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary/40 outline-none" />
              </div>
              
              <div className="md:col-span-2 space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-white/40 font-bold">@</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Instagram Username (Optional)" 
                    value={formData.instagram_account} 
                    onChange={e => setFormData({...formData, instagram_account: e.target.value})} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary/40 outline-none transition-all text-white placeholder:text-white/20" 
                  />
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white/60 leading-relaxed italic relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
                  <p>
                    "Please note that there may be slight variations between the cover image in our gallery and the physical book you receive. This is often due to different editions or publisher updates. Rest assured, we guarantee the content is identical and of the highest quality. If there is a major difference, we will reach out to you personally via Instagram or phone to confirm your approval before shipping. <strong>Thank you for your confidentiality</strong> 😊"
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-white/10 space-y-6">
            <div className="flex items-center space-x-3 text-primary-light"><Truck className="w-5 h-5" /><h2 className="text-xl font-bold text-white">Shipping Method</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setFormData({...formData, shipping_method: 'direct'})}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.shipping_method === 'direct' ? 'border-primary bg-primary/20' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
              >
                <p className="font-bold text-white">Home Delivery</p>
                <p className="text-xs text-white/40">Delivered directly to your door</p>
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, shipping_method: 'office'})}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.shipping_method === 'office' ? 'border-primary bg-primary/20' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
              >
                <p className="font-bold text-white">Office Pickup</p>
                <p className="text-xs text-white/40">Pick up from our nearest office</p>
              </button>
            </div>
            
            <div className="flex items-start gap-3 mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200/80 leading-relaxed">
                <strong>Tip from us:</strong> We personally advise choosing <strong>Office Pickup</strong> if possible. It's often faster and more reliable, as coordinating with delivery drivers can sometimes be tricky!
              </p>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-white/10 space-y-6">
            <div className="flex items-center space-x-3 text-primary-light"><MapPin className="w-5 h-5" /><h2 className="text-xl font-bold text-white">Shipping Address</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <select required value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value, baladia: ''})} className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all ${getValidationClass(formData.wilaya)}`}>
                <option value="" className="bg-ink">Select Wilaya</option>
                {activeWilayas.map(w => <option key={w} value={w} className="bg-ink">{w}</option>)}
              </select>
              <select 
                required 
                value={formData.baladia} 
                onChange={e => {
                  const selectedBaladia = e.target.value;
                  if (formData.shipping_method === 'office' && agencies.length > 0) {
                    const matchingAgency = agencies.find(a => 
                      (a.commune_name || '').toLowerCase().trim() === selectedBaladia.toLowerCase().trim() ||
                      (a.name || '').toLowerCase().trim().includes(selectedBaladia.toLowerCase().trim())
                    );
                    if (matchingAgency) {
                      setFormData(prev => ({
                        ...prev,
                        baladia: matchingAgency.commune_name || selectedBaladia,
                        agency: String(matchingAgency.center_id)
                      }));
                    } else {
                      const currentAgency = agencies.find(a => String(a.center_id) === String(formData.agency)) || agencies[0];
                      if (currentAgency && currentAgency.commune_name) {
                        setFormData(prev => ({
                          ...prev,
                          baladia: currentAgency.commune_name,
                          agency: String(currentAgency.center_id)
                        }));
                      } else {
                        setFormData(prev => ({ ...prev, baladia: selectedBaladia }));
                      }
                    }
                  } else {
                    setFormData(prev => ({ ...prev, baladia: selectedBaladia }));
                  }
                }} 
                className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all ${getValidationClass(formData.baladia)} cursor-pointer`}
              >
                {!formData.wilaya ? (
                  <option value="" className="bg-ink text-white/50">Select Wilaya First</option>
                ) : (
                  <>
                    <option value="" className="bg-ink">Select Commune (Baladia)</option>
                    {activeCommunesMap[formData.wilaya]?.map(c => <option key={c} value={c} className="bg-ink">{c}</option>)}
                  </>
                )}
              </select>
              {formData.shipping_method === 'office' && (
                <div className="md:col-span-2">
                  <select 
                    required 
                    value={formData.agency} 
                    onChange={e => {
                      const selectedId = e.target.value;
                      const chosen = agencies.find(a => String(a.center_id) === String(selectedId));
                      if (chosen && chosen.commune_name) {
                        setFormData(prev => ({
                          ...prev,
                          agency: selectedId,
                          baladia: chosen.commune_name
                        }));
                      } else {
                        setFormData(prev => ({ ...prev, agency: selectedId }));
                      }
                    }} 
                    className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all ${getValidationClass(formData.agency)} cursor-pointer`}
                  >
                    {!formData.wilaya ? (
                      <option value="" className="bg-ink text-white/50">Select Wilaya First</option>
                    ) : isLoadingAgencies ? (
                      <option value="" className="bg-ink text-white/50">Loading Agencies...</option>
                    ) : agencies.length === 0 ? (
                      <option value="" className="bg-ink text-white/50">No agencies available in this Wilaya</option>
                    ) : (
                      <>
                        <option value="" className="bg-ink">Select Agency</option>
                        {agencies.map(a => (
                          <option key={a.center_id} value={a.center_id} className="bg-ink">{a.name} ({a.commune_name})</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-white/10 space-y-6">
            <h2 className="text-xl font-bold text-white">Special Note / Instructions (Optional)</h2>
            <textarea 
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Any special instructions for delivery or packaging..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all resize-none h-24"
            />
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/10 sticky top-24 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Summary</h2>
              <div className="bg-primary/20 text-primary-light px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/30">
                {items.length} {items.length === 1 ? 'Book' : 'Books'}
              </div>
            </div>

            {/* Free Shipping Progress Bar */}
            {!isFreeShipping && subtotalVal > 0 && (
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-white/40">Free Shipping Progress</span>
                  <span className="text-primary-light">{Math.round((subtotalVal / FREE_SHIPPING_THRESHOLD) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (subtotalVal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                    className="h-full bg-gradient-to-r from-primary to-primary-light"
                  />
                </div>
                <p className="text-[10px] text-white/40 italic">
                  Add <span className="text-white font-bold">{(FREE_SHIPPING_THRESHOLD - subtotalVal).toFixed(0)} DA</span> more for <span className="text-primary-light font-bold">FREE SHIPPING</span>!
                </p>
              </div>
            )}
            {isFreeShipping && subtotalVal > 0 && (
              <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 flex items-center space-x-3 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">You've unlocked FREE SHIPPING!</span>
              </div>
            )}
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Discount Code</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter code" 
                  value={discountCode}
                  onChange={e => setDiscountCode(e.target.value)}
                  className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-white placeholder:text-white/20"
                />
                <button 
                  onClick={handleApplyDiscount}
                  disabled={isApplyingDiscount || !discountCode}
                  className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-light transition-colors disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              {appliedDiscount && (
                <div className="flex items-center justify-between bg-green-500/20 text-green-400 px-3 py-2 rounded-lg text-xs font-bold border border-green-500/30">
                  <span>Code {appliedDiscount.code} Applied!</span>
                  <span>-{appliedDiscount.percent}%</span>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-6 border-t border-white/10">
              <div className="flex justify-between text-white/40"><span>Subtotal</span><span>{subtotalVal.toFixed(2)} DA</span></div>
              {appliedDiscount && (
                <div className="flex justify-between text-green-400 font-medium">
                  <span>Discount ({appliedDiscount.percent}%)</span>
                  <span>-{discountAmount.toFixed(2)} DA</span>
                </div>
              )}
              <div className="flex justify-between text-white/40"><span>Shipping</span><span>{finalShippingCost.toFixed(2)} DA</span></div>
              {selectedReward && (
                <div className="flex justify-between text-primary-light font-bold animate-pulse">
                  <span>Loyalty Reward Applied!</span>
                  <span>-{loyaltyDiscount > 0 ? loyaltyDiscount.toFixed(2) : finalShippingCost === 0 ? shippingCost.toFixed(2) : 0} DA</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-3 border-t border-white/10 text-white"><span>Total</span><span className="text-primary-light">{total.toFixed(0)} DA</span></div>
            </div>

            {/* Points Earning Indicator */}
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <div className="flex items-center space-x-2 text-primary-light">
                <Trophy className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Points Earning</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-white">+{10 + Math.floor(total / 100)} Points</span>
                <p className="text-[8px] text-white/30 uppercase tracking-tighter">10 base + 1 per 100DA</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-white/40 bg-white/5 py-3 rounded-xl border border-white/5">
                <Truck className="w-4 h-4 text-primary-light" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Delivery within or less than 2 weeks</span>
              </div>
              <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-primary text-white py-5 rounded-2xl font-bold text-lg hover:bg-primary-light transition-all shadow-[0_0_40px_rgba(139,92,246,0.3)] hover:shadow-[0_0_60px_rgba(139,92,246,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3">
                {isSubmitting ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-6 h-6" />
                    <span>Confirm Order</span>
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ConfettiOverlay() {
  const particles = Array.from({ length: 45 });
  const colors = ['#facc15', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c'];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((_, i) => {
        const randomX = Math.random() * 100;
        const randomDelay = Math.random() * 2;
        const randomDuration = 2.5 + Math.random() * 3;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 8 + Math.random() * 14;
        const isCircle = Math.random() > 0.5;

        return (
          <motion.div
            key={i}
            initial={{ y: -30, x: `${randomX}vw`, opacity: 1, rotate: 0 }}
            animate={{ 
              y: '105vh', 
              x: `${randomX + (Math.random() * 25 - 12.5)}vw`, 
              rotate: 360 + Math.random() * 360,
              opacity: [1, 1, 0.8, 0]
            }}
            transition={{ 
              duration: randomDuration, 
              delay: randomDelay, 
              ease: "easeOut",
              repeat: Infinity,
              repeatDelay: Math.random() * 1.5
            }}
            style={{
              position: 'fixed',
              width: size,
              height: isCircle ? size : size * 0.6,
              backgroundColor: color,
              borderRadius: isCircle ? '50%' : '3px',
              boxShadow: `0 0 12px ${color}`
            }}
          />
        );
      })}
    </div>
  );
}