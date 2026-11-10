import { createClient } from '@supabase/supabase-js';

const s = createClient(
  'https://ioxsprfchcytqbyriwby.supabase.co',
  'sb_publishable_59EOl26obYAzn_Z9pZQ9Bw_T0iKDKZJ'
);

async function check() {
  const { data: dcs, error } = await s.from('delivery_challans').select('*');
  console.log('DC COUNT:', dcs?.length);
  console.log('DCS:', dcs);
}
check();
