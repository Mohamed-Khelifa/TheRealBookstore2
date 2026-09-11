import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
async function test() {
  const { data: books } = await supabase.from('books').select('id, price').limit(1);
  if (!books || books.length === 0) { console.log('No books'); return; }
  const book = books[0];
  const { error } = await supabase.from('books').update({ price: book.price }).eq('id', book.id);
  console.log('Update Error:', error);
}
test();
