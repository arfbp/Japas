'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateStoreSettings(data: any) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') throw new Error('Not authorized');

  // Validate formatting before upserting
  const settingsData = {
    ...data,
    singleton_key: 'singleton'
  };

  const { error } = await supabase
    .from('store_settings')
    .upsert(settingsData, { onConflict: 'singleton_key' });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/settings');
  revalidatePath('/');
  revalidatePath('/katalog');
  
  return { success: true };
}

export async function saveAnnouncement(data: any) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') throw new Error('Not authorized');

  if (data.id) {
    const { error } = await supabase
      .from('announcements')
      .update(data)
      .eq('id', data.id);
      
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('announcements')
      .insert([data]);
      
    if (error) throw new Error(error.message);
  }

  revalidatePath('/admin/settings');
  revalidatePath('/');
  revalidatePath('/katalog');
  
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') throw new Error('Not authorized');

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/settings');
  revalidatePath('/');
  revalidatePath('/katalog');
  
  return { success: true };
}
