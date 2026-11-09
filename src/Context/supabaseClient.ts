import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ioxsprfchcytqbyriwby.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_59EOl26obYAzn_Z9pZQ9Bw_T0iKDKZJ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

/**
 * Auto-paginating helper to fetch ALL rows matching a Supabase query builder
 * without getting capped at the PostgREST 1,000-row limit.
 */
export async function fetchAllPages<T = any>(
  queryBuilder: any,
  pageSize = 1000
): Promise<{ data: T[]; error: any }> {
  let all: T[] = [];
  let page = 0;
  while (true) {
    const from = page * pageSize;
    const to = (page + 1) * pageSize - 1;
    const { data, error } = await queryBuilder.range(from, to);
    if (error) return { data: all, error };
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  return { data: all, error: null };
}
