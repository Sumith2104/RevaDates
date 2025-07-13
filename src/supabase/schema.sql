-- Create the profiles table
create table profiles (
  id uuid not null primary key,
  updated_at timestamp with time zone,
  name text,
  email text unique,
  phone text,
  dob date,
  bio text,
  photos text[],
  
  constraint email_validation check (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- Set up Row Level Security (RLS)
alter table profiles
  enable row level security;

create policy "Profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (true);

create policy "Users can update their own profile." on profiles
  for update using (true);

-- Set up Supabase Storage for photos
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Set up RLS for storage
create policy "Photo images are publicly accessible." on storage.objects
  for select using (bucket_id = 'photos');

create policy "Anyone can upload a photo." on storage.objects
  for insert with check (bucket_id = 'photos');

create policy "Anyone can update a photo." on storage.objects
  for update with check (bucket_id = 'photos');
