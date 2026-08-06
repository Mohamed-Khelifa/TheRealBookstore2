import { useState, useEffect } from 'react';
import { motion, AnimatePresence,PanInfo } from 'motion/react';
import { Star, Hand, ArrowLeftRight } from 'lucide-react';

export function WallOfLoveStack({ screenshots }: { screenshots: any[] }) {
  const [cards, setCards] = useState(screenshots);
  const [isSwiping, setIsSwiping] = useState(false);
  const [exitX, setExitX] = useState(0);

  useEffect(() => {
    // Auto shuffle every 5 seconds if not interacting
    const timer = setInterval(() => {
      if (!isSwiping && cards.length > 1) {
        setExitX(-200); // simulate swiping left
        setTimeout(() => {
          setCards(prev => {
            const newArray = [...prev];
            const first = newArray.shift();
            if (first) newArray.push(first);
            return newArray;
          });
          setExitX(0);
        }, 200);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [isSwiping, cards.length]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsSwiping(false);
    if (Math.abs(info.offset.x) > 50 || Math.abs(info.velocity.x) > 500) {
      setExitX(info.offset.x > 0 ? 200 : -200);
      setTimeout(() => {
        setCards(prev => {
          const newArray = [...prev];
          const first = newArray.shift();
          if (first) newArray.push(first);
          return newArray;
        });
        setExitX(0);
      }, 200);
    }
  };

  if (!cards.length) return null;

  return (
    <div className="relative h-[550px] w-full max-w-[340px] mx-auto flex items-start justify-center pt-8">
      <AnimatePresence initial={false}>
        {cards.slice(0, Math.min(3, cards.length)).map((card, i) => {
          const isFront = i === 0;
          return (
            <motion.div
              key={card.id + (isFront ? '-front' : '')}
              className="absolute top-8 w-full h-[450px] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-white/5 cursor-grab active:cursor-grabbing origin-bottom"
              style={{
                zIndex: cards.length - i,
              }}
              drag={isFront ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragStart={() => isFront && setIsSwiping(true)}
              onDragEnd={isFront ? handleDragEnd : undefined}
              initial={{
                scale: 0.8,
                y: 50,
                opacity: 0
              }}
              animate={{
                scale: isFront ? 1 : 1 - i * 0.05,
                y: isFront ? 0 : i * 20,
                opacity: 1 - i * 0.2,
                x: isFront ? exitX : 0,
                rotate: isFront ? exitX * 0.1 : 0
              }}
              exit={{
                x: exitX,
                opacity: 0,
                scale: 0.9,
                transition: { duration: 0.2 }
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
            >
              <img 
                src={card.image_url} 
                alt="Customer Review" 
                className="w-full h-full object-contain bg-ink/50 select-none pointer-events-none"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent pointer-events-none" />
              {isFront && (
                <div className="absolute bottom-6 inset-x-0 flex flex-col items-center justify-center opacity-80 pointer-events-none">
                  <div className="bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20 mb-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="flex items-center space-x-2 text-white/70 bg-black/40 px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider animate-bounce">
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>Swipe</span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
