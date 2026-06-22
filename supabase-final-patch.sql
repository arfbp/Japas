DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_proofs_order_id_key'
  ) THEN
    ALTER TABLE public.payment_proofs ADD CONSTRAINT payment_proofs_order_id_key UNIQUE (order_id);
  END IF;
END $$;

ALTER TABLE public.payment_proofs ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_proofs_verification_status_check'
  ) THEN
    ALTER TABLE public.payment_proofs ADD CONSTRAINT payment_proofs_verification_status_check CHECK (verification_status IN ('pending', 'accepted', 'rejected'));
  END IF;
END $$;

ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS singleton_key BOOLEAN DEFAULT true;
UPDATE public.store_settings SET singleton_key = true WHERE singleton_key IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'store_settings_singleton_key_check'
  ) THEN
    ALTER TABLE public.store_settings ADD CONSTRAINT store_settings_singleton_key_check CHECK (singleton_key = true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'store_settings_singleton_key_unique'
  ) THEN
    ALTER TABLE public.store_settings ADD CONSTRAINT store_settings_singleton_key_unique UNIQUE (singleton_key);
  END IF;
END $$;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;

UPDATE public.orders SET customer_name = 'Unknown' WHERE customer_name IS NULL;
UPDATE public.orders SET customer_phone = 'Unknown' WHERE customer_phone IS NULL;

ALTER TABLE public.orders ALTER COLUMN customer_name SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN customer_phone SET NOT NULL;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_address TEXT;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_time TIME;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS orders_customer_phone_idx ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS products_featured_idx ON public.products(featured);
CREATE INDEX IF NOT EXISTS products_active_idx ON public.products(is_active);

DROP POLICY IF EXISTS "Customers can upload own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Customers can view own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete payment proofs" ON storage.objects;

CREATE POLICY "Customers can upload own payment proofs" ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'payment-proofs' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Customers can view own payment proofs" ON storage.objects FOR SELECT 
USING (
  bucket_id = 'payment-proofs' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view all payment proofs" ON storage.objects FOR SELECT 
USING (bucket_id = 'payment-proofs' AND public.is_admin());

CREATE POLICY "Admins can update payment proofs" ON storage.objects FOR UPDATE 
USING (bucket_id = 'payment-proofs' AND public.is_admin());

CREATE POLICY "Admins can delete payment proofs" ON storage.objects FOR DELETE 
USING (bucket_id = 'payment-proofs' AND public.is_admin());
