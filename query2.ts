import { supabase } from './src/lib/supabase';
(async () => {
  const { data, error } = await supabase.from('site_settings').select('*');
  console.log('site_settings:', data?.map(d => d.key));
})();
