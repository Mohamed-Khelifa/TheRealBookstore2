import { supabase } from './src/lib/supabase';
(async () => {
  const { data, error } = await supabase.from('wilayas').select('*').limit(1);
  console.log('wilayas:', data, error);
  const { data: d2, error: e2 } = await supabase.from('guepex_agencies').select('*').limit(1);
  console.log('guepex_agencies:', d2, e2);
  const { data: d3, error: e3 } = await supabase.from('agencies').select('*').limit(1);
  console.log('agencies:', d3, e3);
})();
