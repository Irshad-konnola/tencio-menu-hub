# Supabase Database Migrations

This directory contains the database schema migrations for Tencio Menu Hub.

## Migration History

1. **`01_features_and_billing.sql`**
   - Creates the `CafeFeatures` table for multi-tenant feature toggling (`table_service`, `banners`, `category_highlight`, `billing`).
   - Enables Row Level Security (RLS) on `CafeFeatures`.
   - Creates the `Bill` table with JSONB item storage and financial columns.
   - Adds `malayalamName` column to `MenuItem`.
   - Creates the `SuperAdminSession` table for admin authentication.
   - Seeds initial feature flags for existing tenants.

2. **`02_bill_and_category_updates.sql`**
   - Adds `documentType` (`'invoice'` | `'quotation'`) to the `Bill` table.
   - Adds `isFavorite` and `sortOrder` flags to `MenuItem`.
   - Adds `isHidden` and `sortOrder` flags to `Category`.

3. **`03_staff_passcode.sql`**
   - Adds `staffPasscode` column to `Cafe` for restricted staff access.

4. **`04_item_units.sql`**
   - Adds `unit` column to `MenuItem` for portion/unit pricing (e.g., '1 kg', 'Half kg', 'Plate').
   - Seeds `item_units` feature flag into `CafeFeatures` (enabled by default for `kolarkitchen`).

5. **`05_catering_menu.sql`**
   - Adds the optional `Cafe.cateringWhatsappNumber` contact setting.
   - Enables `catering_menu` for `kolar-kitchen` / `kolarkitchen`; other existing cafes remain disabled.
   - Seeds Kolar Kitchen's supplied enquiry number, `+91 8075603490`, on initial setup.
   - Can be run again without resetting feature choices or contact edits.

## Applying Migrations

Apply migration 05 before enabling catering on a tenant. The existing outlet routes
continue working before it is applied. This repository change does not itself run
SQL against the live database.

You can apply these migrations using either:
- **Supabase Dashboard**: Copy and paste the contents into the **SQL Editor** in sequential order.
- **Supabase CLI**: If linked to your project, run `supabase db push`.
