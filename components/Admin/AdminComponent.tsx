"use client";
import { useState } from "react";
import {
  FaDatabase,
  FaUsers,
  FaUserPlus,
  FaChartBar,
} from "react-icons/fa";
import UserRecordsModal from "./UserRecordsModal";
import UsersListModal from "./UsersListModal";
import CreateUserModal from "./CreateUserModal";
import StatisticsModal from "./StatisticsModal";

const AdminComponent = () => {
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState<string | undefined>(undefined);
  const [userFilter, setUserFilter] = useState<string | undefined>(undefined);

  const shortcuts = [
    {
      id: "records",
      title: "View All Records",
      description: "Browse QC records from all users",
      icon: FaDatabase,
      color: "from-blue-500 to-cyan-500",
      onClick: () => setShowRecordsModal(true),
    },
    {
      id: "users",
      title: "View All Users",
      description: "See all registered users and their information",
      icon: FaUsers,
      color: "from-purple-500 to-pink-500",
      onClick: () => setShowUsersModal(true),
    },
    {
      id: "create-user",
      title: "Create/Update Users",
      description: "Add new users or manage existing ones",
      icon: FaUserPlus,
      color: "from-green-500 to-emerald-500",
      onClick: () => setShowCreateUserModal(true),
    },
    {
      id: "statistics",
      title: "Statistics & Reports",
      description: "View supplier statistics and ratings",
      icon: FaChartBar,
      color: "from-orange-500 to-red-500",
      onClick: () => setShowStatisticsModal(true),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Admin Dashboard
        </h2>
        <p className="text-gray-600">
          Quick access to system management features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <button
              key={shortcut.id}
              onClick={shortcut.onClick}
              className="group relative bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-indigo-400 hover:shadow-xl transition-all duration-200 text-left"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-4 rounded-xl bg-gradient-to-br ${shortcut.color} text-white shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <Icon className="text-2xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">
                    {shortcut.title}
                  </h3>
                  <p className="text-sm text-gray-600">{shortcut.description}</p>
                </div>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modals */}
      <UserRecordsModal
        isOpen={showRecordsModal}
        onClose={() => {
          setShowRecordsModal(false);
          setSupplierFilter(undefined);
          setUserFilter(undefined);
        }}
        initialSupplierFilter={supplierFilter}
        initialUserFilter={userFilter}
      />
      <UsersListModal
        isOpen={showUsersModal}
        onClose={() => setShowUsersModal(false)}
        onUserClick={(userEmail, userId) => {
          // Use email for filtering as it's more user-friendly and works with the search
          setUserFilter(userEmail);
          setShowUsersModal(false);
          setShowRecordsModal(true);
        }}
      />
      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        onUserCreated={() => {
          // Optionally refresh users list if needed
        }}
      />
      <StatisticsModal
        isOpen={showStatisticsModal}
        onClose={() => setShowStatisticsModal(false)}
        onSupplierClick={(supplierName) => {
          setSupplierFilter(supplierName);
          setShowStatisticsModal(false);
          setShowRecordsModal(true);
        }}
      />
    </div>
  );
};

export default AdminComponent;
