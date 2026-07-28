import { supabaseAdmin } from './supabase/admin';

const ADMIN_USERNAME = 'aawaiz';

export async function isAdminUser(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('users')
    .select('name, username')
    .eq('id', userId)
    .single();
  return (
    data?.username?.toLowerCase() === ADMIN_USERNAME ||
    data?.name?.toLowerCase() === ADMIN_USERNAME
  );
}
