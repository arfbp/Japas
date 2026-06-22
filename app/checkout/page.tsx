import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { createClient } from '@/lib/supabase/server';
import { CheckoutView } from './checkout-view';
import { redirect } from 'next/navigation';

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone_number')
    .eq('id', user.id)
    .single();

  // Get store settings
  const { data: storeSettings } = await supabase
    .from('store_settings')
    .select('pickup_address, cutoff_time, minimum_lead_days')
    .single();

  return (
    <AuthenticatedLayout>
      <CheckoutView 
        userId={user.id} 
        profile={profile} 
        storeSettings={storeSettings} 
      />
    </AuthenticatedLayout>
  );
}
