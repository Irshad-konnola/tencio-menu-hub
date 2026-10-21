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

## Applying Migrations

You can apply these migrations using either:
- **Supabase Dashboard**: Copy and paste the contents into the **SQL Editor** in sequential order.
- **Supabase CLI**: If linked to your project, run `supabase db push`.
