"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { FaLock, FaCheck, FaTimes, FaSpinner, FaEye, FaEyeSlash } from "react-icons/fa";

export default function SetupPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // Check if we have a valid token in the URL
    const checkToken = async () => {
      const hash = window.location.hash;
      if (!hash) {
        toast.error("Invalid or missing setup link");
        router.push("/");
        return;
      }
      setValidating(false);
    };

    checkToken();
  }, [router]);

  const validatePassword = (pwd: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (pwd.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      errors.push("Password must contain at least one special character");
    }

    return { valid: errors.length === 0, errors };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.valid) {
      toast.error(validation.errors[0]);
      setLoading(false);
      return;
    }

    try {
      // Extract token from URL hash
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (!accessToken) {
        throw new Error("Invalid setup link. Please request a new one.");
      }

      // Set the session with the tokens
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || "",
      });

      if (sessionError) {
        throw sessionError;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      // Update user metadata to mark first login as complete
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { first_login: false },
      });

      if (metadataError) {
        console.error("Error updating metadata:", metadataError);
        // Don't fail if metadata update fails
      }

      toast.success("Password set successfully! Redirecting...", {
        icon: <FaCheck />,
        duration: 2000,
      });

      // Redirect to main page after a short delay
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to set password";
      toast.error(errorMessage, {
        icon: <FaTimes />,
        duration: 5000,
      });
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-400 via-indigo-500 to-sky-300">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-white mx-auto mb-4" />
          <p className="text-white text-lg">Validating setup link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-400 via-indigo-500 to-sky-300 px-4">
      <div className="w-full max-w-md bg-white/95 border border-white/40 backdrop-blur shadow-2xl rounded-3xl px-10 py-12 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 text-2xl font-extrabold shadow-inner">
            <FaLock />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Set Up Your Password
            </h1>
            <p className="text-sm text-slate-500">
              Create a secure password for your account
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full p-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            
            {/* Password requirements */}
            {password.length > 0 && (
              <div className="text-xs space-y-1 mt-2">
                <div className={`flex items-center gap-2 ${password.length >= 8 ? "text-green-600" : "text-red-600"}`}>
                  {password.length >= 8 ? <FaCheck /> : <FaTimes />}
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? "text-green-600" : "text-red-600"}`}>
                  {/[A-Z]/.test(password) ? <FaCheck /> : <FaTimes />}
                  <span>One uppercase letter</span>
                </div>
                <div className={`flex items-center gap-2 ${/[a-z]/.test(password) ? "text-green-600" : "text-red-600"}`}>
                  {/[a-z]/.test(password) ? <FaCheck /> : <FaTimes />}
                  <span>One lowercase letter</span>
                </div>
                <div className={`flex items-center gap-2 ${/[0-9]/.test(password) ? "text-green-600" : "text-red-600"}`}>
                  {/[0-9]/.test(password) ? <FaCheck /> : <FaTimes />}
                  <span>One number</span>
                </div>
                <div className={`flex items-center gap-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-green-600" : "text-red-600"}`}>
                  {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? <FaCheck /> : <FaTimes />}
                  <span>One special character</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                className="w-full p-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <div className="text-xs mt-2">
                {passwordsMatch ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <FaCheck />
                    <span>Passwords match</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <FaTimes />
                    <span>Passwords do not match</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !passwordValidation.valid || !passwordsMatch}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-semibold tracking-wide shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Setting Password...
              </>
            ) : (
              <>
                <FaLock />
                Set Password
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-center text-slate-400">
          This link will expire in 24 hours for security purposes
        </p>
      </div>
    </div>
  );
}

