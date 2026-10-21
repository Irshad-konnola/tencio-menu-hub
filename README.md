<div align="center">
  <img src="https://tencio-menu-hub.vercel.app/og-image.png" alt="Tencio Menu Hub" width="100%" />
</div>

# 🍽️ Tencio Menu Hub (Multi-Tenant Restaurant SaaS)

Tencio Menu Hub is a high-performance, real-time digital menu, billing, and table service platform built for modern cafes and restaurants. Operating as a Multi-Tenant SaaS platform, it empowers cafe owners to manage their menus, generate table-specific QR codes, generate PDF quotations, and receive real-time waiter requests via background OS notifications.

Built with **Next.js 15**, **Supabase**, and **Tailwind CSS**, it features a robust split architecture: a highly interactive Admin Dashboard, a secure Super Admin control panel, and a Server-Side Rendered (SSR), lightning-fast Customer Menu.

## ✨ Key Features

* **🏢 Multi-Tenant Architecture & Super Admin:** Run multiple distinct cafes from a single platform. A dedicated Super Admin dashboard allows platform owners to toggle features (Billing, Table Service, Banners) on a per-tenant basis.
* **🚀 Zero-Second Load Times (SSR):** Customer menus are pre-fetched on the server (Next.js App Router) for instant loading, avoiding frontend loading spinners.
* **⚡ Real-Time Database Sync:** Powered by Supabase WebSockets. If an admin marks an item as "Out of Stock," it instantly turns gray on every customer's phone without a page refresh.
* **🧾 Invoicing & Quotations (Billing Module):** Integrated POS-style billing system. Easily build a cart, mark favorite items, and instantly download formatted Invoices or Quotations as high-quality images/PDFs.
* **👥 Restricted Staff Mode:** Cafe owners can generate a custom 4-digit Staff PIN. Staff logging in with this PIN get a restricted view that only allows them to toggle items In-Stock/Out-of-Stock without accessing financial data or settings.
* **🔔 Native Background Notifications:** Utilizes Service Workers and the Web Push API. Cafe owners receive OS-level "Ding!" notifications for table service requests, even if the browser tab is closed.
* **📱 Premium Mobile-First UI:** Smooth animations using **Framer Motion** and an auto-playing swipeable promo banner using **Embla Carousel**.
* **🖨️ Smart QR Engine:** Dynamically generates both Global Store QR codes and Table-Specific QR codes that owners can download as PNGs in one click.

## 🛠️ Tech Stack

* **Frontend:** React, Next.js 15 (App Router), Tailwind CSS, Framer Motion
* **Backend:** Supabase (PostgreSQL, Realtime Engine, Storage Buckets, Row Level Security)
* **Notifications:** Web Push API, Service Workers (`sw.js`)
* **Deployment:** Vercel (Edge Network)
* **Images:** `html-to-image` for instant POS receipt generation.

## 📦 Environment Variables

Copy the provided `.env.example` template to `.env.local` and populate the values:

```bash
cp .env.example .env.local
```

Key variables required:
* **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
* **Direct Database (Optional):** `DATABASE_URL`, `DIRECT_URL`
* **Web Push (VAPID):** `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
* **Super Admin:** `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`

See [`.env.example`](.env.example) for detailed comments on each variable.

## 🚀 Getting Started

1. **Clone the repository:**
```bash
   git clone https://github.com/Irshad-konnola/tencio-menu-hub.git
   cd tencio-menu-hub
```

2. **Install dependencies:**
```bash
   npm install
```

3. **Configure environment:**
```bash
   cp .env.example .env.local
```

4. **Generate VAPID Keys (if starting fresh):**
```bash
   npx web-push generate-vapid-keys
```
   *(Add these to your `.env.local` file)*

5. **Run the development server:**
```bash
   npm run dev
```
   Open http://localhost:3000 with your browser to see the result.

## 🗄️ Database Schema & Migrations

This project relies on a secure PostgreSQL database with Row Level Security (RLS) enabled. Structured SQL migrations are located in the [`supabase/migrations/`](supabase/migrations/) directory:

* `01_features_and_billing.sql`: Cafe features flag system, billing tables, RLS policies, and superadmin session.
* `02_bill_and_category_updates.sql`: Quotations support, favorite items, and category visibility toggles.
* `03_staff_passcode.sql`: 4-digit staff passcode authentication column.

Core tables include:
* **Cafe:** Stores cafe details, branding, staff passcode, and owner association.
* **CafeFeatures:** Tracks enabled/locked SaaS modules (Billing, Banners, Table Service) per tenant.
* **Category & MenuItem:** Relational tables for menu management with visibility/stock toggles.
* **ServiceRequest:** Handles real-time waiter calls.
* **Bill:** Stores transaction histories (Invoices & Quotations).
* **PushSubscriptions:** Stores device-specific endpoints for background alerts.

## 🔒 Security

* **Row Level Security (RLS):** Every database read/write is isolated. Tenants can only see their own menus and financial data.
* **Staff Access Control:** Front-end routing blocks Staff Mode users from accessing features outside the `ItemsTab`.
* **Strict Deduplication:** Frontend state and backend insertion logic ensures duplicate menu items and push subscriptions are automatically filtered out.
* **1MB File Limit:** Admin image uploads are strictly gated to preserve storage and bandwidth.