"use client";
import { useState, useEffect } from "react";
import { FaTimes, FaSpinner, FaCalendar, FaUser, FaBox } from "react-icons/fa";
import toast from "react-hot-toast";

interface HistoryRecord {
  id: number;
  partscode: string;
  supplier: string;
  po_number: string | null;
  delivery_date: string | null;
  inspection_date: string | null;
  created_at: string;
  [key: string]: unknown;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/qc/records?limit=10");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Failed to fetch history");
      }

      setRecords(result.data || []);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load history";
      toast.error(errorMessage, {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("zh-CN", {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaCalendar className="text-indigo-600" />
            历史记录 (最近10条)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FaSpinner className="animate-spin text-4xl text-indigo-600" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaBox className="text-6xl mx-auto mb-4 opacity-50" />
              <p className="text-lg">暂无历史记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">部品番号</div>
                      <div className="font-semibold text-gray-800">
                        {record.partscode || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">供方</div>
                      <div className="font-semibold text-gray-800">
                        {record.supplier || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">P/O</div>
                      <div className="font-semibold text-gray-800">
                        {record.po_number || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">纳入日</div>
                      <div className="text-gray-800">
                        {formatDate(record.delivery_date)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">检完日</div>
                      <div className="text-gray-800">
                        {formatDate(record.inspection_date)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">提交时间</div>
                      <div className="text-gray-800 text-sm">
                        {formatDateTime(record.created_at)}
                      </div>
                    </div>
                  </div>
                  {record.judgement && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-500 mb-1">判定</div>
                      <div className="font-semibold text-gray-800">
                        {record.judgement}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

