import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, ArrowLeft, ShieldCheck, Truck, RefreshCw, MessageSquare, Plus, Minus, CheckCircle, Trophy, Sparkles, BookDashed, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { Book, Review } from '../types';
import { useCart } from '../store/useCart';
import { supabase } from '../lib/supabase';
import { BundleCover } from '../components/BundleCover';
import { LazyImage } from '../components/ui/lazy-image';
import { trackViewContent, trackAddToCart } from '../lib/metaPixel';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [book, setBook] = useState<Book | null>(null);
  const [bundleBooks, setBundleBooks] = useState<Book[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [cartStatus, setCartStatus] = useState<'idle' | 'added' | 'go_to_cart'>('idle');

  // Reader's Space Integrations
  const userPhone = localStorage.getItem('bigdeal_user_phone');
  const [isInTbr, setIsInTbr] = useState(false);
  const [isCurrentRead, setIsCurrentRead] = useState(false);

  useEffect(() => {
    if (userPhone && id) {
      const storedTbr = localStorage.getItem(`tbr_${userPhone}`);
      if (storedTbr) {
        const tbrList = JSON.parse(storedTbr) as string[];
        setIsInTbr(tbrList.includes(id));
      }
      const storedCurrent = localStorage.getItem(`current_${userPhone}`);
      if (storedCurrent) {
        const currentData = JSON.parse(storedCurrent);
        setIsCurrentRead(!!currentData[id]);
      }
    }
  }, [userPhone, id]);

  const toggleTbr = () => {
    if (!userPhone) return navigate('/reader-space');
    const storedTbr = localStorage.getItem(`tbr_${userPhone}`);
    let tbrList = storedTbr ? JSON.parse(storedTbr) as string[] : [];
    
    if (isInTbr) {
      tbrList = tbrList.filter(bookId => bookId !== book?.id);
    } else {
      if (book?.id && !tbrList.includes(book.id)) tbrList.push(book.id);
    }
    
    localStorage.setItem(`tbr_${userPhone}`, JSON.stringify(tbrList));
    setIsInTbr(!isInTbr);
  };

  const toggleCurrentRead = () => {
    if (!userPhone) return navigate('/reader-space');
    const storedCurrent = localStorage.getItem(`current_${userPhone}`);
    let currentData = storedCurrent ? JSON.parse(storedCurrent) : {};
    
    if (isCurrentRead) {
      delete currentData[book?.id!];
    } else {
      if (book?.id) currentData[book.id] = { page: 1, note: '' };
    }
    
    localStorage.setItem(`current_${userPhone}`, JSON.stringify(currentData));
    setIsCurrentRead(!isCurrentRead);
  };

  const cuteNames = ['Happy Panda', 'Cozy Koala', 'Reading Rabbit', 'Bookish Bear', 'Wise Owl', 'Curious Cat', 'Dreamy Deer', 'Little Fox'];

  const handleAddToCart = (e: React.MouseEvent) => {
    if (cartStatus === 'go_to_cart') {
      navigate('/checkout');
      return;
    }
    
    addItem({ book_id: book!.id, title: book!.title, author: book!.author, price: book!.price, qty, cover_image_url: book!.cover_image_url });
    setCartStatus('added');
    
    trackAddToCart({ id: book!.id, title: book!.title, price: book!.price }, qty);
    
    // Dispatch animation event
    const event = new CustomEvent('add-to-cart-animation', {
      detail: {
        x: e.clientX,
        y: e.clientY,
        imageUrl: book!.cover_image_url || 'https://picsum.photos/seed/book/600/800'
      }
    });
    window.dispatchEvent(event);
    
    setTimeout(() => setCartStatus('go_to_cart'), 2000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim() || submittingReview) return;

    setSubmittingReview(true);
    const finalName = isAnonymous ? cuteNames[Math.floor(Math.random() * cuteNames.length)] : (reviewName || 'Guest');

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          book_id: id,
          user_name: finalName,
          rating: reviewRating,
          comment: reviewComment,
        }])
        .select()
        .single();

      if (!error && data) {
        setReviews([data, ...reviews]);
        setReviewComment('');
        setReviewName('');
        setIsAnonymous(false);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    setCartStatus('idle');
    setQty(1);
    
    const fetchBook = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setBook(data);
        
        trackViewContent({ id: data.id, title: data.title, price: data.price });
        
        // Fetch bundle books if it's a bundle
        if (data.is_bundle && data.bundle_books && data.bundle_books.length > 0) {
          const { data: bundleData } = await supabase
            .from('books')
            .select('*')
            .in('id', data.bundle_books);
          if (bundleData) setBundleBooks(bundleData);
        }

        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('book_id', id)
          .order('created_at', { ascending: false });
        if (reviewsData) setReviews(reviewsData);

        // Fetch related books based on categories, author, and rating
        const { data: allOtherBooks } = await supabase
          .from('books')
          .select('*')
          .neq('id', id);
        
        if (allOtherBooks) {
          const currentCategories = data.categories || [];
          const currentAuthor = data.author || '';
          
          const sortedRelated = allOtherBooks.map(b => {
             let score = 0;
             const theirCategories = b.categories || [];
             
             // Category intersection score
             const intersection = currentCategories.filter((c: string) => theirCategories.includes(c)).length;
             score += intersection * 5;
             
             // Author match
             if (b.author === currentAuthor) score += 10;
             
             // Rating importance
             score += (b.rating || 0) * 0.5;
             
             // Price similarity (closer price -> slight bonus)
             const priceDiff = Math.abs(b.price - data.price);
             if (priceDiff < 10) score += 2;
             
             return { book: b, score };
          })
          .sort((a, b) => b.score - a.score)
          .map(item => item.book)
          .slice(0, 10);
          
          setRelatedBooks(sortedRelated);
        }
      }
      setLoading(false);
    };

    fetchBook();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><RefreshCw className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!book) return <div className="text-center py-20">Book not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-20">
      <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-white/40 hover:text-primary-light mb-12 transition-colors group relative z-30">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold text-sm uppercase tracking-widest">Back to Collection</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <div className="aspect-[3/4] rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-center p-8 md:p-12 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            {book.is_bundle && bundleBooks.length > 0 ? (
              <BundleCover 
                bundleBookIds={book.bundle_books || []} 
                allBooks={bundleBooks} 
                className="transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <LazyImage 
                src={book.cover_image_url || 'https://picsum.photos/seed/book/600/800'} 
                className="max-w-full max-h-full object-contain shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-lg relative z-10 transform transition-transform duration-700 group-hover:scale-105" 
                alt={book.title} 
                referrerPolicy="no-referrer" 
              />
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {book.is_bundle && (
                <span className="text-[10px] uppercase font-black text-indigo-400 tracking-widest bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)]">Book Bundle</span>
              )}
              {book.categories?.map(cat => (
                <span key={cat} className="text-[10px] uppercase font-bold text-primary-light tracking-widest bg-primary/20 border border-primary/30 px-3 py-1 rounded-full">{cat}</span>
              ))}
            </div>
            <h1 className="notranslate text-4xl md:text-5xl font-serif font-bold leading-tight text-white">{book.title}</h1>
            <p className="text-xl text-white/40 font-medium italic">by {book.author}</p>
            <div className="flex items-center space-x-4">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-5 h-5 ${s <= Math.round(book.rating || 5) ? 'fill-current' : 'text-white/10'}`} />
                ))}
              </div>
              <span className="text-sm font-bold text-white/30">({reviews.length} reviews)</span>
            </div>
          </div>

          <div className="flex items-baseline space-x-4">
            <div className="text-4xl font-bold text-primary-light">{(book.price || 0).toFixed(0)} DA</div>
            {Number(book.old_price) > book.price && (
              <>
                <div className="text-xl text-white/20 line-through">{(book.old_price || 0).toFixed(0)} DA</div>
                <div className="bg-yellow-400 text-ink px-3 py-1 rounded-full font-black text-xs shadow-lg">
                  SAVE {Math.round(((book.old_price! - book.price) / book.old_price!) * 100)}%
                </div>
              </>
            )}
          </div>

          <div className="prose prose-invert prose-primary max-w-none text-white/60 leading-relaxed">
            <Markdown>{book.description}</Markdown>
          </div>

          {book.is_bundle && bundleBooks.length > 0 && (
            <div className="space-y-6 pt-8 border-t border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="text-lg font-serif font-bold text-white">Bundle Includes</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bundleBooks.map(b => (
                  <div key={b.id} onClick={() => navigate(`/book/${b.id}`)} className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
                    <div className="w-12 h-16 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
                      <LazyImage src={b.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{b.title}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest truncate">{b.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-8 relative z-30">
            <div className="flex items-center bg-white/5 rounded-full px-6 py-4 border border-white/10">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQty(Math.max(1, qty - 1));
                }} 
                className="p-2 hover:text-primary-light text-white/60 transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="mx-6 font-bold w-4 text-center text-white">{qty}</span>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQty(qty + 1);
                }} 
                className="p-2 hover:text-primary-light text-white/60 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button 
              type="button"
              onClick={handleAddToCart}
              className={`flex-grow flex items-center justify-center space-x-3 px-8 py-4 rounded-full font-bold transition-all duration-500 shadow-xl cursor-pointer ${
                cartStatus === 'added' 
                  ? 'bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.5)] scale-105' 
                  : cartStatus === 'go_to_cart'
                  ? 'bg-white text-ink hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.3)]'
                  : 'bg-primary text-white hover:bg-primary-light shadow-[0_0_30px_rgba(139,92,246,0.3)]'
              }`}
            >
              <AnimatePresence mode="wait">
                {cartStatus === 'added' ? (
                  <motion.div
                    key="added"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Added!</span>
                  </motion.div>
                ) : cartStatus === 'go_to_cart' ? (
                  <motion.div
                    key="goto"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Go to Cart</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="add"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add to Cart</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <button
              onClick={toggleTbr}
              className={`py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all border ${
                isInTbr ? 'bg-primary/20 text-primary-light border-primary/30' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <BookDashed className="w-5 h-5" />
              <span className="text-sm">{isInTbr ? 'In TBR List' : 'Add to TBR'}</span>
            </button>
            <button
              onClick={toggleCurrentRead}
              className={`py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all border ${
                isCurrentRead ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <Bookmark className="w-5 h-5" />
              <span className="text-sm">{isCurrentRead ? 'Reading Now' : 'Read Now'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-white/10">
            <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10">
              <ShieldCheck className="w-6 h-6 text-primary-light" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Premium Quality</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10">
              <Truck className="w-6 h-6 text-primary-light" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Fast Shipping</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10">
              <CheckCircle className="w-6 h-6 text-primary-light" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Verified Read</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10">
              <Trophy className="w-6 h-6 text-primary-light" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Top Choice</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Related Books Section */}
      {relatedBooks.length > 0 && (
        <div className="mt-32 space-y-12 relative z-10">
          <div className="flex items-center justify-between border-b border-white/10 pb-8">
            <h2 className="text-3xl font-serif font-bold text-white">Books You Might Like</h2>
            <div className="flex items-center space-x-2 text-primary-light">
              <Plus className="w-5 h-5" />
              <span className="font-bold">Similar Genre</span>
            </div>
          </div>

          <div className="flex overflow-x-auto pb-8 gap-6 sm:gap-10 scrollbar-hide snap-x snap-mandatory">
            {relatedBooks.map((relatedBook) => (
              <motion.div
                key={relatedBook.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group cursor-pointer card-glass p-3 sm:p-4 min-w-[200px] sm:min-w-[240px] snap-start"
                onClick={() => {
                  navigate(`/book/${relatedBook.id}`);
                  window.scrollTo(0, 0);
                }}
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-4 bg-white/5 shadow-md group-hover:shadow-xl transition-all duration-500">
                  <LazyImage 
                    src={relatedBook.cover_image_url || 'https://picsum.photos/seed/book/300/450'} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={relatedBook.title}
                    referrerPolicy="no-referrer"
                  />
                  {Number(relatedBook.old_price) > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                      SALE
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-sm group-hover:text-primary-light transition-colors line-clamp-1 text-white">{relatedBook.title}</h3>
                  <p className="text-white/40 text-xs line-clamp-1">{relatedBook.author}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-primary-light text-sm">{(relatedBook.price || 0).toFixed(0)} DA</span>
                    <div className="flex items-center text-yellow-400">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span className="text-[10px] font-bold ml-0.5">{relatedBook.rating || 5.0}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="mt-24 space-y-12 relative z-10">
        <div className="flex items-center justify-between border-b border-white/10 pb-8">
          <h2 className="text-3xl font-serif font-bold text-white">Reader Reviews</h2>
          <div className="flex items-center space-x-2 text-primary-light">
            <MessageSquare className="w-5 h-5" />
            <span className="font-bold">{reviews.length} Thoughts</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Review Form */}
          <div className="lg:col-span-1">
            <form onSubmit={handleReviewSubmit} className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 space-y-6 sticky top-24">
              <h3 className="text-xl font-bold text-white">Leave a Review</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-white/60">Rating:</span>
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setReviewRating(s)} className="p-0.5">
                        <Star className={`w-5 h-5 ${s <= reviewRating ? 'fill-current' : 'text-white/10'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Your Name</label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary" />
                      <span className="text-[10px] font-bold text-primary-light uppercase tracking-widest">Post Anonymously</span>
                    </label>
                  </div>
                  <input 
                    type="text" 
                    disabled={isAnonymous}
                    placeholder={isAnonymous ? "Anonymous" : "Enter your name"}
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-white placeholder:text-white/20 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Your Thoughts</label>
                  <textarea 
                    rows={4}
                    required
                    placeholder="What did you think of this book?"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-white placeholder:text-white/20"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-light transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {submittingReview ? 'Posting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-8">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <motion.div 
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-bold text-lg text-white">{review.user_name}</p>
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-current' : 'text-white/10'}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-white/30">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-white/60 leading-relaxed italic">"{review.comment}"</p>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <h3 className="text-xl font-serif font-bold text-white/30">No reviews yet. Be the first to share your thoughts!</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}