begin;

alter table "Cafe" add column if not exists "cateringWhatsappNumber" text;

-- Seed the client's supplied number on initial setup only; preserve later edits.
update "Cafe" set "cateringWhatsappNumber" = '918075603490'
where slug in ('kolar-kitchen', 'kolarkitchen')
  and "cateringWhatsappNumber" is null
  and not exists (
    select 1 from "CafeFeatures" f
    where f."cafeId" = "Cafe".id and f."featureKey" = 'catering_menu'
  );

-- Kolar Kitchen gets a full catering catalog. Other tenants remain opted out.
-- Re-running this migration preserves subsequent Super Admin choices.
insert into "CafeFeatures" ("cafeId", "featureKey", "enabled", "displayMode")
select id, 'catering_menu', slug in ('kolar-kitchen', 'kolarkitchen'), 'hidden'
from "Cafe"
on conflict ("cafeId", "featureKey") do nothing;

commit;
