"use client";
import { useState, useEffect } from "react";
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

  const checkAdminStatus = async (user: User): Promise<void> => {
    try {
      const response = await fetch("/api/admin/check");
      const result = await response.json();
      setIsAdmin(result.isAdmin || false);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        checkAdminStatus(user).then(() => setCheckingAuth(false));
      } else {
        setCheckingAuth(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await checkAdminStatus(session.user);
        setIsLoggingOut(false); // Reset logout state when user logs in
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsLoggingOut(false); // Reset logout state when user logs out
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

