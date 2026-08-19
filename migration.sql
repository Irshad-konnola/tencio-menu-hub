create table "CafeFeatures" (
  id uuid primary key default gen_random_uuid(),
  "cafeId" text not null references "Cafe"(id) on delete cascade,
  "featureKey" text not null,        -- 'billing', 'table_service', 'banners', 'category_highlight'
  "enabled" boolean not null default false,
  "displayMode" text not null default 'hidden',  -- 'hidden' | 'locked'
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("cafeId", "featureKey")
);

-- Enable RLS on CafeFeatures
alter table "CafeFeatures" enable row level security;

-- Policy for tenant to read their own feature flags
create policy "Tenant can read own feature flags"
  on "CafeFeatures" for select
  using (
    "cafeId" in (select id from "Cafe" where "ownerId" = auth.uid())
  );

create table "Bill" (
  id uuid primary key default gen_random_uuid(),
  "cafeId" text not null references "Cafe"(id) on delete cascade,
  "customerName" text,
  "customerPhone" text,
  "items" jsonb not null,        -- [{ menuItemId, name, malayalamName, quantity, unit, rate, lineTotal }]
  "subtotal" numeric not null,
  "discount" numeric default 0,
  "deliveryCharge" numeric default 0,
  "grandTotal" numeric not null,
  "billDate" date not null default current_date,
  "notes" text,
  "createdAt" timestamptz not null default now()
);

-- Enable RLS on Bill
alter table "Bill" enable row level security;

-- Policy for tenant to manage their own bills
create policy "Tenant can manage own bills"
  on "Bill" for all
  using ("cafeId" in (select id from "Cafe" where "ownerId" = auth.uid()));

-- 3. Add malayalamName to MenuItem
alter table "MenuItem" add column "malayalamName" text;

-- 4. Create SuperAdminSession table
create table "SuperAdminSession" (
  id uuid primary key default gen_random_uuid(),
  "token" text not null unique,
  "createdAt" timestamptz not null default now(),
  "expiresAt" timestamptz not null
);

-- 5. Seed CafeFeatures for existing tenants
insert into "CafeFeatures" ("cafeId", "featureKey", "enabled", "displayMode")
select id, 'table_service', "hasTableService", 'locked' from "Cafe"
union all
select id, 'banners', (upper("serviceType") = 'PREMIUM'), 'locked' from "Cafe"
union all
select id, 'category_highlight', (upper("serviceType") = 'PREMIUM'), 'locked' from "Cafe"
union all
select id, 'billing', false, 'hidden' from "Cafe";
