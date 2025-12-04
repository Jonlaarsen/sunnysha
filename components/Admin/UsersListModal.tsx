"use client";
import { useState, useEffect } from "react";
import { FaTimes, FaSpinner, FaEnvelope, FaCalendar } from "react-icons/fa";
import toast from "react-hot-toast";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  user_metadata?: {
    name?: string;
    first_login?: boolean;
  };
}

interface UsersListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UsersListModal({
  isOpen,
  onClose,
}: UsersListModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Failed to fetch users");
      }

      setUsers(result.data || []);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load users";
      toast.error(errorMessage, {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Never";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user_metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              All Users
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {users.length} total users
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search by email, name, or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FaSpinner className="animate-spin text-4xl text-indigo-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm ? "No users found matching your search." : "No users found."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-indigo-400 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {user.user_metadata?.name || user.email.split("@")[0]}
                        </h3>
                        {user.user_metadata?.first_login && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            First Login
                          </span>
                        )}
                        {user.email_confirmed_at && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FaEnvelope className="text-gray-400" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaCalendar className="text-gray-400" />
                          <span>
                            Created: {formatDate(user.created_at)}
                          </span>
                        </div>
                        {user.last_sign_in_at && (
                          <div className="flex items-center gap-2">
                            <FaCalendar className="text-gray-400" />
                            <span>
                              Last Sign In: {formatDate(user.last_sign_in_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      {user.id.substring(0, 8)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

