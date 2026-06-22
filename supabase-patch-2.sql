-- 1. Orders table snapshot fields (Mandatory)
-- Backfill existing rows if any to ensure NOT NULL constraint succeeds
UPDATE public.orders SET customer_name = 'Unknown' WHERE customer_name IS NULL;
UPDATE public.orders SET customer_phone = 'Unknown' WHERE customer_phone IS NULL;

ALTER TABLE public.orders 
  ALTER COLUMN customer_name SET NOT NULL,
  ALTER COLUMN customer_phone SET NOT NULL;

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS profiles_phone_number_idx ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS products_featured_idx ON public.products(featured);
CREATE INDEX IF NOT EXISTS products_is_active_idx ON public.products(is_active);

-- 3. Strengthen Payment Proof Storage Security and Organization
-- Remove previous policies if they exist to replace with folder-scoped policies
DROP POLICY IF EXISTS "Customers can upload own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Customers can view own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update payment proofs" ON storage.objects;

-- Customers can upload ONLY to their own folder: bucket/user_id/...
CREATE POLICY "Customers can upload own payment proofs" ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'payment-proofs' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Customers can view ONLY their own folder
CREATE POLICY "Customers can view own payment proofs" ON storage.objects FOR SELECT 
USING (
  bucket_id = 'payment-proofs' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can manage all payment proofs
CREATE POLICY "Admins can view all payment proofs" ON storage.objects FOR SELECT 
USING (bucket_id = 'payment-proofs' AND public.is_admin());

CREATE POLICY "Admins can update payment proofs" ON storage.objects FOR UPDATE 
USING (bucket_id = 'payment-proofs' AND public.is_admin());

CREATE POLICY "Admins can delete payment proofs" ON storage.objects FOR DELETE 
USING (bucket_id = 'payment-proofs' AND public.is_admin());
