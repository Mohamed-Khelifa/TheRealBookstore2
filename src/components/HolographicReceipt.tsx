import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { formatOrderRef } from '../lib/utils';
import { Book, CheckCircle, Sparkles } from 'lucide-react';

interface HolographicReceiptProps {
  orderId: string;
  fullName: string;
  date: string;
}

export function HolographicReceipt({ orderId, fullName, date }: HolographicReceiptProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

  // We map the mouse position to a background position for the glare
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Normalized coordinates between -0.5 and 0.5
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div style={{ perspective: 1200 }} className="flex w-full items-center justify-center my-6">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full max-w-sm shrink-0 rounded-2xl md:rounded-3xl cursor-grab active:cursor-grabbing"
      >
        <div className="absolute inset-0 rounded-2xl md:rounded-3xl shadow-[0_20px_50px_rgba(139,92,246,0.3)] transition-shadow duration-300" />
        
        <div className="relative border border-white/20 bg-ink/90 backdrop-blur-3xl overflow-hidden rounded-2xl md:rounded-3xl">
          {/* Holographic Glare */}
          <motion.div
            style={{
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 80%)`,
            }}
            className="pointer-events-none absolute inset-0 z-20 mix-blend-overlay"
          />
          
          <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

          {/* Ticket Body */}
          <div className="relative z-30 p-6 md:p-8 space-y-6 text-left flex flex-col items-center">
            
            <div className="text-center space-y-2 border-b border-dashed border-white/20 pb-6 w-full">
               <div className="flex justify-center mb-4">
                  <div className="bg-primary/20 p-4 rounded-full shadow-inner border border-primary/30 relative">
                    <CheckCircle className="w-12 h-12 text-primary-light" />
                    <Sparkles className="w-6 h-6 text-white absolute -top-2 -right-2 drop-shadow-xl" />
                  </div>
               </div>
               <div className="font-mono text-xs text-white/50 uppercase tracking-widest">
                 Official Receipt
               </div>
               <div className="font-mono text-2xl md:text-3xl font-bold tracking-widest text-primary-light">
                 #{formatOrderRef(orderId)}
               </div>
               <div className="font-mono text-[10px] text-white/40 uppercase tracking-widest">
                 {date}
               </div>
            </div>

            <div className="w-full text-center space-y-4">
              <p className="text-sm md:text-base text-white/80 font-medium leading-relaxed font-sans">
                Your order will take around <span className="text-white font-bold inline-block border-b border-primary/50">1 to 2 weeks</span> to reach you.
              </p>
              <div className="bg-gradient-to-r from-emerald-500/15 via-primary/20 to-emerald-500/15 border border-emerald-500/30 rounded-xl p-4">
                <p className="text-sm md:text-base text-white font-medium leading-relaxed">
                  You will receive a <span className="text-emerald-300 font-bold">confirmation WhatsApp message or a call this Friday.</span>
                </p>
              </div>
              <p className="text-sm text-white/70 italic font-serif">
                ~ "Words travel through time; thank you for carrying them forward." ~
              </p>
            </div>
            
            {/* Holographic Barcode */}
            <div className="pt-4 border-t border-dashed border-white/20 w-full flex flex-col items-center gap-2">
                <div className="w-full h-8 flex justify-between items-end opacity-60">
                   {Array.from({ length: 44 }).map((_, i) => (
                     <div key={i} className="bg-white/80" style={{ width: Math.random() > 0.5 ? '2px' : '4px', height: Math.random() > 0.5 ? '100%' : '70%' }} />
                   ))}
                </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
