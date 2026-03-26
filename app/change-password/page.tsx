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
      errors.push("至少 8 个字符");
    }

    if (!/[a-zA-Z]/.test(password)) {
      errors.push("至少一个字母");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("至少一个数字");
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
      toast.error("新密码两次输入不一致", {
        icon: <FaTimes />,
      });
      setLoading(false);
      return;
    }

    // Validate password strength
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      toast.error("密码不符合要求", {
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
        throw new Error(result.error || "修改密码失败");
      }

      toast.success(result.message || "密码修改成功！", {
        icon: <FaCheck />,
        duration: 3000,
      });

      // Redirect to main page after successful password change
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "修改密码失败";
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
          <p className="text-white text-lg">加载中...</p>
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
              修改密码
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              请设置新密码后继续使用
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              当前密码
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="请输入当前密码"
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
              新密码
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码"
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
                  强度：{" "}
                  <span
                    className={`font-semibold ${
                      passwordStrength === "weak"
                        ? "text-red-500"
                        : passwordStrength === "medium"
                        ? "text-yellow-500"
                        : "text-green-500"
                    }`}
                  >
                    {passwordStrength === "weak"
                      ? "弱"
                      : passwordStrength === "medium"
                        ? "中"
                        : "强"}
                  </span>
                </p>
              </div>
            )}

            {/* Password Requirements */}
            <div className="mt-2 text-xs text-slate-600 space-y-1">
              <p className="font-medium mb-1">密码要求：</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {newPassword.length >= 8 ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaTimes className="text-red-500" />
                  )}
                  <span>至少 8 个字符</span>
                </div>
                <div className="flex items-center gap-2">
                  {/[a-zA-Z]/.test(newPassword) ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaTimes className="text-red-500" />
                  )}
                  <span>至少一个字母</span>
                </div>
                <div className="flex items-center gap-2">
                  {/[0-9]/.test(newPassword) ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaTimes className="text-red-500" />
                  )}
                  <span>至少一个数字</span>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              确认新密码
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
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
                <FaTimes /> 密码不一致
              </p>
            )}
            {confirmPassword && newPassword === confirmPassword && newPassword.length > 0 && (
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <FaCheck /> 密码一致
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
                正在修改密码...
              </>
            ) : (
              <>
                <FaLock />
                修改密码
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-center text-slate-400">
          在访问系统前，你必须先修改密码
        </p>
      </div>
    </div>
  );
}

