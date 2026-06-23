'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function AuthSync() {
  const router = useRouter();
  const checking = useRef(false);

  useEffect(() => {
    const syncProfile = async () => {
      if (checking.current) return;
      checking.current = true;
      
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data, error } = await supabase.from('profiles').select('id').eq('id', session.user.id).single();
        
        if (!data || error) {
          // If no profile or error fetching profile, attempt to create it.
          const { error: insertError } = await supabase.from('profiles').upsert({
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
            role: 'customer'
          }, { onConflict: 'id', ignoreDuplicates: true });
          
          if (!insertError) {
             router.refresh();
          }
        }
      }
      checking.current = false;
    };

    syncProfile();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        syncProfile();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
