import { AdminLayout } from '@/components/layout/admin-layout';
import { createClient } from '@/lib/supabase/server';
import { SettingsView } from './settings-view';
import { redirect } from 'next/navigation';

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  // Get store settings
  const { data: storeSettings } = await supabase
    .from('store_settings')
    .select('*')
    .eq('singleton_key', true)
    .single();

  // Get announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <AdminLayout>
      <SettingsView 
        initialSettings={storeSettings} 
        initialAnnouncements={announcements || []} 
      />
    </AdminLayout>
  );
}
