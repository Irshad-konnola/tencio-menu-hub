# 🍽️ Menu Hub (Smart Cafe SaaS)

Menu Hub is a high-performance, real-time digital menu and table service platform built for modern cafes and restaurants. It empowers cafe owners to manage their menus, generate table-specific QR codes, and receive real-time waiter requests via background OS notifications.

Built with **Next.js 15**, **Supabase**, and **Tailwind CSS**, it features a robust split architecture: a highly interactive Admin Dashboard and a Server-Side Rendered (SSR), lightning-fast Customer Menu.

## ✨ Key Features

* **🚀 Zero-Second Load Times (SSR):** Customer menus are pre-fetched on the server (Next.js App Router) for instant loading, avoiding frontend loading spinners.
* **⚡ Real-Time Database Sync:** Powered by Supabase WebSockets. If an admin marks an item as "Out of Stock," it instantly turns gray on every customer's phone without a page refresh.
* **🔔 Native Background Notifications:** Utilizes Service Workers and the Web Push API. Cafe owners receive OS-level "Ding!" notifications for table service requests, even if the browser tab is closed.
* **📱 Premium Mobile-First UI:** Smooth animations using **Framer Motion** and an auto-playing swipeable promo banner using **Embla Carousel**.
* **🖨️ Smart QR Engine:** Dynamically generates both Global Store QR codes and Table-Specific QR codes that owners can download as PNGs in one click.
* **👑 Tiered SaaS Architecture:** Built-in gatekeeping for "Standard" vs. "Premium" cafes, including an integrated upsell paywall UI.

## 🛠️ Tech Stack

* **Frontend:** React, Next.js 15 (App Router), Tailwind CSS, Framer Motion
* **Backend:** Supabase (PostgreSQL, Realtime Engine, Storage Buckets)
* **Notifications:** Web Push API, Service Workers (`sw.js`)
* **Deployment:** Vercel (Edge Network)

## 📦 Environment Variables

To run this project locally, you will need to add the following variables to a `.env.local` file:

```text
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

## 🚀 Getting Started

1. **Clone the repository:**
```bash
   git clone [https://github.com/yourusername/menu-hub.git](https://github.com/yourusername/tencio-menu-hub.git)
   cd tencio-menu-hub
   ```

2. **Install dependencies:**
```bash
   npm install
   ```

3. **Generate VAPID Keys (if starting fresh):**
```bash
   npx web-push generate-vapid-keys
   ```
   *(Add these to your `.env.local` file)*

4. **Run the development server:**
```bash
   npm run dev
   ```
   Open http://localhost:3000 with your browser to see the result.

## 🗄️ Database Schema

This project relies on a secure PostgreSQL database with Row Level Security (RLS) enabled. Core tables include:

* **Cafe:** Stores cafe details, branding, and subscription tier (Standard/Premium).
* **Category & MenuItem:** Relational tables for menu management.
* **ServiceRequest:** Handles real-time waiter calls.
* **PushSubscriptions:** Stores device-specific endpoints for background alerts.

## 🔒 Security

* **Strict Deduplication:** Frontend state and backend insertion logic ensures duplicate menu items and push subscriptions are automatically filtered out.
* **1MB File Limit:** Admin image uploads are strictly gated to preserve storage and bandwidth.