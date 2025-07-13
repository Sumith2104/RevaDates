-- Create a table for public profiles
create table profiles (
  id uuid not null primary key,
  updated_at timestamp with time zone,
  name text,
  email text,
  phone text,
  dob date,
  bio text,
  photos text[]
);

-- Create a public bucket for photos with public read access
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/storage/security/access-control#policies
-- for best practices on securing your storage.
alter table profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

-- For this example, we're not using Supabase Auth, so we can't tie policies to user IDs.
-- In a real app, you would have policies like this:
-- create policy "Users can insert their own profile." on profiles
--   for insert with check (auth.uid() = id);
-- create policy "Users can update their own profile." on profiles
--   for update using (auth.uid() = id);

-- Give all users access to upload to the photos bucket.
-- In a real app, you would want to restrict this more.
create policy "Anyone can upload a photo." on storage.objects
  for insert to authenticated, anon with check (bucket_id = 'photos');
  
create policy "Anyone can see any photo." on storage.objects
  for select to authenticated, anon using (bucket_id = 'photos');
