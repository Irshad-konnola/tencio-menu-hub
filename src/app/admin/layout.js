'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 1. Check if the dashboard was unlocked using the PIN or Password
    const isUnlocked = sessionStorage.getItem('dashboard_unlocked');

    if (!isUnlocked) {
      // 2. If no unlock badge is found, immediately kick them to the login screen
      router.replace('/login');
    } else {
      // 3. Badge found! Allow them to see the dashboard
      React.startTransition(() => {
        setIsAuthorized(true);
      });
    }
  }, [router]);

  // Show a blank screen (or you can add a loading spinner) for the split second it takes to check the badge
  if (!isAuthorized) {
    return <div className="min-h-screen bg-[#0a0a0a]"></div>; 
  }

  // Render the admin pages normally
  return <>{children}</>;
}