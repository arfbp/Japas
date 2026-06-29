'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { sanitizeText } from '@/lib/sanitize';
import { checkRateLimit } from '@/lib/rate-limit';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  phone: z.string()
    .min(1, 'Nomor harus diisi')
    .min(9, 'Minimal 9 angka')
    .max(15, 'Maksimal 15 angka')
    .regex(/^[1-9][0-9]*$/, 'Masukkan nomor langsung tanpa 0 setelah +62')
    .refine((val) => !val.startsWith('0'), {
      message: 'Masukkan nomor langsung tanpa 0 setelah +62',
    })
    .refine((val) => !val.startsWith('62'), {
      message: 'Masukkan nomor langsung tanpa 0 setelah +62',
    }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  profile: any;
  email: string;
}

export default function ProfileForm({ profile, email }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Extract phone without '62' prefix for the form
  const defaultPhone = profile.phone_number?.startsWith('62') 
    ? profile.phone_number.substring(2) 
    : profile.phone_number || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name || '',
      phone: defaultPhone,
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    if (!checkRateLimit(`${profile.id}:profile`, 10, 3600000)) {
      return toast.error('Terlalu banyak perubahan profil, coba lagi nanti');
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      
      const formattedPhone = `62${data.phone}`;

      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: sanitizeText(data.full_name),
          phone_number: sanitizeText(formattedPhone) 
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Profil berhasil diperbarui');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvalid = (errors: any) => {
    if (errors.phone?.message) {
      toast.error(errors.phone.message);
    } else if (errors.full_name?.message) {
      toast.error(errors.full_name.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, handleInvalid)} className="space-y-6">
      <div className="space-y-2">
        <Label>Alamat Email</Label>
        <Input
          type="email"
          value={email}
          disabled
          className="bg-gray-100 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500">Email tidak dapat diubah (tertakut ke akun Google).</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Nama Lengkap</Label>
        <Input
          id="full_name"
          placeholder="Budi Santoso"
          {...register('full_name')}
          disabled={isLoading}
        />
        {errors.full_name && (
          <p className="text-sm border-l-2 border-red-500 pl-2 text-red-500">{errors.full_name.message as string}</p>
        )}
      </div>

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

      <div className="pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </form>
  );
}
