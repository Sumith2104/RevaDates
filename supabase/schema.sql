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

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (true); -- Simplified for no auth

create policy "Users can update own profile." on profiles
  for update using (true); -- Simplified for no auth

-- This trigger automatically updates the updated_at column when a profile is changed.
create trigger handle_updated_at before update on profiles
  for each row execute procedure moddatetime (updated_at);


-- Set up Storage!
-- Create a public bucket for photos.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Set up access policies for storage.
-- See https://supabase.com/docs/guides/storage/security/access-control for more details.
create policy "Anyone can upload to photos."
  on storage.objects for insert to authenticated, anon
  with check ( bucket_id = 'photos' );

create policy "Anyone can update their own photos."
  on storage.objects for update to authenticated, anon
  using ( bucket_id = 'photos' );

create policy "Anyone can see the photos."
  on storage.objects for select to authenticated, anon
  using ( bucket_id = 'photos' );

create policy "Anyone can delete their own photos."
  on storage.objects for delete to authenticated, anon
  using ( bucket_id = 'photos' );
