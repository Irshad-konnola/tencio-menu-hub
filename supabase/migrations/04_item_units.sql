-- 1. Add unit column to MenuItem table (optional, e.g., '1 kg', 'Half kg', 'Plate', etc.)
alter table "MenuItem" add column if not exists "unit" text;

-- 2. Seed 'item_units' feature into CafeFeatures
-- Enable by default for kolar-kitchen tenant
insert into "CafeFeatures" ("cafeId", "featureKey", "enabled", "displayMode")
select id, 'item_units', true, 'locked' from "Cafe" where slug in ('kolar-kitchen', 'kolarkitchen')
on conflict ("cafeId", "featureKey") do update set enabled = true;

-- For all other existing cafes, add as disabled
insert into "CafeFeatures" ("cafeId", "featureKey", "enabled", "displayMode")
select id, 'item_units', false, 'locked' from "Cafe" where slug not in ('kolar-kitchen', 'kolarkitchen')
on conflict ("cafeId", "featureKey") do nothing;
