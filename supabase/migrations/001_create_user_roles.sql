-- Create user_roles table for admin authentication
-- This table stores role assignments for users

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own role
CREATE POLICY "Users can read their own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can do everything (for admin operations)
-- Note: Service role bypasses RLS by default, but this is explicit
CREATE POLICY "Service role full access"
  ON public.user_roles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.user_roles IS 'Stores user role assignments for authorization';
COMMENT ON COLUMN public.user_roles.user_id IS 'References auth.users(id)';
COMMENT ON COLUMN public.user_roles.role IS 'User role (e.g., "admin", "user")';

