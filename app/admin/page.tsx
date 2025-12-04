"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FaUserPlus, FaUsers, FaCheck, FaTimes, FaSpinner } from "react-icons/fa";

interface User {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    name?: string;
  };
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Check authentication and admin status
    supabase.auth.getUser().then(async ({ data: { user: currentUser } }) => {
      if (!currentUser) {
        router.push("/");
        return;
      }

      setUser(currentUser);

      // Check if user is admin via API
      try {
        const response = await fetch("/api/admin/check");
        const result = await response.json();

        if (!result.isAdmin) {
          toast.error("Access denied. Admin privileges required.");
          router.push("/");
          return;
        }

        setIsAdmin(true);
        setLoading(false);
        loadUsers();
      } catch (error) {
        console.error("Error checking admin status:", error);
        toast.error("Error verifying admin access.");
        router.push("/");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push("/");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      // Note: In production, you'd want a proper API endpoint to fetch users
      // For now, we'll show a message that users can be managed via Supabase dashboard
      // or create an API endpoint to list users
      setLoadingUsers(false);
    } catch (error) {
      console.error("Error loading users:", error);
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Failed to create user");
      }

      toast.success(result.message || "User created successfully!", {
        icon: <FaCheck />,
        duration: 5000,
      });

      // Reset form
      setEmail("");
      setName("");

      // Reload users list
      loadUsers();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create user";
      toast.error(errorMessage, {
        icon: <FaTimes />,
        duration: 5000,
      });
    } finally {
      setCreating(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-400/50 via-indigo-500/50 to-sky-300">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-white mx-auto mb-4" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen py-10 bg-gradient-to-br from-slate-400/50 via-indigo-500/50 to-sky-300">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white border-black border rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FaUsers className="text-indigo-600" />
                User Management
              </h1>
              <p className="text-gray-600 mt-1">
                Create and manage system users
              </p>
            </div>
            <button
              onClick={() => {
                setNavigating(true);
                router.push("/");
              }}
              disabled={navigating}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {navigating ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Loading...
                </>
              ) : (
                "Back to QC System"
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create User Form */}
          <div className="bg-white border-black border rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaUserPlus className="text-indigo-600" />
              Create New User
            </h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Creating User...
                  </>
                ) : (
                  <>
                    <FaUserPlus />
                    Create User
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Info Panel */}
          <div className="bg-white border-black border rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              User Management Info
            </h2>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  How It Works
                </h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Enter user email and optional name, then click "Create User"</li>
                  <li>User account will be created in Supabase</li>
                  <li>Account setup link will be sent to the user's email</li>
                  <li>User will set their own password using the secure link</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  Security Notes
                </h3>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Users set their own password via secure link</li>
                  <li>Setup links expire in 24 hours for security</li>
                  <li>Only admins can create new users</li>
                  <li>Self-registration is disabled</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  View All Users
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  To view and manage all users, go to:
                </p>
                <p className="text-xs text-gray-600 font-mono bg-white p-2 rounded border">
                  Supabase Dashboard → Authentication → Users
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity or User List could go here */}
      </div>
    </div>
  );
}

