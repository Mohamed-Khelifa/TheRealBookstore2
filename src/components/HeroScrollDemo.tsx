import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Book } from "../types";
import { usePerformance } from "../hooks/usePerformance";
import { CircularTestimonials } from "./ui/circular-testimonials";

interface HeroScrollDemoProps {
  featuredBooks: Book[];
}

export function HeroScrollDemo({ featuredBooks }: HeroScrollDemoProps) {
  const { isAndroid } = usePerformance();

  const testimonials = useMemo(() => {
    return featuredBooks.map(book => ({
      name: book.title,
      designation: `by ${book.author}`,
      src: book.cover_image_url || 'https://picsum.photos/seed/featured/600/900',
      href: `/book/${book.id}`,
      price: book.price,
      old_price: book.old_price
    }));
  }, [featuredBooks]);

  if (!featuredBooks || featuredBooks.length === 0) return null;

  return (
    <section className="relative w-full py-12 md:py-24 overflow-hidden bg-transparent">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full animate-pulse-subtle" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse-subtle" style={{ animationDelay: '2s' }} />
        {!isAndroid && (
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:60px_60px]" />
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center mb-12 md:mb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 bg-primary/10 text-primary-light px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/20 mb-6"
          >
            <Sparkles className="w-3 h-3" />
            <span>Curated Selection</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-serif font-bold text-white leading-tight"
          >
            Featured <span className="purplish-text-gradient italic">Masterpieces</span>
          </motion.h2>
        </div>

        <div className="flex flex-wrap gap-6 items-center justify-center relative min-h-[300px]">
          <div
            className="items-center justify-center relative flex w-full"
            style={{ maxWidth: "1456px" }}
          >
            <CircularTestimonials
              testimonials={testimonials}
              autoplay={true}
              colors={{
                name: "#f7f7ff",
                designation: "#e1e1e1",
                testimony: "#f1f1f7",
                arrowBackground: "rgba(255,255,255,0.1)",
                arrowForeground: "#141414",
                arrowHoverBackground: "#f7f7ff",
              }}
              fontSizes={{
                name: "28px",
                designation: "20px",
                quote: "20px",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
