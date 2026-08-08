import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, BookOpen, Truck, ShoppingBag, MessageSquare, 
  Plus, Edit, Trash2, Save, X, Check, Search, ExternalLink, Star,
  Quote as QuoteIcon, RefreshCw, ClipboardList, Sparkles, Tag, Trophy, Gift, Info, Clock, Download,
  CheckCircle, XCircle, Instagram, Copy, Printer, BarChart2, Zap, Radio, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Book, Order, ShippingRate, Review, User, Quote, SpecialRequest, Discount, LoyaltyPoints } from '../types';
import { supabase } from '../lib/supabase';
import { fetchAllRows } from '../lib/api';
import { BundleCover } from '../components/BundleCover';
import { LazyImage } from '../components/ui/lazy-image';
import { formatOrderRef } from '../lib/utils';
import { notifyDeliveredOrder } from '../lib/notifications';
import wilayaList from '../../public/wilaya_list.json';
import ManageAnalytics from "./ManageAnalytics";
import ManageMetaPixel from "./ManageMetaPixel";
import ManageWhatsApp, { DEFAULT_WHATSAPP_TEMPLATE } from "./ManageWhatsApp";
import LiveDeliveryFeed from "./LiveDeliveryFeed";
import { ECONOMIC_RATES, getEconomicRate } from '../data/shippingRates';

export default function AdminDashboard({ user }: { user: User | null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [newCounts, setNewCounts] = useState({
    orders: 0,
    reviews: 0,
    requests: 0
  });

  useEffect(() => {
    const fetchNewCounts = async () => {
      const lastSeenOrders = localStorage.getItem('admin_last_seen_orders') || new Date(0).toISOString();
      const lastSeenReviews = localStorage.getItem('admin_last_seen_reviews') || new Date(0).toISOString();
      const lastSeenRequests = localStorage.getItem('admin_last_seen_requests') || new Date(0).toISOString();

      try {
        const [ordersRes, reviewsRes, requestsRes] = await Promise.all([
          supabase.from('orders').select('id', { count: 'exact', head: true }).gt('created_at', lastSeenOrders),
          supabase.from('reviews').select('id', { count: 'exact', head: true }).gt('created_at', lastSeenReviews),
          supabase.from('special_requests').select('id', { count: 'exact', head: true }).gt('created_at', lastSeenRequests)
        ]);

        setNewCounts({
          orders: location.pathname.startsWith('/admin/orders') ? 0 : (ordersRes.count || 0),
          reviews: location.pathname.startsWith('/admin/reviews') ? 0 : (reviewsRes.count || 0),
          requests: location.pathname.startsWith('/admin/requests') ? 0 : (requestsRes.count || 0)
        });
      } catch (error) {
        console.error('Error fetching new counts:', error);
      }
    };

    fetchNewCounts();
    const interval = setInterval(fetchNewCounts, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith('/admin/orders')) {
      localStorage.setItem('admin_last_seen_orders', new Date().toISOString());
    } else if (location.pathname.startsWith('/admin/reviews')) {
      localStorage.setItem('admin_last_seen_reviews', new Date().toISOString());
    } else if (location.pathname.startsWith('/admin/requests')) {
      localStorage.setItem('admin_last_seen_requests', new Date().toISOString());
    }
  }, [location.pathname]);

  useEffect(() => {
    console.log("AdminDashboard rendered with user:", user);
    if (!user || user.role !== 'OWNER') {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'OWNER') return null;

  return (
    <div className="flex flex-col md:flex-row gap-8 min-h-[80vh]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 space-y-4">
        <div className="bg-white/5 backdrop-blur-2xl rounded-[2rem] p-4 border border-white/10 space-y-1 shadow-2xl">
          <div className="px-4 py-4 mb-2">
            <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">Management</h3>
          </div>
          <Link to="/admin" className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 ${location.pathname === '/admin' ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-bold text-sm">Overview</span>
          </Link>
          <Link to="/admin/analytics" className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 ${location.pathname.startsWith('/admin/analytics') ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <BarChart2 className="w-5 h-5" />
            <span className="font-bold text-sm">Analytics</span>
          </Link>
          <Link to="/admin/featured" className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 ${location.pathname.startsWith('/admin/featured') ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <Sparkles className="w-5 h-5" />
            <span className="font-bold text-sm">Featured Read</span>
          </Link>
          <Link to="/admin/books" className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 ${location.pathname.startsWith('/admin/books') ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <BookOpen className="w-5 h-5" />
            <span className="font-bold text-sm">Books</span>
          </Link>
          <Link to="/admin/inventory" className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 ${location.pathname.startsWith('/admin/inventory') ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <ClipboardList className="w-5 h-5" />
            <span className="font-bold text-sm">Inventory</span>
          </Link>
          <Link to="/admin/orders" className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 ${location.pathname.startsWith('/admin/orders') ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <ShoppingBag className="w-5 h-5" />
            <span className="font-bold text-sm">Orders</span>
            {newCounts.orders > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {newCounts.orders}
              </span>
            )}
          </Link>
          <Link to="/admin/live-deliveries" className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 ${location.pathname.startsWith('/admin/live-deliveries') ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="font-bold text-sm">Live Deliveries & Webhooks</span>
          </Link>
          <Link to="/admin/shipping" className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 ${location.pathname.startsWith('/admin/shipping') ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <Truck className="w-5 h-5" />
            <span className="font-bold text-sm">Shipping</span>
          </Link>
          <Link to="/admin/reviews" className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 ${location.pathname.startsWith('/admin/reviews') ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <MessageSquare className="w-5 h-5" />
            <span className="font-bold text-sm">Reviews</span>
            {newCounts.reviews > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {newCounts.reviews}
              </span>
            )}
          </Link>
          <Link to="/admin/quotes" className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 ${location.pathname.startsWith('/admin/quotes') ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <QuoteIcon className="w-5 h-5" />
            <span className="font-bold text-sm">Quotes</span>
          </Link>
          <Link to="/admin/discounts" className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 ${location.pathname.startsWith('/admin/discounts') ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <Tag className="w-5 h-5" />
            <span className="font-bold text-sm">Discounts</span>
          </Link>
          <Link to="/admin/loyalty" className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 ${location.pathname.startsWith('/admin/loyalty') ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <Trophy className="w-5 h-5" />
            <span className="font-bold text-sm">Loyalty Points</span>
          </Link>
          <Link to="/admin/requests" className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 ${location.pathname.startsWith('/admin/requests') ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <ClipboardList className="w-5 h-5" />
            <span className="font-bold text-sm">Special Requests</span>
            {newCounts.requests > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {newCounts.requests}
              </span>
            )}
          </Link>
          <Link to="/admin/screenshots" className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 ${location.pathname.startsWith('/admin/screenshots') ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <Star className="w-5 h-5" />
            <span className="font-bold text-sm">Screenshots</span>
          </Link>
          <Link to="/admin/meta-pixel" className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 ${location.pathname.startsWith('/admin/meta-pixel') ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">Meta Pixel & CAPI</span>
          </Link>
          <Link to="/admin/whatsapp" className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 ${location.pathname.startsWith('/admin/whatsapp') ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">WhatsApp Msg</span>
          </Link>
          
          <div className="pt-4 mt-4 border-t border-white/10">
            <Link to="/" className="flex items-center space-x-3 p-3 rounded-2xl text-white/40 hover:bg-white/5 hover:text-white transition-all group">
              <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm">Back to Store</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-grow bg-white/5 rounded-[2.5rem] shadow-2xl border border-white/10 p-6 md:p-10 relative">
        <div className="absolute inset-0 backdrop-blur-xl rounded-[2.5rem] -z-10 pointer-events-none" />
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="/analytics" element={<ManageAnalytics />} />
          <Route path="/books" element={<ManageBooks />} />
          <Route path="/inventory" element={<ManageInventory />} />
          <Route path="/orders" element={<ManageOrders />} />
          <Route path="/live-deliveries" element={<LiveDeliveryFeed />} />
          <Route path="/shipping" element={<ManageShipping />} />
          <Route path="/reviews" element={<ManageReviews />} />
          <Route path="/quotes" element={<ManageQuotes />} />
          <Route path="/requests" element={<ManageRequests />} />
          <Route path="/featured" element={<ManageFeatured />} />
          <Route path="/discounts" element={<ManageDiscounts />} />
          <Route path="/loyalty" element={<ManageLoyalty />} />
          <Route path="/screenshots" element={<ManageScreenshots />} />
          <Route path="/meta-pixel" element={<ManageMetaPixel />} />
          <Route path="/whatsapp" element={<ManageWhatsApp />} />
        </Routes>
      </main>
    </div>
  );
}

// Sub-components for Admin Dashboard

function AdminOverview() {
  const [stats, setStats] = useState({ books: 0, orders: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [booksRes, ordersRes, reviewsRes] = await Promise.all([
          supabase.from('books').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('reviews').select('*', { count: 'exact', head: true })
        ]);

        setStats({
          books: booksRes.count || 0,
          orders: ordersRes.count || 0,
          reviews: reviewsRes.count || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-12">
      <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl p-10 md:p-16 rounded-[3rem] border border-white/10 shadow-2xl group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-colors" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-dark/10 rounded-full blur-[80px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center space-x-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20"
            >
              <Sparkles className="w-4 h-4 text-primary-light" />
              <span className="text-[10px] font-bold text-primary-light uppercase tracking-widest">Store Insights</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight">
              Welcome back, <br />
              <span className="purplish-text-gradient">Owner!</span>
            </h2>
            <p className="text-white/40 text-lg max-w-md font-medium leading-relaxed">
              Your bookstore is thriving. Here's a quick look at how things are going today.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 text-center min-w-[140px] shadow-xl">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Active Books</p>
              <p className="text-3xl font-bold text-white">{loading ? '...' : stats.books}</p>
            </div>
            <div className="bg-primary/10 backdrop-blur-md p-6 rounded-[2rem] border border-primary/20 text-center min-w-[140px] shadow-xl shadow-primary/5">
              <p className="text-[10px] font-bold text-primary-light uppercase tracking-widest mb-1">New Orders</p>
              <p className="text-3xl font-bold text-white">{loading ? '...' : stats.orders}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="p-8 bg-primary/10 rounded-[2rem] border border-primary/20 shadow-xl shadow-primary/5 group hover:bg-primary/20 transition-all">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 border border-primary/30 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6 text-primary-light" />
          </div>
          <p className="text-xs text-primary-light/60 font-bold uppercase tracking-[0.2em]">Total Books</p>
          <p className="text-5xl font-serif font-bold mt-3 text-white">{loading ? '...' : stats.books}</p>
        </div>
        <div className="p-8 bg-green-500/10 rounded-[2rem] border border-green-500/20 shadow-xl shadow-green-500/5 group hover:bg-green-500/20 transition-all">
          <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6 border border-green-500/30 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-xs text-green-400/60 font-bold uppercase tracking-[0.2em]">Active Orders</p>
          <p className="text-5xl font-serif font-bold mt-3 text-white">{loading ? '...' : stats.orders}</p>
        </div>
        <div className="p-8 bg-purple-500/10 rounded-[2rem] border border-purple-500/20 shadow-xl shadow-purple-500/5 group hover:bg-purple-500/20 transition-all">
          <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-xs text-purple-400/60 font-bold uppercase tracking-[0.2em]">New Reviews</p>
          <p className="text-5xl font-serif font-bold mt-3 text-white">{loading ? '...' : stats.reviews}</p>
        </div>
      </div>
    </div>
  );
}

function ManageBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [editingBook, setEditingBook] = useState<Partial<Book> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [bundleSearchQuery, setBundleSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await fetchAllRows('books', '*', 'created_at', false);

      if (error) {
        console.warn('Fetch books warning:', error.message || error);
      }
      setBooks(data || []);
    } catch (err: any) {
      console.warn('Fetch books exception:', err?.message || err);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = (books || []).filter(b => {
    const title = (b.title || '').toLowerCase();
    const author = (b.author || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();
    return title.includes(query) || author.includes(query);
  });

  // Intelligent Duplicate Search
  const duplicatesMap = new Map<string, Book[]>();
  if (showDuplicates) {
    books.forEach(b => {
      // Normalize title for comparison (remove spaces, punctuation, lowercase)
      const normTitle = (b.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normTitle) {
        if (!duplicatesMap.has(normTitle)) {
          duplicatesMap.set(normTitle, []);
        }
        duplicatesMap.get(normTitle)!.push(b);
      }
    });
  }

  const finalFilteredBooks = showDuplicates 
    ? Array.from(duplicatesMap.values()).filter(group => group.length > 1).flat()
    : filteredBooks;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showDuplicates]);

  const totalPages = Math.ceil(finalFilteredBooks.length / itemsPerPage);
  const paginatedBooks = finalFilteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook || isSaving) return;

    setIsSaving(true);
    const { id, created_at, ...bookData } = editingBook as any;
    
    if (bookData.price) bookData.price = parseFloat(bookData.price);
    if (bookData.old_price !== undefined) bookData.old_price = parseFloat(bookData.old_price);
    if (bookData.stock) bookData.stock = parseInt(bookData.stock);
    if (bookData.rating) bookData.rating = parseFloat(bookData.rating);

    try {
      let result;
      if (id) {
        result = await supabase
          .from('books')
          .update(bookData)
          .eq('id', id);
      } else {
        result = await supabase
          .from('books')
          .insert([bookData]);
      }

      if (result.error) throw result.error;
      setEditingBook(null);
      await fetchBooks();
    } catch (err: any) {
      console.error('Error saving book:', err);
      alert(`Error saving book: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAdjustingPrices, setIsAdjustingPrices] = useState(false);
  const [priceAdjustment, setPriceAdjustment] = useState<number>(0);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const handleBulkPriceAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (priceAdjustment === 0 || isAdjusting) return;
    if (!confirm(`Are you sure you want to adjust ALL book prices by ${priceAdjustment > 0 ? '+' : ''}${priceAdjustment} DA?`)) return;

    setIsAdjusting(true);
    try {
      const { data: allBooks, error: fetchError } = await fetchAllRows('books', '*', 'created_at', false);
      if (fetchError) throw fetchError;

      if (allBooks && allBooks.length > 0) {
        const updates = allBooks.map(book => ({
          ...book,
          price: Math.max(0, book.price + priceAdjustment)
        }));

        const { error: updateError } = await supabase.from('books').upsert(updates);
        if (updateError) throw updateError;
        
        alert(`Successfully adjusted prices for ${allBooks.length} books!`);
        await fetchBooks();
        setIsAdjustingPrices(false);
        setPriceAdjustment(0);
      }
    } catch (err: any) {
      console.error('Error adjusting prices:', err);
      alert(`Error adjusting prices: ${err.message}`);
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setBooks(prev => prev.filter(b => b.id !== id));
    } catch (err: any) {
      console.error('Error deleting book:', err);
      alert(`Error deleting book: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-serif font-bold purplish-text-gradient">Manage Books</h2>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button 
            onClick={() => setShowDuplicates(!showDuplicates)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all font-bold ${showDuplicates ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10' : 'bg-white/10 text-white hover:bg-white/20'}`}
            title="Find duplicate books"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">Duplicates</span>
          </button>
          <button 
            onClick={() => setIsAdjustingPrices(true)}
            className="flex items-center space-x-2 bg-white/10 text-white px-4 py-3 rounded-xl hover:bg-white/20 transition-all font-bold"
          >
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">Bulk Adjust Prices</span>
          </button>
          <button 
            onClick={() => setEditingBook({ 
              title: '', author: '', price: 0, old_price: 0, description: '', cover_image_url: '',
              categories: [], featured: false, rating: 5 
            })}
            className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary-light transition-all shadow-lg shadow-primary/20 font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Add Book</span>
          </button>
        </div>
      </div>

      {isAdjustingPrices && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-ink/90 backdrop-blur-2xl w-full max-w-md rounded-3xl p-8 shadow-2xl my-auto border border-white/10 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Bulk Adjust Prices</h3>
              <button onClick={() => setIsAdjustingPrices(false)} className="text-white/60 hover:text-white"><X /></button>
            </div>
            <form onSubmit={handleBulkPriceAdjustment} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Adjustment Value (DA)</label>
                <p className="text-xs text-white/40 mb-2">Enter a positive number to increase prices, or a negative number to reduce them.</p>
                <input 
                  type="number" 
                  required 
                  value={priceAdjustment} 
                  onChange={e => setPriceAdjustment(parseFloat(e.target.value) || 0)} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" 
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setIsAdjustingPrices(false)} className="px-6 py-2 rounded-xl border border-white/10 text-white">Cancel</button>
                <button type="submit" disabled={isAdjusting || priceAdjustment === 0} className="px-6 py-2 rounded-xl bg-primary text-white font-bold disabled:opacity-50">
                  {isAdjusting ? 'Applying...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {editingBook && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-ink/90 backdrop-blur-2xl w-full max-w-2xl rounded-3xl p-8 shadow-2xl my-auto border border-white/10 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">{editingBook.id ? 'Edit Book' : 'Add New Book'}</h3>
              <button onClick={() => setEditingBook(null)} className="text-white/60 hover:text-white"><X /></button>
            </div>
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Title</label>
                <input type="text" required value={editingBook.title || ''} onChange={e => setEditingBook({ ...editingBook, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Author</label>
                <input type="text" required value={editingBook.author || ''} onChange={e => setEditingBook({ ...editingBook, author: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">New Price (DA)</label>
                <input type="number" step="0.01" required value={editingBook.price || 0} onChange={e => setEditingBook({ ...editingBook, price: parseFloat(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Old Price (DA) - Set to 0 to hide</label>
                <input type="number" step="0.01" value={editingBook.old_price || 0} onChange={e => setEditingBook({ ...editingBook, old_price: parseFloat(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-white/60">Description (Markdown)</label>
                <textarea rows={4} value={editingBook.description || ''} onChange={e => setEditingBook({ ...editingBook, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Cover Image URL</label>
                <input type="url" value={editingBook.cover_image_url || ''} onChange={e => setEditingBook({ ...editingBook, cover_image_url: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Rating (0-5)</label>
                <input type="number" step="0.01" min="0" max="5" required value={editingBook.rating || 0} onChange={e => setEditingBook({ ...editingBook, rating: parseFloat(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div className="md:col-span-2 flex items-center space-x-3 bg-primary/10 p-4 rounded-xl border border-primary/20">
                <input 
                  type="checkbox" 
                  id="featured"
                  checked={editingBook.featured || false} 
                  onChange={e => setEditingBook({ ...editingBook, featured: e.target.checked })} 
                  className="w-5 h-5 rounded border-primary/20 text-primary focus:ring-primary" 
                />
                <label htmlFor="featured" className="text-sm font-bold text-primary-light uppercase tracking-widest cursor-pointer">Feature this book on Home Page</label>
              </div>
              <div className="md:col-span-2 flex items-center space-x-3 bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                <input 
                  type="checkbox" 
                  id="is_bundle"
                  checked={editingBook.is_bundle || false} 
                  onChange={e => setEditingBook({ ...editingBook, is_bundle: e.target.checked, bundle_books: e.target.checked ? (editingBook.bundle_books || []) : [] })} 
                  className="w-5 h-5 rounded border-indigo-500/20 text-indigo-500 focus:ring-indigo-500" 
                />
                <label htmlFor="is_bundle" className="text-sm font-bold text-indigo-400 uppercase tracking-widest cursor-pointer">This is a Book Bundle</label>
              </div>
              {editingBook.is_bundle && (
                <div className="md:col-span-2 space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-white/60 uppercase tracking-widest block">Select Books for Bundle</label>
                    {(editingBook.bundle_books || []).length > 0 && (
                      <div className="w-20 h-28 rounded-lg overflow-hidden border border-white/10 bg-white/5 relative">
                        <BundleCover 
                          bundleBookIds={editingBook.bundle_books || []} 
                          allBooks={books} 
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input 
                        type="text"
                        placeholder="Search books to add..."
                        value={bundleSearchQuery}
                        onChange={(e) => setBundleSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {books
                        .filter(b => b.id !== editingBook.id && !b.is_bundle)
                        .filter(b => {
                          const title = (b.title || '').toLowerCase();
                          const author = (b.author || '').toLowerCase();
                          const query = bundleSearchQuery.toLowerCase();
                          return title.includes(query) || author.includes(query);
                        })
                        .slice(0, 50)
                        .map(book => (
                          <div 
                            key={book.id} 
                            onClick={() => {
                              const current = editingBook.bundle_books || [];
                              const next = current.includes(book.id) 
                                ? current.filter(id => id !== book.id)
                                : [...current, book.id];
                              setEditingBook({ ...editingBook, bundle_books: next });
                            }}
                            className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              (editingBook.bundle_books || []).includes(book.id)
                                ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <div className="w-10 h-14 bg-white/10 rounded overflow-hidden flex-shrink-0">
                              <LazyImage src={book.cover_image_url} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="notranslate text-sm font-bold text-white truncate">{book.title}</p>
                              <p className="text-xs text-white/40 truncate">{book.author}</p>
                            </div>
                            {(editingBook.bundle_books || []).includes(book.id) && (
                              <Check className="w-4 h-4 text-primary-light ml-auto" />
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                  <p className="text-xs text-white/40 italic">Selected: {(editingBook.bundle_books || []).length} books</p>
                </div>
              )}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-white/60">Categories (comma separated). Add French, Arabic, Manga, or Algerian for those formats.</label>
                <input type="text" value={editingBook.categories?.join(', ') || ''} onChange={e => setEditingBook({ ...editingBook, categories: e.target.value.split(',').map(c => c.trim()).filter(c => c !== '') })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setEditingBook(null)} className="px-6 py-2 rounded-xl border border-white/10 text-white">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2 rounded-xl bg-primary text-white font-bold disabled:opacity-50">Save Book</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 text-white/40 text-sm uppercase tracking-widest">
              <th className="pb-4 font-medium">Book</th>
              <th className="pb-4 font-medium">Price</th>
              <th className="pb-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginatedBooks.map(book => (
              <tr key={book.id} className="group hover:bg-white/5 transition-colors">
                <td className="py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-14 rounded overflow-hidden shadow-lg bg-white/5 relative">
                      {book.is_bundle && book.bundle_books && book.bundle_books.length > 0 ? (
                        <BundleCover 
                          bundleBookIds={book.bundle_books} 
                          allBooks={books} 
                        />
                      ) : (
                        <LazyImage src={book.cover_image_url || 'https://picsum.photos/seed/book/50/75'} className="w-full h-full object-cover" alt="" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="notranslate font-bold text-white">{book.title}</p>
                        {book.is_bundle && (
                          <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border border-indigo-500/30">Bundle</span>
                        )}
                      </div>
                      <p className="text-xs text-white/40">{book.author}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 font-bold text-primary-light">{(book.price || 0).toFixed(0)} DA</td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button onClick={() => setEditingBook(book)} className="p-2 hover:bg-primary/20 text-primary-light rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(book.id)} disabled={deletingId === book.id} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                      {deletingId === book.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8 pb-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            <span className="text-white/60 font-medium text-sm">
              Page <span className="text-white">{currentPage}</span> of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ManageOrders() {
  const [orders, setOrders] = useState<(Order & { points?: number })[]>([]);
  const [inventoryIds, setInventoryIds] = useState<string[]>([]);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('ALL');
  const [stateFilter, setStateFilter] = useState<'ALL' | 'DID_NOT_ARRIVE' | 'IN_STOCK_UNPACKAGED' | 'READY_NOT_DELIVERED' | 'DELIVERED_PAID' | 'DELIVERED_RETURNED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFlags, setCustomerFlags] = useState<Record<string, { deliveredPaid: number; deliveredReturned: number }>>({});
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [guepexParcels, setGuepexParcels] = useState<Record<string, any>>({});
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  const [waTemplate, setWaTemplate] = useState<string>(DEFAULT_WHATSAPP_TEMPLATE);

  const [sentWaOrders, setSentWaOrders] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('wa_sent_orders');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const generateWhatsAppUrl = (phone: string, order?: any) => {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '213' + cleanPhone.substring(1) : cleanPhone;
    
    const customerName = order?.customer_name ? ` ${order.customer_name}` : '';
    
    const booksList = order?.items && order.items.length > 0
      ? order.items.map((item: any) => `• ${item.qty > 1 ? `${item.qty}x ` : ''}${item.title}`).join('\n')
      : '• N/A';
      
    const totalPrice = order?.total_price ? `${Number(order.total_price).toFixed(0)} DA` : 'N/A';

    let message = waTemplate || DEFAULT_WHATSAPP_TEMPLATE;
    message = message
      .replace(/{{customerName}}/g, customerName)
      .replace(/{{booksList}}/g, booksList)
      .replace(/{{totalPrice}}/g, totalPrice);

    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleWhatsAppClick = (order: any, phone: string) => {
    if (!phone) return;
    const orderId = String(order.id);

    setSentWaOrders(prev => {
      const updated = { ...prev, [orderId]: true };
      try {
        localStorage.setItem('wa_sent_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    const url = generateWhatsAppUrl(phone, order);
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  useEffect(() => {
    if (statusMsg) {
      const timer = setTimeout(() => setStatusMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error } = await fetchAllRows('orders', '*', 'created_at', false);
      if (error) throw error;

      try {
        const { data: ratesData, error: ratesError } = await supabase.from('shipping_rates').select('*');
        if (!ratesError && ratesData) {
          setShippingRates(ratesData);
        }
      } catch (e) {
        console.error('Error fetching shipping rates:', e);
      }

      try {
        const { data: settingsData } = await supabase.from('site_settings').select('key, value').in('key', ['inventory_books', 'whatsapp_template']);
        if (settingsData) {
          const inv = settingsData.find(s => s.key === 'inventory_books');
          if (inv && inv.value) {
            try {
              setInventoryIds(JSON.parse(inv.value));
            } catch(e) {}
          }
          const wa = settingsData.find(s => s.key === 'whatsapp_template');
          if (wa && wa.value) {
            setWaTemplate(wa.value);
          }
        }
      } catch (e) {
        // ignore missing inventory settings
      }

      console.log('Fetched orders raw data:', ordersData);

      // Fetch Guepex tracking data in batches
      if (ordersData && ordersData.length > 0) {
        try {
          // Guepex order_id filter might have length limits, let's just fetch all recent parcels or batch them
          // Assuming max 100 per page, let's just do a big fetch of the first 100 for now.
          const res = await fetch('/api/guepex-parcels?page_size=200');
          if (res.ok) {
            try {
              const result = await res.json();
              if (result && result.data) {
                const parcelMap: Record<string, any> = {};
                result.data.forEach((p: any) => {
                  if (p.order_id) {
                    parcelMap[p.order_id] = p;
                  }
                });
                setGuepexParcels(parcelMap);

                // Dynamically sync orders with Guepex parcel statuses
                const updates: Promise<any>[] = [];
                ordersData.forEach(order => {
                  const parcel = parcelMap[order.id];
                  if (parcel && parcel.last_status) {
                    const statusLower = parcel.last_status.toLowerCase();
                    let newState = order.order_state;

                    const isDelivered = statusLower === 'livré' || statusLower === 'livre' || statusLower.startsWith('livré ') || statusLower.startsWith('livre ');
                    const isReturned = statusLower.includes('retour') || statusLower.includes("echec de livraison") || statusLower.includes("échec de livraison") || statusLower.includes("echec d'livraison") || statusLower.includes("échec d'livraison");

                    if (isDelivered) {
                      if (order.order_state !== 'DELIVERED_PAID' && order.status !== 'DELIVERED') {
                        notifyDeliveredOrder({ ...order, order_state: 'DELIVERED_PAID' });
                      }
                      newState = 'DELIVERED_PAID';
                    } else if (isReturned) {
                      newState = 'DELIVERED_RETURNED';
                    }

                    if (newState !== order.order_state) {
                      order.order_state = newState;
                      updates.push((async () => supabase.from('orders').update({ order_state: newState }).eq('id', order.id))());
                    }
                  }
                });

                if (updates.length > 0) {
                  Promise.all(updates).catch(e => console.error("Error auto-syncing states:", e));
                }
              }
            } catch (e) {
              console.error("Invalid response from /api/guepex-parcels:", e);
            }
          }
        } catch (e) {
          console.error("Failed to fetch guepex parcels:", e);
        }
      }

      const flags: Record<string, { deliveredPaid: number; deliveredReturned: number }> = {};
      if (ordersData) {
        ordersData.forEach(order => {
          if (order.phone) {
            if (!flags[order.phone]) {
              flags[order.phone] = { deliveredPaid: 0, deliveredReturned: 0 };
            }
            if (order.order_state === 'DELIVERED_PAID') {
              flags[order.phone].deliveredPaid += 1;
            } else if (order.order_state === 'DELIVERED_RETURNED') {
              flags[order.phone].deliveredReturned += 1;
            }
          }
        });
      }
      setCustomerFlags(flags);

      // Batch fetch points for all phones to avoid making 1000 parallel requests
      const phoneSet = new Set((ordersData || []).map(o => o.phone).filter(Boolean));
      const uniquePhones = Array.from(phoneSet);
      const pointsMap: Record<string, number> = {};
      
      try {
        for (let i = 0; i < uniquePhones.length; i += 100) {
          const chunk = uniquePhones.slice(i, i + 100);
          const { data: pointsData } = await supabase
            .from('loyalty_points')
            .select('phone, points')
            .in('phone', chunk);
            
          if (pointsData) {
            pointsData.forEach(p => {
              pointsMap[p.phone] = p.points;
            });
          }
        }
      } catch (err) {
        console.error('Error fetching batch points:', err);
      }

      const ordersWithPoints = (ordersData || []).map(order => ({
         ...order,
         points: pointsMap[order.phone] || 0
      }));

      setOrders(ordersWithPoints);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const checkAndAwardPoints = async (order: any, newStatus: string, newState: string) => {
    // Only award points if status is CONFIRMED and state is DELIVERED_PAID
    if (newStatus !== 'CONFIRMED' || newState !== 'DELIVERED_PAID') return;
    
    // Check if points were already awarded for this order
    const isAwarded = order.items && order.items.length > 0 && order.items[0].is_points_awarded;
    if (isAwarded) return;

    try {
      // 1. Calculate points to award
      const earnedPoints = 10 + Math.floor((order.total_price || 0) / 100);
      
      // 2. Get current points
      const { data: existingPoints } = await supabase
        .from('loyalty_points')
        .select('points')
        .eq('phone', order.phone)
        .single();
        
      const currentPoints = existingPoints?.points || 0;
      
      // 3. Update loyalty points
      await supabase
        .from('loyalty_points')
        .upsert({ phone: order.phone, points: currentPoints + earnedPoints }, { onConflict: 'phone' });
        
      // 4. Mark order as awarded by updating the first item
      const updatedItems = [...order.items];
      if (updatedItems.length > 0) {
        updatedItems[0] = { ...updatedItems[0], is_points_awarded: true };
        
        await supabase
          .from('orders')
          .update({ items: updatedItems })
          .eq('id', order.id);
          
        // Update local state
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, items: updatedItems, points: currentPoints + earnedPoints } : o));
        setStatusMsg({ type: 'success', text: `Order updated and ${earnedPoints} points awarded!` });
      }
    } catch (err) {
      console.error('Error awarding points:', err);
    }
  };

  const handleStatusUpdate = async (order: any, newStatus: string) => {
    setUpdatingId(order.id);
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id)
        .select();
      
      if (error || !data || data.length === 0) {
        // Fallback: Update by matching other unique-ish fields
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .match({ 
            phone: order.phone, 
            created_at: order.created_at,
            customer_name: order.customer_name
          })
          .select();
          
        if (fallbackError) throw fallbackError;
        if (!fallbackData || fallbackData.length === 0) {
          throw new Error('Order not found in database');
        }
      }
      
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus as any } : o));
      setStatusMsg({ type: 'success', text: `Order status updated to ${newStatus}` });
      
      if (newStatus === 'DELIVERED' && order.status !== 'DELIVERED' && order.order_state !== 'DELIVERED_PAID') {
        notifyDeliveredOrder({ ...order, status: 'DELIVERED' });
      }

      // Check if we should award points
      await checkAndAwardPoints(order, newStatus, order.order_state || 'DID_NOT_ARRIVE');
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setStatusMsg({ type: 'error', text: `Failed to update status: ${err.message || 'Unknown error'}` });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOrderStateUpdate = async (order: any, newState: string) => {
    setUpdatingId(order.id);
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ order_state: newState })
        .eq('id', order.id)
        .select();
      
      if (error || !data || data.length === 0) {
        // Fallback: Update by matching other unique-ish fields
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('orders')
          .update({ order_state: newState })
          .match({ 
            phone: order.phone, 
            created_at: order.created_at,
            customer_name: order.customer_name
          })
          .select();
          
        if (fallbackError) throw fallbackError;
        if (!fallbackData || fallbackData.length === 0) {
          throw new Error('Order not found in database');
        }
      }
      
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, order_state: newState as any } : o));
      setStatusMsg({ type: 'success', text: `Order state updated` });

      if (newState === 'DELIVERED_PAID' && order.order_state !== 'DELIVERED_PAID' && order.status !== 'DELIVERED') {
        notifyDeliveredOrder({ ...order, order_state: 'DELIVERED_PAID' });
      }
      
      // Check if we should award points
      await checkAndAwardPoints(order, order.status || 'PENDING', newState);
    } catch (err: any) {
      console.error('Error updating order state:', err);
      setStatusMsg({ type: 'error', text: `Failed to update state: ${err.message || 'Unknown error'}` });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleNoteUpdate = async (order: any, note: string) => {
    setUpdatingId(order.id);
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ special_note: note })
        .eq('id', order.id)
        .select();
      
      if (error || !data || data.length === 0) {
        // Fallback: Update by matching other unique-ish fields
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('orders')
          .update({ special_note: note })
          .match({ 
            phone: order.phone, 
            created_at: order.created_at,
            customer_name: order.customer_name
          })
          .select();
          
        if (fallbackError) throw fallbackError;
        if (!fallbackData || fallbackData.length === 0) {
          throw new Error('Order not found in database');
        }
      }
      
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, special_note: note } : o));
      setStatusMsg({ type: 'success', text: `Special note updated` });
    } catch (err: any) {
      console.error('Error updating note:', err);
      setStatusMsg({ type: 'error', text: `Failed to update note: ${err.message || 'Unknown error'}` });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (order: any) => {
    const idStr = String(order.id);
    
    // First click: set confirmation state
    if (confirmDeleteId !== idStr) {
      setConfirmDeleteId(idStr);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => {
        setConfirmDeleteId(current => current === idStr ? null : current);
      }, 3000);
      return;
    }

    // Second click: proceed with deletion
    setDeletingOrderId(idStr);
    setConfirmDeleteId(null);
    
    try {
      console.log('Attempting to delete order:', order);
      
      // 1. Try primary deletion by ID
      // We pass the ID exactly as it came from the database
      const { data, error } = await supabase
        .from('orders')
        .delete()
        .eq('id', order.id)
        .select();
      
      if (error) {
        console.warn('Primary delete by ID failed, trying fallback:', error);
        
        // 2. Fallback: Delete by matching other unique-ish fields
        // This helps if 'id' is a virtual column or has trigger/type issues
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('orders')
          .delete()
          .match({ 
            phone: order.phone, 
            created_at: order.created_at,
            customer_name: order.customer_name
          })
          .select();
        
        if (fallbackError) {
          console.error('Fallback delete also failed:', fallbackError);
          // If both failed, show the most relevant error
          const msg = error.message.includes('uuid') 
            ? `Database type mismatch: ${error.message}. Please check if the 'id' column is a UUID but the app is receiving an integer.`
            : fallbackError.message;
          throw new Error(msg);
        }
        
        if (!fallbackData || fallbackData.length === 0) {
          throw new Error(error.message || 'Order not found');
        }
        
        console.log('Fallback delete successful:', fallbackData);
      } else if (!data || data.length === 0) {
        // No error but nothing deleted? Try fallback just in case
        const { data: fallbackData } = await supabase
          .from('orders')
          .delete()
          .match({ 
            phone: order.phone, 
            created_at: order.created_at 
          })
          .select();
          
        if (!fallbackData || fallbackData.length === 0) {
          setStatusMsg({ type: 'error', text: 'Order not found in database.' });
          setOrders(prev => prev.filter(o => String(o.id) !== idStr));
          return;
        }
      }
      
      setOrders(prev => prev.filter(o => String(o.id) !== idStr));
      setStatusMsg({ type: 'success', text: `Order #${formatOrderRef(order)} deleted successfully` });
    } catch (err: any) {
      console.error('Final delete error:', err);
      setStatusMsg({ type: 'error', text: `Failed to delete: ${err.message || 'Unknown error'}` });
    } finally {
      setDeletingOrderId(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchStatus = statusFilter === 'ALL' || (o.status || 'PENDING') === statusFilter;
    const matchState = stateFilter === 'ALL' || (o.order_state || 'DID_NOT_ARRIVE') === stateFilter;
    
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || 
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.phone || '').includes(q) ||
      formatOrderRef(o).toLowerCase().includes(q) ||
      String(o.id).toLowerCase().includes(q);

    return matchStatus && matchState && matchSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, stateFilter, searchQuery, itemsPerPage]);

  const totalPages = itemsPerPage > 0 ? Math.ceil(filteredOrders.length / itemsPerPage) : 1;
  const paginatedOrders = itemsPerPage > 0 
    ? filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredOrders;

  const getRemainingDays = (createdAt: string) => {
    const orderDate = new Date(createdAt);
    const expiryDate = new Date(orderDate.getTime() + 15 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const downloadCSV = () => {
    if (!filteredOrders.length) return;

    const headers = [
      'Date',
      'Customer Name',
      'Phone Number',
      'Location',
      'Delivery Type',
      'Books',
      'Prices',
      'Total Price (DA)',
      'Status',
      'Client Note',
      'Our Special Note'
    ];

    const rows = filteredOrders.map(order => {
      const dateObj = new Date(order.created_at);
      const dateStr = `${dateObj.toLocaleDateString('en-GB')} ${dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
      
      // Use \n to put items one above another in the same Excel cell (no new rows created)
      const booksStr = order.items.map((item: any) => `• ${item.qty > 1 ? item.qty + 'x ' : ''}${item.title}`).join('\n');
      const pricesStr = order.items.map((item: any) => `${item.price * item.qty} DA`).join('\n');
      
      const deliveryType = order.shipping_method === 'direct' ? 'Home Delivery' : 'Desk/Stop';
      const location = [order.wilaya, order.baladia].filter(Boolean).join(' - ');
      
      return [
        dateStr,
        order.customer_name || '',
        order.phone || '',
        location,
        deliveryType,
        booksStr,
        pricesStr,
        order.total_price || 0,
        order.status || 'PENDING',
        order.client_note || '',
        order.special_note || ''
      ].map(val => {
        const strVal = String(val || '').replace(/"/g, '""');
        return `"${strVal}"`;
      });
    });

    const grandTotal = filteredOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);
    const summaryRow = [
      '"GRAND TOTAL"',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      `"${grandTotal}"`,
      '""',
      '""',
      '""'
    ];
    
    rows.push(summaryRow);

    // Add BOM (\uFEFF) to ensure Excel correctly renders UTF-8 characters (like Arabic)
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Lead_Tracker_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyBooksList = () => {
    if (!filteredOrders.length) return;

    let bookCounter = 1;
    let booksText = '';

    filteredOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const qty = item.qty || 1;
          for (let i = 0; i < qty; i++) {
            const authorText = item.author ? ` by ${item.author}` : '';
            booksText += `${bookCounter}. ${item.title}${authorText}\n`;
            bookCounter++;
          }
        });
      }
    });

    if (!booksText) {
      setStatusMsg({ type: 'error', text: 'No books found to copy.' });
      return;
    }

    navigator.clipboard.writeText(booksText).then(() => {
      setStatusMsg({ type: 'success', text: 'Books list copied to clipboard!' });
    }).catch(err => {
      console.error('Failed to copy', err);
      setStatusMsg({ type: 'error', text: 'Failed to copy to clipboard' });
    });
  };

  const printAllLabels = async () => {
    const ordersToPrint = selectedOrderIds.size > 0 
      ? filteredOrders.filter(o => selectedOrderIds.has(o.id))
      : filteredOrders;

    if (!ordersToPrint.length) return;

    const labelUrls = ordersToPrint
      .map(o => guepexParcels[o.id]?.label)
      .filter(Boolean);

    if (labelUrls.length === 0) {
      setStatusMsg({ type: 'error', text: 'No printed labels available for selected orders.' });
      return;
    }

    setStatusMsg({ type: 'success', text: `Generating 4-in-1 labels for ${labelUrls.length} orders...` });

    // Open window synchronously to avoid pop-up blockers
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      setStatusMsg({ type: 'error', text: 'Pop-up blocked. Please allow pop-ups to print.' });
      return;
    }
    
    newWindow.document.write('<html><body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f9fafb; color: #111;"><h2>Generating your labels, please wait...</h2></body></html>');
    newWindow.document.title = "Generating Labels...";

    try {
      const response = await fetch('/api/merge-pdf-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: labelUrls })
      });

      if (!response.ok) {
        throw new Error('Failed to merge PDFs');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      newWindow.location.href = url;
      setStatusMsg({ type: 'success', text: `Generated ${labelUrls.length} labels in 4-in-1 format.` });
    } catch (err: any) {
      console.error('Error merging labels:', err);
      newWindow.close();
      setStatusMsg({ type: 'error', text: err.message || 'Failed to merge labels' });
    }
  };

  const pendingBooksCount = filteredOrders.reduce((total, order) => {
    // Only status CONFIRMED or PENDING (i.e. exclude CANCELLED)
    if (order.status === 'CANCELLED') return total;
    
    // Only count if state is DID_NOT_ARRIVE (or missing, which defaults to DID_NOT_ARRIVE)
    const state = order.order_state || 'DID_NOT_ARRIVE';
    if (state === 'DID_NOT_ARRIVE') {
      const itemsCount = order.items?.reduce((sum: number, item: any) => sum + (item.qty || 1), 0) || 0;
      return total + itemsCount;
    }
    return total;
  }, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-3xl font-serif font-bold purplish-text-gradient">Orders</h2>
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl" title="Total books across all CONFIRMED or PENDING orders that have not arrived yet">
            <ShoppingBag className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-bold text-yellow-400">
              Yet to Arrive: <span className="text-yellow-300 ml-1">{pendingBooksCount} books</span>
            </span>
          </div>
          <button
            onClick={downloadCSV}
            className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all text-sm font-bold"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
          <button
            onClick={copyBooksList}
            className="flex items-center space-x-2 bg-primary/20 hover:bg-primary/30 text-primary-light px-4 py-2 rounded-xl transition-all text-sm font-bold"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Copy Books</span>
          </button>
          <button
            onClick={printAllLabels}
            className="flex items-center space-x-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-4 py-2 rounded-xl transition-all text-sm font-bold"
            title="Merge and print all labels for the currently filtered orders"
          >
            <Printer className="w-4 h-4" />
            <span>Print Labels ({selectedOrderIds.size > 0 ? selectedOrderIds.size : filteredOrders.filter(o => guepexParcels[o.id]?.label).length})</span>
          </button>
          <AnimatePresence>
            {statusMsg && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg backdrop-blur-md border ${
                  statusMsg.type === 'success' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}
              >
                {statusMsg.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 w-full lg:w-auto items-stretch xl:items-center">
          <div className="relative w-full xl:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search client name, phone or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto">
            {['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === status 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto">
            {[
              { value: 'ALL', label: 'ALL STATES' },
              { value: 'DID_NOT_ARRIVE', label: 'NOT ARRIVED' },
              { value: 'IN_STOCK_UNPACKAGED', label: 'UNPACKAGED' },
              { value: 'READY_NOT_DELIVERED', label: 'READY' },
              { value: 'DELIVERED_PAID', label: 'DELIVERED' },
              { value: 'DELIVERED_RETURNED', label: 'RETURNED' }
            ].map((state) => (
              <button
                key={state.value}
                onClick={() => setStateFilter(state.value as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  stateFilter === state.value 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {state.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-12 text-white/40">Loading orders...</div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white/5 p-4 rounded-[1.5rem] border border-white/10">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-white/40 uppercase tracking-wider">
                {filteredOrders.length} Total Orders
              </span>
              <button
                onClick={() => {
                  if (selectedOrderIds.size === paginatedOrders.length && paginatedOrders.length > 0) {
                    setSelectedOrderIds(new Set());
                  } else {
                    setSelectedOrderIds(new Set(paginatedOrders.map(o => o.id)));
                  }
                }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                {selectedOrderIds.size === paginatedOrders.length && paginatedOrders.length > 0 
                  ? 'Deselect All Page' 
                  : 'Select All Page'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-white/40 uppercase">Per page:</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-ink border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary/50"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={-1}>All</option>
              </select>
            </div>
          </div>
          {paginatedOrders.map(order => {
            const remainingDays = getRemainingDays(order.created_at);
            const isExpired = remainingDays <= 0;
            
            return (
            <div key={order.id} className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 space-y-6 shadow-xl hover:bg-white/[0.07] transition-colors">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.has(order.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedOrderIds);
                        if (e.target.checked) newSet.add(order.id);
                        else newSet.delete(order.id);
                        setSelectedOrderIds(newSet);
                      }}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-ink cursor-pointer"
                    />
                    <h4 className="font-bold text-xl text-white">
                      Order #{guepexParcels[order.id]?.tracking || formatOrderRef(order)}
                    </h4>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      isExpired ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                      remainingDays <= 3 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {isExpired ? 'Expired' : `${remainingDays} days left`}
                    </span>
                  </div>
                  <p className="text-sm text-white/40 font-medium mt-1" title={order.id}>System ID: {order.id.split('-')[0]}</p>
                  <p className="text-sm text-white/40 font-medium mt-1">{new Date(order.created_at).toLocaleString()}</p>
                  {guepexParcels[order.id] ? (() => {
                    const statusStr = (guepexParcels[order.id].last_status || 'UNKNOWN').toLowerCase();
                    const isDelivered = statusStr === 'livré' || statusStr === 'livre' || statusStr.startsWith('livré ') || statusStr.startsWith('livre ');
                    const isReturned = statusStr.includes('retour') || statusStr.includes("echec de livraison") || statusStr.includes("échec de livraison") || statusStr.includes("echec d'livraison") || statusStr.includes("échec d'livraison");
                    const isReady = statusStr.includes('en preparation') || statusStr.includes('en préparation');
                    
                    const boxClass = isDelivered ? 'bg-green-500/20 border-green-500/30' : 
                                     isReturned ? 'bg-red-500/20 border-red-500/30' : 
                                     isReady ? 'bg-purple-500/20 border-purple-500/30' :
                                     'bg-indigo-500/20 border-indigo-500/30';
                    const iconClass = isDelivered ? 'text-green-400' : 
                                      isReturned ? 'text-red-400' : 
                                      isReady ? 'text-purple-400' :
                                      'text-indigo-400';
                                      
                    return (
                      <div className={`mt-3 inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${boxClass}`}>
                        <Truck className={`w-3.5 h-3.5 ${iconClass}`} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${iconClass}`}>{guepexParcels[order.id].last_status || 'UNKNOWN'}</span>
                        <a href={guepexParcels[order.id].label} target="_blank" rel="noreferrer" className="text-[10px] text-white/60 hover:text-white underline ml-2">Print Label</a>
                      </div>
                    );
                  })() : (
                    <div className="mt-3">
                       <button onClick={() => {
                         // Manual push logic
                         fetch('/api/guepex-sync', {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({
                             order_id: order.id,
                             firstname: order.customer_name.split(' ')[0] || 'Client',
                             familyname: order.customer_name.split(' ').slice(1).join(' ') || '.',
                             contact_phone: order.phone,
                             address: `${order.wilaya}, ${order.baladia}`,
                             to_commune_name: order.baladia,
                             to_wilaya_name: order.wilaya,
                             price: order.total_price || 0,
                             product_list: order.items.map((i:any) => `${i.qty}x ${i.title}`).join(', '),
                             is_stopdesk: order.shipping_method === 'office',
                             stopdesk_id: null // Will be auto-resolved in backend
                           })
                         }).then(r => r.json()).then(res => {
                           if (res.success) {
                             setStatusMsg({ type: 'success', text: 'Order synced to Guepex!' });
                             fetchOrders();
                           } else {
                             setStatusMsg({ type: 'error', text: res.error || 'Failed to sync' });
                           }
                         });
                       }} className="inline-flex items-center space-x-2 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-colors text-indigo-400">
                         <RefreshCw className="w-3.5 h-3.5" />
                         <span className="text-xs font-bold uppercase tracking-wider">Sync to Guepex</span>
                       </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  {updatingId === order.id && <RefreshCw className="w-4 h-4 animate-spin text-primary-light" />}
                  <button
                    onClick={() => handleWhatsAppClick(order, order.phone)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                      sentWaOrders[String(order.id)]
                        ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-bold'
                        : 'bg-white/5 text-white/40 border-white/10 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/30'
                    }`}
                    title={sentWaOrders[String(order.id)] ? "WhatsApp confirmation already sent! Click to open again." : "Send pre-filled WhatsApp confirmation message to customer"}
                  >
                    {sentWaOrders[String(order.id)] ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>WA Sent ✓</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 opacity-50 text-white/40" />
                        <span>WA Confirm</span>
                      </>
                    )}
                  </button>
                  <select 
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order, e.target.value)}
                    disabled={updatingId === order.id}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.2em] border-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all ${
                      order.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                      order.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    }`}
                  >
                    <option value="PENDING" className="bg-ink">Pending</option>
                    <option value="CONFIRMED" className="bg-ink">Confirmed</option>
                    <option value="CANCELLED" className="bg-ink">Canceled</option>
                  </select>
                  <select 
                    value={order.order_state || 'DID_NOT_ARRIVE'}
                    onChange={(e) => handleOrderStateUpdate(order, e.target.value)}
                    disabled={updatingId === order.id}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.1em] border-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all ${
                      order.order_state === 'DID_NOT_ARRIVE' || !order.order_state ? 'bg-gray-500/20 text-gray-400' :
                      order.order_state === 'IN_STOCK_UNPACKAGED' ? 'bg-yellow-500/20 text-yellow-400' :
                      order.order_state === 'READY_NOT_DELIVERED' ? 'bg-purple-500/20 text-purple-400' :
                      order.order_state === 'DELIVERED_PAID' ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    }`}
                  >
                    <option value="DID_NOT_ARRIVE" className="bg-ink">Did not arrive yet</option>
                    <option value="IN_STOCK_UNPACKAGED" className="bg-ink">In stock but unpackaged</option>
                    <option value="READY_NOT_DELIVERED" className="bg-ink">Ready but not delivered</option>
                    <option value="DELIVERED_PAID" className="bg-ink">Delivered and paid</option>
                    <option value="DELIVERED_RETURNED" className="bg-ink">Delivered but returned</option>
                  </select>
                  <button 
                    onClick={() => handleDeleteOrder(order)}
                    disabled={deletingOrderId === String(order.id)}
                    className={`p-2 rounded-xl transition-all duration-300 flex items-center space-x-2 ${
                      confirmDeleteId === String(order.id) 
                        ? 'bg-red-500 text-white px-4 shadow-lg shadow-red-500/20' 
                        : 'hover:bg-red-500/20 text-red-400'
                    }`}
                  >
                    {deletingOrderId === String(order.id) ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : confirmDeleteId === String(order.id) ? (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Confirm?</span>
                      </>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">Customer Details</p>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-lg font-bold text-white">{order.customer_name}</p>
                        {customerFlags[order.phone]?.deliveredPaid > 0 && (
                          <div title={`${customerFlags[order.phone].deliveredPaid} successful orders`} className="text-green-400 flex items-center space-x-1">
                            <CheckCircle className="w-5 h-5 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                            <span className="text-xs font-bold">{customerFlags[order.phone].deliveredPaid}</span>
                          </div>
                        )}
                        {customerFlags[order.phone]?.deliveredReturned > 0 && (
                          <div title={`${customerFlags[order.phone].deliveredReturned} returned orders`} className="text-red-500 flex items-center space-x-1">
                            <XCircle className="w-5 h-5 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            <span className="text-xs font-bold">{customerFlags[order.phone].deliveredReturned}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-primary-light font-bold">{order.phone}</p>
                        <button
                          onClick={() => handleWhatsAppClick(order, order.phone)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                            sentWaOrders[String(order.id)]
                              ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                              : 'bg-white/5 text-white/40 border-white/10 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/30'
                          }`}
                          title={sentWaOrders[String(order.id)] ? "Confirmation sent! Click to open WhatsApp again." : "Open WhatsApp chat with pre-filled confirmation text"}
                        >
                          {sentWaOrders[String(order.id)] ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Sent ✓</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-3.5 h-3.5 opacity-50" />
                              <span>WhatsApp</span>
                            </>
                          )}
                        </button>
                      </div>
                      {(order as any).phone2 && (
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-white/40 italic">Alt: {(order as any).phone2}</p>
                          <button
                            onClick={() => handleWhatsAppClick(order, (order as any).phone2)}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all border ${
                              sentWaOrders[String(order.id)]
                                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                                : 'bg-white/5 text-white/40 border-white/10 hover:bg-emerald-500/20 hover:text-emerald-300'
                            }`}
                            title="Open WhatsApp chat with alt number"
                          >
                            <MessageSquare className="w-3 h-3 opacity-50" />
                            <span>WA</span>
                          </button>
                        </div>
                      )}
                      {order.instagram_account && <p className="text-sm text-primary-light font-bold">@{order.instagram_account}</p>}
                      <p className="text-sm text-white/60 mt-2">{order.wilaya}, {order.baladia}</p>
                      {order.shipping_method === 'office' ? (
                        <div className="mt-3 inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-xl text-xs font-bold">
                          <Truck className="w-3.5 h-3.5 text-purple-400" />
                          <span>Office Pickup — Agency: {order.client_note && order.client_note.includes('Agency / StopDesk:') ? order.client_note.split('|')[0].replace('Agency / StopDesk:', '').trim() : 'Specified Office'}</span>
                        </div>
                      ) : (
                        <div className="mt-3 inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-xl text-xs font-bold">
                          <Truck className="w-3.5 h-3.5 text-blue-400" />
                          <span>Home Delivery</span>
                        </div>
                      )}
                    </div>
                    <div className="inline-flex items-center space-x-2 bg-primary/20 text-primary-light px-4 py-2 rounded-xl border border-primary/30 shadow-lg shadow-primary/5">
                      <Trophy className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest notranslate">{order.points} BigDeal Points</span>
                    </div>

                    {order.client_note && (
                      <div className="pt-4 border-t border-white/10 space-y-2">
                        <p className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">Client Note</p>
                        <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80">
                          {order.client_note}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-white/10 space-y-2">
                      <p className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">Our Special Note</p>
                      <textarea
                        defaultValue={order.special_note || ''}
                        onBlur={(e) => {
                          if (e.target.value !== (order.special_note || '')) {
                            handleNoteUpdate(order, e.target.value);
                          }
                        }}
                        placeholder="Add a special note for this order..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">
                      Order Summary 
                      <span className={`ml-2 px-2 py-0.5 rounded-md text-[10px] ${order.shipping_method === 'direct' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'}`}>
                        {order.shipping_method === 'direct' ? 'Home Delivery' : 'Desk/Stop'}
                      </span>
                    </p>
                    <button 
                      onClick={() => {
                        if (!order.items || order.items.length === 0) return;
                        const text = order.items.map((item: any, idx: number) => {
                          const authorStr = item.author ? ` by ${item.author}` : '';
                          // If quantity > 1, maybe include it? The user didn't ask for it, but let's stick to the requested format: "1. dune by Frank Herbert"
                          const qtyStr = item.qty > 1 ? ` (${item.qty}x)` : '';
                          return `${idx + 1}. ${item.title}${authorStr}${qtyStr}`;
                        }).join('\n');
                        
                        navigator.clipboard.writeText(text).then(() => {
                          setStatusMsg({ type: 'success', text: 'Books list copied to clipboard!' });
                        }).catch(err => {
                          console.error('Failed to copy', err);
                          setStatusMsg({ type: 'error', text: 'Failed to copy to clipboard' });
                        });
                      }}
                      className="p-1.5 bg-primary/20 text-primary-light rounded-lg hover:bg-primary/30 transition-colors"
                      title="Copy books list"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <ul className="space-y-3">
                    {order.items?.map((item: any, idx: number) => {
                      const inInventory = item.book_id && inventoryIds.includes(item.book_id);
                      return (
                        <li key={idx} className={`flex justify-between items-center p-3 rounded-xl border ${inInventory ? 'bg-primary/20 border-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'bg-white/5 border-white/5'}`}>
                          <div className="flex flex-col">
                            <span className="notranslate text-sm font-medium flex items-center gap-2 text-white">
                              {inInventory && <Star className="w-4 h-4 text-primary-light" />}
                              {item.qty}x {item.title}
                            </span>
                            {item.author && <span className={`text-xs ${inInventory ? 'text-primary-light/70' : 'text-white/40'}`}>{item.author}</span>}
                          </div>
                          <span className={`font-bold text-sm ${inInventory ? 'text-primary-light' : 'text-white'}`}>{((item.price || 0) * item.qty).toFixed(2)} DA</span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-sm font-bold text-white/40 uppercase tracking-widest">Grand Total</span>
                    <span className="text-2xl font-bold text-primary-light">{(order.total_price || 0).toFixed(2)} DA</span>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
          
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && (
                        <span className="text-white/30 px-1">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                          currentPage === p
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {filteredOrders.length === 0 && (
            <div className="text-center py-24 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
              <p className="text-white/40">No orders found matching the selected filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ManageShipping() {
  const [rates, setRates] = useState<ShippingRate[]>(ECONOMIC_RATES);
  const [wilayas, setWilayas] = useState<string[]>(wilayaList);
  const [editingRate, setEditingRate] = useState<Partial<ShippingRate> | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const { data, error } = await supabase.from('shipping_rates').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        setRates(data);
      } else {
        setRates(ECONOMIC_RATES);
      }
    } catch (err) {
      console.error('Error fetching rates:', err);
      setRates(ECONOMIC_RATES);
    }
  };

  const syncEconomicRates = async () => {
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('shipping_rates').upsert(ECONOMIC_RATES);
      if (error) throw error;
      alert('Successfully synced all 58 Wilaya Economic Tariff rates to the database!');
      fetchRates();
    } catch (err: any) {
      console.error('Error syncing rates:', err);
      alert('Failed to sync rates to database: ' + (err.message || err));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRate?.wilaya) return;
    try {
      const { error } = await supabase.from('shipping_rates').upsert(editingRate);
      if (error) throw error;
      setEditingRate(null);
      fetchRates();
    } catch (err) {
      console.error('Error saving rate:', err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold purplish-text-gradient">Shipping Rates</h2>
          <p className="text-xs text-white/50 mt-1">Configured according to Guepex Tarif [ECONOMIQUE]</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={syncEconomicRates}
            disabled={isSyncing}
            className="bg-white/10 text-white px-4 py-3 rounded-xl hover:bg-white/20 transition-all font-bold text-xs flex items-center space-x-2 border border-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync Economic Rates (PDF)</span>
          </button>
          <button 
            onClick={() => setEditingRate({ wilaya: '', rate_per_item: 0, office_pickup_rate: 0 })} 
            className="bg-primary text-white p-3 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-light transition-all"
            title="Add Custom Rate"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
      {editingRate && (
        <form onSubmit={handleSave} className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] grid grid-cols-1 md:grid-cols-3 gap-6 border border-white/10 shadow-2xl">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Wilaya</label>
            <select required value={editingRate.wilaya} onChange={e => setEditingRate({ ...editingRate, wilaya: e.target.value })} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all">
              <option value="" className="bg-ink">Select Wilaya</option>
              {wilayas.map(w => <option key={w} value={w} className="bg-ink">{w}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Direct Rate (DA)</label>
            <input type="number" required placeholder="Direct Rate" value={editingRate.rate_per_item} onChange={e => setEditingRate({ ...editingRate, rate_per_item: parseFloat(e.target.value) })} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Office Rate (DA)</label>
            <input type="number" required placeholder="Office Rate" value={editingRate.office_pickup_rate} onChange={e => setEditingRate({ ...editingRate, office_pickup_rate: parseFloat(e.target.value) })} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
          </div>
          <button type="submit" className="bg-primary text-white py-4 rounded-xl md:col-span-3 font-bold shadow-lg shadow-primary/20 hover:bg-primary-light transition-all mt-2">Save Shipping Rate</button>
        </form>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rates.map(rate => (
          <div key={rate.wilaya} className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl flex justify-between items-center border border-white/10 shadow-lg hover:bg-white/[0.07] transition-all group">
            <div>
              <p className="font-bold text-white text-lg">{rate.wilaya}</p>
              <div className="flex gap-3 mt-1">
                <span className="text-[10px] font-bold text-primary-light uppercase tracking-widest">Direct: {rate.rate_per_item} DA</span>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Office: {rate.office_pickup_rate} DA</span>
              </div>
            </div>
            <button onClick={() => setEditingRate(rate)} className="p-2 text-white/40 hover:text-primary-light hover:bg-primary/10 rounded-xl transition-all"><Edit className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManageReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  useEffect(() => {
    supabase.from('reviews').select('*').order('created_at', { ascending: false }).then(({ data }) => setReviews(data || []));
  }, []);
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    setReviews(prev => prev.filter(r => r.id !== id));
  };
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-serif font-bold purplish-text-gradient">Customer Reviews</h2>
      <div className="grid grid-cols-1 gap-6">
        {reviews.map(review => (
          <div key={review.id} className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-xl hover:bg-white/[0.07] transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <QuoteIcon className="w-24 h-24" />
            </div>
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <p className="font-bold text-lg text-white">{review.user_name}</p>
                  <div className="flex items-center gap-1 bg-primary/20 px-2 py-0.5 rounded-lg border border-primary/30">
                    <Star className="w-3 h-3 text-primary-light fill-primary-light" />
                    <span className="text-[10px] font-bold text-primary-light">{review.rating}</span>
                  </div>
                </div>
                <p className="text-white/60 leading-relaxed max-w-3xl italic">"{review.comment}"</p>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{new Date(review.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleDelete(review.id)} className="p-3 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-center py-12 text-white/40">No reviews yet.</p>}
      </div>
    </div>
  );
}

function ManageQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [editingQuote, setEditingQuote] = useState<Partial<Quote> | null>(null);
  useEffect(() => { fetchQuotes(); }, []);
  const fetchQuotes = async () => {
    const { data } = await fetchAllRows('quotes', '*', 'created_at', false);
    setQuotes(data || []);
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote) return;
    
    try {
      const quoteToSave = {
        ...editingQuote,
        id: editingQuote.id || crypto.randomUUID(),
        created_at: editingQuote.created_at || new Date().toISOString()
      };

      const { error } = await supabase
        .from('quotes')
        .upsert([quoteToSave]);

      if (error) throw error;
      
      setEditingQuote(null);
      fetchQuotes();
    } catch (err: any) {
      console.error('Error saving quote:', err);
      alert(`Error saving quote: ${err.message}`);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this quote?')) return;
    await supabase.from('quotes').delete().eq('id', id);
    setQuotes(prev => prev.filter(q => q.id !== id));
  };
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif font-bold purplish-text-gradient">Literary Quotes</h2>
        <button 
          onClick={() => setEditingQuote({ text: '', author: '' })} 
          className="bg-primary text-white p-3 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-light transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      {editingQuote && (
        <form onSubmit={handleSave} className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] space-y-6 border border-white/10 shadow-2xl">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Quote Text</label>
            <textarea 
              required 
              placeholder="Enter the quote text..."
              value={editingQuote.text || ''} 
              onChange={e => setEditingQuote({ ...editingQuote, text: e.target.value })} 
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px]" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Author</label>
            <input 
              required 
              placeholder="Author name..."
              value={editingQuote.author || ''} 
              onChange={e => setEditingQuote({ ...editingQuote, author: e.target.value })} 
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
            />
          </div>
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={() => setEditingQuote(null)} className="flex-1 py-4 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-colors text-white">Cancel</button>
            <button type="submit" className="flex-1 bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-light transition-all shadow-lg shadow-primary/20">Save Quote</button>
          </div>
        </form>
      )}
      <div className="grid grid-cols-1 gap-6">
        {quotes.map(quote => (
          <div key={quote.id} className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] flex justify-between items-start border border-white/10 shadow-lg hover:bg-white/[0.07] transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <QuoteIcon className="w-24 h-24" />
            </div>
            <div className="relative z-10 space-y-3">
              <p className="italic text-lg text-white leading-relaxed max-w-3xl">"{quote.text}"</p>
              <p className="text-sm font-bold text-primary-light uppercase tracking-widest">— {quote.author}</p>
            </div>
            <button onClick={() => handleDelete(quote.id)} className="p-3 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all relative z-10"><Trash2 className="w-5 h-5" /></button>
          </div>
        ))}
        {quotes.length === 0 && <p className="text-center py-12 text-white/40">No quotes added yet.</p>}
      </div>
    </div>
  );
}

function ManageLoyalty() {
  const [loyaltyData, setLoyaltyData] = useState<(LoyaltyPoints & { instagram?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPoints, setEditingPoints] = useState<{ phone: string, points: number, instagram: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .order('points', { ascending: false });

      if (error) throw error;
      
      // Fetch Instagram accounts from orders and special requests
      const { data: ordersData } = await supabase.from('orders').select('phone, customer_name');
      const { data: requestsData } = await supabase.from('special_requests').select('phone, instagram_account');
      
      const phoneToIg: Record<string, string> = {};
      
      if (requestsData) {
        requestsData.forEach(req => {
          if (req.phone && req.instagram_account) {
            phoneToIg[req.phone] = req.instagram_account;
          }
        });
      }
      
      if (ordersData) {
        ordersData.forEach(ord => {
          if (ord.phone && ord.customer_name && !phoneToIg[ord.phone]) {
            const igMatch = ord.customer_name.match(/\(IG: @([^)]+)\)/);
            if (igMatch && igMatch[1]) {
              phoneToIg[ord.phone] = igMatch[1].trim();
            }
          }
        });
      }

      setLoyaltyData((data || []).map(item => ({
        ...item,
        instagram: phoneToIg[item.phone] || undefined
      })));
    } catch (err) {
      console.error('Error fetching loyalty data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPoints || isSaving) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('loyalty_points')
        .update({ points: editingPoints.points, instagram: editingPoints.instagram || null })
        .eq('phone', editingPoints.phone);

      if (error) throw error;
      
      setLoyaltyData(prev => prev.map(item => 
        item.phone === editingPoints.phone ? { ...item, points: editingPoints.points, instagram: editingPoints.instagram || undefined } : item
      ));
      setEditingPoints(null);
    } catch (err: any) {
      console.error('Error updating points:', err);
      if (err.message?.includes('column "instagram" of relation "loyalty_points" does not exist')) {
        alert("Please run the SQL migration '/sql/add_instagram_to_loyalty_points.sql' in your Supabase SQL Editor first. The database column is missing.");
      } else {
        alert(`Error: ${err.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const filteredData = loyaltyData.filter(item => 
    item.phone.includes(searchQuery) || (item.instagram && item.instagram.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-serif font-bold purplish-text-gradient">Loyalty Points Management</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            type="text"
            placeholder="Search phone or IG..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {editingPoints && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-ink/90 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 shadow-2xl w-full max-w-md space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Edit Points</h3>
              <button onClick={() => setEditingPoints(null)} className="text-white/40 hover:text-white"><X /></button>
            </div>
            <p className="text-sm text-white/60">Updating points for: <span className="text-primary-light font-bold">{editingPoints.phone}</span></p>
            <form onSubmit={handleUpdatePoints} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Points Balance</label>
                <input 
                  type="number" 
                  value={editingPoints.points}
                  onChange={e => setEditingPoints({ ...editingPoints, points: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Instagram Account (Optional)</label>
                <input 
                  type="text" 
                  value={editingPoints.instagram}
                  onChange={e => setEditingPoints({ ...editingPoints, instagram: e.target.value })}
                  placeholder="@username"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingPoints(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-white font-bold">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-light transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-widest">
                <th className="px-8 py-6 font-medium">Phone Number</th>
                <th className="px-8 py-6 font-medium">Instagram</th>
                <th className="px-8 py-6 font-medium">Points Balance</th>
                <th className="px-8 py-6 font-medium">Joined Date</th>
                <th className="px-8 py-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-white/40">Loading loyalty data...</td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map(item => (
                  <tr key={item.phone} className="group hover:bg-white/5 transition-colors">
                    <td className="px-8 py-5 font-bold text-white">{item.phone}</td>
                    <td className="px-8 py-5">
                      {item.instagram && (
                        <a href={`https://instagram.com/${item.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-pink-400 hover:text-pink-300 font-bold text-sm bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20 w-fit">
                          <Instagram className="w-4 h-4" />
                          @{item.instagram.replace('@', '')}
                        </a>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-primary-light" />
                        <span className="font-bold text-primary-light">{item.points} pts</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-white/40">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => setEditingPoints({ phone: item.phone, points: item.points, instagram: item.instagram || '' })}
                        className="p-2 hover:bg-primary/20 text-primary-light rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-white/40">No loyalty data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ManageRequests() {
  const [requests, setRequests] = useState<SpecialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('ALL');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await fetchAllRows('special_requests', '*', 'created_at', false);

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED') => {
    try {
      const { error } = await supabase
        .from('special_requests')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error updating status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this request?')) return;
    try {
      const { error } = await supabase
        .from('special_requests')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error deleting request:', err);
      alert('Error deleting request');
    }
  };

  const filteredRequests = requests.filter(r => statusFilter === 'ALL' || (r.status || 'PENDING') === statusFilter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-serif font-bold purplish-text-gradient">Special Requests</h2>
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                statusFilter === status 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/40">Loading requests...</div>
      ) : (
        <div className="space-y-6">
          {filteredRequests.map(request => (
            <div key={request.id} className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 space-y-6 shadow-xl hover:bg-white/[0.07] transition-all group">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold text-xl text-white">Request for: {request.book_name}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      request.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      request.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {request.status || 'PENDING'}
                    </span>
                  </div>
                  <p className="text-sm text-white/40 font-medium">by {request.author}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={request.status || 'PENDING'}
                    onChange={(e) => handleUpdateStatus(request.id, e.target.value as any)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="PENDING" className="bg-ink">Pending</option>
                    <option value="CONFIRMED" className="bg-ink">Confirmed</option>
                    <option value="CANCELLED" className="bg-ink">Canceled</option>
                  </select>
                  <button onClick={() => handleDelete(request.id)} className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <p className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">Customer Information</p>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-white">{request.full_name}</p>
                    <p className="text-primary-light font-bold">{request.phone}</p>
                    <p className="text-sm text-white/50">{request.email}</p>
                    {request.instagram_account && <p className="text-sm text-primary-light font-bold mt-1">IG: @{request.instagram_account}</p>}
                    <p className="text-sm text-white/40 mt-2">{request.wilaya}, {request.baladia}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {((request.shipping_method === 'office') || (request.notes && request.notes.includes('Office Pickup'))) ? (
                        <span className="inline-flex items-center gap-1 bg-primary/20 text-primary-light border border-primary/30 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                          🏢 Office Pickup
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                          🚗 Home Delivery
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {request.notes && (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">Customer Notes</p>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-sm text-white/60 leading-relaxed italic">"{request.notes}"</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredRequests.length === 0 && (
            <div className="text-center py-24 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
              <p className="text-white/40">No special requests found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ManageFeatured() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await fetchAllRows('books', '*', 'title', true);

      if (error) {
        console.warn('Fetch books warning:', error.message || error);
      }
      setBooks(data || []);
    } catch (err: any) {
      console.warn('Fetch books exception:', err?.message || err);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (bookId: string, currentStatus: boolean) => {
    setIsUpdating(bookId);
    try {
      const { error } = await supabase
        .from('books')
        .update({ featured: !currentStatus })
        .eq('id', bookId);

      if (error) throw error;
      
      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, featured: !currentStatus } : b));
    } catch (err: any) {
      console.error('Error updating featured status:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsUpdating(null);
    }
  };

  const featuredBooks = books.filter(b => b.featured);
  const availableBooks = books.filter(b => !b.featured && (
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h2 className="text-3xl font-serif font-bold purplish-text-gradient">Featured Read Carousel</h2>
        <p className="text-white/40 text-lg">Manage the books that cycle through the "Featured Read" panel on the home page.</p>
      </div>

      {/* Currently Featured */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-3 text-white">
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          Currently Cycling ({featuredBooks.length})
        </h3>
        
        {loading ? (
          <div className="text-center py-12 text-white/40">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBooks.map(book => (
              <div key={book.id} className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 flex gap-6 group hover:bg-white/[0.07] transition-all shadow-xl">
                <LazyImage src={book.cover_image_url} className="w-20 h-28 object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform" alt="" />
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                    <h4 className="notranslate font-bold text-white truncate">{book.title}</h4>
                    <p className="text-sm text-white/40 truncate">{book.author}</p>
                  </div>
                  <button 
                    onClick={() => toggleFeatured(book.id, true)}
                    disabled={isUpdating === book.id}
                    className="text-xs font-bold text-red-400 hover:text-red-500 flex items-center gap-2 mt-4 group/btn"
                  >
                    {isUpdating === book.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3 group-hover/btn:scale-110 transition-transform" />}
                    <span>Remove from Carousel</span>
                  </button>
                </div>
              </div>
            ))}
            {featuredBooks.length === 0 && (
              <div className="col-span-full py-24 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                <p className="text-white/40">No books are currently featured. The carousel will be empty!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add More */}
      <div className="space-y-8 pt-12 border-t border-white/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <h3 className="text-xl font-bold text-white">Add to Carousel</h3>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text"
              placeholder="Search books to add..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableBooks.slice(0, 9).map(book => (
            <div key={book.id} className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 flex gap-6 hover:border-white/30 transition-all group shadow-lg">
              <LazyImage src={book.cover_image_url} className="w-20 h-28 object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform" alt="" />
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div>
                  <h4 className="notranslate font-bold text-white truncate">{book.title}</h4>
                  <p className="text-sm text-white/40 truncate">{book.author}</p>
                </div>
                <button 
                  onClick={() => toggleFeatured(book.id, false)}
                  disabled={isUpdating === book.id}
                  className="text-xs font-bold text-primary-light hover:text-white flex items-center gap-2 mt-4 group/btn"
                >
                  {isUpdating === book.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3 group-hover/btn:scale-110 transition-transform" />}
                  <span>Add to Featured</span>
                </button>
              </div>
            </div>
          ))}
          {availableBooks.length === 0 && searchQuery && (
            <div className="col-span-full py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
              <p className="text-white/40">No matching books found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ManageDiscounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [newPercent, setNewPercent] = useState(10);
  const [newOneTimeUse, setNewOneTimeUse] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [discountRules, setDiscountRules] = useState('');
  const [isSavingRules, setIsSavingRules] = useState(false);

  // Global Sale State
  const [globalSaleTitle, setGlobalSaleTitle] = useState('Weekend Flash Sale!');
  const [globalSalePercent, setGlobalSalePercent] = useState(0);
  const [globalSaleActive, setGlobalSaleActive] = useState(false);
  const [globalSaleEndsAt, setGlobalSaleEndsAt] = useState('');
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [isRevertingDiscount, setIsRevertingDiscount] = useState(false);

  useEffect(() => {
    fetchDiscounts();
    fetchRules();
    fetchGlobalSale();
  }, []);

  const fetchGlobalSale = async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      if (data) {
        const title = data.find(s => s.key === 'global_sale_title')?.value;
        const percent = data.find(s => s.key === 'global_sale_percent')?.value;
        const active = data.find(s => s.key === 'global_sale_active')?.value;
        const endsAt = data.find(s => s.key === 'global_sale_ends_at')?.value;

        if (title !== undefined) setGlobalSaleTitle(title);
        if (percent !== undefined) setGlobalSalePercent(parseInt(percent) || 0);
        if (active !== undefined) setGlobalSaleActive(active === 'true');
        if (endsAt !== undefined) {
          // Ensure it's in YYYY-MM-DDTHH:mm format for datetime-local input
          const formattedEndsAt = endsAt.length > 16 ? endsAt.substring(0, 16) : endsAt;
          setGlobalSaleEndsAt(formattedEndsAt);
        }
      }
    } catch (err) {
      console.error('Error fetching global sale:', err);
    }
  };

  const handleSaveGlobal = async () => {
    setIsSavingGlobal(true);
    try {
      const { error } = await supabase.from('site_settings').upsert([
        { key: 'global_sale_title', value: globalSaleTitle },
        { key: 'global_sale_percent', value: globalSalePercent.toString() },
        { key: 'global_sale_active', value: globalSaleActive.toString() },
        { key: 'global_sale_ends_at', value: globalSaleEndsAt }
      ], { onConflict: 'key' });

      if (error) throw error;
      alert('Global sale settings saved!');
    } catch (err: any) {
      console.error('Error saving global sale:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  const applyGlobalDiscount = async () => {
    if (globalSalePercent <= 0) return alert('Please set a percentage greater than 0');
    if (!confirm(`This will update ALL books in the database. Current price will become old price, and new price will be discounted by ${globalSalePercent}%. Continue?`)) return;

    setIsApplyingDiscount(true);
    try {
      const { data: books, error: fetchError } = await fetchAllRows('books', '*', 'created_at', false);
      if (fetchError) throw fetchError;

      if (books) {
        const updates = books.map(book => ({
          ...book,
          old_price: book.price,
          price: Math.round(book.price * (1 - globalSalePercent / 100))
        }));

        const { error: updateError } = await supabase.from('books').upsert(updates);
        if (updateError) throw updateError;
        
        alert(`Successfully applied ${globalSalePercent}% discount to ${books.length} books!`);
      }
    } catch (err: any) {
      console.error('Error applying global discount:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const revertGlobalDiscount = async () => {
    if (!confirm('This will revert ALL books to their original prices (using the "Old Price" field). Continue?')) return;

    setIsRevertingDiscount(true);
    try {
      const { data: books, error: fetchError } = await fetchAllRows('books', '*', 'created_at', false);
      if (fetchError) throw fetchError;

      if (books) {
        const updates = books
          .filter(book => book.old_price && book.old_price > 0)
          .map(book => ({
            ...book,
            price: book.old_price,
            old_price: 0
          }));

        if (updates.length === 0) {
          alert('No books found with an old price to revert to.');
          return;
        }

        const { error: updateError } = await supabase.from('books').upsert(updates);
        if (updateError) throw updateError;
        
        alert(`Successfully reverted prices for ${updates.length} books!`);
      }
    } catch (err: any) {
      console.error('Error reverting global discount:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsRevertingDiscount(false);
    }
  };

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'discount_rules')
        .single();
      if (!error && data) {
        setDiscountRules(data.value);
      }
    } catch (err) {
      console.error('Error fetching rules:', err);
    }
  };

  const handleSaveRules = async () => {
    setIsSavingRules(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'discount_rules', value: discountRules });
      if (error) throw error;
      alert('Discount rules saved successfully!');
    } catch (err: any) {
      console.error('Error saving rules:', err);
      alert(`Error saving rules: ${err.message}`);
    } finally {
      setIsSavingRules(false);
    }
  };

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await fetchAllRows('discounts', '*', 'created_at', false);

      if (error) throw error;
      setDiscounts(data || []);
    } catch (err) {
      console.error('Error fetching discounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || isSaving) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('discounts')
        .insert([{ 
          code: newCode.toUpperCase(), 
          percent: newPercent,
          one_time_use: newOneTimeUse,
          used: false
        }]);

      if (error) throw error;
      setNewCode('');
      setNewPercent(10);
      setNewOneTimeUse(false);
      await fetchDiscounts();
    } catch (err: any) {
      console.error('Error creating discount:', err);
      alert(`Error creating discount: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;
    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setDiscounts(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      console.error('Error deleting discount:', err);
      alert(`Error deleting discount: ${err.message}`);
    }
  };

  return (
    <div className="space-y-12">
      <h2 className="text-3xl font-serif font-bold purplish-text-gradient">Manage Discounts</h2>

      {/* Global Flash Sale Control */}
      <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary-light" />
            Global Flash Sale Banner
          </h3>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Banner Active</span>
            <button 
              onClick={() => setGlobalSaleActive(!globalSaleActive)}
              className={`w-12 h-6 rounded-full transition-all relative ${globalSaleActive ? 'bg-primary' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${globalSaleActive ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2 md:col-span-1">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Banner Title</label>
            <input 
              type="text" 
              value={globalSaleTitle}
              onChange={e => setGlobalSaleTitle(e.target.value)}
              placeholder="E.g. Weekend Flash Sale!"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Sale Percentage (%)</label>
            <input 
              type="number" 
              value={globalSalePercent}
              onChange={e => setGlobalSalePercent(parseInt(e.target.value))}
              min="0"
              max="100"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Ends At (Date/Time)</label>
            <input 
              type="datetime-local" 
              value={globalSaleEndsAt}
              onChange={e => setGlobalSaleEndsAt(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleSaveGlobal}
            disabled={isSavingGlobal}
            className="flex-1 bg-white/5 text-white py-4 rounded-xl font-bold hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center space-x-3"
          >
            {isSavingGlobal ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Banner Settings</span>
          </button>
          <button 
            onClick={applyGlobalDiscount}
            disabled={isApplyingDiscount || globalSalePercent <= 0}
            className="flex-1 bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-light transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center space-x-3"
          >
            {isApplyingDiscount ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Tag className="w-4 h-4" />}
            <span>Apply Global Discount</span>
          </button>
          <button 
            onClick={revertGlobalDiscount}
            disabled={isRevertingDiscount}
            className="flex-1 bg-white/5 text-white py-4 rounded-xl font-bold hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center space-x-3"
          >
            {isRevertingDiscount ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>Revert to Original Prices</span>
          </button>
        </div>
        
        <p className="text-[10px] text-white/30 italic text-center">
          * Applying the global discount will overwrite all book prices. Current price becomes "Old Price" and a new discounted price is calculated.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-8">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <Tag className="w-6 h-6 text-primary-light" />
            Active Promo Codes
          </h3>
          <form onSubmit={handleCreate} className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 flex flex-col sm:flex-row gap-6 items-end shadow-xl">
            <div className="space-y-2 flex-grow w-full">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Code Name</label>
              <input 
                type="text" 
                required 
                placeholder="E.g. SUMMER20"
                value={newCode} 
                onChange={e => setNewCode(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
              />
            </div>
            <div className="space-y-2 w-full sm:w-32">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Percent (%)</label>
              <input 
                type="number" 
                required 
                min="1" 
                max="100"
                value={newPercent} 
                onChange={e => setNewPercent(parseInt(e.target.value))} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
              />
            </div>
            <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-xl border border-white/10">
              <input 
                type="checkbox" 
                id="oneTimeUse"
                checked={newOneTimeUse}
                onChange={e => setNewOneTimeUse(e.target.checked)}
                className="w-5 h-5 rounded border-primary/20 text-primary focus:ring-primary" 
              />
              <label htmlFor="oneTimeUse" className="text-[10px] font-bold text-white/60 uppercase tracking-widest cursor-pointer">One-time use only</label>
            </div>
            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-light transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              Create
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-12 text-white/40">Loading discounts...</div>
            ) : discounts.map(discount => (
              <div key={discount.id} className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-lg flex justify-between items-center group hover:bg-white/[0.07] transition-all">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-xl font-bold text-primary-light tracking-wider">{discount.code}</p>
                    {discount.one_time_use && (
                      <span className="bg-primary/20 text-primary-light text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter border border-primary/30">1-Time</span>
                    )}
                    {discount.used && (
                      <span className="bg-red-500/20 text-red-400 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter border border-red-500/30">Used</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">{discount.percent}% Off Storewide</p>
                </div>
                <button 
                  onClick={() => handleDelete(discount.id)}
                  className="p-3 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {!loading && discounts.length === 0 && (
              <div className="col-span-full text-center py-12 text-white/40">No discount codes created yet.</div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-primary-light" />
            Discount Rules Display
          </h3>
          <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 space-y-6 shadow-xl">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Rules Content (Markdown)</label>
              <textarea 
                rows={12}
                value={discountRules}
                onChange={e => setDiscountRules(e.target.value)}
                placeholder="Write the rules that customers will see in checkout..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[250px]"
              />
            </div>
            <button 
              onClick={handleSaveRules}
              disabled={isSavingRules}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-light transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center space-x-3"
            >
              {isSavingRules ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="text-lg">Save Rules</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManageScreenshots() {
  const [screenshots, setScreenshots] = useState<{ id: string, image_url: string, active: boolean, order: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newUrl, setNewUrl] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchScreenshots();
  }, []);

  const fetchScreenshots = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'customer_screenshots')
        .single();
      
      if (!error && data && data.value) {
        let parsed = data.value;
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch(e) {}
        }
        setScreenshots(Array.isArray(parsed) ? parsed : []);
      }
    } catch (err) {
      console.error('Error fetching screenshots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    setIsSaving(true);
    const newScreenshot = {
      id: Math.random().toString(36).substring(7),
      image_url: newUrl,
      active: true,
      order: screenshots.length
    };
    
    const updatedScreenshots = [newScreenshot, ...screenshots];

    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'customer_screenshots', value: updatedScreenshots }, { onConflict: 'key' });

      if (error) throw error;
      setScreenshots(updatedScreenshots);
      setNewUrl('');
    } catch (err: any) {
      console.error('Error saving screenshot:', err);
      alert('Error saving screenshot: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const updated = screenshots.map(s => s.id === id ? { ...s, active: !currentStatus } : s);
    saveUpdates(updated);
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    const updated = screenshots.filter(s => s.id !== id);
    saveUpdates(updated);
    setConfirmDeleteId(null);
  };

  const saveUpdates = async (updated: any[]) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'customer_screenshots', value: updated }, { onConflict: 'key' });
      if (error) throw error;
      setScreenshots(updated);
    } catch (err: any) {
      console.error('Error saving updates:', err);
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-serif font-bold purplish-text-gradient">Customer Screenshots</h2>
      <p className="text-white/60">Upload screenshots of satisfied customers to display in the "Wall of Love" section on the Home page.</p>

      <div className="bg-white/5 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/10 shadow-2xl">
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-grow space-y-2 w-full">
            <label className="text-sm font-medium text-white/60">Paste Image URL</label>
            <input 
              type="url" 
              required
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="https://example.com/screenshot.png"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button 
            type="submit" 
            disabled={isSaving}
            className="whitespace-nowrap px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-light transition-all disabled:opacity-50 h-[50px] shadow-lg shadow-primary/20 flex items-center space-x-2"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            <span>Add Screenshot</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          <p className="text-white/40 col-span-full">Loading...</p>
        ) : screenshots.length === 0 ? (
          <p className="text-white/40 col-span-full text-center py-12">No screenshots added yet. Add one above!</p>
        ) : (
          screenshots.map(s => (
            <div key={s.id} className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 group relative">
              <div className="aspect-[3/4] relative">
                <LazyImage src={s.image_url} alt="Review screenshot" className={`w-full h-full object-contain bg-black/20 ${!s.active ? 'opacity-50 grayscale' : ''}`} />
                <div className="absolute inset-0 bg-ink/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                  <button 
                    onClick={() => handleToggleActive(s.id, s.active)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-colors w-32"
                  >
                    {s.active ? 'Hide' : 'Show'}
                  </button>
                  <button 
                    onClick={() => handleDelete(s.id)}
                    className={`px-4 py-2 ${confirmDeleteId === s.id ? 'bg-red-500 hover:bg-red-600' : 'bg-red-500/20 hover:bg-red-500/40'} text-white rounded-lg text-sm font-bold transition-colors w-32`}
                  >
                    {confirmDeleteId === s.id ? 'Confirm?' : 'Delete'}
                  </button>
                </div>
              </div>
              <div className="p-3 bg-ink/50 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-white/40 font-mono truncate mr-2" title={s.image_url}>
                  {s.image_url.split('/').pop() || 'image'}
                </span>
                <span className={`w-2 h-2 rounded-full ${s.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ManageInventory() {
  const [books, setBooks] = useState<Book[]>([]);
  const [inventoryIds, setInventoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [booksRes, settingsRes] = await Promise.all([
        fetchAllRows('books', 'id, title, author, cover_image_url', 'created_at', false),
        supabase.from('site_settings').select('value').eq('key', 'inventory_books').single()
      ]);

      if (booksRes.data) setBooks(booksRes.data as Book[]);
      if (settingsRes.data && settingsRes.data.value) {
        try {
          setInventoryIds(JSON.parse(settingsRes.data.value));
        } catch(e) {}
      }
    } catch (err) {
      console.error('Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleInventory = async (bookId: string) => {
    const newInventory = inventoryIds.includes(bookId) 
      ? inventoryIds.filter(id => id !== bookId)
      : [...inventoryIds, bookId];
      
    setInventoryIds(newInventory);
    
    const { error } = await supabase.from('site_settings').upsert({
      key: 'inventory_books',
      value: JSON.stringify(newInventory),
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });
    
    if (error) {
       console.error("Error updating inventory:", error);
       alert("Failed to update inventory.");
       setInventoryIds(inventoryIds); // Revert
    }
  };

  const filteredBooks = books.filter(b => {
    const title = (b.title || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();
    return title.includes(query);
  });
  
  const sortedBooks = [...filteredBooks].sort((a, b) => {
     const aInv = inventoryIds.includes(a.id) ? 1 : 0;
     const bInv = inventoryIds.includes(b.id) ? 1 : 0;
     return bInv - aInv;
  });

  const totalPages = Math.ceil(sortedBooks.length / itemsPerPage);
  const paginatedBooks = sortedBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif font-bold purplish-text-gradient">Store Inventory</h2>
        <div className="bg-primary/20 text-primary-light px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/10">
          <ClipboardList className="w-4 h-4 inline-block mr-2" />
          {inventoryIds.length} Books in Inventory
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p className="text-white/60 text-sm max-w-lg">
            Manage books that are physically available in the store. When customers order these books, they will be highlighted with a shiny border and star in your Orders menu.
          </p>
          <div className="relative w-full sm:w-64 flex-shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white/40">Loading books...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {paginatedBooks.map((book) => {
                const inInventory = inventoryIds.includes(book.id);
                return (
                  <div key={book.id} className={`group relative bg-ink rounded-2xl overflow-hidden border transition-all duration-300 ${inInventory ? 'border-primary shadow-[0_0_20px_rgba(139,92,246,0.3)] ring-1 ring-primary/50' : 'border-white/10 hover:border-white/30'}`}>
                    <div className="aspect-[2/3] relative">
                      <LazyImage src={book.cover_image_url} alt={book.title} className={`w-full h-full object-cover transition-transform duration-500 ${inInventory ? 'scale-105' : 'group-hover:scale-105'}`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                      {inInventory && (
                        <div className="absolute top-2 right-2 bg-primary text-white p-1.5 rounded-full shadow-lg">
                          <Star className="w-4 h-4 fill-white" />
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
                      <div>
                        <h4 className="text-white font-bold text-sm line-clamp-1 notranslate">{book.title}</h4>
                        <p className="text-white/40 text-xs line-clamp-1">{book.author}</p>
                      </div>
                      <button
                        onClick={() => toggleInventory(book.id)}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all duration-300 ${inInventory ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-primary text-white shadow-lg hover:shadow-primary/30'}`}
                      >
                        {inInventory ? 'Remove from Inventory' : 'Add to Inventory'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 pt-6 border-t border-white/10">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
                >
                  Previous
                </button>
                <span className="text-white/40 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
