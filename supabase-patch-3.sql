-- Fix: Allow users to insert their own profile in case the trigger fails or they were partially deleted
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
