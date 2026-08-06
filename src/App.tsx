import React, { Suspense, useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, LogOut, Instagram, Phone, Lock, Trophy, Truck } from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { useCart } from './store/useCart';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { User as UserType } from './types';
import { supabase } from './lib/supabase';
import { fetchAllRows } from './lib/api';
import { GlassVideoBackground } from './components/ui/glass-video-hero';
import { NavBar, NavLink } from './components/ui/tubelight-navbar';
import { Footer } from './components/Footer';
import { SocialProof } from './components/SocialProof';
import { usePerformance } from './hooks/usePerformance';
import { fuzzyMatch, getSearchRelevance, searchBooks } from './lib/utils';
import CartAnimation from './components/CartAnimation';
import { OrderNotification } from './components/OrderNotification';
import { initMetaPixel, trackPageView, trackSearch } from './lib/metaPixel';

const Home = React.lazy(() => import('./pages/Home'));
const BookDetail = React.lazy(() => import('./pages/BookDetail'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const SpecialRequest = React.lazy(() => import('./pages/SpecialRequest'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Categories = React.lazy(() => import('./pages/Categories'));
const ReaderSpace = React.lazy(() => import('./pages/ReaderSpace'));
const TrackOrder = React.lazy(() => import('./pages/TrackOrder'));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminError, setAdminError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [allBooksCache, setAllBooksCache] = useState<any[]>([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { isVeryLowEnd } = usePerformance();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('bigdeal_referral_code', ref);
      // Clean up URL without refreshing
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined') {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('user');
      }
    }
    initMetaPixel();
  }, []);

  useEffect(() => {
    trackPageView(window.location.href);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (location.pathname === '/') {
      document.documentElement.classList.add('home-page');
    } else {
      document.documentElement.classList.remove('home-page');
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    supabase.auth.signOut();
    navigate('/');
  };

  const handleAdminAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPasscode,
      });

      if (!authError && authData.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', adminEmail)
          .single();

        if (!userError && userData) {
          const user: UserType = {
            id: userData.id,
            email: userData.email,
            role: userData.role,
            fullName: userData.full_name
          };
          localStorage.setItem('user', JSON.stringify(user));
          setUser(user);
          setIsAdminModalOpen(false);
          setAdminPasscode('');
          setAdminEmail('');
          if (user.role === 'OWNER') navigate('/admin');
          return;
        }
      }

      // Secure server-side authentication fallback route
      const serverAuthRes = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPasscode })
      });

      if (serverAuthRes.ok) {
        const authResult = await serverAuthRes.json();
        if (authResult.success && authResult.user) {
          localStorage.setItem('user', JSON.stringify(authResult.user));
          setUser(authResult.user);
          setIsAdminModalOpen(false);
          setAdminPasscode('');
          setAdminEmail('');
          navigate('/admin');
          return;
        }
      }

      if (authError) throw authError;
      throw new Error('Access denied');
      
    } catch (err: any) {
      setAdminError(err.message || 'Access denied');
    }
  };

  const handleSearch = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      trackSearch(searchQuery.trim());
      navigate(`/?search=${encodeURIComponent(searchQuery)}#categories`);
      setIsSearchDropdownOpen(false);
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setIsSearchDropdownOpen(false);
        return;
      }

      setIsSearching(true);
      setIsSearchDropdownOpen(true);
      try {
        let booksToSearch = allBooksCache;
        if (booksToSearch.length === 0) {
          const { data, error } = await fetchAllRows(
            'books',
            'id, title, author, cover_image_url, created_at',
            'created_at',
            false
          );
            
          if (!error && data) {
            setAllBooksCache(data);
            booksToSearch = data;
          }
        }

        const results = searchBooks(booksToSearch, searchQuery, 5);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, allBooksCache]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.search-container')) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <MotionConfig reducedMotion={isVeryLowEnd ? "always" : "user"}>
    <GlassVideoBackground className="min-h-screen flex flex-col relative overflow-x-hidden bg-transparent dark:bg-transparent !items-stretch !justify-start">
      <NavBar>
        <div className="flex items-center justify-between w-full gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 shrink-0 notranslate">
            <span className="text-xl md:text-2xl font-serif font-bold purplish-text-gradient">BigDeal</span>
            <span className="text-[10px] font-medium text-primary/60 uppercase tracking-widest">Bookstore</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-grow max-w-md relative search-container">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text" 
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim().length >= 2 && setIsSearchDropdownOpen(true)}
                className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </form>

            <AnimatePresence>
              {isSearchDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-ink/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-[60]"
                >
                  {isSearching ? (
                    <div className="p-4 text-center text-white/40 text-sm">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map(book => (
                        <Link
                          key={book.id}
                          to={`/book/${book.id}`}
                          onClick={() => {
                            setSearchQuery('');
                            setIsSearchDropdownOpen(false);
                          }}
                          className="flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors"
                        >
                          <img src={book.cover_image_url} className="w-8 h-10 object-cover rounded shadow-sm" alt="" />
                          <div className="min-w-0">
                            <p className="notranslate font-bold text-sm truncate text-white">{book.title}</p>
                            <p className="text-xs text-white/40 truncate">{book.author}</p>
                          </div>
                        </Link>
                      ))}
                      <button
                        onClick={handleSearch}
                        className="w-full text-center py-2 text-xs font-bold text-primary-light hover:bg-white/5 border-t border-white/5"
                      >
                        See all results for "{searchQuery}"
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 text-center space-y-3">
                      <p className="text-white/40 text-sm">No books found for "{searchQuery}"</p>
                      <Link
                        to="/special-request"
                        onClick={() => {
                          setSearchQuery('');
                          setIsSearchDropdownOpen(false);
                        }}
                        className="inline-block bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-light transition-colors"
                      >
                        Make a Special Order
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            <NavLink 
              href="/" 
              name="Home" 
              isActive={location.pathname === '/' && !location.hash}
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
            <NavLink 
              href="/#categories" 
              name="Categories" 
              isActive={location.hash === '#categories'}
              onClick={(e) => {
                e.preventDefault();
                navigate('/#categories');
              }}
            />
            <NavLink 
              href="/reader-space" 
              name="Reader's Space" 
              isActive={location.pathname === '/reader-space'}
              onClick={(e) => {
                e.preventDefault();
                navigate('/reader-space');
              }}
            />
            {user?.role === 'OWNER' && (
              <NavLink 
                href="/admin" 
                name="Admin" 
                isActive={location.pathname.startsWith('/admin')}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/admin');
                }}
              >
                Admin Panel
              </NavLink>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            <div className="relative group">
              <Link to="/track" className="p-2 hover:bg-white/10 rounded-full transition-colors relative flex items-center justify-center text-white/80 hover:text-white">
                <Truck className="w-5 h-5" />
              </Link>
            </div>

            <div className="relative group">
              <Link to="/checkout" id="cart-icon" className="p-2.5 hover:bg-white/10 rounded-full transition-colors relative inline-flex items-center justify-center text-white">
                <ShoppingCart className="w-5 h-5" />
                {totalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-lg ring-2 ring-ink">
                    {totalItems()}
                  </span>
                )}
              </Link>
            </div>

            {user ? (
              <div className="hidden sm:flex items-center space-x-2">
                <button onClick={handleLogout} className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition-colors" title="Sign Out">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : null}

            <button 
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              onClick={() => setIsMenuOpen(true)}
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <button 
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors relative flex items-center justify-center"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 mt-4 bg-ink/90 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-2xl md:hidden"
            >
              <div className="p-6 space-y-4">
                {/* Mobile Search */}
                <div className="relative search-container">
                  <form onSubmit={handleSearch} className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input 
                      type="text" 
                      placeholder="Search books..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchQuery.trim().length >= 2 && setIsSearchDropdownOpen(true)}
                      className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </form>
                  
                  {/* Mobile Search Results */}
                  <AnimatePresence>
                    {isSearchDropdownOpen && searchQuery.trim().length >= 2 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-2 bg-white/5 rounded-2xl border border-white/10 overflow-hidden max-h-[40vh] overflow-y-auto"
                      >
                        {searchResults.map(book => (
                          <Link
                            key={book.id}
                            to={`/book/${book.id}`}
                            onClick={() => {
                              setSearchQuery('');
                              setIsSearchDropdownOpen(false);
                              setIsMenuOpen(false);
                            }}
                            className="flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors"
                          >
                            <img src={book.cover_image_url} className="w-8 h-10 object-cover rounded shadow-sm" alt="" />
                            <div className="min-w-0">
                              <p className="notranslate font-bold text-sm truncate text-white">{book.title}</p>
                              <p className="text-xs text-white/40 truncate">{book.author}</p>
                            </div>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 p-4 rounded-2xl hover:bg-white/5 text-white transition-colors">
                    <span className="font-bold">Home</span>
                  </Link>
                  <Link to="/#categories" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 p-4 rounded-2xl hover:bg-white/5 text-white transition-colors">
                    <span className="font-bold">Categories</span>
                  </Link>
                  <Link to="/reader-space" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 p-4 rounded-2xl hover:bg-white/5 text-white transition-colors text-primary-light">
                    <span className="font-bold">Reader's Space</span>
                  </Link>
                  <Link to="/track" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 p-4 rounded-2xl hover:bg-white/5 text-white transition-colors">
                    <Truck className="w-5 h-5" />
                    <span className="font-bold">Track My Order</span>
                  </Link>
                  {user?.role === 'OWNER' && (
                    <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 p-4 rounded-2xl bg-primary/10 text-primary-light transition-colors">
                      <span className="font-bold">Admin Panel</span>
                    </Link>
                  )}
                  {user && (
                    <button onClick={handleLogout} className="flex items-center space-x-3 p-4 rounded-2xl hover:bg-red-500/10 text-red-400 transition-colors w-full text-left">
                      <LogOut className="w-5 h-5" />
                      <span className="font-bold">Sign Out</span>
                    </button>
                  )}
                  <div className="md:hidden pt-2 border-t border-white/10 mt-2">
                    <div className="flex items-center justify-between p-2">
                      <span className="text-white/60 font-medium px-2">Language</span>
                      <LanguageSwitcher />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </NavBar>

      <main className="flex-grow pt-32 md:pt-36 relative z-10">
        <ScrollToTop />
        <Suspense fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/reader-space" element={<ReaderSpace />} />
            <Route path="/track" element={<TrackOrder />} />
            <Route path="/track/:id" element={<TrackOrder />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/special-request" element={<SpecialRequest />} />
            <Route path="/admin/*" element={<AdminDashboard user={user} />} />
          </Routes>
        </Suspense>
      </main>

      <Footer onAdminAccess={() => setIsAdminModalOpen(true)} />
      <SocialProof />
    </GlassVideoBackground>

    <AnimatePresence>
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-ink/80 backdrop-blur-2xl w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-8 border border-white/10 relative my-auto"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="text-center space-y-3 relative z-10">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-lg shadow-primary/5">
                <Lock className="w-10 h-10 text-primary-light" />
              </div>
              <h3 className="text-3xl font-serif font-bold text-white">Admin Access</h3>
              <p className="text-white/40 text-sm font-medium">Please enter the owner credentials to continue.</p>
            </div>

            <form onSubmit={handleAdminAccess} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Admin Email</label>
                <input 
                  type="email" 
                  required
                  placeholder="admin@example.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/40 text-white placeholder:text-white/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Passcode</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/40 text-white placeholder:text-white/20 transition-all"
                />
              </div>
              {adminError && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs text-center font-bold bg-red-400/10 py-2 rounded-lg border border-red-400/20"
                >
                  {adminError}
                </motion.p>
              )}
              <div className="flex gap-4 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAdminModalOpen(false)}
                  className="flex-1 px-4 py-4 rounded-2xl border border-white/10 font-bold hover:bg-white/5 transition-colors text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-light transition-all shadow-xl shadow-primary/20"
                >
                  Access
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      <CartAnimation />
    </AnimatePresence>
    <OrderNotification />
    </MotionConfig>
  );
}