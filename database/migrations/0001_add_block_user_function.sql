
create or replace function append_to_blocked_users(user_id uuid, blocked_id uuid)
returns void
language plpgsql
as $$
begin
  update profiles
  set blocked_users = array_append(coalesce(blocked_users, '{}'::uuid[]), blocked_id)
  where id = user_id;
end;
$$;
