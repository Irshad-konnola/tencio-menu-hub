import React from 'react';
import { verifySuperAdminSession, getAllTenantsWithFeatures, superAdminLogout } from '@/app/actions/adminActions';
import { redirect } from 'next/navigation';
import SuperAdminClient from './SuperAdminClient';

export default async function SuperAdminPage() {
  const isValid = await verifySuperAdminSession();
  
  if (!isValid) {
    redirect('/superadmin/login');
  }

  const tenants = await getAllTenantsWithFeatures();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 sm:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Super Admin Dashboard</h1>
            <p className="text-sm text-neutral-400">Manage feature toggles for all MenuHub tenants.</p>
          </div>
          <form action={async () => {
            'use server';
            await superAdminLogout();
            redirect('/superadmin/login');
          }}>
            <button type="submit" className="text-[11px] font-bold tracking-widest uppercase bg-neutral-900 hover:bg-neutral-800 text-neutral-300 px-5 py-2.5 rounded-xl transition-colors border border-neutral-800">
              Logout
            </button>
          </form>
        </header>
        
        <SuperAdminClient initialTenants={tenants} />
      </div>
    </div>
  );
}
