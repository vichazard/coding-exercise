
create or replace function public.owns_record_as_user(user_id uuid)
returns boolean
language sql
as $$
  select exists (
    select 1
    from public.users 
    where auth_user_id = auth.uid() 
    and id = user_id
  );
$$;

alter table "public"."courses_likes" enable row level security;

create policy "select_courses_likes_policy"
on "public"."courses_likes"
for select
using (public.owns_record_as_user(user_id));

create policy "update_courses_likes_policy"
on "public"."courses_likes"
for update
using (public.owns_record_as_user(user_id));

create policy "delete_courses_likes_policy"
on "public"."courses_likes"
for delete
using (public.owns_record_as_user(user_id));