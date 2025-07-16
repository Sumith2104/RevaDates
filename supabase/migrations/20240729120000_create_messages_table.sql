
create table public.messages (
    id uuid not null default gen_random_uuid() primary key,
    match_id bigint not null,
    sender_id uuid not null,
    recipient_id uuid not null,
    content text not null,
    created_at timestamp with time zone not null default now(),

    constraint messages_match_id_fkey foreign key (match_id) references public.matches (id) on delete cascade,
    constraint messages_sender_id_fkey foreign key (sender_id) references public.profiles (id) on delete cascade,
    constraint messages_recipient_id_fkey foreign key (recipient_id) references public.profiles (id) on delete cascade
);

-- Enable Row Level Security
alter table public.messages enable row level security;

-- Policies for messages
create policy "Allow read access to own messages"
on public.messages for select
using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Allow insert access to own messages"
on public.messages for insert
with check (
    auth.uid() = sender_id and
    exists (
        select 1 from public.matches
        where id = match_id and (user1_id = auth.uid() or user2_id = auth.uid())
    )
);
