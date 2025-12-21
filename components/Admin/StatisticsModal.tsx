"use client";
import { useState, useEffect } from "react";
import {
  FaTimes,
  FaSpinner,
  FaSearch,
  FaChartLine,
  FaCheckCircle,
  FaTimesCircle,
  FaExternalLinkAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";

interface SupplierStats {
  supplier: string;
  totalRecords: number;
  passCount: number;
  failCount: number;
  passRate: number;
  averageDefectiveCount: number;
  latestRecordDate: string;
  latestRecordId: number;
}

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierClick?: (supplierName: string) => void;
}

const StatisticsModal = ({ isOpen, onClose, onSupplierClick }: StatisticsModalProps) => {
  const [suppliers, setSuppliers] = useState<SupplierStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
    } else {
      // Reset state when modal closes
      setSuppliers([]);
      setSearchQuery("");
    }
  }, [isOpen]);

  const fetchSuppliers = async (search?: string) => {
    setIsLoading(true);
    try {
      const url = search
        ? `/api/admin/statistics/suppliers?search=${encodeURIComponent(search)}`
        : "/api/admin/statistics/suppliers";

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Failed to fetch statistics"
        );
      }

      if (result.success && result.data) {
        setSuppliers(result.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch supplier statistics";
      console.error("Error fetching supplier statistics:", error);
      toast.error(errorMessage);
      setSuppliers([]);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      fetchSuppliers(searchQuery.trim());
    } else {
      fetchSuppliers();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    fetchSuppliers();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getPassRateBgColor = (rate: number) => {
    if (rate >= 90) return "bg-green-100";
    if (rate >= 70) return "bg-yellow-100";
    return "bg-red-100";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200  rounded-t-xl">
          <div className="flex items-center gap-3">
            <FaChartLine className="text-3xl text-orange-500" />
            <h2 className="text-2xl font-bold">
              Supplier Statistics & Reports
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search suppliers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <FaSearch />
                  Search
                </>
              )}
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <FaSpinner className="animate-spin text-4xl text-orange-500" />
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchQuery
                  ? "No suppliers found matching your search."
                  : "No supplier statistics available."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {suppliers.map((supplier, index) => (
                <div
                  key={`${supplier.supplier}-${supplier.latestRecordId}`}
                  onClick={() => onSupplierClick?.(supplier.supplier)}
                  className={`bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-orange-300 hover:shadow-lg transition-all ${
                    onSupplierClick ? "cursor-pointer" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-gray-800">
                          {supplier.supplier}
                        </h3>
                        {onSupplierClick && (
                          <FaExternalLinkAlt className="text-orange-500 text-sm" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Latest record: {formatDate(supplier.latestRecordDate)}
                      </p>
                      {onSupplierClick && (
                        <p className="text-xs text-orange-600 mt-1 font-medium">
                          Click to view all records
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">
                        #{index + 1}
                      </div>
                      <div className="text-xs text-gray-500">Rank</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Total Records */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">
                        Total Records
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {supplier.totalRecords}
                      </div>
                    </div>

                    {/* Pass Rate */}
                    <div
                      className={`${getPassRateBgColor(
                        supplier.passRate
                      )} rounded-lg p-4`}
                    >
                      <div className="text-sm text-gray-600 mb-1">
                        Pass Rate
                      </div>
                      <div
                        className={`text-2xl font-bold ${getPassRateColor(
                          supplier.passRate
                        )}`}
                      >
                        {supplier.passRate.toFixed(1)}%
                      </div>
                    </div>

                    {/* Pass/Fail Count */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-2">Results</div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <FaCheckCircle className="text-green-500" />
                          <span className="font-semibold text-green-600">
                            {supplier.passCount}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaTimesCircle className="text-red-500" />
                          <span className="font-semibold text-red-600">
                            {supplier.failCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Average Defective Count */}
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">
                        Avg Defects
                      </div>
                      <div className="text-2xl font-bold text-purple-600">
                        {supplier.averageDefectiveCount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {searchQuery
                ? `Showing ${suppliers.length} supplier(s) matching "${searchQuery}"`
                : `Showing top ${suppliers.length} most recent supplier(s)`}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsModal;
