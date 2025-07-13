--
-- Create a table for public user profiles
--
CREATE TABLE profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  first_name text,
  last_name text,
  email text,
  phone text,
  dob date,
  bio text,
  photos text[]
);

--
-- Set up Row Level Security (RLS)
--
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Profiles are viewable by everyone
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

--
-- Create a function to automatically create a profile for a new user
--
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--
-- Create a trigger to call the function when a new user is created
--
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

--
-- Set up storage for user photos
--
INSERT INTO storage.buckets (id, name, public)
VALUES ('user_photos', 'user_photos', true);

-- Policy: Allow anyone to view photos
CREATE POLICY "Anyone can view user photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'user_photos');

-- Policy: Users can upload photos to their own folder
CREATE POLICY "Users can upload photos to their folder" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can update their own photos
CREATE POLICY "Users can update their own photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'user_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete their own photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'user_photos' AND auth.uid()::text = (storage.foldername(name))[1]);
