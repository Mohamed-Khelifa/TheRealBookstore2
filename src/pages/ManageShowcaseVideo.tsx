import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Video, Save, CheckCircle, RefreshCw, AlertCircle, Upload, Play, Eye, Sparkles, Link as LinkIcon, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DEFAULT_SHOWCASE_SETTINGS, VideoShowcaseSettings } from '../components/QualityShowcaseVideo';

export default function ManageShowcaseVideo() {
  const [settings, setSettings] = useState<VideoShowcaseSettings>(DEFAULT_SHOWCASE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const posterInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'showcase_video_settings')
        .single();

      if (!error && data && data.value) {
        let parsed = data.value;
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed); } catch (e) {}
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
    } catch (err: any) {
      console.error('Error fetching video settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSavedSuccess(false);

    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'showcase_video_settings',
          value: JSON.stringify(settings),
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving showcase settings:', err);
      setErrorMsg(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setErrorMsg('Please select a valid video file (e.g. MP4, WebM, MOV).');
      return;
    }

    setUploadingVideo(true);
    setErrorMsg('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `quality_video_${Date.now()}.${fileExt}`;

      // Try uploading to Supabase storage bucket 'site-media' or 'public-assets'
      const { data, error } = await supabase.storage
        .from('site-media')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (error) {
        // Fallback: If bucket does not exist or upload fails, convert to data URL if small, or use FileReader
        console.warn('Supabase bucket upload error:', error);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setSettings(prev => ({ ...prev, video_url: event.target!.result as string }));
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3000);
          }
        };
        reader.readAsDataURL(file);
      } else if (data) {
        const { data: urlData } = supabase.storage.from('site-media').getPublicUrl(fileName);
        if (urlData?.publicUrl) {
          setSettings(prev => ({ ...prev, video_url: urlData.publicUrl }));
        }
      }
    } catch (err: any) {
      console.error('Error uploading video:', err);
      setErrorMsg('Failed to upload video file. You can also paste a direct video URL.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handlePosterFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPoster(true);
    setErrorMsg('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `poster_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('site-media')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (error) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setSettings(prev => ({ ...prev, poster_url: event.target!.result as string }));
          }
        };
        reader.readAsDataURL(file);
      } else if (data) {
        const { data: urlData } = supabase.storage.from('site-media').getPublicUrl(fileName);
        if (urlData?.publicUrl) {
          setSettings(prev => ({ ...prev, poster_url: urlData.publicUrl }));
        }
      }
    } catch (err: any) {
      console.error('Error uploading poster:', err);
    } finally {
      setUploadingPoster(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-500/20 rounded-2xl">
            <Video className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Book Quality Video Showcase</h1>
            <p className="text-white/60 mt-1">Upload and manage the showcase video displayed on the Home page under the Wall of Love.</p>
          </div>
        </div>

        <label className="flex items-center space-x-3 cursor-pointer bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl hover:bg-white/10 transition-all">
          <input
            type="checkbox"
            checked={settings.active}
            onChange={(e) => setSettings(prev => ({ ...prev, active: e.target.checked }))}
            className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
          />
          <span className="text-sm font-bold text-white">Show on Home Page</span>
        </label>
      </div>

      {errorMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{errorMsg}</span>
        </motion.div>
      )}

      {savedSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">Video Showcase settings saved successfully!</span>
        </motion.div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Title & Subtitle Settings */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-light" />
            Section Headers
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Section Title</label>
              <input
                type="text"
                value={settings.title}
                onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Uncompromising Quality"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Subtitle / Description</label>
              <textarea
                value={settings.subtitle}
                onChange={(e) => setSettings(prev => ({ ...prev, subtitle: e.target.value }))}
                rows={2}
                placeholder="Take a closer look at the physical craftsmanship..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-primary transition-all resize-y"
              />
            </div>
          </div>
        </div>

        {/* Video Upload & URL Settings */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-400" />
            Video Source
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload File Option */}
            <div className="bg-black/30 border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Option A: Upload Video File</h3>
                <p className="text-xs text-white/50 mt-1">Upload an MP4 or WebM video directly from your phone or computer.</p>
              </div>

              <input
                type="file"
                ref={videoInputRef}
                accept="video/*"
                onChange={handleVideoFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={uploadingVideo}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 font-bold rounded-xl border border-purple-500/30 transition-all disabled:opacity-50"
              >
                {uploadingVideo ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Choose Video File</span>
                  </>
                )}
              </button>
            </div>

            {/* Paste Video URL Option */}
            <div className="bg-black/30 border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Option B: Paste Video URL</h3>
                <p className="text-xs text-white/50 mt-1">Paste a direct public link to an MP4 video file.</p>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <LinkIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="url"
                    value={settings.video_url}
                    onChange={(e) => {
                      let val = e.target.value;
                      // Auto format raw Cloudinary iPhone video links if needed
                      if (val.includes('res.cloudinary.com') && !val.includes('/f_mp4,vc_h264/')) {
                        val = val.replace('/upload/', '/upload/f_mp4,vc_h264/');
                      }
                      setSettings(prev => ({ ...prev, video_url: val }));
                    }}
                    placeholder="https://example.com/video.mp4 or /showcase_book_quality.mp4"
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                {settings.video_url.includes('res.cloudinary.com') && (
                  <p className="text-[11px] text-amber-300/80 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    💡 iPhone videos (HEVC/H.265) require H.264 transcoding. Cloudinary URLs are auto-formatted with <code className="text-white bg-black/40 px-1 rounded">/f_mp4,vc_h264/</code> for cross-browser compatibility.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Thumbnail / Poster Image Option */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">Video Poster / Cover Image URL (Optional)</label>
            <div className="flex gap-3">
              <input
                type="url"
                value={settings.poster_url}
                onChange={(e) => setSettings(prev => ({ ...prev, poster_url: e.target.value }))}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary font-mono"
              />
              <input
                type="file"
                ref={posterInputRef}
                accept="image/*"
                onChange={handlePosterFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => posterInputRef.current?.click()}
                disabled={uploadingPoster}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10 transition-all"
              >
                {uploadingPoster ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Upload Poster'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Admin Video Preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white/70 text-xs font-bold uppercase tracking-wider">
            <Eye className="w-4 h-4 text-purple-400" />
            Live Video Preview:
          </div>
          <div className="bg-black/60 border border-white/10 rounded-3xl p-4 overflow-hidden aspect-video max-w-2xl mx-auto flex items-center justify-center relative">
            {settings.video_url ? (
              <video
                src={settings.video_url}
                poster={settings.poster_url}
                controls
                onError={() => {
                  setErrorMsg('Video player note: This video format or URL cannot be played in this browser (e.g. 403 Forbidden or unsupported HEVC/H.265 codec). Try uploading a standard MP4 (H.264).');
                }}
                className="w-full h-full object-contain rounded-2xl"
              />
            ) : (
              <div className="text-center text-white/40 text-sm">No video source set</div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl shadow-lg shadow-primary/25 transition-all disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Showcase Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
