import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, CheckCircle, RefreshCw, FileText, AlertCircle, RotateCcw, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const DEFAULT_CHECKOUT_COVER_NOTE = `Please note that there may be slight variations between the cover image in our gallery and the physical book you receive. This is often due to different editions or publisher updates. Rest assured, we guarantee the content is identical and of the highest quality. If there is a major difference, we will reach out to you personally via Instagram or phone to confirm your approval before shipping. <strong>Thank you for your confidentiality</strong> 😊`;

export default function ManageCheckoutNote() {
  const [note, setNote] = useState(DEFAULT_CHECKOUT_COVER_NOTE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchNote();
  }, []);

  const fetchNote = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) {
        if (error.code !== '42P01') {
          console.error('Error fetching settings:', error);
          setErrorMsg('Failed to load settings.');
        }
      } else if (data && data.length > 0) {
        const storedNote = data.find(s => s.key === 'checkout_cover_note')?.value;
        if (storedNote && typeof storedNote === 'string' && storedNote.trim()) {
          setNote(storedNote);
        }
      }
    } catch (err: any) {
      console.error('Error:', err);
      setErrorMsg(err.message || 'Error loading note');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSavedSuccess(false);

    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'checkout_cover_note', value: note, updated_at: new Date().toISOString() }, { onConflict: 'key' });

      if (error) throw error;

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving checkout cover note:', err);
      setErrorMsg(err.message || 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset note to default text?')) {
      setNote(DEFAULT_CHECKOUT_COVER_NOTE);
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
          <div className="p-3 bg-primary/20 rounded-2xl">
            <FileText className="w-8 h-8 text-primary-light" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Checkout Disclaimer Note</h1>
            <p className="text-white/60 mt-1">Modify the disclaimer message shown to customers on the Checkout page.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Default
        </button>
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
          <span className="text-sm">Checkout Disclaimer note updated successfully!</span>
        </motion.div>
      )}

      <form onSubmit={handleSaveNote} className="space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
          <label className="block text-sm font-bold text-white/90">
            Disclaimer Note Content (HTML/Text allowed):
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            placeholder="Enter disclaimer note..."
            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-primary transition-all resize-y leading-relaxed"
          />
          <p className="text-xs text-white/40">
            Tip: You can use HTML tags like <code className="text-primary-light">&lt;strong&gt;text&lt;/strong&gt;</code> or <code className="text-primary-light">&lt;em&gt;text&lt;/em&gt;</code> for bold or italic styling.
          </p>
        </div>

        {/* Live Preview Card */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white/70 text-xs font-bold uppercase tracking-wider">
            <Eye className="w-4 h-4 text-primary-light" />
            Live Checkout Preview:
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white/60 leading-relaxed italic relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
            <div dangerouslySetInnerHTML={{ __html: `"${note.replace(/^"|"$/g, '')}"` }} />
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
                <span>Save Note Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
