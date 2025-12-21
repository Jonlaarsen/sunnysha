"use client";
import { useState, useEffect } from "react";
import { FaTimes, FaSpinner, FaChevronDown, FaChevronUp, FaEye, FaEnvelope } from "react-icons/fa";
import toast from "react-hot-toast";

interface QCRecord {
  id: number;
  user_id: string;
  partscode: string;
  supplier: string;
  po_number?: string | null;
  delivery_date?: string | null;
  inspection_date?: string | null;
  delivery_quantity?: number | null;
  return_quantity?: number | null;
  lot_number?: string | null;
  lot_quantity?: number | null;
  inspector?: string | null;
  sample_size?: number | null;
  defective_count?: number | null;
  judgement?: string | null;
  strictness_adjustment?: string | null;
  selection_a?: boolean | null;
  selection_b?: boolean | null;
  selection_c?: boolean | null;
  selection_d?: boolean | null;
  destination?: string | null;
  group_leader_confirmation?: string | null;
  quality_summary?: string | null;
  remarks?: string | null;
  created_at: string;
  updated_at?: string | null;
  [key: string]: unknown;
}

interface UserRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSupplierFilter?: string;
  initialUserFilter?: string; // Can be user_id or email
}

interface User {
  id: string;
  email: string;
}

export default function UserRecordsModal({
  isOpen,
  onClose,
  initialSupplierFilter,
  initialUserFilter,
}: UserRecordsModalProps) {
  const [records, setRecords] = useState<QCRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (isOpen) {
      fetchRecords();
      fetchUsers();
      // Set initial filter if provided (supplier takes precedence)
      if (initialSupplierFilter) {
        setSearchTerm(initialSupplierFilter);
      } else if (initialUserFilter) {
        setSearchTerm(initialUserFilter);
      }
    } else {
      // Reset search term when modal closes
      setSearchTerm("");
    }
  }, [isOpen, initialSupplierFilter, initialUserFilter]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      const result = await response.json();

      if (response.ok && result.data) {
        // Create a map of user_id to email
        const map = new Map<string, string>();
        result.data.forEach((user: User) => {
          map.set(user.id, user.email);
        });
        setUserMap(map);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      // Don't show error toast, just continue without user emails
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/qc/records");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Failed to fetch records");
      }

      setRecords(result.data || []);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load records";
      toast.error(errorMessage, {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
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

  const formatDateOnly = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getUserEmail = (userId: string): string => {
    return userMap.get(userId) || "Unknown";
  };

  const filteredRecords = records.filter((record) => {
    const searchLower = searchTerm.toLowerCase();
    const userEmail = getUserEmail(record.user_id).toLowerCase();
    return (
      record.partscode?.toLowerCase().includes(searchLower) ||
      record.supplier?.toLowerCase().includes(searchLower) ||
      record.user_id?.toLowerCase().includes(searchLower) ||
      userEmail.includes(searchLower)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              All QC Records
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {records.length} total records
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
            placeholder="Search by part code, supplier, user email, or user ID..."
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
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm ? "No records found matching your search." : "No records found."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRecords.map((record) => {
                const isExpanded = expandedRows.has(record.id);
                return (
                  <div
                    key={record.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:border-indigo-400 transition-colors"
                  >
                    {/* Summary Row */}
                    <div
                      className="bg-white p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleRow(record.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 flex-wrap">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <FaChevronUp className="text-gray-400" />
                            ) : (
                              <FaChevronDown className="text-gray-400" />
                            )}
                            <span className="text-sm font-semibold text-gray-500">
                              ID: {record.id}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 flex items-center gap-1">
                            <FaEnvelope className="text-gray-400 text-xs" />
                            <span className="font-medium">User:</span>{" "}
                            {getUserEmail(record.user_id)}
                          </div>
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">Part Code:</span>{" "}
                            {formatValue(record.partscode)}
                          </div>
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">Supplier:</span>{" "}
                            {formatValue(record.supplier)}
                          </div>
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">Created:</span>{" "}
                            {formatDate(record.created_at)}
                          </div>
                        </div>
                        <FaEye className="text-indigo-500" />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="bg-gray-50 border-t border-gray-200 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          {/* Basic Information */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">
                              Basic Information
                            </h4>
                            <div className="flex items-center gap-2">
                              <FaEnvelope className="text-gray-400 text-xs" />
                              <div className="flex-1">
                                <span className="text-gray-600">User Email:</span>{" "}
                                <span className="font-medium text-indigo-600">
                                  {getUserEmail(record.user_id)}
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">User ID:</span>{" "}
                              <span className="font-mono text-xs">
                                {record.user_id}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Part Code:</span>{" "}
                              {formatValue(record.partscode)}
                            </div>
                            <div>
                              <span className="text-gray-600">Supplier:</span>{" "}
                              {formatValue(record.supplier)}
                            </div>
                            <div>
                              <span className="text-gray-600">PO Number:</span>{" "}
                              {formatValue(record.po_number)}
                            </div>
                          </div>

                          {/* Dates */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">
                              Dates
                            </h4>
                            <div>
                              <span className="text-gray-600">Delivery Date:</span>{" "}
                              {formatDateOnly(record.delivery_date)}
                            </div>
                            <div>
                              <span className="text-gray-600">Inspection Date:</span>{" "}
                              {formatDateOnly(record.inspection_date)}
                            </div>
                            <div>
                              <span className="text-gray-600">Created At:</span>{" "}
                              {formatDate(record.created_at)}
                            </div>
                            <div>
                              <span className="text-gray-600">Updated At:</span>{" "}
                              {formatDate(record.updated_at)}
                            </div>
                          </div>

                          {/* Quantities */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">
                              Quantities
                            </h4>
                            <div>
                              <span className="text-gray-600">Delivery Qty:</span>{" "}
                              {formatValue(record.delivery_quantity)}
                            </div>
                            <div>
                              <span className="text-gray-600">Return Qty:</span>{" "}
                              {formatValue(record.return_quantity)}
                            </div>
                            <div>
                              <span className="text-gray-600">Lot Number:</span>{" "}
                              {formatValue(record.lot_number)}
                            </div>
                            <div>
                              <span className="text-gray-600">Lot Quantity:</span>{" "}
                              {formatValue(record.lot_quantity)}
                            </div>
                          </div>

                          {/* Inspection Details */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">
                              Inspection Details
                            </h4>
                            <div>
                              <span className="text-gray-600">Inspector:</span>{" "}
                              {formatValue(record.inspector)}
                            </div>
                            <div>
                              <span className="text-gray-600">Sample Size:</span>{" "}
                              {formatValue(record.sample_size)}
                            </div>
                            <div>
                              <span className="text-gray-600">Defective Count:</span>{" "}
                              {formatValue(record.defective_count)}
                            </div>
                            <div>
                              <span className="text-gray-600">Judgement:</span>{" "}
                              {formatValue(record.judgement)}
                            </div>
                            <div>
                              <span className="text-gray-600">Strictness Adjustment:</span>{" "}
                              {formatValue(record.strictness_adjustment)}
                            </div>
                          </div>

                          {/* Selections */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">
                              Selections
                            </h4>
                            <div>
                              <span className="text-gray-600">Selection A:</span>{" "}
                              {formatValue(record.selection_a)}
                            </div>
                            <div>
                              <span className="text-gray-600">Selection B:</span>{" "}
                              {formatValue(record.selection_b)}
                            </div>
                            <div>
                              <span className="text-gray-600">Selection C:</span>{" "}
                              {formatValue(record.selection_c)}
                            </div>
                            <div>
                              <span className="text-gray-600">Selection D:</span>{" "}
                              {formatValue(record.selection_d)}
                            </div>
                          </div>

                          {/* Additional Information */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">
                              Additional Information
                            </h4>
                            <div>
                              <span className="text-gray-600">Destination:</span>{" "}
                              {formatValue(record.destination)}
                            </div>
                            <div>
                              <span className="text-gray-600">Group Leader Confirmation:</span>{" "}
                              {formatValue(record.group_leader_confirmation)}
                            </div>
                          </div>

                          {/* Text Fields */}
                          {(record.quality_summary || record.remarks) && (
                            <div className="md:col-span-2 lg:col-span-3 space-y-2">
                              {record.quality_summary && (
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-1">
                                    Quality Summary:
                                  </h4>
                                  <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                                    {record.quality_summary}
                                  </p>
                                </div>
                              )}
                              {record.remarks && (
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-1">
                                    Remarks:
                                  </h4>
                                  <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                                    {record.remarks}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredRecords.length} of {records.length} records
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

