-- 1. Payment Proofs revisions
ALTER TABLE public.payment_proofs
  ADD CONSTRAINT payment_proofs_order_id_key UNIQUE (order_id),
  ADD COLUMN verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'accepted', 'rejected'));

-- 2. Store Settings constraints (limit to 1 row)
ALTER TABLE public.store_settings 
  ADD COLUMN singleton_key BOOLEAN DEFAULT true;

ALTER TABLE public.store_settings
  ADD CONSTRAINT store_settings_singleton_key_check CHECK (singleton_key = true),
  ADD CONSTRAINT store_settings_singleton_key_unique UNIQUE (singleton_key);

-- 3. Orders table snapshots & future fields
ALTER TABLE public.orders
  ADD COLUMN customer_name TEXT,
  ADD COLUMN customer_phone TEXT,
  ADD COLUMN pickup_address TEXT,
  ADD COLUMN pickup_time TIME;

-- 4. Products table active flag
ALTER TABLE public.products
  ADD COLUMN is_active BOOLEAN DEFAULT true;

-- 5. Revise Storage Security for Payment Proofs
DROP POLICY IF EXISTS "Users can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own payment proofs" ON storage.objects;

-- Customer can only upload and view their own files (via owner column)
CREATE POLICY "Customers can upload own payment proofs" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'payment-proofs' AND owner = auth.uid());

CREATE POLICY "Customers can view own payment proofs" ON storage.objects FOR SELECT 
USING (bucket_id = 'payment-proofs' AND owner = auth.uid());

-- Admin can access and update all payment proofs
CREATE POLICY "Admins can view all payment proofs" ON storage.objects FOR SELECT 
USING (bucket_id = 'payment-proofs' AND public.is_admin());

CREATE POLICY "Admins can update payment proofs" ON storage.objects FOR UPDATE 
USING (bucket_id = 'payment-proofs' AND public.is_admin());
