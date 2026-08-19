import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 font-sans selection:bg-white selection:text-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icon.png" alt="Tencio Menu Hub Logo" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-white font-bold tracking-tight text-lg">MenuHub</span>
          </div>
          <Link href="/login" className="text-sm font-bold bg-white text-black px-4 py-2 rounded-full hover:scale-105 transition-transform">
            Vendor Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-32 pb-20 px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-400 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Now supporting Quotations & Staff Mode
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight mb-6">
          The operating system <br className="hidden md:block" />
          for modern restaurants.
        </h1>
        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Tencio Menu Hub is a powerful multi-tenant platform. We empower cafe and restaurant owners with digital menus, smart table service, real-time push notifications, and comprehensive billing tools.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/login" className="bg-white text-black px-8 py-4 rounded-full font-bold text-sm tracking-wide hover:bg-neutral-200 transition-colors">
            Get Started
          </Link>
          <a href="#features" className="bg-neutral-900 border border-neutral-800 text-white px-8 py-4 rounded-full font-bold text-sm tracking-wide hover:bg-neutral-800 transition-colors">
            Explore Features
          </a>
        </div>
      </header>

      {/* App Preview / Graphic */}
      <div className="max-w-5xl mx-auto px-6 mb-32">
        <div className="aspect-video bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden relative shadow-2xl flex items-center justify-center">
          <img src="/og-image.png" alt="MenuHub Dashboard Preview" className="w-full h-full object-cover opacity-80 mix-blend-screen" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 border-t border-neutral-900">
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Everything you need to run your floor.</h2>
          <p className="text-neutral-400 max-w-xl">A complete suite of tools designed specifically for food service, baked right into one seamless dashboard.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-[24px] hover:bg-neutral-900 transition-colors">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-white">📱</div>
            <h3 className="text-xl font-bold text-white mb-3">Dynamic Digital Menus</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">Instantly update prices, hide out-of-stock items, and organize categories. Changes reflect instantly on your public URL.</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-[24px] hover:bg-neutral-900 transition-colors">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-white">🛎️</div>
            <h3 className="text-xl font-bold text-white mb-3">Smart Table Service</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">Generate specific QR codes for every table. Customers can call a waiter directly from their phone with a single tap.</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-[24px] hover:bg-neutral-900 transition-colors">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-white">🔔</div>
            <h3 className="text-xl font-bold text-white mb-3">Push Notifications</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">Staff receive immediate background push notifications on their devices when a table requests service.</p>
          </div>

          {/* Feature 4 */}
          <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-[24px] hover:bg-neutral-900 transition-colors">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-white">🧾</div>
            <h3 className="text-xl font-bold text-white mb-3">Invoices & Quotations</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">Built-in POS billing module. Create invoices, generate quotations, and manage favorites for fast checkout.</p>
          </div>

          {/* Feature 5 */}
          <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-[24px] hover:bg-neutral-900 transition-colors">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-white">👥</div>
            <h3 className="text-xl font-bold text-white mb-3">Restricted Staff Mode</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">Set a custom Staff PIN so employees can quickly toggle item availability without having full access to edit prices or settings.</p>
          </div>

          {/* Feature 6 */}
          <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-[24px] hover:bg-neutral-900 transition-colors">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-white">🏢</div>
            <h3 className="text-xl font-bold text-white mb-3">Multi-Tenant Architecture</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">Run multiple cafes from one platform. Super Admins can manage features, tenant access, and billing modules centrally.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-900 mt-20 py-10 px-6 text-center">
        <p className="text-neutral-500 text-sm font-medium">© {new Date().getFullYear()} Tencio Menu Hub. Built with Next.js & Supabase.</p>
      </footer>
    </div>
  );
}
