import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Phone, BookOpen, Star, Bookmark, BookDashed, 
  History, Gift, Share2, LogOut, MessageSquare, Loader2, 
  Sparkles, CheckCircle2, Copy, BookMarked, PenTool, Edit3
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchAllRows } from '../lib/api';
import { LoyaltyPoints, Order, Book } from '../types';
import { Link } from 'react-router-dom';
import { LazyImage } from '../components/ui/lazy-image';

export default function ReaderSpace() {
  const [phone, setPhone] = useState(localStorage.getItem('bigdeal_user_phone') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('bigdeal_user_phone'));
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'library' | 'contributions'>('overview');
  
  // Data
  const [pointsData, setPointsData] = useState<LoyaltyPoints | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allBooks, setAllBooks] = useState<Record<string, Book>>({});
  
  // Local TBR & Current Reads Map
  const [tbrList, setTbrList] = useState<string[]>([]);
  const [currentReads, setCurrentReads] = useState<Record<string, { note: string, page: number }>>({});
  
  const [copied, setCopied] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');

  // Save note wrapper
  const handleSaveNote = (bookId: string) => {
    const updated = { ...currentReads, [bookId]: { ...currentReads[bookId], note: tempNote } };
    setCurrentReads(updated);
    localStorage.setItem(`current_${phone}`, JSON.stringify(updated));
    setEditingNoteId(null);
  };

  useEffect(() => {
    if (isLoggedIn) {
      document.title = "Reader's Space | BigDeal Bookstore";
      fetchUserData(phone);
      
      // Load Local Storage specific for this user
      const storedTbr = localStorage.getItem(`tbr_${phone}`);
      if (storedTbr) setTbrList(JSON.parse(storedTbr));
      
      const storedCurrent = localStorage.getItem(`current_${phone}`);
      if (storedCurrent) setCurrentReads(JSON.parse(storedCurrent));
    }
  }, [isLoggedIn, phone]);

  useEffect(() => {
    // Only load all books once
    if (isLoggedIn && Object.keys(allBooks).length === 0) {
      fetchBooks();
    }
  }, [isLoggedIn]);

  const fetchBooks = async () => {
    const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) {
      const booksMap: Record<string, Book> = {};
      data.forEach(b => booksMap[b.id] = b);
      setAllBooks(booksMap);
    }
  };

  const fetchUserData = async (phoneNumber: string) => {
    setLoading(true);
    try {
      // 1. Fetch Points
      const { data: pData } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('phone', phoneNumber)
        .single();
      
      if (pData) setPointsData(pData);
      else setPointsData({ phone: phoneNumber, points: 0, created_at: new Date().toISOString() });
      
      // 2. Fetch Orders to get purchased books
      const { data: oData } = await supabase
        .from('orders')
        .select('*')
        .eq('phone', phoneNumber)
        .order('created_at', { ascending: false });
        
      if (oData) setOrders(oData);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = phone.trim().replace(/\s/g, '');
    if (!normalizedPhone) return;

    setAuthLoading(true);
    try {
      localStorage.setItem('bigdeal_user_phone', normalizedPhone);
      setPhone(normalizedPhone);
      setIsLoggedIn(true);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bigdeal_user_phone');
    setPhone('');
    setIsLoggedIn(false);
    setPointsData(null);
    setOrders([]);
  };

  const referralLink = `${window.location.origin}?ref=${phone}`;
  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const milestones = [
    { points: 200, reward: 'Free Shipping on next order', icon: <History className="w-4 h-4" /> },
    { points: 500, reward: '15% Discount', icon: <Gift className="w-4 h-4" /> },
    { points: 800, reward: 'One Free Novel', icon: <Star className="w-4 h-4" /> },
  ];

  // Derive purchased items mapping
  const purchasedBooks: any[] = [];
  orders.forEach(order => {
    if (order.status !== 'CANCELLED') {
      order.items.forEach(item => {
        if (!purchasedBooks.find(pb => pb.book_id === item.book_id)) {
          purchasedBooks.push(item);
        }
      });
    }
  });

  const renderAuthScreen = () => (
    <div className="min-h-[70vh] flex items-center justify-center px-4 relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-ink/80 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-10 border border-white/10 shadow-[0_30px_60px_rgba(139,92,246,0.15)] text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <BookMarked className="w-48 h-48 text-primary" />
        </div>
        
        <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-lg shadow-primary/10 relative z-10">
          <Sparkles className="w-8 h-8 text-primary-light" />
        </div>
        
        <h2 className="text-3xl font-serif font-bold text-white mb-3 relative z-10">Reader's Space</h2>
        <p className="text-white/50 text-sm mb-8 leading-relaxed relative z-10">
          Enter your mobile number to access your TBR lists, current reads, purchase history, and loyalty points.
        </p>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <div className="space-y-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl group-focus-within:bg-primary/20 transition-all opacity-0 group-focus-within:opacity-100" />
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-light/50" />
                <input
                  type="tel"
                  required
                  placeholder="0XXX XX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg font-medium text-white placeholder:text-white/20"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-4 rounded-2xl bg-white text-ink font-bold hover:bg-gray-100 transition-all shadow-xl flex items-center justify-center space-x-2"
          >
            {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Enter Sanctuary</span>}
          </button>
        </form>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen pt-8 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!isLoggedIn ? renderAuthScreen() : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 md:space-y-12 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-primary-light text-xs font-bold tracking-widest uppercase mb-2">
                  <Star className="w-3 h-3" fill="currentColor" /> verified reader
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-white flex items-center gap-4">
                  Welcome Back.
                </h1>
                <div className="flex items-center gap-3 text-white/50 text-sm">
                  <Phone className="w-4 h-4" />
                  <span className="font-mono">{phone}</span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="self-start md:self-auto flex items-center gap-2 text-white/40 hover:text-red-400 bg-white/5 hover:bg-red-400/10 px-4 py-2 rounded-xl transition-all text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 md:gap-4 p-1 bg-white/5 rounded-2xl border border-white/10 w-max max-w-full">
              {[
                { id: 'overview', icon: <Trophy />, label: 'Overview' },
                { id: 'library', icon: <BookOpen />, label: 'My Library' },
                { id: 'contributions', icon: <MessageSquare />, label: 'Contributions' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {React.cloneElement(tab.icon as any, { className: 'w-4 h-4' })}
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* OVERVIEW TAB */}
                  {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Points Card */}
                      <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-primary/20 via-ink to-primary/10 border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-2xl group">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                          <Trophy className="w-48 h-48" />
                        </div>
                        
                        <div className="relative z-10 space-y-8">
                          <div>
                            <p className="text-xs font-bold text-primary-light uppercase tracking-widest mb-4">Loyalty Balance</p>
                            <div className="flex items-baseline gap-3">
                              <span className="text-7xl font-serif font-bold text-white drop-shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                                {pointsData?.points || 0}
                              </span>
                              <span className="text-xl font-medium text-white/40">pts</span>
                            </div>
                          </div>

                          <div className="space-y-4 max-w-md">
                            <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 inset-shadow-sm">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(((pointsData?.points || 0) / 800) * 100, 100)}%` }}
                                className="h-full bg-gradient-to-r from-primary via-primary-light to-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                              />
                            </div>
                            <div className="flex justify-between text-xs font-bold text-white/40 uppercase tracking-widest">
                              <span>0 pts</span>
                              <span>Next Milestone: {milestones.find(m => m.points > (pointsData?.points || 0))?.points || 800} pts</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                            {milestones.map((m, idx) => {
                              const isUnlocked = (pointsData?.points || 0) >= m.points;
                              return (
                                <div key={idx} className={`p-4 rounded-2xl border ${isUnlocked ? 'bg-primary/20 border-primary/30' : 'bg-white/5 border-white/5'} flex flex-col gap-2`}>
                                  <div className="flex justify-between items-center">
                                    {React.cloneElement(m.icon as any, { className: `w-5 h-5 ${isUnlocked ? 'text-primary-light' : 'text-white/40'}`})}
                                    {isUnlocked && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                                  </div>
                                  <div>
                                    <p className={`text-sm font-bold ${isUnlocked ? 'text-white' : 'text-white/40'}`}>{m.reward}</p>
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">{m.points} pts</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Invite Card */}
                      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col justify-between">
                        <div className="space-y-4 mb-8">
                          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary-light mb-6">
                            <Share2 className="w-6 h-6" />
                          </div>
                          <h3 className="text-2xl font-serif font-bold text-white">Invite & Earn</h3>
                          <p className="text-white/50 text-sm leading-relaxed">
                            Share your link. You get 10pts for their visit, and 20pts for their first purchase. Books basically become free!
                          </p>
                        </div>

                        <div className="space-y-4 mt-auto">
                          <div className="bg-ink border border-white/10 rounded-xl p-4 text-sm font-mono text-white/50 truncate select-all">
                            {referralLink}
                          </div>
                          <button
                            onClick={copyToClipboard}
                            className="w-full py-4 bg-white text-ink hover:bg-gray-200 transition-colors rounded-xl font-bold flex items-center justify-center gap-2"
                          >
                            {copied ? <><CheckCircle2 className="w-5 h-5" /> Copied</> : <><Copy className="w-5 h-5"/> Copy Link</>}
                          </button>
                        </div>
                      </div>

                      {/* Orders Tracking Section */}
                      <div className="lg:col-span-3 space-y-6 pt-8">
                        <h3 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                           <History className="text-primary" /> My Orders
                        </h3>
                        {orders.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {orders.map(order => (
                              <div key={order.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col justify-between group hover:bg-white/10 transition-colors">
                                <div className="space-y-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</p>
                                      <h4 className="text-white font-bold mt-1">Order #{order.id.split('-')[0]}</h4>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                      order.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400' :
                                      order.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400' :
                                      'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                      {order.status}
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    {order.items.map((item, idx) => (
                                      <p key={idx} className="text-sm text-white/60 line-clamp-1 truncate">
                                        <span className="text-white/40">{item.qty}x</span> {item.title}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                                  <p className="text-primary-light font-black">{order.total_price} DA</p>
                                  <Link to={`/track/${order.id}`} className="px-4 py-2 bg-primary/20 hover:bg-primary/40 text-primary-light rounded-xl text-xs font-bold transition-colors">
                                    Track Package
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-8 py-10 rounded-2xl border border-dashed border-white/10 text-center">
                            <p className="text-white/40 text-sm">You haven't placed any orders yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* LIBRARY TAB */}
                  {activeTab === 'library' && (
                    <div className="space-y-12">
                      {/* Current Reads Section */}
                      <div className="space-y-6 lg:col-span-3">
                        <h3 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                          <Bookmark className="text-primary" /> Current Reads
                        </h3>
                        {Object.keys(currentReads).length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(currentReads).map(([bookId, data]) => {
                              const book = allBooks[bookId];
                              if (!book) return null;
                              return (
                                <div key={bookId} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex flex-col gap-6 group hover:bg-white/10 transition-colors">
                                  <div className="flex gap-4">
                                    <LazyImage src={book.cover_image_url} alt={book.title} className="w-20 h-28 object-cover rounded-lg shadow-lg border border-white/10" />
                                    <div>
                                      <h4 className="font-bold text-white line-clamp-2">{book.title}</h4>
                                      <p className="text-sm text-white/50">{book.author}</p>
                                      <div className="mt-4 flex items-center gap-2">
                                        <div className="px-3 py-1 bg-primary/20 text-primary-light text-xs font-bold rounded-lg border border-primary/30">
                                          Page {data.page}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="bg-ink/50 p-4 rounded-xl border border-white/5 relative min-h-[5rem]">
                                    {editingNoteId === bookId ? (
                                      <div className="flex flex-col gap-2">
                                        <textarea
                                          autoFocus
                                          value={tempNote}
                                          onChange={(e) => setTempNote(e.target.value)}
                                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-primary-light resize-none transition-colors h-20"
                                          placeholder="Where did you stop? What do you think?"
                                        />
                                        <div className="flex justify-end gap-2">
                                          <button onClick={() => setEditingNoteId(null)} className="text-xs px-3 py-1 text-white/50 hover:text-white transition-colors font-medium">Cancel</button>
                                          <button onClick={() => handleSaveNote(bookId)} className="text-xs px-3 py-1 bg-primary text-white rounded font-bold hover:bg-primary-light transition-colors">Save</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <button 
                                          onClick={() => { setEditingNoteId(bookId); setTempNote(data.note || ''); }}
                                          className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded-lg transition-colors text-white/20 hover:text-white"
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </button>
                                        <p className="text-sm text-white/80 italic font-serif pr-6 whitespace-pre-wrap">
                                          {data.note ? `"${data.note}"` : <span className="text-white/30">Add a note or current page...</span>}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="px-8 py-12 rounded-[2rem] border border-dashed border-white/20 text-center space-y-4">
                            <BookDashed className="w-12 h-12 text-white/20 mx-auto" />
                            <p className="text-white/40">You haven't added any current reads yet.</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* TBR List */}
                        <div className="space-y-6">
                           <h3 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                            <BookDashed className="text-primary" /> To Be Read (TBR)
                          </h3>
                          {tbrList.length > 0 ? (
                            <div className="space-y-4">
                              {tbrList.map(bookId => {
                                const book = allBooks[bookId];
                                if (!book) return null;
                                return (
                                  <Link key={bookId} to={`/book/${bookId}`} className="flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-colors p-4 rounded-2xl border border-white/5">
                                    <LazyImage src={book.cover_image_url} className="w-12 h-16 object-cover rounded shadow" alt="" />
                                    <div>
                                      <h4 className="text-white font-bold text-sm">{book.title}</h4>
                                      <p className="text-white/50 text-xs">{book.author}</p>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="px-8 py-10 rounded-2xl border border-dashed border-white/10 text-center">
                              <p className="text-white/40 text-sm">Your TBR list is empty.</p>
                              <Link to="/" className="text-primary-light text-xs font-bold mt-2 inline-block hover:underline">Browse Catalog</Link>
                            </div>
                          )}
                        </div>

                        {/* Purchases Section */}
                        <div className="space-y-6">
                          <h3 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                            <History className="text-primary" /> Past Purchases
                          </h3>
                          {purchasedBooks.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                              {purchasedBooks.map((item, idx) => (
                                <Link key={idx} to={`/book/${item.book_id}`} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col gap-3 group hover:bg-white/10 transition-colors items-center text-center">
                                  <LazyImage src={item.cover_image_url} alt="" className="w-20 h-28 object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform" />
                                  <div className="w-full">
                                    <h4 className="text-white font-bold text-xs truncate w-full">{item.title}</h4>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div className="px-8 py-10 rounded-2xl border border-dashed border-white/10 text-center">
                              <p className="text-white/40 text-sm">You haven't bought any books yet.</p>
                              <Link to="/" className="text-primary-light text-xs font-bold mt-2 inline-block hover:underline">Start Reading</Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CONTRIBUTIONS TAB */}
                  {activeTab === 'contributions' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <h3 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                          <MessageSquare className="text-primary" /> Your Reviews
                        </h3>
                        <div className="px-8 py-16 rounded-[2rem] border border-dashed border-white/20 text-center space-y-4 bg-white/5">
                          <PenTool className="w-12 h-12 text-white/20 mx-auto" />
                          <p className="text-white/40 max-w-sm mx-auto">
                            Reviews are securely linked to your orders. Verified purchases grant special review badges on book pages.
                          </p>
                          <Link to="/" className="inline-block px-6 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors text-sm">
                            Write a review
                          </Link>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <h3 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                          <Gift className="text-primary" /> Impact Score
                        </h3>
                        <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] space-y-6 box-border h-full">
                           <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                             <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-2xl flex items-center justify-center font-bold text-xl border border-green-500/20">
                               {orders.length}
                             </div>
                             <div>
                               <p className="text-white font-bold text-lg">Total Orders</p>
                               <p className="text-white/50 text-sm">Thank you for trusting us.</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-4">
                             <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center font-bold text-xl border border-blue-500/20">
                               {purchasedBooks.length}
                             </div>
                             <div>
                               <p className="text-white font-bold text-lg">Books Discovered</p>
                               <p className="text-white/50 text-sm">Expanding your horizons.</p>
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
