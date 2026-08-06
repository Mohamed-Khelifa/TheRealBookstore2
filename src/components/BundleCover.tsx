import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Book } from '../types';
import { supabase } from '../lib/supabase';
import { LazyImage } from './ui/lazy-image';

interface BundleCoverProps {
  bundleBookIds: string[];
  allBooks: Book[];
  className?: string;
}

export const BundleCover: React.FC<BundleCoverProps> = ({ bundleBookIds, allBooks, className = "" }) => {
  const [fetchedBooks, setFetchedBooks] = useState<Book[]>([]);

  useEffect(() => {
    const missingIds = bundleBookIds.filter(id => !allBooks.find(b => b.id === id));
    if (missingIds.length > 0) {
      const fetchMissing = async () => {
        const { data } = await supabase.from('books').select('*').in('id', missingIds);
        if (data) {
          setFetchedBooks(prev => {
            const newBooks = [...prev];
            data.forEach(b => {
              if (!newBooks.find(existing => existing.id === b.id)) {
                newBooks.push(b);
              }
            });
            return newBooks;
          });
        }
      };
      fetchMissing();
    }
  }, [bundleBookIds, allBooks]);

  const bundleBooks = bundleBookIds
    .map(id => allBooks.find(b => b.id === id) || fetchedBooks.find(b => b.id === id))
    .filter((b): b is Book => !!b)
    .slice(0, 3); // Show up to 3 books for best aesthetic

  if (bundleBooks.length === 0) {
    return (
      <div className={`w-full h-full bg-white/5 flex items-center justify-center ${className}`}>
        <span className="text-white/20 text-xs italic">No books in bundle</span>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full flex items-center justify-center p-4 ${className}`}>
      {bundleBooks.map((book, index) => {
        // Calculate offsets and rotations for the layered effect
        const total = bundleBooks.length;
        const isLast = index === total - 1;
        
        // Aesthetic offsets
        let rotation = 0;
        let xOffset = 0;
        let scale = 1;
        let zIndex = index;

        if (total === 1) {
          rotation = 0;
          xOffset = 0;
        } else if (total === 2) {
          rotation = index === 0 ? -8 : 8;
          xOffset = index === 0 ? -15 : 15;
          scale = index === 0 ? 0.9 : 1;
        } else {
          // 3 or more
          if (index === 0) {
            rotation = -12;
            xOffset = -25;
            scale = 0.85;
          } else if (index === 1) {
            rotation = 0;
            xOffset = 0;
            scale = 0.92;
            zIndex = 10;
          } else {
            rotation = 12;
            xOffset = 25;
            scale = 1;
            zIndex = 20;
          }
        }

        return (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: 1, 
              scale: scale,
              rotate: rotation,
              x: xOffset,
              zIndex: zIndex
            }}
            className="absolute w-[70%] aspect-[2/3] shadow-2xl rounded-lg overflow-hidden border border-white/10"
            style={{ 
              transformOrigin: 'bottom center',
            }}
          >
            <LazyImage 
              src={book.cover_image_url || 'https://picsum.photos/seed/book/400/600'} 
              alt={book.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Subtle shadow overlay for depth */}
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
          </motion.div>
        );
      })}
    </div>
  );
};
