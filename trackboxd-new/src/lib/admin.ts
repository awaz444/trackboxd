import { supabaseAdmin } from './supabase/admin';

const ADMIN_USERNAME = 'aawaiz';

export async function isAdminUser(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('users')
    .select('username')
    .eq('id', userId)
    .single();
  return data?.username?.toLowerCase() === ADMIN_USERNAME;
}
