import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AnimationEvent {
  id: number;
  x: number;
  y: number;
  imageUrl: string;
}

export default function CartAnimation() {
  const [animations, setAnimations] = useState<AnimationEvent[]>([]);

  useEffect(() => {
    const handleAnimation = (e: CustomEvent<Omit<AnimationEvent, 'id'>>) => {
      const newAnim = {
        ...e.detail,
        id: Date.now() + Math.random(),
      };
      setAnimations((prev) => [...prev, newAnim]);

      // Remove after animation completes
      setTimeout(() => {
        setAnimations((prev) => prev.filter((a) => a.id !== newAnim.id));
      }, 1000);
    };

    window.addEventListener('add-to-cart-animation' as any, handleAnimation);
    return () => window.removeEventListener('add-to-cart-animation' as any, handleAnimation);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      <AnimatePresence>
        {animations.map((anim) => {
          const cartIcon = document.getElementById('cart-icon');
          let targetX = window.innerWidth - 50;
          let targetY = 20;

          if (cartIcon) {
            const rect = cartIcon.getBoundingClientRect();
            targetX = rect.left + rect.width / 2;
            targetY = rect.top + rect.height / 2;
          }

          return (
            <motion.img
              key={anim.id}
              src={anim.imageUrl}
              initial={{
                x: anim.x - 40, // Center the 80x120 image
                y: anim.y - 60,
                scale: 1,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                x: targetX - 20, // Center the final 40x60 image
                y: targetY - 30,
                scale: 0.2,
                opacity: 0.5,
                rotate: 360,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.25, 1, 0.5, 1], // Custom easing for a nice curve
              }}
              className="absolute w-20 h-30 object-cover rounded-md shadow-2xl z-[100]"
              style={{
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
