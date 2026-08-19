-- 1. Update Bill table
alter table "Bill" add column "documentType" text not null default 'invoice';

-- 2. Update MenuItem table
alter table "MenuItem" add column "isFavorite" boolean not null default false;
alter table "MenuItem" add column "sortOrder" integer not null default 0;

-- 3. Update Category table
alter table "Category" add column "isHidden" boolean not null default false;
alter table "Category" add column "sortOrder" integer not null default 0;
