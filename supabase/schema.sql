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
  for insert with check (true);

create policy "Users can update own profile." on profiles
  for update using (true);

-- This trigger automatically creates a profile for new users.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
-- create function public.handle_new_user()
-- returns trigger as $$
-- begin
--   insert into public.profiles (id, name)
--   values (new.id, new.raw_user_meta_data->>'full_name');
--   return new;
-- end;
-- $$ language plpgsql security definer;
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();


-- Set up Storage!
insert into storage.buckets (id, name, public)
  values ('photos', 'photos', true);

-- Set up access policies for storage.
-- See https://supabase.com/docs/guides/storage/security/access-control for more details.
create policy "Photos are publicly accessible." on storage.objects
  for select using (bucket_id = 'photos');

create policy "Anyone can upload a photo." on storage.objects
  for insert with check (bucket_id = 'photos');

create policy "Anyone can update a photo." on storage.objects
  for update with check (bucket_id = 'photos');
