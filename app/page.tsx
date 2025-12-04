"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/Auth/LoginForm";
import LoadingSpinner from "@/components/Auth/LoadingSpinner";
import AppHeader from "@/components/Layout/AppHeader";
import QcComponent from "@/components/QcComponent";
import Qc2Component from "@/components/Qc2Component";
import AdminComponent from "@/components/Admin/AdminComponent";

export default function Home() {
  const [currentview, setCurrentview] = useState<"qc" | "qc2" | "admin">("qc");
  const { user, isAdmin, checkingAuth, login, logout, isLoggingOut } =
    useAuth();

  // Force admin view for admins and prevent switching to QC views
  useEffect(() => {
    if (isAdmin) {
      setCurrentview("admin");
    }
  }, [isAdmin]);

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
      <div className="bg-white border-sky-400 border h-full min-h-screen rounded-lg shadow-lg p-6 w-full max-w-6xl mx-auto pb-8 overflow-y-auto">
        {isAdmin ? (
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
