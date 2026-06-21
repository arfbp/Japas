'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface UserMenuProps {
  profile: any;
  email: string;
}

export function UserMenu({ profile, email }: UserMenuProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="flex items-center gap-4">
      <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-full bg-[#C96A3D] text-white flex items-center justify-center text-xs font-medium">
          {getInitials(profile?.full_name)}
        </div>
      </Link>
      <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-500 hover:text-red-600">
        Keluar
      </Button>
    </div>
  );
}
