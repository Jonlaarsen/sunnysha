"use client";
import { useState, useEffect } from "react";
import { FaTimes, FaSpinner, FaUserPlus, FaCheck, FaInfoCircle, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import toast from "react-hot-toast";

interface User {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    name?: string;
  };
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: () => void; // Optional callback to refresh user list
}

type TabType = "create" | "update" | "delete";

export default function CreateUserModal({
  isOpen,
  onClose,
  onUserCreated,
}: CreateUserModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("create");
  
  // Create user state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  
  // Update user state
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [updateEmail, setUpdateEmail] = useState("");
  const [updateName, setUpdateName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Delete user state
  const [deleteUserId, setDeleteUserId] = useState<string>("");
  const [deleting, setDeleting] = useState(false);
  
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch users for update/delete tabs
  useEffect(() => {
    if (isOpen && (activeTab === "update" || activeTab === "delete")) {
      fetchUsers();
    }
  }, [isOpen, activeTab]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/admin/users");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch users");
      }

      setUsers(result.data || []);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load users";
      toast.error(errorMessage, {
        duration: 3000,
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle user selection for update
  useEffect(() => {
    if (selectedUserId) {
      const user = users.find((u) => u.id === selectedUserId);
      if (user) {
        setUpdateEmail(user.email);
        setUpdateName(user.user_metadata?.name || "");
      }
    } else {
      setUpdateEmail("");
      setUpdateName("");
    }
  }, [selectedUserId, users]);

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

  const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error("Please select a user to update");
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch("/api/admin/update-user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
          email: updateEmail.trim(),
          name: updateName.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Failed to update user");
      }

      toast.success(result.message || "User updated successfully!", {
        icon: <FaCheck />,
        duration: 5000,
      });

      // Reset form and refresh users
      setSelectedUserId("");
      setUpdateEmail("");
      setUpdateName("");
      await fetchUsers();

      // Call callback to refresh user list if provided
      if (onUserCreated) {
        onUserCreated();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update user";
      toast.error(errorMessage, {
        icon: <FaTimes />,
        duration: 5000,
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!deleteUserId) {
      toast.error("Please select a user to delete");
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: deleteUserId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Failed to delete user");
      }

      toast.success(result.message || "User deleted successfully!", {
        icon: <FaCheck />,
        duration: 5000,
      });

      // Reset form and refresh users
      setDeleteUserId("");
      await fetchUsers();

      // Call callback to refresh user list if provided
      if (onUserCreated) {
        onUserCreated();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete user";
      toast.error(errorMessage, {
        icon: <FaTimes />,
        duration: 5000,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!creating && !updating && !deleting) {
      setEmail("");
      setName("");
      setSelectedUserId("");
      setUpdateEmail("");
      setUpdateName("");
      setDeleteUserId("");
      setSearchTerm("");
      setActiveTab("create");
      onClose();
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FaUserPlus className="text-indigo-600" />
              User Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Create, update, or delete users
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={creating || updating || deleting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${
              activeTab === "create"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <FaUserPlus className="inline mr-2" />
            Create
          </button>
          <button
            onClick={() => setActiveTab("update")}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${
              activeTab === "update"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <FaEdit className="inline mr-2" />
            Update
          </button>
          <button
            onClick={() => setActiveTab("delete")}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${
              activeTab === "delete"
                ? "text-red-600 border-b-2 border-red-600 bg-red-50"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <FaTrash className="inline mr-2" />
            Delete
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create Tab */}
          {activeTab === "create" && (
            <form onSubmit={handleCreateSubmit} id="create-user-form" className="space-y-6">
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
                      <li>Account setup link will be sent to the user&apos;s email</li>
                      <li>User will set their own password using the secure link</li>
                      <li>Setup links expire in 24 hours for security</li>
                    </ul>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Update Tab */}
          {activeTab === "update" && (
            <form onSubmit={handleUpdateSubmit} id="update-user-form" className="space-y-6">
              {/* Search/Select User */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                {loadingUsers ? (
                  <div className="mt-2 flex items-center justify-center py-4">
                    <FaSpinner className="animate-spin text-indigo-500" />
                  </div>
                ) : (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        {searchTerm ? "No users found" : "Start typing to search users"}
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setSearchTerm("");
                          }}
                          className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                            selectedUserId === user.id ? "bg-indigo-50 border-indigo-200" : ""
                          }`}
                        >
                          <div className="font-medium text-gray-800">
                            {user.user_metadata?.name || user.email.split("@")[0]}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {selectedUserId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={updateEmail}
                      onChange={(e) => setUpdateEmail(e.target.value)}
                      placeholder="user@example.com"
                      required
                      disabled={updating}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={updateName}
                      onChange={(e) => setUpdateName(e.target.value)}
                      placeholder="John Doe"
                      disabled={updating}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </>
              )}
            </form>
          )}

          {/* Delete Tab */}
          {activeTab === "delete" && (
            <form onSubmit={handleDeleteSubmit} id="delete-user-form" className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User to Delete <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                {loadingUsers ? (
                  <div className="mt-2 flex items-center justify-center py-4">
                    <FaSpinner className="animate-spin text-red-500" />
                  </div>
                ) : (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        {searchTerm ? "No users found" : "Start typing to search users"}
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setDeleteUserId(user.id);
                            setSearchTerm("");
                          }}
                          className={`w-full text-left p-3 hover:bg-red-50 border-b border-gray-100 last:border-b-0 ${
                            deleteUserId === user.id ? "bg-red-100 border-red-200" : ""
                          }`}
                        >
                          <div className="font-medium text-gray-800">
                            {user.user_metadata?.name || user.email.split("@")[0]}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {deleteUserId && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FaInfoCircle className="text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-semibold mb-2">Warning: This action cannot be undone!</p>
                      <p>Deleting this user will permanently remove their account and all associated data.</p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={creating || updating || deleting}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          {activeTab === "create" && (
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
          )}
          {activeTab === "update" && (
            <button
              type="submit"
              form="update-user-form"
              disabled={updating || !selectedUserId || !updateEmail}
              className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {updating ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Updating User...
                </>
              ) : (
                <>
                  <FaEdit />
                  Update User
                </>
              )}
            </button>
          )}
          {activeTab === "delete" && (
            <button
              type="submit"
              form="delete-user-form"
              disabled={deleting || !deleteUserId}
              className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Deleting User...
                </>
              ) : (
                <>
                  <FaTrash />
                  Delete User
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

