import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, CheckCircle, RefreshCw, MessageCircle, AlertCircle, Info, ChevronDown } from 'lucide-react';
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

export const DELIVERY_DEFAULTS: Record<string, string> = {
  'wa_delivery_sorti': `Hello {{customerName}}, from BigDeal Bookstore! 📚
Bonjour {{customerName}}, de BigDeal Bookstore !
مرحباً {{customerName}}، من مكتبة BigDeal!

Order / Commande / الطلب : *{{orderRef}}*

🚚 Out for delivery! Please keep your phone reachable, the driver will call you soon. ({{totalPrice}})

🚚 En cours de livraison ! Gardez votre téléphone joignable, le livreur va appeler. ({{totalPrice}})

🚚 في الطريق إليك! يرجى إبقاء هاتفك متاحاً، سيتصل بك المندوب قريباً. ({{totalPrice}})`,

  'wa_delivery_attente': `Hello {{customerName}}, from BigDeal Bookstore! 📚
Bonjour {{customerName}}, de BigDeal Bookstore !
مرحباً {{customerName}}، من مكتبة BigDeal!

Order / Commande / الطلب : *{{orderRef}}*

⏳ We noted that you will pick up your order later today. See you soon!

⏳ Nous avons noté que vous récupérerez votre commande plus tard dans la journée. À très vite !

⏳ لقد سجلنا أنك ستستلم طلبك في وقت لاحق اليوم. نراك قريباً!`,

  'wa_delivery_alerte': `Hello {{customerName}}, from BigDeal Bookstore! 📚
Bonjour {{customerName}}, de BigDeal Bookstore !
مرحباً {{customerName}}، من مكتبة BigDeal!

Order / Commande / الطلب : *{{orderRef}}*

⚠️ The driver tried to reach you. Please call back to receive your order before it is returned.

⚠️ Le livreur a essayé de vous joindre. Veuillez le rappeler pour éviter le retour de votre commande.

⚠️ حاول المندوب الاتصال بك. يرجى معاودة الاتصال لاستلام طلبك قبل إرجاعه.`,

  'wa_delivery_failed': `Hello {{customerName}}, from BigDeal Bookstore! 📚
Bonjour {{customerName}}, de BigDeal Bookstore !
مرحباً {{customerName}}، من مكتبة BigDeal!

Order / Commande / الطلب : *{{orderRef}}*

⚠️ Delivery attempt failed. Please tell us when you are available to reschedule.

⚠️ Tentative de livraison échouée. Dites-nous quand vous serez disponible pour reprogrammer.

⚠️ فشلت محاولة التوصيل. يرجى إخبارنا متى ستكون متاحاً لإعادة الجدولة.`,

  'wa_delivery_transit': `Hello {{customerName}}, from BigDeal Bookstore! 📚
Bonjour {{customerName}}, de BigDeal Bookstore !
مرحباً {{customerName}}، من مكتبة BigDeal!

Order / Commande / الطلب : *{{orderRef}}*

📦 Your package is on the way! The driver will contact you once it arrives in your city.

📦 Votre colis est en route ! Le livreur vous contactera dès son arrivée dans votre ville.

📦 طلبك في الطريق إليك! سيتصل بك المندوب فور وصوله إلى مدينتك.`,

  'wa_delivery_retour': `Hello {{customerName}}, from BigDeal Bookstore! 📚
Bonjour {{customerName}}, de BigDeal Bookstore !
مرحباً {{customerName}}، من مكتبة BigDeal!

Order / Commande / الطلب : *{{orderRef}}*

🔄 Your package was marked as returned. Let us know if you still want to receive it.

🔄 Votre colis a été marqué comme retour. Dites-nous si vous souhaitez toujours le recevoir.

🔄 تم تسجيل الطرد كمرتجع. أخبرنا إذا كنت لا تزال ترغب في استلامه.`,

  'wa_delivery_livre': `Hello {{customerName}}, from BigDeal Bookstore! 📚
Bonjour {{customerName}}, de BigDeal Bookstore !
مرحباً {{customerName}}، من مكتبة BigDeal!

Order / Commande / الطلب : *{{orderRef}}*

🎉 Delivered! Enjoy your books and feel free to tag us.

🎉 Livré ! Bonne lecture, n'hésitez pas à nous taguer.

🎉 تم التوصيل! قراءة ممتعة، لا تتردد في الإشارة إلينا.`,

  'wa_delivery_default': `Hello {{customerName}}, from BigDeal Bookstore! 📚
Bonjour {{customerName}}, de BigDeal Bookstore !
مرحباً {{customerName}}، من مكتبة BigDeal!

Order / Commande / الطلب : *{{orderRef}}*

Current status: *{{status}}*. Let us know if you have questions!

Statut actuel: *{{status}}*. Contactez-nous si vous avez des questions !

الحالة الحالية: *{{status}}*. تواصل معنا إذا كان لديك أي أسئلة!`
};

const TEMPLATE_TYPES = [
  { id: 'whatsapp_template', label: 'Order Confirmation' },
  { id: 'wa_delivery_sorti', label: 'Out for Delivery (Sorti en livraison)' },
  { id: 'wa_delivery_attente', label: 'Waiting for Customer (En attente)' },
  { id: 'wa_delivery_alerte', label: 'Action Required (En alerte)' },
  { id: 'wa_delivery_failed', label: 'Failed Delivery (Tentative échouée)' },
  { id: 'wa_delivery_transit', label: 'In Transit (Expédié, Centre...)' },
  { id: 'wa_delivery_retour', label: 'Returned (Retour)' },
  { id: 'wa_delivery_livre', label: 'Delivered (Livré)' },
  { id: 'wa_delivery_default', label: 'Default / Other Status' }
];

export default function ManageWhatsApp() {
  const [activeType, setActiveType] = useState('whatsapp_template');
  const [templates, setTemplates] = useState<Record<string, string>>({
    'whatsapp_template': DEFAULT_WHATSAPP_TEMPLATE,
    ...DELIVERY_DEFAULTS
  });
  
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
        const newTemplates = { ...templates };
        data.forEach(s => {
          if (newTemplates.hasOwnProperty(s.key)) {
            newTemplates[s.key] = s.value;
          }
        });
        setTemplates(newTemplates);
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
      const { error: tError } = await supabase
        .from('site_settings')
        .upsert({ key: activeType, value: templates[activeType] }, { onConflict: 'key' });

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

  const handleTemplateChange = (val: string) => {
    setTemplates(prev => ({ ...prev, [activeType]: val }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isConfirmation = activeType === 'whatsapp_template';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/20 rounded-2xl">
            <MessageCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">WhatsApp Messages</h1>
            <p className="text-white/60 mt-1">Configure automated WhatsApp messages for various scenarios.</p>
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
          <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-8 border border-white/10 shadow-2xl space-y-6">
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider">
                Select Message Scenario
              </label>
              <div className="relative">
                <select
                  value={activeType}
                  onChange={(e) => setActiveType(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-black/30 border border-white/10 rounded-2xl text-white appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {TEMPLATE_TYPES.map(t => (
                    <option key={t.id} value={t.id} className="bg-gray-900">{t.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-5 h-5 text-white/40 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6 pt-4 border-t border-white/10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <span>Message Configuration</span>
              </h2>
              <p className="text-sm text-white/60">
                Customize the message sent to customers. Use the variables on the right to inject order details automatically.
              </p>

              <div className="space-y-2">
                <textarea
                  value={templates[activeType] || ''}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  placeholder="Enter your WhatsApp message template here..."
                  required
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-emerald-500 text-sm font-sans min-h-[400px]"
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
                <div className="text-xs text-white/50">The customer's full name.</div>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <code className="text-emerald-400 font-bold font-mono">{"{{totalPrice}}"}</code>
                <div className="text-xs text-white/50">The total order price formatted with currency.</div>
              </div>
              
              {isConfirmation ? (
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 animate-in fade-in slide-in-from-top-2">
                  <code className="text-emerald-400 font-bold font-mono">{"{{booksList}}"}</code>
                  <div className="text-xs text-white/50">Bullet-point list of ordered books.</div>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 animate-in fade-in slide-in-from-top-2">
                    <code className="text-emerald-400 font-bold font-mono">{"{{orderRef}}"}</code>
                    <div className="text-xs text-white/50">The Tracking Code or Order ID.</div>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 animate-in fade-in slide-in-from-top-2">
                    <code className="text-emerald-400 font-bold font-mono">{"{{status}}"}</code>
                    <div className="text-xs text-white/50">The current delivery status name (e.g. "Livré").</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
