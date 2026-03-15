import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  
  return createBrowserClient(url, key);
}

// Clear session marker when browser/tab closes
// This ensures users must login again after closing the browser/tab
// Note: beforeunload may not fire reliably in all browsers, but it's the best we can do client-side
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Clear session marker - if it's missing on next page load, user will be signed out
    sessionStorage.removeItem('auth_session_active');
  });
}


