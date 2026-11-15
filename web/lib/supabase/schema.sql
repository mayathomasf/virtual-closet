-- ============================================================================
-- Virtual Closet: database schema for Supabase
-- Matches the "Data" section of the project proposal: two tables, items and plans,
-- plus a private photo bucket.
--
-- Run it: Supabase Dashboard -> SQL Editor -> New query -> paste all -> Run.
-- Safe to run again later; it never deletes your clothes or plans.
-- If you ran the FIRST version of this file, this upgrades it in place.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0. UPGRADE FROM THE FIRST VERSION
--    The first version had "outfits" and "outfit_items" tables. The proposal
--    uses a single "plans" table instead, so those go away.
-- ----------------------------------------------------------------------------
drop table if exists public.outfit_items;
drop table if exists public.outfits;


-- ----------------------------------------------------------------------------
-- 1. ITEMS: one row per clothing item photo
-- ----------------------------------------------------------------------------
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  -- auth.uid() is the logged-in user's id, so it fills itself in on insert
  user_id     uuid not null default auth.uid()
              references auth.users (id) on delete cascade,
  category    text not null check (category in
                ('tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'other')),
  name        text check (char_length(name) between 1 and 100),  -- optional
  image_path  text not null,   -- where the photo lives: closet/<user_id>/<file>
  created_at  timestamptz not null default now()
);

-- Upgrade from the first version: remove the columns the proposal doesn't use,
-- and make name optional (the Add Item screen has no name field).
alter table public.items
  drop column if exists color,
  drop column if exists brand,
  drop column if exists season,
  drop column if exists tags;
alter table public.items alter column name drop not null;
delete from public.items where image_path is null;   -- photo-less test rows only
alter table public.items alter column image_path set not null;

-- Speeds up "show me my tops"
create index if not exists items_user_category_idx on public.items (user_id, category);


-- ----------------------------------------------------------------------------
-- 2. PLANS: one row per outfit plan. Several per day are allowed.
--
--    item_ids  the clothing items in the outfit
--    layout    where each item sits in the collage, keyed by item id.
--              Positions are fractions of the canvas (0 to 1), so a collage
--              looks the same on a phone and a laptop. Example:
--              { "<item id>": { "x": 0.10, "y": 0.05, "w": 0.45, "z": 2 } }
-- ----------------------------------------------------------------------------
create table if not exists public.plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
              references auth.users (id) on delete cascade,
  date        date not null,
  label       text check (char_length(label) between 1 and 50),  -- e.g. 'class'
  item_ids    uuid[] not null default '{}' check (cardinality(item_ids) <= 30),
  layout      jsonb not null default '{}' check (jsonb_typeof(layout) = 'object'),
  created_at  timestamptz not null default now()
);

-- Speeds up "get this user's plans for this week"
create index if not exists plans_user_date_idx on public.plans (user_id, date);


-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS)
--    The database itself enforces "you only see your own closet", so even a
--    bug in an API route can't leak someone else's clothes.
-- ----------------------------------------------------------------------------
alter table public.items enable row level security;
alter table public.plans enable row level security;

-- Logged-in users may use these tables (RLS then narrows it to their own rows).
-- Logged-out visitors ("anon") get nothing.
grant  select, insert, update, delete on public.items, public.plans to authenticated;
revoke all                            on public.items, public.plans from anon;

drop policy if exists "Users manage their own items" on public.items;
create policy "Users manage their own items"
  on public.items
  for all to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- An array of ids isn't linked to the items table the way a normal foreign key
-- is, so this policy adds the check by hand: every id in item_ids must be one
-- of YOUR items.
drop policy if exists "Users manage their own plans" on public.plans;
create policy "Users manage their own plans"
  on public.plans
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and not exists (
      select 1
      from unnest(item_ids) as t(item_id)
      where not exists (
        select 1 from public.items i
        where i.id = t.item_id and i.user_id = (select auth.uid())
      )
    )
  );


-- ----------------------------------------------------------------------------
-- 4. CLEANUP WHEN AN ITEM IS DELETED
--    Removes the deleted item from every plan it was in (both item_ids and
--    layout), so plans never point at clothes that no longer exist.
-- ----------------------------------------------------------------------------
create or replace function public.remove_deleted_item_from_plans()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.plans
     set item_ids = array_remove(item_ids, old.id),
         layout   = layout - old.id::text
   where user_id = old.user_id
     and old.id = any (item_ids);
  return old;
end;
$$;

drop trigger if exists items_remove_from_plans on public.items;
create trigger items_remove_from_plans
  after delete on public.items
  for each row execute function public.remove_deleted_item_from_plans();


-- ----------------------------------------------------------------------------
-- 5. PHOTO STORAGE
--    A private bucket named "closet". Each user's photos go in a folder named
--    after their user id:  closet/<user-id>/<photo>.png
--    Private means photos are only viewable through short-lived signed links.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('closet', 'closet', false, 5242880,                 -- 5 MB per photo
        array['image/png', 'image/webp', 'image/jpeg'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- (storage.foldername(name))[1] is the first folder in the file path,
-- which must match the logged-in user's id.
drop policy if exists "Users view their own closet photos" on storage.objects;
create policy "Users view their own closet photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'closet'
         and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users upload to their own closet folder" on storage.objects;
create policy "Users upload to their own closet folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'closet'
              and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users update their own closet photos" on storage.objects;
create policy "Users update their own closet photos"
  on storage.objects for update to authenticated
  using      (bucket_id = 'closet'
              and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'closet'
              and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users delete their own closet photos" on storage.objects;
create policy "Users delete their own closet photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'closet'
         and (storage.foldername(name))[1] = (select auth.uid())::text);
