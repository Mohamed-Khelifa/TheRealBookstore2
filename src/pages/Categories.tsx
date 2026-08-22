import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingCart, Star, Trophy, Gift, Sparkles, ChevronLeft, Search, BookOpen, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchAllRows } from '../lib/api';
import { Book } from '../types';

export default function Categories() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooks = async () => {
      const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false }).limit(50);
      if (data) setBooks(data);
    };
    fetchBooks();
    window.scrollTo(0, 0);
  }, []);

  const famousGenres = ['Classics', 'Fantasy', 'Romance', 'Fiction', 'Mystery', 'Sci-Fi', 'History', 'Biography', 'Philosophy'];
  const categories = Array.from(new Set((Array.isArray(books) ? books : []).flatMap(b => (b as any).categories || [])))
    .filter(c => c !== 'Featured' && c !== 'Most Popular' && c !== 'Trendiest' && c !== 'Personal Development');
  
  const sortedCategories = [...categories].sort((a, b) => {
    const aIndex = famousGenres.indexOf(a);
    const bIndex = famousGenres.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  const allCategories = ['All', 'Featured', 'Most Popular', 'Bundles', 'Personal Development', 'Trendiest', ...sortedCategories];
  
  const filteredCategories = allCategories.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCategoryClick = (cat: string) => {
    navigate(`/?category=${encodeURIComponent(cat)}#categories`);
  };

  return (
    <div className="min-h-screen pt-8 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-20">
      <div className="mb-12 space-y-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-bold">Back</span>
        </button>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Discover Genres</h1>
            <p className="text-white/60 text-lg max-w-2xl">Explore our vast collection of books across all categories and genres. Find your next great read today.</p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="text" 
              placeholder="Search genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredCategories.map((cat, index) => {
          const bookCount = books.filter(b => 
            cat === 'All' || 
            (cat === 'Featured' && b.featured) ||
            (cat === 'Most Popular' && b.featured) ||
            (cat === 'Bundles' && b.is_bundle) ||
            (cat === 'Personal Development' && ((b as any).categories?.some((c: string) => c.toLowerCase().includes('self help') || c.toLowerCase().includes('self-help') || c.toLowerCase().includes('personal development')))) ||
            (cat === 'Trendiest' && b.rating >= 4.5) ||
            ((b as any).categories && (b as any).categories.includes(cat))
          ).length;

          return (
            <motion.button
              key={cat}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCategoryClick(cat)}
              className="w-full p-6 md:p-8 rounded-[2rem] text-left transition-all border group relative overflow-hidden flex flex-col justify-between min-h-[160px] bg-white/5 border-white/10 hover:border-white/20 text-white hover:bg-white/[0.07]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:to-transparent transition-colors duration-500" />
              
              <div className="relative z-10 w-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    {cat === 'All' ? <ShoppingCart className="w-5 h-5 text-primary-light" /> :
                     cat === 'Featured' ? <Star className="w-5 h-5 text-yellow-400" /> :
                     cat === 'Most Popular' ? <Trophy className="w-5 h-5 text-orange-400" /> :
                     cat === 'Bundles' ? <Gift className="w-5 h-5 text-indigo-400" /> :
                     cat === 'Personal Development' ? <Sparkles className="w-5 h-5 text-blue-400" /> :
                     cat === 'Trendiest' ? <Sparkles className="w-5 h-5 text-emerald-400" /> :
                     <BookOpen className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />}
                  </div>
                </div>
                <h4 className="font-bold text-xl mb-2 leading-tight break-words pr-2 text-white group-hover:text-primary-light transition-colors">{cat}</h4>
              </div>
              
              <div className="relative z-10 flex items-center justify-between w-full mt-4">
                <span className="text-sm font-medium text-white/40 group-hover:text-white/60 transition-colors">
                  {bookCount} {bookCount === 1 ? 'Book' : 'Books'}
                </span>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
      
      {filteredCategories.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">No genres found</h3>
          <p className="text-white/40">Try adjusting your search query to find what you're looking for.</p>
        </div>
      )}
    </div>
  );
}
