"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface UseAuthReturn {
  user: User | null;
  isAdmin: boolean;
  checkingAuth: boolean;
  adminStatusResolved: boolean;
  skipAuthCheck: () => void;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminStatusResolved, setAdminStatusResolved] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const hasCheckedAdminRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  const checkAdminStatus = async (user: User, forceCheck: boolean = false): Promise<void> => {
    // Only check if forced (explicit login) or if we haven't checked yet and no cache exists
    const cachedAdmin = sessionStorage.getItem(`admin_${user.id}`);
    
    if (!forceCheck && cachedAdmin !== null) {
      // Use cached value, don't make API call
      setIsAdmin(JSON.parse(cachedAdmin));
      setAdminStatusResolved(true);
      return;
    }

    if (!forceCheck && hasCheckedAdminRef.current) {
      // Already checked in this session, use cache
      if (cachedAdmin !== null) {
        setIsAdmin(JSON.parse(cachedAdmin));
        setAdminStatusResolved(true);
      }
      return;
    }

    try {
      // On explicit login, auth cookies/session can lag briefly.
      // Retry a few times before deciding user is not admin.
      const maxAttempts = forceCheck ? 4 : 1;
      let result: { isAdmin?: boolean; authenticated?: boolean } = {};

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const response = await fetch("/api/admin/check", { cache: "no-store" });
        result = await response.json();
        if (result.authenticated) break;
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 250));
        }
      }

      const adminStatus = !!result.isAdmin;
      setIsAdmin(adminStatus);
      setAdminStatusResolved(true);

      // Cache only after authenticated check succeeds to avoid persisting false
      // from transient login timing races.
      if (result.authenticated) {
        sessionStorage.setItem(`admin_${user.id}`, JSON.stringify(adminStatus));
        hasCheckedAdminRef.current = true;
      }
    } catch (error) {
      setIsAdmin(false);
      setAdminStatusResolved(true);
      sessionStorage.removeItem(`admin_${user.id}`);
    }
  };

  useEffect(() => {
    let cancelled = false;

    // Timeout: if auth check hangs (e.g. Supabase unreachable), show login after 5s
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      setCheckingAuth(false);
      setAdminStatusResolved(true);
    }, 5000);

    // Check if user is already logged in
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (cancelled) return;
      clearTimeout(timeoutId);
      if (user) {
        setUser(user);
        currentUserIdRef.current = user.id;
        // Try cache first; fetch from API when cache is missing.
        const cachedAdmin = sessionStorage.getItem(`admin_${user.id}`);
        if (cachedAdmin !== null) {
          setIsAdmin(JSON.parse(cachedAdmin));
          setAdminStatusResolved(true);
        } else {
          await checkAdminStatus(user, false);
        }
        setCheckingAuth(false);
      } else {
        setAdminStatusResolved(true);
        setCheckingAuth(false);
      }
    }).catch(() => {
      if (cancelled) return;
      clearTimeout(timeoutId);
      setAdminStatusResolved(true);
      setCheckingAuth(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const didUserChange = currentUserIdRef.current !== session.user.id;
        currentUserIdRef.current = session.user.id;

        // Re-check admin only on real sign-in/user switch.
        if (event === "SIGNED_IN" && didUserChange) {
          setAdminStatusResolved(false);
          await checkAdminStatus(session.user, true);
        } else {
          // For token refresh/window focus events, avoid network checks.
          const cachedAdmin = sessionStorage.getItem(`admin_${session.user.id}`);
          if (cachedAdmin !== null) {
            setIsAdmin(JSON.parse(cachedAdmin));
            setAdminStatusResolved(true);
          } else {
            setAdminStatusResolved(true);
          }
        }
        setIsLoggingOut(false);
      } else {
        setUser(null);
        currentUserIdRef.current = null;
        setIsAdmin(false);
        setAdminStatusResolved(true);
        setIsLoggingOut(false);
        hasCheckedAdminRef.current = false;
        // Clear role cache on logout
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('currentView');
          Object.keys(sessionStorage)
            .filter((k) => k.startsWith('admin_'))
            .forEach((k) => sessionStorage.removeItem(k));
        }
      }
      setCheckingAuth(false);
    });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message || "Invalid email or password" };
    }

    if (data.user) {
      router.refresh();
      return { error: null };
    }

    return { error: "Login failed" };
  };

  const logout = async (): Promise<void> => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      setAdminStatusResolved(true);
      hasCheckedAdminRef.current = false; // Reset ref on logout
      
      // Clear all session storage on logout
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
      
      setIsLoggingOut(false); // Reset loading state after successful logout
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
      setIsLoggingOut(false);
    }
  };

  const skipAuthCheck = () => setCheckingAuth(false);

  return {
    user,
    isAdmin,
    checkingAuth,
    adminStatusResolved,
    skipAuthCheck,
    login,
    logout,
    isLoggingOut,
  };
}

