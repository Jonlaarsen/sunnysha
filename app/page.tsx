"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/Auth/LoginForm";
import LoadingSpinner from "@/components/Auth/LoadingSpinner";
import AppHeader from "@/components/Layout/AppHeader";
import QcComponent from "@/components/QcComponent";
import Qc2Component from "@/components/Qc2Component";
import AdminComponent from "@/components/Admin/AdminComponent";
import { FaSpinner } from "react-icons/fa";

export default function Home() {
  const [currentview, setCurrentview] = useState<"qc" | "qc2" | "admin">("qc");
  const [isComponentLoading, setIsComponentLoading] = useState(true);
  const { user, isAdmin, checkingAuth, login, logout, isLoggingOut } =
    useAuth();

  // Force admin view for admins and prevent switching to QC views
  // For non-admin users, automatically set to QC view
  useEffect(() => {
    if (user && !checkingAuth) {
      // Wait a bit to ensure admin status is fully determined
      const timer = setTimeout(() => {
        if (isAdmin) {
          setCurrentview("admin");
        } else {
          // Automatically show QC for normal users
          setCurrentview("qc");
        }
        // Add a brief loading period before showing the component (300ms)
        setTimeout(() => {
          setIsComponentLoading(false);
        }, 300);
      }, 150);

      return () => clearTimeout(timer);
    } else if (!user && !checkingAuth) {
      setIsComponentLoading(false);
    }
  }, [isAdmin, user, checkingAuth]);

  // Reset component loading when auth state changes
  useEffect(() => {
    if (checkingAuth) {
      setIsComponentLoading(true);
      setCurrentview("qc"); // Reset to default
    }
  }, [checkingAuth]);

  // Prevent admins from switching to QC views
  const handleViewChange = (view: "qc" | "qc2" | "admin") => {
    if (isAdmin && view !== "admin") {
      return; // Prevent admins from switching to QC views
    }
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
        currentView={currentview}
        onViewChange={handleViewChange}
        onLogout={logout}
        isLoggingOut={isLoggingOut}
      />
      <div className="bg-white border-sky-400 border h-full rounded-lg shadow-lg p-6 w-full max-w-6xl mx-auto pb-8 overflow-y-auto">
        {isComponentLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <FaSpinner className="animate-spin text-4xl text-indigo-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading component...</p>
            </div>
          </div>
        ) : isAdmin ? (
          <AdminComponent />
        ) : currentview === "qc" ? (
          <QcComponent />
        ) : currentview === "qc2" ? (
          <Qc2Component />
        ) : null}
      </div>
    </div>
  );
}
