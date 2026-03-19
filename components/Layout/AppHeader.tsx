"use client";
import { FaUserShield, FaSpinner, FaUser, FaSignOutAlt } from "react-icons/fa";
import type { User } from "@supabase/supabase-js";

interface AppHeaderProps {
  user: User;
  isAdmin: boolean;
  currentView: "qc" | "qc2" | "admin";
  onViewChange: (view: "qc" | "qc2" | "admin") => void;
  onLogout: () => void;
  isLoggingOut: boolean;
}

export default function AppHeader({
  user,
  isAdmin,
  currentView,
  onViewChange,
  onLogout,
  isLoggingOut,
}: AppHeaderProps) {
  return (
    <div className="my-8">
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/50 p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo/Brand Section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600 rounded-xl blur-sm opacity-50"></div>
              <div className="relative flex space-x-2 bg-gradient-to-br from-blue-400 to-purple-200 text-white rounded-xl px-2 py-2 font-extrabold text-2xl shadow-lg">
                <img
                  src="./logo_big.png"
                  className="h-12 w-12"
                  alt="sunny shanghai logo"
                />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
                质检系统
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">作者：jl-studios</p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
              <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                <FaUser className="text-indigo-600 text-sm" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-medium">
                  当前登录
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {user.email}
                </span>
              </div>
            </div>

            {/* Admin Badge or View Switcher */}
            {isAdmin ? (
              <div className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/30">
                <FaUserShield />
                <span>管理后台</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                <button
                  onClick={() => onViewChange("qc")}
                  className={`px-4 py-2 font-semibold rounded-lg transition-all duration-200 ${
                    currentView === "qc"
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white "
                      : "text-gray-600 hover:text-gray-800 hover:bg-white"
                  }`}
                >
                  履历表
                </button>
                <button
                  onClick={() => onViewChange("qc2")}
                  className={`px-4 py-2 font-semibold rounded-lg transition-all duration-200 ${
                    currentView === "qc2"
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white "
                      : "text-gray-600 hover:text-gray-800 hover:bg-white"
                  }`}
                >
                  记录表
                </button>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={onLogout}
              disabled={isLoggingOut}
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2  hover:shadow-xl hover:shadow-red-500/40"
            >
              {isLoggingOut ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>退出中...</span>
                </>
              ) : (
                <>
                  <FaSignOutAlt />
                  <span>退出</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
