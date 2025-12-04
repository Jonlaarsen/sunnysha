"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FaLock, FaEye, FaEyeSlash, FaCheck, FaTimes, FaSpinner } from "react-icons/fa";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      if (!currentUser) {
        router.push("/");
        return;
      }
      setCheckingAuth(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("At least 8 characters");
    }

    if (!/[a-zA-Z]/.test(password)) {
      errors.push("At least one letter");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("At least one number");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const getPasswordStrength = (password: string): "weak" | "medium" | "strong" => {
    if (password.length === 0) return "weak";
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return "weak";
    if (strength <= 4) return "medium";
    return "strong";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match", {
        icon: <FaTimes />,
      });
      setLoading(false);
      return;
    }

    // Validate password strength
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      toast.error("Password does not meet requirements", {
        icon: <FaTimes />,
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to change password");
      }

      toast.success(result.message || "Password changed successfully!", {
        icon: <FaCheck />,
        duration: 3000,
      });

      // Redirect to main page after successful password change
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to change password";
      toast.error(errorMessage, {
        icon: <FaTimes />,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-400 via-indigo-500 to-sky-300">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-white mx-auto mb-4" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(newPassword);
  const validation = validatePassword(newPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-400 via-indigo-500 to-sky-300 px-4">
      <div className="w-full max-w-md bg-white/95 border border-white/40 backdrop-blur shadow-2xl rounded-3xl px-10 py-12 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 text-2xl font-extrabold shadow-inner">
            <FaLock />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Change Password
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Please set a new password to continue
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                required
                className="w-full p-3 pr-10 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                required
                className="w-full p-3 pr-10 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  <div
                    className={`h-1 flex-1 rounded ${
                      passwordStrength === "weak"
                        ? "bg-red-500"
                        : passwordStrength === "medium"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  />
                  <div
                    className={`h-1 flex-1 rounded ${
                      passwordStrength === "strong" ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                  <div
                    className={`h-1 flex-1 rounded ${
                      passwordStrength === "strong" ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Strength:{" "}
                  <span
                    className={`font-semibold ${
                      passwordStrength === "weak"
                        ? "text-red-500"
                        : passwordStrength === "medium"
                        ? "text-yellow-500"
                        : "text-green-500"
                    }`}
                  >
                    {passwordStrength.toUpperCase()}
                  </span>
                </p>
              </div>
            )}

            {/* Password Requirements */}
            <div className="mt-2 text-xs text-slate-600 space-y-1">
              <p className="font-medium mb-1">Requirements:</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {newPassword.length >= 8 ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaTimes className="text-red-500" />
                  )}
                  <span>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-2">
                  {/[a-zA-Z]/.test(newPassword) ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaTimes className="text-red-500" />
                  )}
                  <span>At least one letter</span>
                </div>
                <div className="flex items-center gap-2">
                  {/[0-9]/.test(newPassword) ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaTimes className="text-red-500" />
                  )}
                  <span>At least one number</span>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                className="w-full p-3 pr-10 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <FaTimes /> Passwords do not match
              </p>
            )}
            {confirmPassword && newPassword === confirmPassword && newPassword.length > 0 && (
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <FaCheck /> Passwords match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !validation.valid || newPassword !== confirmPassword}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-semibold tracking-wide shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Changing Password...
              </>
            ) : (
              <>
                <FaLock />
                Change Password
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-center text-slate-400">
          You must change your password before accessing the system
        </p>
      </div>
    </div>
  );
}

