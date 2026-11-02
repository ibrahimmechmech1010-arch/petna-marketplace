create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'customer' check (role in ('customer', 'partner', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.animals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  species text not null check (species in ('Chien', 'Chat', 'Lapin', 'Autre')),
  age text not null default '',
  city text not null,
  shelter text not null,
  image_url text not null default '',
  summary text not null default '',
  temperament text not null default '',
  care text not null default '',
  adoption_conditions text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price numeric(10, 2) not null check (price >= 0),
  seller text not null,
  image_url text not null default '',
  description text not null default '',
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('Vétérinaire', 'Animalerie', 'Toilettage', 'Autre')),
  city text not null,
  image_url text not null default '',
  description text not null default '',
  services text[] not null default '{}',
  hours text not null default '',
  contact text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  tag text not null default '',
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.adoption_inquiries (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals(id) on delete cascade,
  name text not null,
  email text not null,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'closed')),
  created_at timestamptz not null default now()
);

create table public.partner_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization text not null,
  activity text not null default '',
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'closed')),
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references public.profiles(id) on delete restrict,
  customer_name text not null,
  phone text not null,
  city text not null,
  delivery_address text not null,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  discount numeric(10, 2) not null default 0 check (discount >= 0),
  total numeric(10, 2) not null check (total >= 0),
  payment_method text not null default 'cash_on_delivery',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index animals_public_idx on public.animals(status, city, species);
create index products_public_idx on public.products(status, category);
create index providers_public_idx on public.providers(status, city, type);
create index articles_public_idx on public.articles(status, created_at desc);
create index adoption_inquiries_animal_idx on public.adoption_inquiries(animal_id, created_at desc);
create index orders_user_idx on public.orders(user_id, created_at desc);
create index order_items_order_idx on public.order_items(order_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only an administrator may change a profile role';
  end if;
  return new;
end;
$$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger profiles_protect_role before update on public.profiles
for each row execute function public.protect_profile_role();
create trigger animals_set_updated_at before update on public.animals
for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();
create trigger providers_set_updated_at before update on public.providers
for each row execute function public.set_updated_at();
create trigger articles_set_updated_at before update on public.articles
for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();
create trigger auth_user_profile after insert on auth.users
for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.animals enable row level security;
alter table public.products enable row level security;
alter table public.providers enable row level security;
alter table public.articles enable row level security;
alter table public.adoption_inquiries enable row level security;
alter table public.partner_inquiries enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

grant select on public.animals, public.products, public.providers, public.articles to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.animals, public.products, public.providers, public.articles to authenticated;
grant insert on public.adoption_inquiries, public.partner_inquiries to anon, authenticated;
grant select, update, delete on public.adoption_inquiries, public.partner_inquiries to authenticated;
grant select on public.orders, public.order_items to authenticated;
grant insert, update, delete on public.orders, public.order_items to authenticated;

create policy "Users read their own profile" on public.profiles
for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
create policy "Users update their own profile" on public.profiles
for update to authenticated using (id = (select auth.uid()) or (select public.is_admin()))
with check (id = (select auth.uid()) or (select public.is_admin()));

create policy "Anyone can read published animals" on public.animals
for select to anon, authenticated using (status = 'published');
create policy "Admins manage animals" on public.animals
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Anyone can read published products" on public.products
for select to anon, authenticated using (status = 'published');
create policy "Admins manage products" on public.products
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Anyone can read published providers" on public.providers
for select to anon, authenticated using (status = 'published');
create policy "Admins manage providers" on public.providers
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Anyone can read published articles" on public.articles
for select to anon, authenticated using (status = 'published');
create policy "Admins manage articles" on public.articles
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Visitors can submit adoption inquiries" on public.adoption_inquiries
for insert to anon, authenticated with check (status = 'pending');
create policy "Admins manage adoption inquiries" on public.adoption_inquiries
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Visitors can submit partner inquiries" on public.partner_inquiries
for insert to anon, authenticated with check (status = 'pending');
create policy "Admins manage partner inquiries" on public.partner_inquiries
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Customers read their own orders" on public.orders
for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Admins manage orders" on public.orders
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Customers read their own order items" on public.order_items
for select to authenticated using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin()))
  )
);
create policy "Admins manage order items" on public.order_items
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
