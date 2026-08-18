import { supabase } from '../lib/supabase';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, MapPin, Phone, Mail, User, Instagram, CheckCircle, ArrowLeft, Truck } from 'lucide-react';
import { motion } from 'motion/react';

import { trackLead } from '../lib/metaPixel';
import { DEFAULT_WILAYA_COMMUNES, DEFAULT_STOPDESK_COMMUNES } from '../data/locationData';

// Use direct imports to make load robust and fast



export default function SpecialRequest() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    wilaya: '',
    baladia: '',
    book_name: '',
    author: '',
    instagram_account: '',
    notes: '',
    shipping_method: 'direct' // 'direct' or 'office'
  });

  // Calculate active communes and Wilayas based on shipping method chosen
  
  const [activeCommunesMap, setActiveCommunesMap] = useState<Record<string, string[]>>(DEFAULT_WILAYA_COMMUNES);
  const [activeWilayas, setActiveWilayas] = useState<string[]>(Object.keys(DEFAULT_WILAYA_COMMUNES).sort());
  const [allStopdeskCommunes, setAllStopdeskCommunes] = useState<Record<string, string[]>>(DEFAULT_STOPDESK_COMMUNES);
  const [allWilayaCommunes, setAllWilayaCommunes] = useState<Record<string, string[]>>(DEFAULT_WILAYA_COMMUNES);

  useEffect(() => {
    const fetchData = async () => {
      const { data: settingsData } = await supabase.from('site_settings').select('key, value');
      if (settingsData) {
        const wc = settingsData.find(s => s.key === 'wilaya_communes');
        const sc = settingsData.find(s => s.key === 'stopdesk_communes');

        if (wc) {
          const parsedWc = typeof wc.value === 'string' ? JSON.parse(wc.value) : wc.value;
          if (parsedWc && typeof parsedWc === 'object') setAllWilayaCommunes({ ...DEFAULT_WILAYA_COMMUNES, ...parsedWc });
        }
        if (sc) {
          const parsedSc = typeof sc.value === 'string' ? JSON.parse(sc.value) : sc.value;
          if (parsedSc && typeof parsedSc === 'object') setAllStopdeskCommunes({ ...DEFAULT_STOPDESK_COMMUNES, ...parsedSc });
        }
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const map = formData.shipping_method === 'office' ? allStopdeskCommunes : allWilayaCommunes;
    const currentMap = (map && Object.keys(map).length > 0) ? map : (formData.shipping_method === 'office' ? DEFAULT_STOPDESK_COMMUNES : DEFAULT_WILAYA_COMMUNES);
    setActiveCommunesMap(currentMap);
    setActiveWilayas(Object.keys(currentMap).sort());
  }, [formData.shipping_method, allStopdeskCommunes, allWilayaCommunes]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Append delivery choice to notes to guarantee readability in all admin configurations
      const notesWithShipping = `[Delivery: ${formData.shipping_method === 'office' ? 'Office Pickup' : 'Home Delivery'}]${formData.notes ? `\nNotes: ${formData.notes}` : ''}`;

      const { error } = await supabase
        .from('special_requests')
        .insert([{
          book_name: formData.book_name,
          author: formData.author,
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email,
          wilaya: formData.wilaya,
          baladia: formData.baladia,
          instagram_account: formData.instagram_account,
          notes: notesWithShipping,
          status: 'PENDING'
        }]);

      if (error) throw error;
      setSubmitted(true);
      
      trackLead('Special Book Request', {
        email: formData.email,
        phone: formData.phone,
        full_name: formData.full_name,
        wilaya: formData.wilaya,
        baladia: formData.baladia
      });
    } catch (err: any) {
      console.error('Error submitting special request:', err);
      alert('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 md:py-20 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
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
              <CheckCircle className="w-20 h-20 text-green-400" />
            </div>
          </motion.div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-serif font-bold purplish-text-gradient">Request Received!</h1>
            <p className="text-lg md:text-2xl text-white/60 font-medium">We've received your request for <span className="text-primary-light font-bold">"{formData.book_name}"</span>.</p>
            <p className="text-white/40 text-base md:text-lg">Our team will search for it and contact you soon via Instagram or Phone.</p>
          </div>

          <div className="bg-white/5 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/10 inline-block max-w-lg w-full">
            <p className="text-base md:text-lg text-primary-light font-bold leading-relaxed">
              We'll do our best to find your masterpiece! <br />
              <span className="text-white italic">Stay tuned!</span>
            </p>
          </div>

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
    <div className="max-w-4xl mx-auto px-4 py-12 relative z-10">
      <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-white/40 hover:text-primary-light mb-8 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold text-sm uppercase tracking-widest">Back</span>
      </button>

      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">Special Book Request</h1>
        <p className="text-white/40 text-lg">Can't find a book? Tell us and we'll find it for you!</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-white/10 space-y-6">
          <div className="flex items-center space-x-3 text-primary-light">
            <BookOpen className="w-5 h-5" />
            <h2 className="text-xl font-bold text-white">Book Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Book Name</label>
              <input 
                type="text" required placeholder="Book Title"
                value={formData.book_name}
                onChange={e => setFormData({...formData, book_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary/40 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Author</label>
              <input 
                type="text" required placeholder="Author Name"
                value={formData.author}
                onChange={e => setFormData({...formData, author: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary/40 outline-none"
              />
            </div>
          </div>
        </section>

        <section className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-white/10 space-y-6">
          <div className="flex items-center space-x-3 text-primary-light">
            <User className="w-5 h-5" />
            <h2 className="text-xl font-bold text-white">Contact Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                type="text" required placeholder="Full Name"
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary/40 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Phone Number</label>
              <input 
                type="tel" required placeholder="XXXXXXXXXX"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary/40 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Email (Optional)</label>
              <input 
                type="email" placeholder="Email Address"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary/40 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Instagram Account</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">@</span>
                <input 
                  type="text" placeholder="username"
                  value={formData.instagram_account}
                  onChange={e => setFormData({...formData, instagram_account: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary/40 outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Shipping Method Section */}
        <section className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-white/10 space-y-6">
          <div className="flex items-center space-x-3 text-primary-light">
            <Truck className="w-5 h-5" />
            <h2 className="text-xl font-bold text-white">Shipping Method</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => setFormData({ ...formData, shipping_method: 'direct', wilaya: '', baladia: '' })}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.shipping_method === 'direct' ? 'border-primary bg-primary/20' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
            >
              <p className="font-bold text-white">Home Delivery</p>
              <p className="text-xs text-white/40">Delivered directly to your door</p>
            </button>
            <button 
              type="button"
              onClick={() => {
                setFormData(prev => {
                  const newWilaya = allStopdeskCommunes.hasOwnProperty(prev.wilaya) ? prev.wilaya : '';
                  const newBaladia = newWilaya && (allStopdeskCommunes as Record<string, string[]>)[newWilaya].includes(prev.baladia) ? prev.baladia : '';
                  return { ...prev, shipping_method: 'office', wilaya: newWilaya, baladia: newBaladia };
                });
              }}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.shipping_method === 'office' ? 'border-primary bg-primary/20' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
            >
              <p className="font-bold text-white">Office Pickup</p>
              <p className="text-xs text-white/40">Pick up from our nearest office</p>
            </button>
          </div>
        </section>

        {/* Location Section */}
        <section className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-white/10 space-y-6">
          <div className="flex items-center space-x-3 text-primary-light">
            <MapPin className="w-5 h-5" />
            <h2 className="text-xl font-bold text-white">Location/Destination</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Wilaya</label>
              <select 
                required 
                value={formData.wilaya}
                onChange={e => setFormData({ ...formData, wilaya: e.target.value, baladia: '' })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/40 outline-none"
              >
                <option value="" className="bg-ink">Select Wilaya</option>
                {activeWilayas.map((w, idx) => <option key={`wilaya-${w}-${idx}`} value={w} className="bg-ink">{w}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Baladia (Commune)</label>
              <select 
                required 
                value={formData.baladia}
                onChange={e => setFormData({ ...formData, baladia: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/40 outline-none cursor-pointer"
              >
                {!formData.wilaya ? (
                  <option value="" className="bg-ink text-white/50">Select Wilaya First</option>
                ) : (
                  <>
                    <option value="" className="bg-ink">Select Commune (Baladia)</option>
                    {activeCommunesMap[formData.wilaya]?.map((c, idx) => <option key={`commune-${c}-${idx}`} value={c} className="bg-ink">{c}</option>)}
                  </>
                )}
              </select>
            </div>
          </div>
        </section>

        {/* Custom notes section */}
        <section className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-white/10 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Notes / Additional Details (Optional)</label>
            <textarea 
              placeholder="Any comments, specifics, edition choices or comments..."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary/40 outline-none min-h-[100px]"
            />
          </div>
        </section>

        <button 
          type="submit" disabled={loading}
          className="w-full bg-primary text-white py-5 rounded-full font-bold text-lg hover:bg-primary-light transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)] disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
