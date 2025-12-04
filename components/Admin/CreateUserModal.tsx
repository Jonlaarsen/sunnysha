"use client";
import { useState } from "react";
import { FaTimes, FaSpinner, FaUserPlus, FaCheck, FaInfoCircle } from "react-icons/fa";
import toast from "react-hot-toast";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: () => void; // Optional callback to refresh user list
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onUserCreated,
}: CreateUserModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

      // Call callback to refresh user list if provided
      if (onUserCreated) {
        onUserCreated();
      }

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1000);
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

  const handleClose = () => {
    if (!creating) {
      setEmail("");
      setName("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FaUserPlus className="text-indigo-600" />
              Create New User
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Add a new user to the system
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={creating}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} id="create-user-form" className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={creating}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                disabled={creating}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FaInfoCircle className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-2">How it works:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>User account will be created in Supabase</li>
                    <li>Account setup link will be sent to the user's email</li>
                    <li>User will set their own password using the secure link</li>
                    <li>Setup links expire in 24 hours for security</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={creating}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-user-form"
            disabled={creating || !email}
            className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        </div>
      </div>
    </div>
  );
}

