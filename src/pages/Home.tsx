import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Star, ArrowRight, Sparkles, RefreshCw, Search, ShoppingCart, X, CheckCircle, Trophy, Gift } from 'lucide-react';
import { Book, Quote } from '../types';
import { useCart } from '../store/useCart';
import { supabase } from '../lib/supabase';
import { fetchAllRows } from '../lib/api';
import { HeroScrollDemo } from '../components/HeroScrollDemo';
import { fuzzyMatch, getSearchRelevance, searchBooks } from '../lib/utils';
import SocialCards from '../components/ui/card-fan-carousel';
import { QualityShowcaseVideo } from '../components/QualityShowcaseVideo';

import { BundleCover } from '../components/BundleCover';
import { DynamicIslandTOC } from '../components/ui/dynamic-island-toc';
import { LazyImage } from '../components/ui/lazy-image';
import { trackAddToCart } from '../lib/metaPixel';

export default function Home() {
  const { addItem } = useCart();
  const [books, setBooks] = useState<Book[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('Most Popular');
  const [sortBy, setSortBy] = useState('rating-high');
  const [searchParams, setSearchParams] = useSearchParams();
  const [fateBook, setFateBook] = useState<Book | null>(null);
  const [screenshots, setScreenshots] = useState<{ id: string, image_url: string, active: boolean, order?: number }[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(true);
  const [addedBookId, setAddedBookId] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const interactionTimeout = useRef<NodeJS.Timeout | null>(null);
  const booksPerPage = 8;

  const [paginatedBooks, setPaginatedBooks] = useState<Book[]>([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);


  const startInteraction = () => {
    setIsInteracting(true);
    if (interactionTimeout.current) clearTimeout(interactionTimeout.current);
  };

  const stopInteraction = () => {
    if (interactionTimeout.current) clearTimeout(interactionTimeout.current);
    interactionTimeout.current = setTimeout(() => {
      setIsInteracting(false);
    }, 5000);
  };

  const nextQuote = useCallback(() => {
    if (quotes.length === 0) return;
    setDirection(1);
    setCurrentQuote((prev) => (prev + 1) % quotes.length);
  }, [quotes.length]);

  const prevQuote = useCallback(() => {
    if (quotes.length === 0) return;
    setDirection(-1);
    setCurrentQuote((prev) => (prev - 1 + quotes.length) % quotes.length);
  }, [quotes.length]);

  const [bannerSettings, setBannerSettings] = useState({
    title: 'Weekend Flash Sale!',
    percent: 0,
    active: false,
    endsAt: ''
  });

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!bannerSettings.endsAt || !bannerSettings.active) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(bannerSettings.endsAt) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [bannerSettings.endsAt, bannerSettings.active]);

  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const { data, error } = await supabase.from('site_settings').select('*');
        if (data && !error) {
          const title = data.find(s => s.key === 'global_sale_title')?.value || 'Weekend Flash Sale!';
          const percent = parseInt(data.find(s => s.key === 'global_sale_percent')?.value || '0');
          const active = data.find(s => s.key === 'global_sale_active')?.value === 'true';
          const endsAt = data.find(s => s.key === 'global_sale_ends_at')?.value || '';
          setBannerSettings({ title, percent, active, endsAt });
        } else {
          setBannerSettings({
            title: 'Weekend Flash Sale!',
            percent: 0,
            active: false,
            endsAt: ''
          });
        }
      } catch (err) {
        setBannerSettings({
          title: 'Weekend Flash Sale!',
          percent: 0,
          active: false,
          endsAt: ''
        });
      }
    };
    fetchBanner();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // We always start with the modal open now as per user request
    setIsWelcomeModalOpen(true);
  }, []);

  const [selectedLanguage, setSelectedLanguage] = useState<'All'|'English'|'French'|'Arabic'|'Manga'|'Algerian'>('All');

  useEffect(() => {
    const sort = searchParams.get('sort');
    const cat = searchParams.get('category');
    const lang = searchParams.get('language');
    if (sort) setSortBy(sort);
    if (cat) setSelectedCategory(cat);
    if (lang && ['All', 'English', 'French', 'Arabic', 'Manga', 'Algerian'].includes(lang)) {
      setSelectedLanguage(lang as any);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Instantly fetch initial 50 books for immediate page rendering
      const { data: initialBooks } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })
        .range(0, 49);

      if (initialBooks && initialBooks.length > 0) {
        setBooks(initialBooks);
        setFateBook(initialBooks[Math.floor(Math.random() * initialBooks.length)]);
      }

      // 2. Fetch quotes in a single lightweight query
      const { data: quotesData } = await supabase
        .from('quotes')
        .select('*')
        .limit(30);

      if (quotesData && quotesData.length > 0) {
        const shuffled = [...quotesData].sort(() => Math.random() - 0.5);
        setQuotes(shuffled);
        setCurrentQuote(0);
      }

      // 3. Fetch customer screenshots
      const { data: screensData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'customer_screenshots')
        .single();
      
      if (screensData && screensData.value) {
        let parsed = screensData.value;
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed); } catch(e) {}
        }
        if (Array.isArray(parsed)) {
          setScreenshots(parsed.filter((s: any) => s.active).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
        }
      }

      // Removed full catalog background fetch
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (quotes.length <= 1 || isInteracting) return;
    
    const interval = setInterval(() => {
      nextQuote();
    }, 8000);
    
    return () => clearInterval(interval);
  }, [quotes.length, isInteracting, nextQuote]);

  
  const famousGenres = ['Classics', 'Fantasy', 'Romance', 'Fiction', 'Mystery', 'Sci-Fi', 'History', 'Biography'];
  const fixedCategories = ['All', 'Most Popular', 'Bundles', 'Personal Development', 'Trendiest', 'Classics', 'Philosophy'];
  const displayCategories = [...fixedCategories, 'Fantasy', 'Romance', 'Mystery'];
  const hasMoreCategories = true;


  useEffect(() => {
    let isMounted = true;
    const fetchFilteredBooks = async () => {
      setIsLoadingBooks(true);
      
      let query = supabase.from('books').select('*', { count: 'exact' });

      // Search Query
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`);
      }

      // Category
      if (selectedCategory !== 'All' && selectedCategory !== 'Featured' && selectedCategory !== 'Most Popular' && selectedCategory !== 'Trendiest') {
        if (selectedCategory === 'Bundles') {
          query = query.eq('is_bundle', true);
        } else if (selectedCategory === 'Personal Development') {
          query = query.contains('categories', ['Personal Development']);
        } else {
          query = query.contains('categories', [selectedCategory]);
        }
      } else if (selectedCategory === 'Featured') {
        query = query.eq('featured', true);
      }

      // Language
      if (selectedLanguage !== 'All') {
        if (selectedLanguage === 'French') {
          query = query.contains('categories', ['French']); // Simplified, should maybe check others but Supabase array cs is strict
        } else if (selectedLanguage === 'Arabic') {
          query = query.contains('categories', ['Arabic']);
        } else if (selectedLanguage === 'Manga') {
          query = query.contains('categories', ['Manga']);
        } else if (selectedLanguage === 'Algerian') {
          query = query.contains('categories', ['Algerian']);
        } else if (selectedLanguage === 'English') {
          query = query.contains('categories', ['English']);
        }
      } else {
        // Exclude manga from "All" unless explicitly selected (reproducing old logic)
        // Note: PostgREST doesn't support easy array NOT CONTAINS for JSONB/array without raw SQL.
        // We will just let it be for now, or fetch and filter, but we are doing strict server-side.
      }

      // Sorting & Pagination logic requested by user:
      // "page 1 and 2 are always for featured read, page 3 and on are for the other books"
      // If we are on default view (no search, category=Most Popular/All), we sort by featured first, then rating
      if (!searchQuery && (selectedCategory === 'All' || selectedCategory === 'Most Popular') && sortBy === 'rating-high') {
        query = query.order('featured', { ascending: false }).order('rating', { ascending: false, nullsFirst: false });
      } else {
        // Standard sort
        if (sortBy === 'new') query = query.order('created_at', { ascending: false });
        else if (sortBy === 'price-low') query = query.order('price', { ascending: true });
        else if (sortBy === 'price-high') query = query.order('price', { ascending: false });
        else if (sortBy === 'az') query = query.order('title', { ascending: true });
        else if (sortBy === 'za') query = query.order('title', { ascending: false });
        else if (sortBy === 'rating-high') query = query.order('rating', { ascending: false, nullsFirst: false });
      }

      // Pagination
      const from = (currentPage - 1) * booksPerPage;
      const to = from + booksPerPage - 1;
      query = query.range(from, to);

      const { data, count } = await query;
      
      if (isMounted) {
        if (data) setPaginatedBooks(data);
        if (count !== null) setTotalBooks(count);
        setIsLoadingBooks(false);
      }
    };

    // To preserve the exact initial 50 books behavior on first load without double fetching:
    // We only trigger this if it's NOT the initial render, or if filters are applied.
    // Actually, it's safer to always fetch the exact page data from server to ensure pagination works flawlessly.
    fetchFilteredBooks();

    return () => { isMounted = false; };
  }, [searchQuery, selectedCategory, selectedLanguage, sortBy, currentPage, booksPerPage]);

  const totalPages = Math.ceil(totalBooks / booksPerPage) || 1;



  const rollFate = () => {
    if (books.length === 0) return;
    const random = books[Math.floor(Math.random() * books.length)];
    setFateBook(random);
  };

  const prevPage = useRef(currentPage);

  useEffect(() => {
    if (prevPage.current !== currentPage) {
      prevPage.current = currentPage;
      const element = document.getElementById('categories');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [currentPage]);

  const handleAddToCart = (e: React.MouseEvent, book: Book) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      book_id: book.id,
      title: book.title,
      author: book.author,
      price: book.price,
      qty: 1,
      cover_image_url: book.cover_image_url
    });
    
    trackAddToCart({ id: book.id, title: book.title, price: book.price }, 1);
    
    setAddedBookId(book.id);
    
    // Dispatch animation event
    const event = new CustomEvent('add-to-cart-animation', {
      detail: {
        x: e.clientX,
        y: e.clientY,
        imageUrl: book.cover_image_url || 'https://picsum.photos/seed/book/600/800'
      }
    });
    window.dispatchEvent(event);
    
    setTimeout(() => setAddedBookId(null), 2000);
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    // Clear search when switching categories
    if (searchParams.has('search')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('search');
      setSearchParams(newParams);
    }
  };

  const handleLanguageClick = (lang: string) => {
    setSelectedLanguage(lang as any);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (lang === 'All') {
      newParams.delete('language');
    } else {
      newParams.set('language', lang);
    }
    setSearchParams(newParams);
    
    // Auto-translate based on the selected catalog language
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      if (lang === 'French') {
        select.value = 'fr';
      } else if (lang === 'Arabic' || lang === 'Algerian') {
        select.value = 'ar';
      } else {
        // English, Manga, Global/All -> switch back to English
        select.value = 'en';
      }
      select.dispatchEvent(new Event('change'));
    }

    // Smooth scroll to catalog
    const element = document.getElementById('categories');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const categoryCounts = famousGenres.reduce((acc, cat) => {
    acc[cat] = books.filter(b => (b as any).categories && (b as any).categories.includes(cat)).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DynamicIslandTOC>
      <div className="space-y-16 pb-20">
      {/* Elegant Welcome Notification (iPhone Style) */}
      <AnimatePresence>
        {isWelcomeModalOpen && (
          <div className="fixed top-32 left-0 right-0 z-[300] flex justify-center px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -100, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -100, scale: 0.8 }}
              transition={{ type: "spring", damping: 18, stiffness: 120 }}
              className="pointer-events-auto bg-ink/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-4 pr-6 shadow-2xl flex items-center gap-4 max-w-md w-full relative overflow-hidden group"
            >
              {/* Subtle Glow Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
              
              <div className="relative shrink-0 w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-lg">
                <Sparkles className="w-6 h-6 text-primary-light animate-pulse" />
              </div>
              
              <div className="relative flex-1 min-w-0">
                <p className="text-[10px] font-bold text-primary-light uppercase tracking-widest mb-0.5 notranslate">Welcome to BigDeal</p>
                <h3 className="text-white font-bold text-sm">Experience the Premium Bookstore</h3>
                <p className="text-white/40 text-[10px] italic">"A book is a dream you hold in your hand"</p>
              </div>

              <button 
                onClick={() => setIsWelcomeModalOpen(false)}
                className="relative shrink-0 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>

              {/* Progress bar (auto-close indicator) */}
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 6, ease: "linear" }}
                onAnimationComplete={() => setIsWelcomeModalOpen(false)}
                className="absolute bottom-0 left-0 h-0.5 bg-primary/40"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hero Quote Carousel */}
      <section data-toc data-toc-title="Quotes" className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <div className="absolute inset-0 z-0 bg-transparent w-full h-full">
          <div className="relative h-full w-full flex items-center justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentQuote}
                custom={direction}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragStart={startInteraction}
                onDragEnd={(e, info) => {
                  const threshold = 50;
                  if (info.offset.x < -threshold) {
                    nextQuote();
                  } else if (info.offset.x > threshold) {
                    prevQuote();
                  }
                  stopInteraction();
                }}
                variants={{
                  enter: (direction: number) => ({
                    x: direction > 0 ? 100 : -100,
                    opacity: 0,
                    scale: 0.9,
                    filter: "blur(10px)"
                  }),
                  center: {
                    x: 0,
                    opacity: 1,
                    scale: 1,
                    filter: "blur(0px)"
                  },
                  exit: (direction: number) => ({
                    x: direction < 0 ? 100 : -100,
                    opacity: 0,
                    scale: 0.9,
                    filter: "blur(10px)"
                  })
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex items-center justify-center px-6"
              >
                {quotes.length > 0 ? (
                  <div className="text-center max-w-5xl pointer-events-auto">
                    <div className="mb-8 inline-block">
                      <Sparkles className="w-8 h-8 text-primary-light mx-auto opacity-50" />
                    </div>
                    <h2 className="text-3xl md:text-6xl font-serif italic text-white leading-tight mb-8 drop-shadow-2xl px-6 md:px-4 select-none">
                      "{quotes[currentQuote].text}"
                    </h2>
                    <div className="flex flex-col items-center space-y-2">
                      <p className="text-primary-light font-bold tracking-[0.2em] uppercase text-sm">
                        — {quotes[currentQuote].author}
                      </p>
                      {quotes[currentQuote].book && (
                        <p className="text-white/40 text-xs font-medium italic">
                          from {quotes[currentQuote].book}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center max-w-5xl">
                    <h2 className="text-4xl md:text-6xl font-serif italic text-white leading-tight mb-8 drop-shadow-2xl">
                      "Premium books, better quality."
                    </h2>
                    <p className="text-primary-light font-bold tracking-[0.2em] uppercase text-sm notranslate">
                      — BigDeal Bookstore
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute bottom-12 left-0 right-0 flex justify-center z-20">
            <div className="flex items-center gap-2.5 p-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              {quotes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    startInteraction();
                    setDirection(i > currentQuote ? 1 : -1);
                    setCurrentQuote(i);
                    stopInteraction();
                  }}
                  className="relative flex items-center justify-center focus:outline-none transition-all duration-500"
                  style={{ width: i === currentQuote ? '2.5rem' : '0.6rem' }}
                >
                  <motion.div
                    layout
                    className={`h-1.5 rounded-full w-full ${
                      i === currentQuote 
                        ? 'bg-gradient-to-r from-primary-light to-primary shadow-[0_0_12px_rgba(139,92,246,0.6)]' 
                        : 'bg-white/20 hover:bg-white/40'
                    }`}
                  />
                  {i === currentQuote && (
                    <motion.div
                      layoutId="activeIndicatorGlow"
                      className="absolute inset-0 bg-primary/20 blur-md rounded-full -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Hero Scroll Animation */}
      <div data-toc data-toc-title="Featured Reads" className="relative z-10">
        <HeroScrollDemo featuredBooks={books.filter(b => b.featured)} />
      </div>

      {/* Language Selector Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 mt-8 mb-16">
        <div className="text-center space-y-4 mb-8">
          <h2 data-toc data-toc-title="Format and Languages" className="text-3xl md:text-4xl font-serif font-bold text-white drop-shadow-xl">Choose Format & Language</h2>
          <p className="text-white/60 font-medium">Browse our catalog in your preferred format and language</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { id: 'All', title: 'Global', label: 'All Books', color: 'from-white/10 to-white/5', border: 'border-white/20', shadow: 'shadow-[0_0_30px_rgba(255,255,255,0.1)]' },
            { id: 'English', title: 'English', label: 'English Books', color: 'from-blue-500/30 to-blue-900/30', border: 'border-blue-500/40', shadow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]' },
            { id: 'French', title: 'Français', label: 'Livres Français', color: 'from-rose-500/30 to-rose-900/30', border: 'border-rose-500/40', shadow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]' },
            { id: 'Arabic', title: 'العربية', label: 'كتب عربية', color: 'from-emerald-500/30 to-emerald-900/30', border: 'border-emerald-500/40', shadow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]' },
            { id: 'Manga', title: 'Manga', label: 'Manga & Comics', color: 'from-purple-500/30 to-purple-900/30', border: 'border-purple-500/40', shadow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]' },
            { id: 'Algerian', title: 'Algerian', label: 'كتب جزائرية', color: 'from-orange-500/30 to-orange-900/30', border: 'border-orange-500/40', shadow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]' }
          ].map(lang => (
            <button
              key={lang.id}
              onClick={() => handleLanguageClick(lang.id)}
              className={`relative overflow-hidden group rounded-3xl border transition-all duration-300 p-6 flex flex-col items-center justify-center min-h-[120px] ${
                selectedLanguage === lang.id
                  ? `bg-gradient-to-br ${lang.color} ${lang.border} ${lang.shadow} scale-[1.02] ring-2 ring-white/20`
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 hover:scale-[1.02]'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${lang.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <span className={`text-xl md:text-2xl font-bold text-white tracking-wide ${lang.id === 'Arabic' ? 'font-arabic font-normal' : ''}`}>{lang.title}</span>
                <span className="text-xs md:text-sm text-white/60 font-bold uppercase tracking-widest">{lang.label}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
      
      {/* Catalog Section */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 md:space-y-12 relative z-20">
        {/* Flash Sale Banner */}
        {bannerSettings.active && bannerSettings.percent > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 backdrop-blur-xl border border-primary/30 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.2)_0%,transparent_70%)] animate-pulse" />
            <div className="relative z-10 flex items-center space-x-6">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-xl group-hover:rotate-12 transition-transform duration-500">
                <Sparkles className="w-8 h-8 text-primary-light" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-white">{bannerSettings.title}</h3>
                <p className="text-white/60 font-medium">Get up to <span className="text-primary-light font-bold">{bannerSettings.percent}% OFF</span> on selected titles.</p>
              </div>
            </div>
            <div className="relative z-10 flex items-center space-x-4">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Ends In</span>
                <div className="flex space-x-2">
                  <div className="bg-ink/60 px-3 py-2 rounded-xl border border-white/10 font-mono font-bold text-primary-light">{timeLeft.days.toString().padStart(2, '0')}d</div>
                  <div className="bg-ink/60 px-3 py-2 rounded-xl border border-white/10 font-mono font-bold text-primary-light">{timeLeft.hours.toString().padStart(2, '0')}h</div>
                  <div className="bg-ink/60 px-3 py-2 rounded-xl border border-white/10 font-mono font-bold text-primary-light">{timeLeft.minutes.toString().padStart(2, '0')}m</div>
                  <div className="bg-ink/60 px-3 py-2 rounded-xl border border-white/10 font-mono font-bold text-primary-light">{timeLeft.seconds.toString().padStart(2, '0')}s</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  const el = document.getElementById('categories');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  handleCategoryClick('All');
                }}
                className="bg-white text-ink px-8 py-4 rounded-full font-bold hover:bg-white/90 transition-all shadow-xl hover:scale-105 active:scale-95"
              >
                Shop Sale
              </button>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8">
          <div className="space-y-4 w-full">
            <h2 data-toc data-toc-title="Genres" className="sr-only">Genres</h2>
            <h2 data-toc data-toc-title="Books Gallery" className="text-3xl md:text-4xl font-serif font-bold text-white">Our Collection</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pb-2 md:pb-0">
              {displayCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat 
                      ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]' 
                      : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
              
              {hasMoreCategories && (
                <Link
                  to="/categories"
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-full bg-rose-600 text-white font-bold hover:bg-rose-500 transition-all group whitespace-nowrap shadow-[0_0_20px_rgba(225,29,72,0.6)] hover:shadow-[0_0_30px_rgba(225,29,72,0.8)] animate-pulse-subtle"
                >
                  <span className="text-xs sm:text-sm">Discover More</span>
                  <ChevronRight className="w-3 h-3 sm:w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="rating-high" className="bg-ink">Highest Rated</option>
              <option value="new" className="bg-ink">Newest First</option>
              <option value="price-low" className="bg-ink">Price: Low to High</option>
              <option value="price-high" className="bg-ink">Price: High to Low</option>
              <option value="az" className="bg-ink">Title: A-Z</option>
              <option value="za" className="bg-ink">Title: Z-A</option>
              <option value="sale" className="bg-ink">On Sale</option>
            </select>
          </div>
        </div>

        <motion.div 
          key={`${selectedCategory}-${currentPage}-${sortBy}-${searchQuery}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8"
        >
          {paginatedBooks.length > 0 ? (
            paginatedBooks.map((book, idx) => (
              <motion.div
                key={`${book.id}-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group card-glass p-3 sm:p-4"
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-3 sm:mb-4 bg-white/5">
                  <Link to={`/book/${book.id}`} className="w-full h-full block">
                    {book.is_bundle && book.bundle_books && book.bundle_books.length > 0 ? (
                      <BundleCover 
                        bundleBookIds={book.bundle_books} 
                        allBooks={books} 
                        className="transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <LazyImage 
                        src={book.cover_image_url || 'https://picsum.photos/seed/book/400/600'} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={book.title}
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </Link>
                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col gap-2 z-20">
                      {book.featured && (
                        <div className="bg-primary/80 backdrop-blur-md px-2 py-1 rounded-lg border border-primary/30 shadow-lg flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Featured</span>
                        </div>
                      )}
                      {book.is_bundle && (
                        <div className="bg-indigo-500/80 backdrop-blur-md px-2 py-1 rounded-lg border border-indigo-400/30 shadow-lg flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-white" />
                          <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Bundle</span>
                        </div>
                      )}
                      {book.rating >= 4.8 && !book.is_bundle && (
                        <div className="bg-emerald-500/80 backdrop-blur-md px-2 py-1 rounded-lg border border-emerald-400/30 shadow-lg flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-white" />
                          <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Top Rated</span>
                        </div>
                      )}
                    </div>
                    {Number(book.old_price) > book.price && (
                      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20">
                        <div className="bg-yellow-400 text-ink px-2 py-1 rounded-lg font-black text-[10px] shadow-lg transform -rotate-12">
                          -{Math.round(((book.old_price! - book.price) / book.old_price!) * 100)}% OFF
                        </div>
                      </div>
                    )}
                  <button 
                    onClick={(e) => handleAddToCart(e, book)}
                    className={`absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 py-2 sm:py-3 rounded-xl font-bold opacity-100 translate-y-0 sm:translate-y-12 sm:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center space-x-1 sm:space-x-2 shadow-xl ${
                      addedBookId === book.id 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white/20 backdrop-blur-xl text-white border border-white/30 hover:bg-white/30'
                    }`}
                  >
                    {addedBookId === book.id ? (
                      <>
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">Added!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">Add</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="space-y-1 text-white">
                  <Link to={`/book/${book.id}`}>
                    <h3 className="notranslate font-serif font-bold text-sm sm:text-lg text-white group-hover:text-primary-light transition-colors leading-tight line-clamp-1">{book.title}</h3>
                  </Link>
                  <p className="text-white/50 text-xs sm:text-sm line-clamp-1">{book.author}</p>
                  <div className="pt-1 sm:pt-2 flex items-center justify-between">
                    <div className="flex flex-col">
                      {Number(book.old_price) > 0 && (
                        <span className="text-[10px] sm:text-xs text-white/30 line-through">{(book.old_price || 0).toFixed(0)} DA</span>
                      )}
                      <span className="font-bold text-primary-light text-sm sm:text-base">{(book.price || 0).toFixed(0)} DA</span>
                    </div>
                    <div className="flex items-center text-yellow-400">
                      <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                      <span className="text-[10px] sm:text-xs font-bold ml-0.5 text-white">{book.rating || 5.0}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-6">
              <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-10 h-10 text-primary/20" />
              </div>
              <div className="space-y-2 text-white">
                <h3 className="text-2xl font-serif font-bold text-white">No results found</h3>
                <p className="text-white/50 max-w-md mx-auto">
                  We couldn't find any books matching "{searchQuery}". 
                  Would you like to make a special order?
                </p>
              </div>
              <Link 
                to="/special-request" 
                className="inline-block bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-light transition-all shadow-xl shadow-primary/20"
              >
                Make a Special Order
              </Link>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 sm:space-x-4 pt-8">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 sm:p-3 rounded-full border border-primary/10 disabled:opacity-30 hover:bg-primary/5 transition-colors shrink-0 text-white"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide max-w-[60vw] sm:max-w-none px-2 py-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold transition-all shrink-0 ${
                    currentPage === page 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'hover:bg-primary/5 text-white/50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 sm:p-3 rounded-full border border-primary/10 disabled:opacity-30 hover:bg-primary/5 transition-colors shrink-0 text-white"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 h-5" />
            </button>
          </div>
        )}

        {paginatedBooks.length === 0 && (
          <div className="text-center py-20 bg-primary/5 rounded-[3rem] border border-dashed border-primary/20">
            <Search className="w-12 h-12 text-primary/20 mx-auto mb-4" />
            <h3 className="text-xl font-serif font-bold text-white/40">No books found in this category</h3>
            <button 
              onClick={() => setSelectedCategory('All')}
              className="mt-4 text-primary font-bold hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Wall of Love / Customer Screenshots Section */}
      {screenshots.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-8">
          <div className="text-center mb-10 space-y-4">
            <h2 data-toc data-toc-title="Client's Reviews" className="text-4xl md:text-5xl font-serif font-bold text-white">
              Wall of <span className="text-rose-500 italic drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]">Love</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Don't just take our word for it. See what our amazing readers have to say about their experience.
            </p>
          </div>
          
          <SocialCards 
            cards={screenshots.map(s => ({ imgUrl: s.image_url, alt: 'Customer screenshot' }))} 
          />
        </section>
      )}

      {/* Book Quality Video Showcase Section */}
      <QualityShowcaseVideo />

      {/* Let Fate Choose Section */}
      {/* Combined Discovery & Wishlist Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8 transform-gpu will-change-transform">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Can't Decide? / Roll the Dice */}
          <div className="relative bg-white/5 backdrop-blur-lg md:backdrop-blur-xl rounded-[3rem] p-8 md:p-12 border border-white/10 overflow-hidden flex flex-col justify-between group">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <Sparkles className="w-48 h-48 text-primary-light" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <h2 data-toc data-toc-title="Can't Decide?" className="text-3xl md:text-4xl font-serif font-bold leading-tight text-white">
                Can't decide? <br />
                <span className="purplish-text-gradient italic">Let fate choose</span>
              </h2>
              <p className="text-white/50 text-base max-w-xs">
                Sometimes the best stories are the ones you didn't know you were looking for.
              </p>
              <button 
                onClick={rollFate}
                className="inline-flex items-center space-x-3 bg-primary text-white px-6 py-3 rounded-full font-bold hover:bg-primary-light transition-all shadow-[0_0_20px_rgba(139,92,246,0.2)] group"
              >
                <RefreshCw className="w-4 h-4 group-active:rotate-180 transition-transform duration-500" />
                <span>Roll the Dice</span>
              </button>
            </div>

            <div className="mt-8 relative min-h-[200px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {fateBook ? (
                  <motion.div
                    key={fateBook.id}
                    initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
                    className="card-glass p-4 w-full max-w-[240px]"
                  >
                    <Link to={`/book/${fateBook.id}`} className="block aspect-[3/4] rounded-xl overflow-hidden mb-4 group/img">
                      <motion.img 
                        whileHover={{ scale: 1.05 }}
                        src={fateBook.cover_image_url || 'https://picsum.photos/seed/fate/400/600'} 
                        className="w-full h-full object-cover transition-transform duration-500"
                        alt={fateBook.title}
                        referrerPolicy="no-referrer"
                      />
                    </Link>
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-serif font-bold line-clamp-1 text-white">{fateBook.title}</h3>
                      <p className="text-white/50 text-xs">{(fateBook.price || 0).toFixed(2)} DA</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-white/20 italic font-serif">Click the button to roll...</div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Wish List / Special Request */}
          <Link to="/special-request" className="block group">
            <motion.div 
              whileHover={{ y: -8 }}
              className="relative h-full bg-white/5 backdrop-blur-lg md:backdrop-blur-xl rounded-[3.5rem] p-10 md:p-16 border border-white/10 overflow-hidden flex flex-col justify-between shadow-2xl"
            >
              {/* Animated Background Elements - More Intense */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.4, 1],
                  rotate: [0, 180, 0],
                  opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-20 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-[80px] pointer-events-none"
              />
              <motion.div 
                animate={{ 
                  scale: [1, 1.3, 1],
                  rotate: [0, -180, 0],
                  opacity: [0.05, 0.15, 0.05]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-20 -left-20 w-72 h-72 bg-primary-light/10 rounded-full blur-[70px] pointer-events-none"
              />
              
              <div className="relative z-10 space-y-8">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="inline-block bg-primary/30 p-4 rounded-3xl border border-primary/40 shadow-xl shadow-primary/20"
                >
                  <Sparkles className="w-8 h-8 text-primary-light animate-pulse" />
                </motion.div>
                
                <div className="space-y-4">
                  <h3 data-toc data-toc-title="Wishlist" className="text-5xl md:text-7xl font-serif font-bold leading-none text-white tracking-tight">
                    Wish <br />
                    <span className="purplish-text-gradient italic drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]">list</span>
                  </h3>
                  
                  <p className="text-white/70 text-lg md:text-xl max-w-sm leading-relaxed font-medium">
                    Can't find your dream book? <br />
                    <span className="text-white">Tell us what it is, and we'll track it down for you—no extra fees!</span>
                  </p>
                </div>
                
                <div className="pt-6">
                  <div className="inline-flex items-center space-x-4 bg-primary text-white px-10 py-5 rounded-full text-lg font-bold hover:bg-primary-light transition-all shadow-[0_0_30px_rgba(139,92,246,0.4)] group-hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] group-hover:scale-105 active:scale-95 border border-white/20">
                    <span>Add to Wish List</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </div>

              <div className="mt-12 flex justify-end">
                <div className="relative w-40 h-40 opacity-30 group-hover:opacity-60 transition-opacity">
                  <div className="absolute inset-0 border-2 border-primary rounded-full animate-ping duration-[3s]" />
                  <div className="absolute inset-6 border-2 border-primary-light rounded-full animate-pulse" />
                  <div className="absolute inset-12 border border-white/20 rounded-full" />
                  <Sparkles className="absolute inset-14 w-12 h-12 text-primary-light" />
                </div>
              </div>

              {/* Glass Reflection Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
            </motion.div>
          </Link>
        </div>
      </section>
    </div>
    </DynamicIslandTOC>
  );
}