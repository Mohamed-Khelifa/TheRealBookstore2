import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';

interface MarqueeTextProps {
  text: string;
  className?: string;
  speed?: number; // pixels per second
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({ 
  text, 
  className = "", 
  speed = 20 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      const cWidth = containerRef.current.offsetWidth;
      const tWidth = textRef.current.scrollWidth;
      
      if (tWidth > cWidth) {
        setShouldScroll(true);
        setScrollWidth(tWidth);
        setContainerWidth(cWidth);
      } else {
        setShouldScroll(false);
      }
    }
  }, [text]);

  // Calculate duration based on speed and distance
  const duration = shouldScroll ? (scrollWidth / speed) : 0;

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden whitespace-nowrap ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span 
        ref={textRef}
        className={`inline-block ${shouldScroll ? 'invisible' : ''}`}
      >
        {text}
      </span>

      {shouldScroll && (
        <motion.div
          className="absolute top-0 left-0 flex whitespace-nowrap"
          animate={isHovered ? {
            x: [0, -(scrollWidth - containerWidth + 20), 0],
          } : { x: 0 }}
          transition={{
            duration: duration * 2,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
            repeatDelay: 1
          }}
        >
          <span className="pr-10">{text}</span>
        </motion.div>
      )}
    </div>
  );
};
