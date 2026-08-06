"use client"

import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "../../lib/utils"
import { usePerformance } from "../../hooks/usePerformance"

interface NavBarProps {
  children: React.ReactNode
  className?: string
}

export function NavBar({ children, className }: NavBarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const { isAndroid } = usePerformance()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div
      className={cn(
        "fixed top-0 inset-x-0 mx-auto z-[100] w-full max-w-7xl px-4 transition-all duration-500",
        isScrolled ? "pt-4" : "pt-6",
        className,
      )}
    >
      <div className="relative group">
        {/* Purple Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 via-primary-light/30 to-primary/50 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
        
        <div className={cn(
          "relative flex items-center justify-between border border-white/10 py-2 px-4 md:px-8 rounded-full shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]",
          isAndroid ? "bg-ink" : "bg-ink/60 backdrop-blur-lg"
        )}>
          {children}
          
          {/* Animated Lamp/Glow for the active state (handled by children links) */}
        </div>
      </div>
    </div>
  )
}

interface NavLinkProps {
  href: string
  name: string
  isActive: boolean
  onClick?: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void
  children?: React.ReactNode
}

export function NavLink({ href, name, isActive, onClick, children }: NavLinkProps) {
  const isExternal = href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel');
  
  if (isExternal) {
    return (
      <a
        href={href}
        onClick={onClick as any}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "relative cursor-pointer text-sm font-bold px-4 py-2 rounded-full transition-all duration-300",
          isActive ? "text-primary-light" : "text-white/60 hover:text-white",
        )}
      >
        <span className="relative z-10">{children || name}</span>
      </a>
    );
  }

  return (
    <Link
      to={href}
      onClick={onClick as any}
      className={cn(
        "relative cursor-pointer text-sm font-bold px-4 py-2 rounded-full transition-all duration-300",
        isActive ? "text-primary-light" : "text-white/60 hover:text-white",
      )}
    >
      <span className="relative z-10">{children || name}</span>
      {isActive && (
        <motion.div
          layoutId="lamp"
          className="absolute inset-0 w-full bg-primary/10 rounded-full -z-0"
          initial={false}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        >
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-light rounded-t-full shadow-[0_0_15px_rgba(139,92,246,0.8)]">
            <div className="absolute w-12 h-6 bg-primary/30 rounded-full blur-md -top-2 -left-2" />
            <div className="absolute w-8 h-6 bg-primary/30 rounded-full blur-md -top-1" />
          </div>
        </motion.div>
      )}
    </Link>
  )
}
