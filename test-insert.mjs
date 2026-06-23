import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { error } = await supabase.from('profiles').insert({ id: '00000000-0000-0000-0000-000000000000', full_name: 'Test', role: 'customer' });
  console.log('With Role:', error);

  const { error: error2 } = await supabase.from('profiles').insert({ id: '00000000-0000-0000-0000-000000000002', full_name: 'Test' });
  console.log('Without Role:', error2);
}

test();
