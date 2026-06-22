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
import { resizeImage } from '@/lib/image-utils';
import Image from 'next/image';

const productSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  price: z.coerce.number().min(1, 'Harga wajib diisi'),
  status: z.enum(['available', 'sold_out_today', 'inactive']),
  sort_order: z.coerce.number().default(0),
  featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductForm({ product }: { product?: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null);

  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: product?.name || '',
      price: product?.price || 0,
      status: product?.status || 'available',
      sort_order: product?.sort_order || 0,
      featured: product?.featured ?? false,
      is_active: product?.is_active ?? true,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      let imageUrl = product?.image_url;

      if (imageFile) {
        const optimizedImage = await resizeImage(imageFile);
        const fileExt = 'webp';
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, optimizedImage, {
             contentType: optimizedImage.type,
             upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      } else if (!imageUrl) {
        throw new Error('Foto produk wajib diisi');
      }

      const productData = {
        name: data.name,
        price: data.price,
        status: data.status,
        sort_order: data.sort_order,
        featured: data.featured,
        is_active: data.is_active,
        image_url: imageUrl,
      };

      if (product?.id) {
        const { error } = await supabase.from('products').update(productData).eq('id', product.id);
        if (error) throw error;
        toast.success('Produk berhasil diperbarui');
      } else {
        const { error } = await supabase.from('products').insert([productData]);
        if (error) throw error;
        toast.success('Produk berhasil ditambahkan');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan');
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      if (error) throw error;
      toast.success('Produk berhasil dihapus');
      router.push('/admin/products');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label>Gambar Produk</Label>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-[12px] border border-gray-200 overflow-hidden relative bg-gray-50 flex items-center justify-center shrink-0">
            {imagePreview ? (
              <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized />
            ) : (
              <span className="text-gray-400 text-xs text-center px-2">Belum ada foto</span>
            )}
          </div>
          <div className="space-y-2 h-full">
            <Input type="file" accept="image/*" onChange={handleImageChange} className="w-full max-w-xs" />
            <p className="text-[11px] text-gray-500">Maks. ukuran direkomendasikan. Mendukung JPG, PNG, WEBP.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Kue</Label>
          <Input id="name" {...register('name')} disabled={isLoading} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Harga (Rp)</Label>
          <Input id="price" type="number" {...register('price')} disabled={isLoading} />
          {errors.price && <p className="text-xs text-red-500">{errors.price.message as string}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="featured"
            className="rounded border-gray-300 text-[#C96A3D] focus:ring-[#C96A3D] w-4 h-4"
            {...register('featured')}
            disabled={isLoading}
          />
          <Label htmlFor="featured" className="font-medium cursor-pointer">Produk Unggulan (Featured)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            className="rounded border-gray-300 text-[#C96A3D] focus:ring-[#C96A3D] w-4 h-4"
            {...register('is_active')}
            disabled={isLoading}
          />
          <Label htmlFor="is_active" className="font-medium cursor-pointer">Produk Aktif</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status Ketersediaan</Label>
          <select
            id="status"
            {...register('status')}
            disabled={isLoading}
            className="flex h-9 w-full rounded-[10px] border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C96A3D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="available">Tersedia</option>
            <option value="sold_out_today">Habis Hari Ini</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sort_order">Urutan Tampil</Label>
          <Input id="sort_order" type="number" {...register('sort_order')} disabled={isLoading} />
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <div>
          {product?.id && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
              Hapus Produk
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/products')} disabled={isLoading}>
            Batal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Menyimpan...' : 'Simpan Produk'}
          </Button>
        </div>
      </div>
    </form>
  );
}
