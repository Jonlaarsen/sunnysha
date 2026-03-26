"use client";
import { useState, useEffect } from "react";
import {
  FaTimes,
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaEye,
  FaEnvelope,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
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

type EditableRecord = {
  id: number;
  partscode: string;
  supplier: string;
  po_number: string;
  delivery_date: string;
  inspection_date: string;
  delivery_quantity: string;
  return_quantity: string;
  lot_number: string;
  lot_quantity: string;
  inspector: string;
  sample_size: string;
  defective_count: string;
  judgement: string;
  strictness_adjustment: string;
  destination: string;
  group_leader_confirmation: string;
  quality_summary: string;
  remarks: string;
  selection_a: boolean;
  selection_b: boolean;
  selection_c: boolean;
  selection_d: boolean;
};

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
  const [recordToDelete, setRecordToDelete] = useState<QCRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EditableRecord | null>(null);
  const [updatingRecord, setUpdatingRecord] = useState(false);

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
        throw new Error(result.message || result.error || "获取记录失败");
      }

      setRecords(result.data || []);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "加载记录失败";
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
    if (typeof value === "boolean") return value ? "是" : "否";
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
    const mapped = userMap.get(userId);
    if (mapped) return mapped;
    if (userId.startsWith("deleted:")) return "已删除用户";
    return "未知";
  };

  const toEditableRecord = (record: QCRecord): EditableRecord => ({
    id: record.id,
    partscode: String(record.partscode || ""),
    supplier: String(record.supplier || ""),
    po_number: String(record.po_number || ""),
    delivery_date: String(record.delivery_date || ""),
    inspection_date: String(record.inspection_date || ""),
    delivery_quantity:
      record.delivery_quantity === null || record.delivery_quantity === undefined
        ? ""
        : String(record.delivery_quantity),
    return_quantity:
      record.return_quantity === null || record.return_quantity === undefined
        ? ""
        : String(record.return_quantity),
    lot_number: String(record.lot_number || ""),
    lot_quantity:
      record.lot_quantity === null || record.lot_quantity === undefined
        ? ""
        : String(record.lot_quantity),
    inspector: String(record.inspector || ""),
    sample_size:
      record.sample_size === null || record.sample_size === undefined
        ? ""
        : String(record.sample_size),
    defective_count:
      record.defective_count === null || record.defective_count === undefined
        ? ""
        : String(record.defective_count),
    judgement: String(record.judgement || ""),
    strictness_adjustment: String(record.strictness_adjustment || ""),
    destination: String(record.destination || ""),
    group_leader_confirmation: String(record.group_leader_confirmation || ""),
    quality_summary: String(record.quality_summary || ""),
    remarks: String(record.remarks || ""),
    selection_a: Boolean(record.selection_a),
    selection_b: Boolean(record.selection_b),
    selection_c: Boolean(record.selection_c),
    selection_d: Boolean(record.selection_d),
  });

  const updateEditableField = (field: keyof EditableRecord, value: string | boolean) => {
    setEditingRecord((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    setUpdatingRecord(true);
    try {
      const response = await fetch("/api/qc/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRecord.id,
          partscode: editingRecord.partscode,
          supplier: editingRecord.supplier,
          poNumber: editingRecord.po_number,
          deliveryDate: editingRecord.delivery_date,
          inspectionDate: editingRecord.inspection_date,
          deliveryQuantity: editingRecord.delivery_quantity,
          returnQuantity: editingRecord.return_quantity,
          lotNumber: editingRecord.lot_number,
          lotQuantity: editingRecord.lot_quantity,
          inspector: editingRecord.inspector,
          sampleSize: editingRecord.sample_size,
          defectiveCount: editingRecord.defective_count,
          judgement: editingRecord.judgement,
          strictnessAdjustment: editingRecord.strictness_adjustment,
          selections: {
            A: editingRecord.selection_a,
            B: editingRecord.selection_b,
            C: editingRecord.selection_c,
            D: editingRecord.selection_d,
          },
          destination: editingRecord.destination,
          groupLeaderConfirmation: editingRecord.group_leader_confirmation,
          qualitySummary: editingRecord.quality_summary,
          remarks: editingRecord.remarks,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error || "更新失败");
      }
      toast.success(result.message || "记录已更新");
      setEditingRecord(null);
      fetchRecords();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "更新失败");
    } finally {
      setUpdatingRecord(false);
    }
  };

  const handleConfirmDeleteRecord = async () => {
    if (!recordToDelete) return;
    setDeletingRecord(true);
    try {
      const response = await fetch("/api/qc/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recordToDelete.id }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error || "删除失败");
      }
      toast.success(result.message || "记录已删除");
      setRecordToDelete(null);
      fetchRecords();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "删除失败");
    } finally {
      setDeletingRecord(false);
    }
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
              全部质检记录
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              共 {records.length} 条记录
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
            placeholder="按部品番号、供方、用户邮箱或用户 ID 搜索..."
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
                {searchTerm ? "未找到匹配的记录。" : "暂无记录。"}
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
                            <span className="font-medium">用户：</span>{" "}
                            {getUserEmail(record.user_id)}
                          </div>
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">部品番号：</span>{" "}
                            {formatValue(record.partscode)}
                          </div>
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">供方：</span>{" "}
                            {formatValue(record.supplier)}
                          </div>
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">创建时间：</span>{" "}
                            {formatDate(record.created_at)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRecord(toEditableRecord(record));
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-indigo-200 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50"
                          >
                            <FaEdit />
                            编辑
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRecordToDelete(record);
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            <FaTrash />
                            删除
                          </button>
                          <FaEye className="text-indigo-500" />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="bg-gray-50 border-t border-gray-200 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          {/* Basic Information */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">
                              基本信息
                            </h4>
                            <div className="flex items-center gap-2">
                              <FaEnvelope className="text-gray-400 text-xs" />
                              <div className="flex-1">
                                <span className="text-gray-600">用户邮箱：</span>{" "}
                                <span className="font-medium text-indigo-600">
                                  {getUserEmail(record.user_id)}
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">用户 ID：</span>{" "}
                              <span className="font-mono text-xs">
                                {record.user_id}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">部品番号：</span>{" "}
                              {formatValue(record.partscode)}
                            </div>
                            <div>
                              <span className="text-gray-600">供方：</span>{" "}
                              {formatValue(record.supplier)}
                            </div>
                            <div>
                              <span className="text-gray-600">P/O：</span>{" "}
                              {formatValue(record.po_number)}
                            </div>
                          </div>

                          {/* Dates */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">
                              日期
                            </h4>
                            <div>
                              <span className="text-gray-600">纳入日：</span>{" "}
                              {formatDateOnly(record.delivery_date)}
                            </div>
                            <div>
                              <span className="text-gray-600">检完日：</span>{" "}
                              {formatDateOnly(record.inspection_date)}
                            </div>
                            <div>
                              <span className="text-gray-600">创建时间：</span>{" "}
                              {formatDate(record.created_at)}
                            </div>
                            <div>
                              <span className="text-gray-600">更新时间：</span>{" "}
                              {formatDate(record.updated_at)}
                            </div>
                          </div>

                          {/* Quantities */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">
                              数量
                            </h4>
                            <div>
                              <span className="text-gray-600">纳入数：</span>{" "}
                              {formatValue(record.delivery_quantity)}
                            </div>
                            <div>
                              <span className="text-gray-600">返品数：</span>{" "}
                              {formatValue(record.return_quantity)}
                            </div>
                            <div>
                              <span className="text-gray-600">Lot No.：</span>{" "}
                              {formatValue(record.lot_number)}
                            </div>
                            <div>
                              <span className="text-gray-600">Lot 数量：</span>{" "}
                              {formatValue(record.lot_quantity)}
                            </div>
                          </div>

                          {/* Inspection Details */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">
                              检查详情
                            </h4>
                            <div>
                              <span className="text-gray-600">检查员：</span>{" "}
                              {formatValue(record.inspector)}
                            </div>
                            <div>
                              <span className="text-gray-600">抽样数：</span>{" "}
                              {formatValue(record.sample_size)}
                            </div>
                            <div>
                              <span className="text-gray-600">不合格数：</span>{" "}
                              {formatValue(record.defective_count)}
                            </div>
                            <div>
                              <span className="text-gray-600">判定：</span>{" "}
                              {formatValue(record.judgement)}
                            </div>
                            <div>
                              <span className="text-gray-600">严格度调整：</span>{" "}
                              {formatValue(record.strictness_adjustment)}
                            </div>
                          </div>

                          {/* Selections */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">
                              选项
                            </h4>
                            <div>
                              <span className="text-gray-600">选项 A：</span>{" "}
                              {formatValue(record.selection_a)}
                            </div>
                            <div>
                              <span className="text-gray-600">选项 B：</span>{" "}
                              {formatValue(record.selection_b)}
                            </div>
                            <div>
                              <span className="text-gray-600">选项 C：</span>{" "}
                              {formatValue(record.selection_c)}
                            </div>
                            <div>
                              <span className="text-gray-600">选项 D：</span>{" "}
                              {formatValue(record.selection_d)}
                            </div>
                          </div>

                          {/* Additional Information */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">
                              其他信息
                            </h4>
                            <div>
                              <span className="text-gray-600">出货目的地：</span>{" "}
                              {formatValue(record.destination)}
                            </div>
                            <div>
                              <span className="text-gray-600">组长确认：</span>{" "}
                              {formatValue(record.group_leader_confirmation)}
                            </div>
                          </div>

                          {/* Text Fields */}
                          {(record.quality_summary || record.remarks) && (
                            <div className="md:col-span-2 lg:col-span-3 space-y-2">
                              {record.quality_summary && (
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-1">
                                    品质摘要：
                                  </h4>
                                  <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                                    {record.quality_summary}
                                  </p>
                                </div>
                              )}
                              {record.remarks && (
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-1">
                                    备注：
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
            显示 {filteredRecords.length} / {records.length} 条记录
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>

      {recordToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">确认删除报告</h3>
            <p className="text-sm text-gray-600 mb-5">
              确定要删除报告 ID {recordToDelete.id} 吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                disabled={deletingRecord}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRecord}
                disabled={deletingRecord}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deletingRecord ? <FaSpinner className="animate-spin" /> : null}
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {editingRecord && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">编辑报告 #{editingRecord.id}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <input className="border rounded p-2" placeholder="部品番号" value={editingRecord.partscode} onChange={(e) => updateEditableField("partscode", e.target.value)} />
              <input className="border rounded p-2" placeholder="供方" value={editingRecord.supplier} onChange={(e) => updateEditableField("supplier", e.target.value)} />
              <input className="border rounded p-2" placeholder="P/O" value={editingRecord.po_number} onChange={(e) => updateEditableField("po_number", e.target.value)} />
              <input className="border rounded p-2" placeholder="检查员" value={editingRecord.inspector} onChange={(e) => updateEditableField("inspector", e.target.value)} />
              <input className="border rounded p-2" type="date" value={editingRecord.delivery_date ? editingRecord.delivery_date.split("T")[0] : ""} onChange={(e) => updateEditableField("delivery_date", e.target.value)} />
              <input className="border rounded p-2" type="date" value={editingRecord.inspection_date ? editingRecord.inspection_date.split("T")[0] : ""} onChange={(e) => updateEditableField("inspection_date", e.target.value)} />
              <input className="border rounded p-2" placeholder="纳入数" value={editingRecord.delivery_quantity} onChange={(e) => updateEditableField("delivery_quantity", e.target.value)} />
              <input className="border rounded p-2" placeholder="返品数" value={editingRecord.return_quantity} onChange={(e) => updateEditableField("return_quantity", e.target.value)} />
              <input className="border rounded p-2" placeholder="Lot No." value={editingRecord.lot_number} onChange={(e) => updateEditableField("lot_number", e.target.value)} />
              <input className="border rounded p-2" placeholder="Lot 数量" value={editingRecord.lot_quantity} onChange={(e) => updateEditableField("lot_quantity", e.target.value)} />
              <input className="border rounded p-2" placeholder="抽样数" value={editingRecord.sample_size} onChange={(e) => updateEditableField("sample_size", e.target.value)} />
              <input className="border rounded p-2" placeholder="不合格数" value={editingRecord.defective_count} onChange={(e) => updateEditableField("defective_count", e.target.value)} />
              <input className="border rounded p-2" placeholder="判定" value={editingRecord.judgement} onChange={(e) => updateEditableField("judgement", e.target.value)} />
              <input className="border rounded p-2" placeholder="严格度调整" value={editingRecord.strictness_adjustment} onChange={(e) => updateEditableField("strictness_adjustment", e.target.value)} />
              <input className="border rounded p-2" placeholder="出货目的地" value={editingRecord.destination} onChange={(e) => updateEditableField("destination", e.target.value)} />
              <input className="border rounded p-2" placeholder="组长确认" value={editingRecord.group_leader_confirmation} onChange={(e) => updateEditableField("group_leader_confirmation", e.target.value)} />
            </div>
            <textarea className="mt-4 w-full border rounded p-2 text-sm" rows={3} placeholder="品质摘要" value={editingRecord.quality_summary} onChange={(e) => updateEditableField("quality_summary", e.target.value)} />
            <textarea className="mt-3 w-full border rounded p-2 text-sm" rows={3} placeholder="备注" value={editingRecord.remarks} onChange={(e) => updateEditableField("remarks", e.target.value)} />
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={editingRecord.selection_a} onChange={(e) => updateEditableField("selection_a", e.target.checked)} />选项 A</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={editingRecord.selection_b} onChange={(e) => updateEditableField("selection_b", e.target.checked)} />选项 B</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={editingRecord.selection_c} onChange={(e) => updateEditableField("selection_c", e.target.checked)} />选项 C</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={editingRecord.selection_d} onChange={(e) => updateEditableField("selection_d", e.target.checked)} />选项 D</label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                disabled={updatingRecord}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={updatingRecord || !editingRecord.partscode || !editingRecord.supplier}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {updatingRecord ? <FaSpinner className="animate-spin" /> : null}
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

