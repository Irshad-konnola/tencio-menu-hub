<div align="center">

# 🍽️ Tencio Menu Hub — Real-Time QR Digital Menu & Restaurant SaaS

**A multi-tenant restaurant ordering and table-service SaaS powered by Next.js 15, Supabase Realtime WebSockets, and native Web Push waiter alerts.**

[![Next.js 15](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Web Push](https://img.shields.io/badge/Web_Push_API-FF6B6B?style=for-the-badge&logo=googlechrome&logoColor=white)](#)

[Key Features](#key-features) • [System Architecture](#system-architecture) • [Tech Stack](#tech-stack) • [Local Setup](#getting-started-local-development)

</div>

---

## 📸 Product Preview

<!-- Tip: Drag and drop 2 screenshots directly into the GitHub README editor to replace these placeholders -->
| Mobile QR Menu (Customer View) | Live Restaurant Admin & Table Alerts |
| :---: | :---: |
 <img width="844" height="660" alt="WhatsApp Image 2026-10-21 at 6 45 37 PM" src="https://github.com/user-attachments/assets/7ed2c987-b17c-4346-980a-48bd182a6c59" /> |
 <img width="846" height="660" alt="WhatsApp Image 2026-10-21 at 6 47 11 PM" src="https://github.com/user-attachments/assets/39de6ffa-c6ac-4728-811b-faae45a9d05b" />


---

## 💡 The Problem & Solution

Restaurants and cafes often rely on static PDF QR menus that take seconds to download on mobile networks, cannot reflect sold-out items in real time, and offer no way for diners to signal table service without flagging down staff.

**Tencio Menu Hub** replaces static PDFs with an interactive, cloud-synced dining experience:
- **Instant Server-Side Rendering (SSR):** Engineered with Next.js 15 Server Components so table QR scans render the interactive menu immediately, even on slow mobile data connections.
- **Zero-Refresh Live Sync:** Uses **Supabase Realtime (WebSockets)** so when a kitchen marks an item "Sold Out" or updates a price, every active diner's screen updates instantly without a page reload.
- **Native Background Waiter Alerts:** Implements Service Workers and the **Web Push API** to dispatch instant table-call and bill-request notifications directly to staff devices, even when the browser tab is backgrounded.

---

## ✨ Key Features

- **⚡ Real-Time WebSocket Menu Sync:** Instant bi-directional updates for item availability, dynamic pricing, and daily specials across all connected customer sessions.
- **🔔 Native Web Push Table Service:** One-tap "Call Waiter" and "Request Bill" actions per table QR code using VAPID-authenticated background push notifications.
- **🏢 Multi-Tenant SaaS & Tiered Subscriptions:** Role-based tenant isolation allowing multiple restaurants and branches to manage categories, modifiers, and branding independently.
- **📱 Mobile-First Micro-Interactions:** App-like category filtering, smooth bottom-sheet item drawers, and dietary/spice-level badges tailored for mobile browsers.

---

## 🛠️ Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Framework & UI** | Next.js 15 (App Router & SSR), React, TypeScript, Tailwind CSS |
| **Realtime & Database** | Supabase, PostgreSQL (Row-Level Security), Supabase Realtime WebSockets |
| **Notifications & PWA** | Service Workers, Web Push API (VAPID Keys) |
| **Deployment** | Vercel |

---

## 🚀 Getting Started (Local Development)

### 1. Clone the repository
```bash
git clone [https://github.com/Irshad-konnola/tencio-menu-hub.git](https://github.com/Irshad-konnola/tencio-menu-hub.git)
cd tencio-menu-hub
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

Add your Supabase and Web Push VAPID credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### 4. Run the development server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 📄 License
Distributed under the MIT License. Built by [Irshad Konnola](https://irshadkonnola.vercel.app/) at [Tencio](https://tencio.vercel.app/).
