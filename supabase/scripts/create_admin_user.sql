-- Script to create an admin user in user_roles table
-- 
-- Usage:
-- 1. First, create a user in Supabase Auth (via Supabase Dashboard or Auth API)
-- 2. Get the user's ID from auth.users table
-- 3. Run this script, replacing 'USER_ID_HERE' with the actual user ID
--
-- To find a user's ID:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Example: Create admin role for a user
-- Replace 'USER_ID_HERE' with the actual UUID from auth.users
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = NOW();

-- To create admin for a user by email (if you have access to auth.users):
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'
-- FROM auth.users
-- WHERE email = 'admin@example.com'
-- ON CONFLICT (user_id) 
-- DO UPDATE SET role = 'admin', updated_at = NOW();

