# Supabase Database Setup

## Initial Setup

### 1. Create the `user_roles` table

Run the migration file to create the `user_roles` table:

```sql
-- Run this in your Supabase SQL Editor
-- File: supabase/migrations/001_create_user_roles.sql
```

Or use the Supabase CLI:
```bash
supabase db push
```

### 2. Create your first admin user

After creating a user account in Supabase Auth:

1. **Find your user ID:**
   - Go to Supabase Dashboard → Authentication → Users
   - Find your user and copy their UUID

2. **Add admin role:**
   - Go to Supabase Dashboard → SQL Editor
   - Run the following, replacing `YOUR_USER_ID` with your actual user ID:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = NOW();
```

Or use the helper script in `supabase/scripts/create_admin_user.sql` and replace `USER_ID_HERE` with your user ID.

### 3. Verify the setup

Check that your admin user was created:

```sql
SELECT ur.*, au.email 
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE ur.role = 'admin';
```

## Table Structure

The `user_roles` table has the following structure:

- `id` (UUID): Primary key
- `user_id` (UUID): References `auth.users(id)`
- `role` (TEXT): User role (e.g., 'admin', 'user')
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

## Row Level Security (RLS)

- Users can read their own role
- Service role (admin client) has full access for server-side operations

