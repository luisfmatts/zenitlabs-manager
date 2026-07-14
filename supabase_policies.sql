-- ==========================================
-- SQL Script: Configure Supabase RLS Policies
-- Description: Enables RLS on the "orders" table and creates policies 
--              permitting full access (read, write, update, delete) 
--              for anonymous users (using the anon key).
-- ==========================================

-- 1. Enable Row Level Security (RLS) on the orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 2. Clean up any existing policies on the orders table to prevent conflicts
DROP POLICY IF EXISTS "Allow anon select" ON public.orders;
DROP POLICY IF EXISTS "Allow anon insert" ON public.orders;
DROP POLICY IF EXISTS "Allow anon update" ON public.orders;
DROP POLICY IF EXISTS "Allow anon delete" ON public.orders;

-- 3. Create SELECT policy: Allow any public/anon user to read orders
CREATE POLICY "Allow anon select" ON public.orders
FOR SELECT
TO anon
USING (true);

-- 4. Create INSERT policy: Allow any public/anon user to create new orders
CREATE POLICY "Allow anon insert" ON public.orders
FOR INSERT
TO anon
WITH CHECK (true);

-- 5. Create UPDATE policy: Allow any public/anon user to update existing orders
CREATE POLICY "Allow anon update" ON public.orders
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- 6. Create DELETE policy: Allow any public/anon user to delete orders (if needed)
CREATE POLICY "Allow anon delete" ON public.orders
FOR DELETE
TO anon
USING (true);

-- 7. (Optional but recommended) Ensure realtime replication is enabled for the orders table
-- This is required for the real-time order update flow to work properly with Supabase.
-- (Note: skipped since the 'orders' table is already a member of 'supabase_realtime')
-- alter publication supabase_realtime add table public.orders;
