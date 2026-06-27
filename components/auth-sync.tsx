'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cart';

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
        // Automatically load persistent cart from Supabase
        useCartStore.getState().fetchCart(session.user.id);

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        syncProfile();
        if (session?.user) {
          useCartStore.getState().fetchCart(session.user.id);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

