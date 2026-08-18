import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Volume2, VolumeX, Maximize, Sparkles, CheckCircle, ShieldCheck, BookOpen, PackageCheck, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface VideoShowcaseSettings {
  video_url: string;
  poster_url: string;
  title: string;
  subtitle: string;
  active: boolean;
}

export const DEFAULT_SHOWCASE_SETTINGS: VideoShowcaseSettings = {
  video_url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4',
  poster_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1200&auto=format&fit=crop',
  title: 'Uncompromising Quality',
  subtitle: 'Take a closer look at the physical craftsmanship, crisp printing, and premium paper quality of our books.',
  active: true,
};

export function QualityShowcaseVideo() {
  const [settings, setSettings] = useState<VideoShowcaseSettings>(DEFAULT_SHOWCASE_SETTINGS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  // IntersectionObserver: Autoplay like a GIF when scrolled into view, pause when scrolled away
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !videoError) {
            if (videoRef.current) {
              videoRef.current.muted = isMuted;
              videoRef.current
                .play()
                .then(() => setIsPlaying(true))
                .catch((err) => {
                  console.warn('Autoplay waiting for user gesture or muted policy:', err);
                });
            }
          } else {
            if (videoRef.current) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(node);

    return () => {
      observer.unobserve(node);
    };
  }, [isMuted, settings.video_url, videoError]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'showcase_video_settings')
        .single();

      if (!error && data && data.value) {
        let parsed = data.value;
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch (e) {}
        }
        if (parsed && typeof parsed === 'object') {
          setSettings({
            video_url: parsed.video_url || DEFAULT_SHOWCASE_SETTINGS.video_url,
            poster_url: parsed.poster_url || DEFAULT_SHOWCASE_SETTINGS.poster_url,
            title: parsed.title || DEFAULT_SHOWCASE_SETTINGS.title,
            subtitle: parsed.subtitle || DEFAULT_SHOWCASE_SETTINGS.subtitle,
            active: parsed.active !== undefined ? parsed.active : true,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching showcase video settings:', err);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    if (total > 0) {
      setProgress((current / total) * 100);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * videoRef.current.duration;
  };

  const toggleFullScreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  if (!settings.active) return null;

  return (
    <section ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl h-96 bg-primary/20 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="text-center mb-10 space-y-4">
        <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 text-primary-light px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Physical Quality Guarantee</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
          {settings.title}
        </h2>
        <p className="text-white/60 max-w-2xl mx-auto text-base leading-relaxed">
          {settings.subtitle}
        </p>
      </div>

      {/* Main Video Showcase Container - Vertical 9:16 Portrait Frame for 1440x2560 Video */}
      <div className="relative max-w-[320px] sm:max-w-[360px] md:max-w-[380px] mx-auto">
        <div className="relative bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-3 md:p-4 border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Ambient Video Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-purple-500/10 to-transparent opacity-60 pointer-events-none rounded-[2.5rem]" />

          {/* Video Player Box - Exact 9:16 Vertical Ratio */}
          <div className="relative aspect-[9/16] rounded-[2rem] overflow-hidden bg-black shadow-2xl flex items-center justify-center">
            {videoError ? (
              <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                <img 
                  src={settings.poster_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1200&auto=format&fit=crop'} 
                  alt="Book Showcase" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <BookOpen className="w-12 h-12 text-primary-light" />
                  <p className="text-white font-bold text-lg">{settings.title}</p>
                  <p className="text-white/60 text-xs max-w-md">{settings.subtitle}</p>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                src={settings.video_url}
                poster={settings.poster_url}
                playsInline
                loop
                muted={isMuted}
                autoPlay
                preload="auto"
                disablePictureInPicture
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                onError={() => {
                  console.warn('Video failed to load or codec unsupported, switching to fallback URL');
                  if (settings.video_url !== DEFAULT_SHOWCASE_SETTINGS.video_url) {
                    setSettings(prev => ({ ...prev, video_url: DEFAULT_SHOWCASE_SETTINGS.video_url }));
                  } else {
                    setVideoError(true);
                  }
                }}
                onClick={togglePlay}
                className="w-full h-full object-cover cursor-pointer will-change-transform transform-gpu"
              />
            )}
          </div>
        </div>
      </div>

      {/* Quality Features / Badges Grid - Perfectly Balanced & Centered */}
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex flex-col items-center text-center justify-center space-y-2 shadow-lg transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 group min-h-[110px]">
            <div className="p-2.5 bg-primary/20 text-primary-light rounded-xl group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white leading-tight">Crisp Print</p>
              <p className="text-[11px] text-white/50 leading-tight mt-1">High resolution text</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex flex-col items-center text-center justify-center space-y-2 shadow-lg transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 group min-h-[110px]">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white leading-tight">Soft Cover</p>
              <p className="text-[11px] text-white/50 leading-tight mt-1">Premium tactile feel</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex flex-col items-center text-center justify-center space-y-2 shadow-lg transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 group min-h-[110px]">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white leading-tight">Inspected</p>
              <p className="text-[11px] text-white/50 leading-tight mt-1">Quality verified</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex flex-col items-center text-center justify-center space-y-2 shadow-lg transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 group min-h-[110px]">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white leading-tight">Protected</p>
              <p className="text-[11px] text-white/50 leading-tight mt-1">Bubble wrapped</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
