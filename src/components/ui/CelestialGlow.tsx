import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { usePerformance } from "../../hooks/usePerformance";

interface CelestialGlowProps {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export const CelestialGlow = ({
  children,
  className,
  containerClassName,
}: CelestialGlowProps) => {
  const { isVeryLowEnd, isAndroid } = usePerformance();
  const [isMobile, setIsMobile] = React.useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Generate a set of small orbs with different properties
  const allOrbs = [
    { color: "#a78bfa", size: "w-2 h-2", duration: 25, delay: 0, left: ["5%", "95%", "5%"], top: ["10%", "90%", "10%"] }, // violet-400
    { color: "#a855f7", size: "w-2.5 h-2.5", duration: 35, delay: 2, left: ["90%", "10%", "90%"], top: ["20%", "80%", "20%"] }, // purple-500
    { color: "#fb7185", size: "w-1.5 h-1.5", duration: 28, delay: 1, left: ["20%", "80%", "20%"], top: ["70%", "30%", "70%"] }, // rose-400
    { color: "#818cf8", size: "w-2.5 h-2.5", duration: 40, delay: 3, left: ["70%", "5%", "70%"], top: ["40%", "95%", "40%"] }, // indigo-400
    { color: "#c4b5fd", size: "w-1 h-1", duration: 30, delay: 4, left: ["15%", "85%", "15%"], top: ["60%", "15%", "60%"] }, // violet-300
    { color: "#fda4af", size: "w-2 h-2", duration: 32, delay: 5, left: ["85%", "15%", "85%"], top: ["30%", "70%", "30%"] }, // rose-300
    { color: "#8b5cf6", size: "w-1.5 h-1.5", duration: 45, delay: 6, left: ["40%", "60%", "40%"], top: ["10%", "90%", "10%"] }, // primary (violet-500)
    { color: "#8b5cf6", size: "w-2 h-2", duration: 38, delay: 7, left: ["60%", "40%", "60%"], top: ["90%", "10%", "90%"] }, // violet-500
    { color: "#c084fc", size: "w-1.5 h-1.5", duration: 26, delay: 8, left: ["30%", "70%", "30%"], top: ["50%", "50%", "50%"] }, // purple-400
    { color: "#f43f5e", size: "w-2.5 h-2.5", duration: 42, delay: 9, left: ["10%", "90%", "10%"], top: ["80%", "20%", "80%"] }, // rose-500
    { color: "#7c3aed", size: "w-2 h-2", duration: 31, delay: 1.5, left: ["50%", "10%", "50%"], top: ["5%", "95%", "5%"] },
    { color: "#6366f1", size: "w-1.5 h-1.5", duration: 29, delay: 2.5, left: ["10%", "50%", "10%"], top: ["95%", "5%", "95%"] },
    { color: "#ec4899", size: "w-2 h-2", duration: 33, delay: 3.5, left: ["95%", "50%", "95%"], top: ["50%", "10%", "50%"] },
    { color: "#8b5cf6", size: "w-1 h-1", duration: 37, delay: 4.5, left: ["50%", "95%", "50%"], top: ["10%", "50%", "10%"] },
    { color: "#a78bfa", size: "w-2.5 h-2.5", duration: 41, delay: 0.5, left: ["25%", "75%", "25%"], top: ["25%", "75%", "25%"] },
    { color: "#c084fc", size: "w-1.5 h-1.5", duration: 27, delay: 1.2, left: ["75%", "25%", "75%"], top: ["75%", "25%", "75%"] },
    { color: "#fb7185", size: "w-2 h-2", duration: 34, delay: 2.2, left: ["40%", "80%", "40%"], top: ["80%", "40%", "80%"] },
    { color: "#818cf8", size: "w-1 h-1", duration: 39, delay: 3.2, left: ["80%", "40%", "80%"], top: ["40%", "80%", "40%"] },
    { color: "#fda4af", size: "w-2.5 h-2.5", duration: 43, delay: 4.2, left: ["10%", "30%", "10%"], top: ["30%", "10%", "30%"] },
    { color: "#a855f7", size: "w-1.5 h-1.5", duration: 36, delay: 5.2, left: ["90%", "70%", "90%"], top: ["70%", "90%", "70%"] },
    { color: "#8b5cf6", size: "w-2 h-2", duration: 48, delay: 1.1, left: ["5%", "50%", "5%"], top: ["50%", "5%", "50%"] },
    { color: "#c084fc", size: "w-1.5 h-1.5", duration: 52, delay: 2.1, left: ["50%", "95%", "50%"], top: ["95%", "50%", "95%"] },
    { color: "#fb7185", size: "w-2 h-2", duration: 55, delay: 3.1, left: ["15%", "75%", "15%"], top: ["75%", "15%", "75%"] },
    { color: "#818cf8", size: "w-1 h-1", duration: 58, delay: 4.1, left: ["85%", "25%", "85%"], top: ["25%", "85%", "25%"] },
    { color: "#a78bfa", size: "w-2.5 h-2.5", duration: 60, delay: 5.1, left: ["45%", "55%", "45%"], top: ["55%", "45%", "55%"] },
  ];

  // Orbs count based on device
  const orbsCount = isMobile ? 6 : 25;
  const orbs = allOrbs.slice(0, orbsCount);

  return (
    <div 
      className={cn("relative overflow-hidden bg-transparent w-full h-full", containerClassName)}
    >
      {/* Atmospheric Background Layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Small Glowing Orbs */}
        {!isAndroid && orbs.map((orb, i) => (
          <motion.div
            key={i}
            initial={{
              left: orb.left[0],
              top: orb.top[0],
              opacity: 0.7,
            }}
            // Static on mobile, moving slowly on desktop
            animate={isMobile ? {
              left: orb.left[0],
              top: orb.top[0],
              opacity: 0.7,
            } : {
              left: orb.left,
              top: orb.top,
              opacity: 0.7,
            }}
            transition={{
              duration: isMobile ? orb.duration : orb.duration * 2, // Slower on desktop
              repeat: Infinity,
              delay: -(orb.duration * (i / orbsCount)),
              ease: "linear",
            }}
            className={cn(
              "absolute rounded-full will-change-transform",
              orb.size
            )}
            style={{
              background: `radial-gradient(circle, #ffffff 0%, ${orb.color} 40%, ${orb.color}00 100%)`,
              boxShadow: `
                0 0 15px 5px #ffffffaa,
                0 0 30px 12px ${orb.color}cc,
                0 0 60px 25px ${orb.color}66,
                0 0 100px 40px ${orb.color}22
              `,
              filter: `blur(0.5px) drop-shadow(0 0 10px ${orb.color})`
            }}
          />
        ))}

        {/* Central Radial Gradient for Depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1)_0%,transparent_70%)]" />
        
        {/* Fine Grain/Noise Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* Content Container */}
      <div className={cn("relative z-10 w-full h-full", className)}>
        {children}
      </div>
    </div>
  );
};
