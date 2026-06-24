import { createClient } from '@/lib/supabase/server';
import { AnnouncementBanner } from './announcement-banner';

export async function GlobalAnnouncements() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  let announcements = [];

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`);
      
    if (data) announcements = data;
  } catch (error) {
    // Ignore error
  }

  if (announcements.length === 0) return null;

  return <AnnouncementBanner announcements={announcements} />;
}
