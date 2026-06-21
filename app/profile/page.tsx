import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileForm from './profile-form';

export default async function ProfilePage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <AuthenticatedLayout><div/></AuthenticatedLayout>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/');
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola informasi data diri dan kontak Anda.</p>
        </div>

        <div className="bg-white rounded-[12px] shadow-sm border border-orange-100 p-6">
          <ProfileForm profile={profile} email={user.email!} />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
