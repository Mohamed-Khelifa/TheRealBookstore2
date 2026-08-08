import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, CheckCircle, RefreshCw, MessageCircle, AlertCircle, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const DEFAULT_WHATSAPP_TEMPLATE = `Good evening {{customerName}} ^^
This is BigDealBookstore i am reaching out to confirm your order via messages :D
Ordered Books:
{{booksList}}
Total Price: {{totalPrice}}
if you want to officially confirm the order just say "confirm" and it will reach you this Thursday inshallah, in case you have any questions regarding your order or if you will not be able to receive your books for some reason just reach out through here and we will try to find a solution HAVE A GREAT EVENING!

Bonsoir {{customerName}} ^^
C'est BigDealBookstore, je vous contacte pour confirmer votre commande par message :D
Livres commandés :
{{booksList}}
Prix total : {{totalPrice}}
Si vous souhaitez confirmer officiellement la commande, dites simplement « confirmer » et elle vous parviendra ce jeudi incha'Allah. Si vous avez la moindre question concernant votre commande ou si vous ne pouvez pas recevoir vos livres pour une raison quelconque, écrivez-nous ici et nous trouverons une solution PASSEZ UNE EXCELLENTE SOIRÉE !`;

export default function ManageWhatsApp() {
  const [template, setTemplate] = useState(DEFAULT_WHATSAPP_TEMPLATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) {
        if (error.code !== '42P01') {
          console.error('Error fetching settings:', error);
          setErrorMsg('Failed to load settings. Ensure site_settings table exists.');
        }
      } else if (data && data.length > 0) {
        const storedTemplate = data.find(s => s.key === 'whatsapp_template')?.value;
        if (storedTemplate) setTemplate(storedTemplate);
      }
    } catch (err: any) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSavedSuccess(false);

    try {
      // Upsert whatsapp_template
      const { error: tError } = await supabase
        .from('site_settings')
        .upsert({ key: 'whatsapp_template', value: template }, { onConflict: 'key' });

      if (tError) throw tError;

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setErrorMsg(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/20 rounded-2xl">
            <MessageCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">WhatsApp Template</h1>
            <p className="text-white/60 mt-1">Configure the automated WhatsApp confirmation message.</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{errorMsg}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-8 border border-white/10 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              <span>Message Configuration</span>
            </h2>
            <p className="text-sm text-white/60">
              Customize the message sent to customers for order confirmation. Use the variables on the right to inject order details.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider">
                Message Template
              </label>
              <textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="Enter your WhatsApp message template here..."
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary text-sm font-sans min-h-[400px]"
              />
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-white/10">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : savedSuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-200" />
                    <span>Saved Successfully!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Template</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>Available Variables</span>
            </h3>
            <div className="space-y-3 text-sm text-white/70 leading-relaxed">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <code className="text-emerald-400 font-bold font-mono">{"{{customerName}}"}</code>
                <div className="text-xs text-white/50">The customer's full name (e.g., "John Doe"). If available, it prefixes with a space.</div>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <code className="text-emerald-400 font-bold font-mono">{"{{booksList}}"}</code>
                <div className="text-xs text-white/50">Bullet-point list of ordered books with quantities (e.g., "• 2x The Alchemist").</div>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <code className="text-emerald-400 font-bold font-mono">{"{{totalPrice}}"}</code>
                <div className="text-xs text-white/50">The total order price formatted with currency (e.g., "4500 DA").</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
