"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/Auth/LoginForm";
import LoadingSpinner from "@/components/Auth/LoadingSpinner";
import AppHeader from "@/components/Layout/AppHeader";
import QcComponent from "@/components/QcComponent";
import Qc2Component from "@/components/Qc2Component";
import AdminComponent from "@/components/Admin/AdminComponent";
import { FaSpinner } from "react-icons/fa";
import type { User } from "@supabase/supabase-js";

export default function Home() {
  const [currentview, setCurrentview] = useState<"qc" | "qc2">("qc");
  const [isViewLoading, setIsViewLoading] = useState(false);
  const { user, isAdmin, checkingAuth, login, logout, isLoggingOut } =
    useAuth();
  const prevUserRef = useRef<User | null>(null);
  const prevCheckingAuthRef = useRef(true);
  const prevViewRef = useRef<"qc" | "qc2">("qc");
  const prevIsAdminRef = useRef(false);

  // Set view for non-admin users only
  useEffect(() => {
    if (user && !checkingAuth && !isAdmin) {
      setCurrentview("qc");
    }
  }, [isAdmin, user, checkingAuth]);

  // Show loading when logging in (user changes from null to user)
  useEffect(() => {
    if (prevUserRef.current === null && user !== null && !checkingAuth) {
      setIsViewLoading(true);
      const timer = setTimeout(() => {
        setIsViewLoading(false);
      }, 500);
      prevUserRef.current = user;
      return () => clearTimeout(timer);
    }
    prevUserRef.current = user;
  }, [user, checkingAuth]);

  // Show loading when refreshing (checkingAuth changes from true to false)
  useEffect(() => {
    if (prevCheckingAuthRef.current === true && checkingAuth === false && user) {
      setIsViewLoading(true);
      const timer = setTimeout(() => {
        setIsViewLoading(false);
      }, 500);
      prevCheckingAuthRef.current = checkingAuth;
      return () => clearTimeout(timer);
    }
    prevCheckingAuthRef.current = checkingAuth;
  }, [checkingAuth, user]);

  // Show loading when admin status changes
  useEffect(() => {
    if (prevIsAdminRef.current !== isAdmin && user && !checkingAuth) {
      setIsViewLoading(true);
      const timer = setTimeout(() => {
        setIsViewLoading(false);
      }, 500);
      prevIsAdminRef.current = isAdmin;
      return () => clearTimeout(timer);
    }
  }, [isAdmin, user, checkingAuth]);

  // Show loading when changing view
  useEffect(() => {
    if (prevViewRef.current !== currentview && user && !checkingAuth) {
      setIsViewLoading(true);
      const timer = setTimeout(() => {
        setIsViewLoading(false);
      }, 500);
      prevViewRef.current = currentview;
      return () => clearTimeout(timer);
    }
  }, [currentview, user, checkingAuth]);

  // Prevent admins from switching to QC views
  const handleViewChange = (view: "qc" | "qc2" | "admin") => {
    if (isAdmin || view === "admin") return; // Admins can't switch views
    setCurrentview(view);
  };

  if (checkingAuth) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginForm onSubmit={login} />;
  }

  return (
    <div className="min-h-screen py-10 flex flex-col w-full bg-gradient-to-br from-slate-400/50 via-indigo-500/50 to-sky-300">
      <AppHeader
        user={user}
        isAdmin={isAdmin}
        currentView={isAdmin ? "admin" : currentview}
        onViewChange={handleViewChange}
        onLogout={logout}
        isLoggingOut={isLoggingOut}
      />
      <div className="bg-white border-sky-400 border h-full rounded-lg shadow-lg p-6 w-full max-w-6xl mx-auto pb-8 overflow-y-auto">
        {isViewLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <FaSpinner className="animate-spin text-4xl text-indigo-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        ) : isAdmin ? (
          <AdminComponent />
        ) : currentview === "qc" ? (
          <QcComponent />
        ) : (
          <Qc2Component />
        )}
      </div>
    </div>
  );
}
