'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

const phoneSchema = z.object({
  phone: z.string()
    .min(1, 'Nomor harus diisi')
    .min(9, 'Minimal 9 angka')
    .max(15, 'Maksimal 15 angka')
    .regex(/^[1-9][0-9]*$/, 'Gunakan format +62 tanpa angka 0 di depan')
    .refine((val) => !val.startsWith('0'), {
      message: 'Gunakan format +62 tanpa angka 0 di depan',
    })
    .refine((val) => !val.startsWith('62'), {
      message: 'Masukkan nomor langsung tanpa 0 setelah +62',
    }),
});

type SettingsFormValues = z.infer<typeof phoneSchema>;

export default function CompleteProfileForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: '',
    },
  });

  const onSubmit = async (data: SettingsFormValues) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user) {
        throw new Error('User not authenticated');
      }

      const formattedPhone = `62${data.phone}`;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userData.user.id,
          email: userData.user.email || '',
          full_name: userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || '',
          phone_number: formattedPhone,
          role: 'customer'
        }, { onConflict: 'id' });

      if (error) throw error;

      toast.success('Profil berhasil disimpan');
      router.push('/catalog');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan');
      setIsLoading(false);
    }
  };

  const handleInvalid = (errors: any) => {
    if (errors.phone?.message) {
      toast.error(errors.phone.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, handleInvalid)} className="space-y-6 flex flex-col">
      <div className="space-y-2">
        <Label htmlFor="phone">Nomor WhatsApp</Label>
        <div className="flex">
          <div className="flex items-center justify-center rounded-l-[10px] border border-r-0 border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
            +62
          </div>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            placeholder="81234567890"
            className="rounded-l-none"
            {...register('phone')}
            disabled={isLoading}
          />
        </div>
        {errors.phone && (
          <p className="text-sm border-l-2 border-red-500 pl-2 text-red-500">{errors.phone.message as string}</p>
        )}
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Menyimpan...' : 'Simpan Profil'}
      </Button>
    </form>
  );
}
