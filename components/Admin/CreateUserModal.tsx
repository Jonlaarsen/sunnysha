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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
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
        throw new Error(result.error || "获取用户列表失败");
      }

      setUsers(result.data || []);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "加载用户失败";
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
        throw new Error(result.error || result.message || "创建用户失败");
      }

      toast.success(result.message || "用户创建成功！", {
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
        error instanceof Error ? error.message : "创建用户失败";
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
      toast.error("请选择要更新的用户");
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
        throw new Error(result.error || result.message || "更新用户失败");
      }

      toast.success(result.message || "用户更新成功！", {
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
        error instanceof Error ? error.message : "更新用户失败";
      toast.error(errorMessage, {
        icon: <FaTimes />,
        duration: 5000,
      });
    } finally {
      setUpdating(false);
    }
  };

  const requestDeleteConfirmation = () => {
    if (!deleteUserId) {
      toast.error("请选择要删除的用户");
      return;
    }
    setShowDeleteConfirm(true);
  };

  const handleDeleteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    requestDeleteConfirmation();
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserId) return;

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
        throw new Error(result.error || result.message || "删除用户失败");
      }

      toast.success(result.message || "用户删除成功！", {
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
        error instanceof Error ? error.message : "删除用户失败";
      toast.error(errorMessage, {
        icon: <FaTimes />,
        duration: 5000,
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
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
              用户管理
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              创建、更新或删除用户
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
            创建
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
            更新
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
            删除
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create Tab */}
          {activeTab === "create" && (
            <form onSubmit={handleCreateSubmit} id="create-user-form" className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  姓名（选填）
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
                  邮箱 <span className="text-red-500">*</span>
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
                    <p className="font-semibold mb-2">说明：</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>将在 Supabase 中创建用户账户</li>
                      <li>账户设置链接将发送至用户邮箱</li>
                      <li>用户将通过安全链接自行设置密码</li>
                      <li>设置链接有效期为 24 小时</li>
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
                  选择用户 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜索用户..."
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
                        {searchTerm ? "未找到用户" : "输入以搜索用户"}
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
                  选择要删除的用户 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜索用户..."
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
                        {searchTerm ? "未找到用户" : "输入以搜索用户"}
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
                      <p className="font-semibold mb-2">警告：此操作无法撤销！</p>
                      <p>删除此用户将永久移除其账户及所有关联数据。</p>
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
            取消
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
                  创建中...
                </>
              ) : (
                <>
                  <FaUserPlus />
                  创建用户
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
                  更新中...
                </>
              ) : (
                <>
                  <FaEdit />
                  更新用户
                </>
              )}
            </button>
          )}
          {activeTab === "delete" && (
            <button
              type="button"
              onClick={requestDeleteConfirmation}
              disabled={deleting || !deleteUserId}
              className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  删除中...
                </>
              ) : (
                <>
                  <FaTrash />
                  删除用户
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">确认删除用户</h3>
            <p className="text-sm text-gray-600 mb-5">
              确定要删除该用户吗？用户账户会被删除，但该用户历史报告会保留。
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? <FaSpinner className="animate-spin" /> : null}
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

