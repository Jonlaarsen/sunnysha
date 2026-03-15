"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface UseAuthReturn {
  user: User | null;
  isAdmin: boolean;
  checkingAuth: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const hasCheckedAdminRef = useRef(false);

  const checkAdminStatus = async (user: User, forceCheck: boolean = false): Promise<void> => {
    // Only check if forced (explicit login) or if we haven't checked yet and no cache exists
    const cachedAdmin = sessionStorage.getItem(`admin_${user.id}`);
    
    if (!forceCheck && cachedAdmin !== null) {
      // Use cached value, don't make API call
      setIsAdmin(JSON.parse(cachedAdmin));
      return;
    }

    if (!forceCheck && hasCheckedAdminRef.current) {
      // Already checked in this session, use cache
      if (cachedAdmin !== null) {
        setIsAdmin(JSON.parse(cachedAdmin));
      }
      return;
    }

    try {
      const response = await fetch("/api/admin/check");
      const result = await response.json();
      const adminStatus = result.isAdmin || false;
      setIsAdmin(adminStatus);
      // Cache admin status in sessionStorage
      sessionStorage.setItem(`admin_${user.id}`, JSON.stringify(adminStatus));
      hasCheckedAdminRef.current = true;
    } catch (error) {
      setIsAdmin(false);
      sessionStorage.removeItem(`admin_${user.id}`);
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Check if session marker exists (indicates user logged in during this browser session)
        // If marker is missing, it means the browser/tab was closed and reopened
        const sessionMarker = sessionStorage.getItem('auth_session_active');
        
        if (!sessionMarker) {
          // No session marker = new browser session after close
          // Sign out to require fresh login
          supabase.auth.signOut().catch(() => {
            // Ignore errors - just ensure state is cleared
          });
          setUser(null);
          setIsAdmin(false);
          setCheckingAuth(false);
          return;
        }
        
        // Session marker exists - user is logged in for this session
        setUser(user);
        // Try to get cached admin status
        const cachedAdmin = sessionStorage.getItem(`admin_${user.id}`);
        if (cachedAdmin !== null) {
          setIsAdmin(JSON.parse(cachedAdmin));
        } else {
          setIsAdmin(false);
        }
        setCheckingAuth(false);
      } else {
        setCheckingAuth(false);
      }
    });

    // Listen for auth changes - do NOT check admin status here
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Use cached admin status for all auth state changes
        const cachedAdmin = sessionStorage.getItem(`admin_${session.user.id}`);
        if (cachedAdmin !== null) {
          setIsAdmin(JSON.parse(cachedAdmin));
        } else {
          setIsAdmin(false);
        }
        setIsLoggingOut(false);
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsLoggingOut(false);
        hasCheckedAdminRef.current = false;
        // Clear session data on logout
        if (typeof window !== 'undefined') {
          if (session?.user?.id) {
            sessionStorage.removeItem(`admin_${session.user.id}`);
          }
          sessionStorage.removeItem('auth_session_active');
        }
      }
      setCheckingAuth(false);
    });

    return () => subscription.unsubscribe();
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
      setUser(data.user);
      // Set session marker - this indicates user logged in during this browser session
      // If this marker is missing on next page load, user will be signed out
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_session_active', 'true');
      }
      // Check admin status when explicitly logging in
      await checkAdminStatus(data.user, true);
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

  return {
    user,
    isAdmin,
    checkingAuth,
    login,
    logout,
    isLoggingOut,
  };
}

