-- Create the profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  dob DATE,
  bio TEXT,
  photos TEXT[]
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
-- 1. Allow users to read their own profile
CREATE POLICY "Users can view their own profile."
ON profiles FOR SELECT
USING (auth.jwt()->>'email' = email);

-- 2. Allow users to update their own profile
CREATE POLICY "Users can update their own profile."
ON profiles FOR UPDATE
USING (auth.jwt()->>'email' = email);

-- Note: We are not allowing deletion of profiles via API for safety. 
-- Deletions should be handled via a specific function or manually.

-- Note: We are not allowing anonymous insertion. 
-- A server-side function should handle new user profile creation.
