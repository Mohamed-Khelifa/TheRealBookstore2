import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Phone, Mail, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface FooterProps {
  onAdminAccess: () => void;
}

export const Footer = ({ onAdminAccess }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-ink pt-24 pb-12 overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8">
          
          {/* Brand Section */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <Link to="/" className="flex items-center space-x-2 group notranslate">
                <span className="text-4xl font-serif font-bold purplish-text-gradient group-hover:opacity-80 transition-opacity">BigDeal</span>
                <span className="text-xs font-medium text-primary-light/60 uppercase tracking-[0.2em] mt-2">Bookstore</span>
              </Link>
              <p className="text-white/50 text-lg max-w-md leading-relaxed font-light">
                Curating the world's finest literature for readers who appreciate the weight of a well-crafted story and the beauty of a premium edition.
              </p>
            </div>

            <div className="flex flex-col space-y-4">
              <a 
                href="https://www.instagram.com/bigdealbookstore/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-4 text-white/40 hover:text-primary-light transition-all group w-fit"
              >
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                  <Instagram className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">Follow us</span>
                  <span className="text-sm font-medium notranslate">@bigdealbookstore</span>
                </div>
              </a>

              <div className="flex items-center space-x-4 text-white/40 group w-fit">
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">Email</span>
                  <span className="text-sm font-medium notranslate">contact@bigdealbookstore.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-white/30">Collections</h4>
              <ul className="space-y-4">
                <li>
                  <Link 
                    to="/?sort=newest#categories" 
                    className="text-white/50 hover:text-white transition-colors text-sm flex items-center group"
                  >
                    <span>New Arrivals</span>
                    <ArrowRight className="w-3 h-3 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/?sort=rating-high#categories" 
                    className="text-white/50 hover:text-white transition-colors text-sm flex items-center group"
                  >
                    <span>Top Rated</span>
                    <ArrowRight className="w-3 h-3 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/special-request" 
                    className="text-white/50 hover:text-white transition-colors text-sm flex items-center group"
                  >
                    <span>Special Orders</span>
                    <ArrowRight className="w-3 h-3 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-white/30">Account</h4>
              <ul className="space-y-4">
                <li>
                  <Link to="/checkout" className="text-white/50 hover:text-white transition-colors text-sm">
                    My Cart
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={onAdminAccess}
                    className="text-white/50 hover:text-primary-light transition-colors text-sm flex items-center group"
                  >
                    <span>Admin Access</span>
                    <MapPin className="w-3 h-3 ml-2 opacity-40" />
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-[11px] uppercase tracking-widest font-bold text-white/20">
            <p className="notranslate">&copy; {currentYear} BigDealBookstore</p>
            <div className="hidden md:block w-1 h-1 rounded-full bg-white/10" />
            <p>Crafted for the discerning reader</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs font-serif italic text-primary-light/40">“Premium books, better quality”</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
