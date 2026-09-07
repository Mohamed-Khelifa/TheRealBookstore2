import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, Truck, Tag, Sparkles, 
  ShoppingCart, Check, ShieldCheck, ArrowRight, ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import { useCart } from '../store/useCart';
import { LazyImage } from './ui/lazy-image';
import { BundleCover } from './BundleCover';
import { trackAddToCart } from '../lib/metaPixel';
import { supabase } from '../lib/supabase';

interface FlashDealsSectionProps {
  books: Book[];
}

export function FlashDealsSection({ books: catalogBooks }: FlashDealsSectionProps) {
  const { addItem } = useCart();
  const [addedBookId, setAddedBookId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'high_discount' | 'under_1500' | 'express'>('all');
  const INITIAL_COUNT = 3;
  const BATCH_SIZE = 6;
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_COUNT);
  const [fetchedInventoryBooks, setFetchedInventoryBooks] = useState<Book[]>([]);

  // Fetch store inventory book IDs AND their full book rows directly from Supabase
  useEffect(() => {
    async function fetchInventoryDeals() {
      try {
        const { data: settingsData } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'inventory_books')
          .single();

        let invIds: string[] = [];
        if (settingsData?.value) {
          try {
            const parsed = JSON.parse(settingsData.value);
            if (Array.isArray(parsed)) invIds = parsed.map(String);
          } catch (e) {}
        }

        if (invIds.length > 0) {
          // Query ALL books matching inventory IDs directly from Supabase database
          const { data: invBooks } = await supabase
            .from('books')
            .select('*')
            .in('id', invIds);

          if (invBooks && invBooks.length > 0) {
            setFetchedInventoryBooks(invBooks);
          }
        }
      } catch (e) {
        console.warn('Error fetching inventory books for flash deals:', e);
      }
    }
    fetchInventoryDeals();
  }, []);

  // Purchased deal book IDs from local storage
  const [purchasedBookIds, setPurchasedBookIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('purchased_deal_book_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Listen for order completion to immediately remove purchased deal books
  useEffect(() => {
    const handleOrderCompleted = () => {
      try {
        const stored = localStorage.getItem('purchased_deal_book_ids');
        if (stored) {
          setPurchasedBookIds(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Error reading purchased_deal_book_ids:', e);
      }
    };

    window.addEventListener('order-completed', handleOrderCompleted);
    window.addEventListener('storage', handleOrderCompleted);

    return () => {
      window.removeEventListener('order-completed', handleOrderCompleted);
      window.removeEventListener('storage', handleOrderCompleted);
    };
  }, []);

  // Combine books that are strictly in store inventory OR explicitly discounted
  const eligibleBooks = useMemo(() => {
    const purchasedSet = new Set(purchasedBookIds.map(String));
    
    // Map of all available books from both fetchedInventoryBooks and catalogBooks
    const bookMap = new Map<string, Book>();

    // 1. Add all store inventory books
    fetchedInventoryBooks.forEach(b => {
      if (!purchasedSet.has(String(b.id))) {
        bookMap.set(String(b.id), b);
      }
    });

    // 2. Add any catalog books with explicit discounts
    catalogBooks.forEach(b => {
      if (!purchasedSet.has(String(b.id))) {
        const isExplicitDiscounted = Number(b.old_price) > 0 && Number(b.old_price) > Number(b.price);
        if (isExplicitDiscounted) {
          bookMap.set(String(b.id), b);
        }
      }
    });

    return Array.from(bookMap.values());
  }, [catalogBooks, fetchedInventoryBooks, purchasedBookIds]);

  // Process books to calculate discounts
  const dealsList = eligibleBooks.map(book => {
    const hasExplicitOldPrice = Number(book.old_price) > 0 && Number(book.old_price) > Number(book.price);
    const price = Number(book.price);
    const oldPrice = hasExplicitOldPrice 
      ? Number(book.old_price) 
      : Math.round(price * 1.25);
    const discountPercent = Math.round(((oldPrice - price) / oldPrice) * 100);
    const savings = oldPrice - price;

    return {
      ...book,
      price,
      effectiveOldPrice: oldPrice,
      discountPercent: discountPercent > 0 ? discountPercent : 20,
      savings: savings > 0 ? savings : Math.round(price * 0.2)
    };
  });

  // Filter deal books based on user active filter selection
  const filteredDeals = dealsList.filter(item => {
    if (activeFilter === 'high_discount') return item.discountPercent >= 25;
    if (activeFilter === 'under_1500') return item.price <= 1500;
    if (activeFilter === 'express') return true;
    return true;
  });

  // Display discounted books in batches
  const displayedDeals = filteredDeals.slice(0, visibleCount);
  const remainingDeals = Math.max(0, filteredDeals.length - visibleCount);
  const nextBatchCount = Math.min(BATCH_SIZE, remainingDeals);

  const handleAddToCart = (e: React.MouseEvent, book: Book) => {
    e.stopPropagation();
    e.preventDefault();

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

  if (eligibleBooks.length === 0 || filteredDeals.length === 0) return null;

  return (
    <section data-toc data-toc-title="Flash Deals" id="flash-deals" className="relative my-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Outer Glowing Frame matching primary brand theme */}
      <div className="relative rounded-[2rem] bg-gradient-to-b from-primary/10 via-slate-900/40 to-slate-950/90 border border-primary/20 p-6 md:p-10 backdrop-blur-xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.4)] group">
        
        {/* Background Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-900/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Header Banner */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-white/10">
          
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary-light border border-primary/30">
                <Tag className="w-3.5 h-3.5 text-primary-light" /> Special Offers
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <Truck className="w-3.5 h-3.5" /> Fast Delivery
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                {filteredDeals.length} Discounted Book{filteredDeals.length !== 1 ? 's' : ''} Available
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white leading-tight">
              Discounted Books & <span className="bg-gradient-to-r from-primary-light via-purple-300 to-indigo-200 bg-clip-text text-transparent">Fast Delivery</span>
            </h2>

            <p className="text-white/70 text-sm md:text-base max-w-2xl">
              Discover selected titles from our inventory at discounted prices with reliable, fast delivery across all 58 Wilayas.
            </p>
          </div>

          {/* Single Copy Discount Callout */}
          <div className="shrink-0 bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4.5 md:p-5 shadow-lg flex flex-col items-center justify-center text-center max-w-[280px]">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Limited Stock Deal</span>
            </div>
            <p className="text-white text-xs leading-relaxed font-medium">
              The discount applies to <span className="text-amber-300 font-bold underline decoration-amber-500/50">only 1 copy</span>.
            </p>
            <p className="text-emerald-400 text-[11px] font-semibold mt-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              🎉 Congrats to the first one to get it!
            </p>
          </div>

        </div>

        {/* Filter Pills */}
        <div className="relative z-10 flex items-center gap-2 sm:gap-3 overflow-x-auto my-6 pb-2 scrollbar-hide">
          {[
            { id: 'all', label: 'All Discounted Books', icon: Tag },
            { id: 'high_discount', label: 'Top Discounts (25%+ OFF)', icon: Flame },
            { id: 'under_1500', label: 'Under 1500 DA', icon: Sparkles },
            { id: 'express', label: 'Fast Delivery', icon: Truck },
          ].map(f => {
            const Icon = f.icon;
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => {
                  setActiveFilter(f.id as any);
                  setVisibleCount(INITIAL_COUNT);
                }}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-medium text-xs sm:text-sm flex items-center gap-2 transition-all border ${
                  isActive
                    ? 'bg-primary text-white font-semibold border-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                    : 'bg-white/5 text-white/70 hover:text-white border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-primary-light'}`} />
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Display Count Indicator */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6 py-2.5 px-4 rounded-xl bg-slate-950/60 border border-white/10">
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              Showing <strong className="text-white font-bold">{displayedDeals.length}</strong> of <strong className="text-amber-300 font-bold">{filteredDeals.length}</strong> discounted books
            </span>
          </div>
          {remainingDeals > 0 && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              +{remainingDeals} More Discounted Books Available
            </span>
          )}
        </div>

        {/* Discounted Books Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {displayedDeals.map((book) => {
              const isAdded = addedBookId === book.id;

              return (
                <motion.div
                  key={book.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="group relative bg-slate-950/60 rounded-2xl border border-white/10 hover:border-primary/40 p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:-translate-y-1 overflow-hidden"
                >
                  {/* Top Discount Badge */}
                  <div className="absolute top-3 left-3 z-20 flex flex-col gap-1 items-start">
                    <span className="bg-primary/90 backdrop-blur-md text-white font-bold text-[10px] sm:text-xs px-2.5 py-1 rounded-md shadow-md border border-primary-light/30 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      -{book.discountPercent}% OFF
                    </span>
                  </div>

                  {/* Top Delivery Badge */}
                  <div className="absolute top-3 right-3 z-20">
                    <span className="bg-slate-900/90 backdrop-blur-md text-emerald-400 font-semibold text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <Truck className="w-2.5 h-2.5" /> Fast Delivery
                    </span>
                  </div>

                  {/* Book Image */}
                  <Link to={`/book/${book.id}`} className="block relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-black/40">
                    {book.is_bundle ? (
                      <BundleCover 
                        bundleBookIds={book.bundle_books || []} 
                        allBooks={eligibleBooks} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <LazyImage
                        src={book.cover_image_url || 'https://picsum.photos/seed/book/600/800'}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                      <span className="text-[10px] font-semibold text-primary-light flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> View Details
                      </span>
                    </div>
                  </Link>

                  {/* Book Details */}
                  <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-xs sm:text-sm line-clamp-2 group-hover:text-primary-light transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-white/50 font-medium truncate mt-0.5">
                        {book.author}
                      </p>
                    </div>

                    {/* Price Breakdown */}
                    <div className="pt-2 border-t border-white/10 flex items-baseline justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white/40 text-[10px] sm:text-xs line-through font-mono">
                            {book.effectiveOldPrice} DA
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                            Save {book.savings} DA
                          </span>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-white font-mono mt-0.5">
                          {book.price} <span className="text-xs font-sans text-white/60">DA</span>
                        </div>
                      </div>
                    </div>

                    {/* Add to Cart CTA */}
                    <button
                      onClick={(e) => handleAddToCart(e, book)}
                      className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 ${
                        isAdded
                          ? 'bg-emerald-500 text-white'
                          : 'bg-primary hover:bg-primary-light text-white shadow-md hover:shadow-primary/20 active:scale-95'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4" /> Added to Cart
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Bottom Callout & "See More Discounted Books" Toggle */}
        <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-light shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-white">Fast Delivery Across 58 Wilayas</h4>
              <p className="text-[11px] text-white/50">Priority dispatch for all items ordered from this section.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {remainingDeals > 0 && (
              <button
                onClick={() => setVisibleCount(prev => prev + BATCH_SIZE)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary-light text-white text-xs sm:text-sm font-bold border border-primary/50 transition-all hover:border-primary/70 shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>
                  See More Discounted Books (+{nextBatchCount})
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
            )}

            {visibleCount > INITIAL_COUNT && (
              <button
                onClick={() => setVisibleCount(INITIAL_COUNT)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer"
              >
                <span>Show Less</span>
              </button>
            )}

            <Link
              to="/categories"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-all hover:border-white/20"
            >
              <span>Explore All Books</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
