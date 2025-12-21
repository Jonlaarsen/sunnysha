import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import {
  FaArrowLeft,
  FaCheck,
  FaCheckCircle,
  FaClipboard,
  FaHistory,
  FaPen,
  FaPlus,
  FaSpinner,
  FaTrash,
} from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import { IoWarning } from "react-icons/io5";
import toast from "react-hot-toast";

interface FormData {
  id?: number; // Supabase record ID (optional, only present after saving to database)
  partscode: string;
  supplier: string;
  poNumber: string;
  deliveryDate: string;
  inspectionDate: string;
  deliveryQuantity: string;
  returnQuantity: string;
  lotNumber: string;
  lotQuantity: string;
  inspector: string;
  sampleSize: string;
  defectiveCount: string;
  judgement: string;
  strictnessAdjustment: string;
  selections: {
    A: boolean;
    B: boolean;
    C: boolean;
    D: boolean;
  };
  destination: string;
  groupLeaderConfirmation: string;
  qualitySummary: string;
  remarks: string;
}

interface FormFieldsTwoProps {
  fetchedData?: FormData;
}

export interface FormFieldsTwoRef {
  populateFormWithBarcodeData: (data: FormData) => void;
}

const FormFieldsTwo = forwardRef<FormFieldsTwoRef, FormFieldsTwoProps>(
  ({ fetchedData }, ref) => {
    const getToday = () => new Date().toISOString().split("T")[0];

    const [currentForm, setCurrentForm] = useState<FormData>({
      partscode: "",
      supplier: "",
      poNumber: "",
      deliveryDate: getToday(),
      inspectionDate: getToday(),
      deliveryQuantity: "",
      returnQuantity: "",
      lotNumber: "",
      lotQuantity: "",
      inspector: "",
      sampleSize: "",
      defectiveCount: "",
      judgement: "",
      strictnessAdjustment: "",
      selections: {
        A: false,
        B: false,
        C: false,
        D: false,
      },
      destination: "",
      groupLeaderConfirmation: "",
      qualitySummary: "",
      remarks: "",
    });

    const [savedRecords, setSavedRecords] = useState<FormData[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [originalRecord, setOriginalRecord] = useState<FormData | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    useEffect(() => {
      if (fetchedData) {
        setCurrentForm((prev) => ({
          ...prev,
          ...fetchedData,
          deliveryDate: getToday(),
          inspectionDate: getToday(),
        }));
      }
    }, [fetchedData]);

    const handleInputChange = (field: keyof FormData, value: string) => {
      let nextValue = value;
      if (field === "deliveryDate" || field === "inspectionDate") {
        nextValue = getToday();
      }
      setCurrentForm((prev) => ({ ...prev, [field]: nextValue }));
    };

    const handleSelectionChange = (
      selection: keyof FormData["selections"],
      checked: boolean
    ) => {
      setCurrentForm((prev) => ({
        ...prev,
        selections: {
          ...prev.selections,
          [selection]: checked,
        },
      }));
    };

    const handleKeyDown = (
      e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const currentElement = e.currentTarget;
        const form =
          currentElement.closest("form") || currentElement.closest(".grid");
        if (form) {
          const inputs = Array.from(form.querySelectorAll("input, select")) as (
            | HTMLInputElement
            | HTMLSelectElement
          )[];
          const currentIndex = inputs.indexOf(currentElement);
          const nextIndex = currentIndex + 1;

          if (nextIndex < inputs.length) {
            inputs[nextIndex].focus();
          } else {
            // If we're at the last input, focus the save button
            const saveButton = document.querySelector(
              'button[onClick*="saveCurrentRecord"]'
            ) as HTMLButtonElement;
            if (saveButton) {
              saveButton.focus();
            }
          }
        }
      }
    };

    const handleCheckboxKeyDown = (
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const currentElement = e.currentTarget;
        const form =
          currentElement.closest("form") || currentElement.closest(".grid");
        if (form) {
          const inputs = Array.from(form.querySelectorAll("input, select")) as (
            | HTMLInputElement
            | HTMLSelectElement
          )[];
          const currentIndex = inputs.indexOf(currentElement);
          const nextIndex = currentIndex + 1;

          if (nextIndex < inputs.length) {
            inputs[nextIndex].focus();
          } else {
            // If we're at the last input, focus the save button
            const saveButton = document.querySelector(
              'button[onClick*="saveCurrentRecord"]'
            ) as HTMLButtonElement;
            if (saveButton) {
              saveButton.focus();
            }
          }
        }
      }
    };

    const saveCurrentRecord = async () => {
      // Prevent multiple submissions
      if (isSaving) {
        return;
      }

      // Validate required fields
      if (!currentForm.partscode || !currentForm.supplier) {
        toast.error("部品番号和供方为必填项！", {
          duration: 3000,
          icon: <IoWarning />,
        });
        return;
      }

      setIsSaving(true);

      try {
        // Show loading toast
        const loadingToast = toast.loading("正在保存检查记录...", {
          icon: <FaSpinner className="animate-spin" />,
        });

        // Send POST request to API
        const response = await fetch("/api/qc/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(currentForm),
        });

        // Check if response has content before parsing JSON
        const text = await response.text();
        let result;

        try {
          result = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error("Failed to parse response:", parseError);
          throw new Error("服务器响应格式错误，请重试");
        }

        if (!response.ok) {
          throw new Error(result.message || result.error || "保存失败");
        }

        // Dismiss loading toast
        toast.dismiss(loadingToast);

        // Transform Supabase response to FormData format and include the ID
        const savedRecord: FormData = {
          id: result.data?.id, // Store the Supabase ID
          partscode: result.data?.partscode || currentForm.partscode,
          supplier: result.data?.supplier || currentForm.supplier,
          poNumber: result.data?.po_number || currentForm.poNumber,
          deliveryDate: result.data?.delivery_date || currentForm.deliveryDate,
          inspectionDate:
            result.data?.inspection_date || currentForm.inspectionDate,
          deliveryQuantity:
            result.data?.delivery_quantity?.toString() ||
            currentForm.deliveryQuantity,
          returnQuantity:
            result.data?.return_quantity?.toString() ||
            currentForm.returnQuantity,
          lotNumber: result.data?.lot_number || currentForm.lotNumber,
          lotQuantity:
            result.data?.lot_quantity?.toString() || currentForm.lotQuantity,
          inspector: result.data?.inspector || currentForm.inspector,
          sampleSize:
            result.data?.sample_size?.toString() || currentForm.sampleSize,
          defectiveCount:
            result.data?.defective_count?.toString() ||
            currentForm.defectiveCount,
          judgement: result.data?.judgement || currentForm.judgement,
          strictnessAdjustment:
            result.data?.strictness_adjustment ||
            currentForm.strictnessAdjustment,
          selections: {
            A: result.data?.selection_a || currentForm.selections.A,
            B: result.data?.selection_b || currentForm.selections.B,
            C: result.data?.selection_c || currentForm.selections.C,
            D: result.data?.selection_d || currentForm.selections.D,
          },
          destination: result.data?.destination || currentForm.destination,
          groupLeaderConfirmation:
            result.data?.group_leader_confirmation ||
            currentForm.groupLeaderConfirmation,
          qualitySummary:
            result.data?.quality_summary || currentForm.qualitySummary,
          remarks: result.data?.remarks || currentForm.remarks,
        };

        // Save current form data to saved records (latest record at the top)
        setSavedRecords((prev) => [savedRecord, ...prev]);

        // Show success toast
        toast.success(result.message || "检查记录已成功保存！", {
          duration: 3000,
          icon: <FaCheckCircle />,
        });

        // Clear the current form
        setCurrentForm({
          partscode: "",
          supplier: "",
          poNumber: "",
          deliveryDate: getToday(),
          inspectionDate: getToday(),
          deliveryQuantity: "",
          returnQuantity: "",
          lotNumber: "",
          lotQuantity: "",
          inspector: "",
          sampleSize: "",
          defectiveCount: "",
          judgement: "",
          strictnessAdjustment: "",
          selections: {
            A: false,
            B: false,
            C: false,
            D: false,
          },
          destination: "",
          groupLeaderConfirmation: "",
          qualitySummary: "",
          remarks: "",
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "保存失败，请重试";
        toast.error(errorMessage, {
          duration: 3000,
          icon: <IoWarning />,
        });
        console.error("Error saving record:", error);
      } finally {
        setIsSaving(false);
      }
    };

    const deleteRecord = (index: number) => {
      setRecordToDelete(index);
      setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
      if (recordToDelete === null) return;

      // Prevent multiple deletions
      if (isDeleting) {
        return;
      }

      const recordToDeleteData = savedRecords[recordToDelete];

      // If record doesn't have an ID, it was never saved to database, just remove from local state
      if (!recordToDeleteData.id) {
        setSavedRecords((prev) => prev.filter((_, i) => i !== recordToDelete));
        setShowDeleteModal(false);
        setRecordToDelete(null);
        toast.success("检查记录已成功删除！", {
          duration: 3000,
          icon: <FaTrash />,
        });
        return;
      }

      setIsDeleting(true);

      try {
        // Show loading toast
        const loadingToast = toast.loading("正在删除检查记录...", {
          icon: <FaSpinner className="animate-spin" />,
        });

        // Send DELETE request to API
        const response = await fetch(
          `/api/qc/delete?id=${recordToDeleteData.id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        // Check if response has content before parsing JSON
        const text = await response.text();
        let result;

        try {
          result = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error("Failed to parse response:", parseError);
          throw new Error("服务器响应格式错误，请重试");
        }

        if (!response.ok) {
          throw new Error(result.message || result.error || "删除失败");
        }

        // Dismiss loading toast
        toast.dismiss(loadingToast);

        // Remove from local state only after successful API deletion
        setSavedRecords((prev) => prev.filter((_, i) => i !== recordToDelete));
        setShowDeleteModal(false);
        setRecordToDelete(null);

        // Show success toast
        toast.success(result.message || "检查记录已成功删除！", {
          duration: 3000,
          icon: <FaTrash />,
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "删除失败，请重试";
        toast.error(errorMessage, {
          duration: 3000,
          icon: <IoWarning />,
        });
        console.error("Error deleting record:", error);
      } finally {
        setIsDeleting(false);
      }
    };

    const cancelDelete = () => {
      setShowDeleteModal(false);
      setRecordToDelete(null);
    };

    const loadHistory = async () => {
      // Prevent multiple requests
      if (isLoadingHistory) {
        return;
      }

      setIsLoadingHistory(true);

      try {
        // Show loading toast
        const loadingToast = toast.loading("正在加载历史记录...", {
          icon: <FaSpinner className="animate-spin" />,
        });

        // Fetch latest 10 records from API
        const response = await fetch("/api/qc/records?limit=10", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // Check if response has content before parsing JSON
        const text = await response.text();
        let result;

        try {
          result = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error("Failed to parse response:", parseError);
          throw new Error("服务器响应格式错误，请重试");
        }

        if (!response.ok) {
          throw new Error(result.message || result.error || "加载失败");
        }

        // Dismiss loading toast
        toast.dismiss(loadingToast);

        // Transform Supabase records to FormData format
        interface SupabaseRecord {
          id: number;
          partscode?: string | null;
          supplier?: string | null;
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
        }
        const historyRecords: FormData[] = (result.data || []).map(
          (record: SupabaseRecord) => ({
            id: record.id,
            partscode: record.partscode || "",
            supplier: record.supplier || "",
            poNumber: record.po_number || "",
            deliveryDate: record.delivery_date || "",
            inspectionDate: record.inspection_date || "",
            deliveryQuantity: record.delivery_quantity?.toString() || "",
            returnQuantity: record.return_quantity?.toString() || "",
            lotNumber: record.lot_number || "",
            lotQuantity: record.lot_quantity?.toString() || "",
            inspector: record.inspector || "",
            sampleSize: record.sample_size?.toString() || "",
            defectiveCount: record.defective_count?.toString() || "",
            judgement: record.judgement || "",
            strictnessAdjustment: record.strictness_adjustment || "",
            selections: {
              A: record.selection_a || false,
              B: record.selection_b || false,
              C: record.selection_c || false,
              D: record.selection_d || false,
            },
            destination: record.destination || "",
            groupLeaderConfirmation: record.group_leader_confirmation || "",
            qualitySummary: record.quality_summary || "",
            remarks: record.remarks || "",
          })
        );

        // Replace savedRecords with history (or merge if preferred)
        setSavedRecords(historyRecords);

        // Show success toast
        toast.success(`已加载 ${historyRecords.length} 条历史记录`, {
          duration: 3000,
          icon: <FaHistory />,
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "加载失败，请重试";
        toast.error(errorMessage, {
          duration: 3000,
          icon: <IoWarning />,
        });
        console.error("Error loading history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    const editRecord = (index: number) => {
      const recordToEdit = savedRecords[index];
      setOriginalRecord({ ...recordToEdit }); // Store original data
      setEditingIndex(index);
    };

    const saveEdit = async () => {
      if (editingIndex === null) return;

      // Prevent multiple submissions
      if (isUpdating) {
        return;
      }

      const recordToUpdate = savedRecords[editingIndex];

      // Check if record has an ID (was saved to Supabase)
      if (!recordToUpdate.id) {
        toast.error("无法更新：记录尚未保存到数据库", {
          duration: 3000,
          icon: <IoWarning />,
        });
        return;
      }

      setIsUpdating(true);

      try {
        // Show loading toast
        const loadingToast = toast.loading("正在更新检查记录...", {
          icon: <FaSpinner className="animate-spin" />,
        });

        // Send PATCH request to update API
        const response = await fetch("/api/qc/update", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: recordToUpdate.id,
            ...recordToUpdate,
          }),
        });

        // Check if response has content before parsing JSON
        const text = await response.text();
        let result;

        try {
          result = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error("Failed to parse response:", parseError);
          throw new Error("服务器响应格式错误，请重试");
        }

        if (!response.ok) {
          throw new Error(result.message || result.error || "更新失败");
        }

        // Dismiss loading toast
        toast.dismiss(loadingToast);

        // Transform Supabase response to FormData format
        const updatedRecord: FormData = {
          id: result.data?.id || recordToUpdate.id,
          partscode: result.data?.partscode || recordToUpdate.partscode,
          supplier: result.data?.supplier || recordToUpdate.supplier,
          poNumber: result.data?.po_number || recordToUpdate.poNumber,
          deliveryDate:
            result.data?.delivery_date || recordToUpdate.deliveryDate,
          inspectionDate:
            result.data?.inspection_date || recordToUpdate.inspectionDate,
          deliveryQuantity:
            result.data?.delivery_quantity?.toString() ||
            recordToUpdate.deliveryQuantity,
          returnQuantity:
            result.data?.return_quantity?.toString() ||
            recordToUpdate.returnQuantity,
          lotNumber: result.data?.lot_number || recordToUpdate.lotNumber,
          lotQuantity:
            result.data?.lot_quantity?.toString() || recordToUpdate.lotQuantity,
          inspector: result.data?.inspector || recordToUpdate.inspector,
          sampleSize:
            result.data?.sample_size?.toString() || recordToUpdate.sampleSize,
          defectiveCount:
            result.data?.defective_count?.toString() ||
            recordToUpdate.defectiveCount,
          judgement: result.data?.judgement || recordToUpdate.judgement,
          strictnessAdjustment:
            result.data?.strictness_adjustment ||
            recordToUpdate.strictnessAdjustment,
          selections: {
            A: result.data?.selection_a ?? recordToUpdate.selections.A,
            B: result.data?.selection_b ?? recordToUpdate.selections.B,
            C: result.data?.selection_c ?? recordToUpdate.selections.C,
            D: result.data?.selection_d ?? recordToUpdate.selections.D,
          },
          destination: result.data?.destination || recordToUpdate.destination,
          groupLeaderConfirmation:
            result.data?.group_leader_confirmation ||
            recordToUpdate.groupLeaderConfirmation,
          qualitySummary:
            result.data?.quality_summary || recordToUpdate.qualitySummary,
          remarks: result.data?.remarks || recordToUpdate.remarks,
        };

        // Update the record in savedRecords with the updated data
        setSavedRecords((prev) =>
          prev.map((record, index) =>
            index === editingIndex ? updatedRecord : record
          )
        );

        setEditingIndex(null);
        setOriginalRecord(null);

        // Show success toast
        toast.success(result.message || "检查记录已成功更新！", {
          duration: 3000,
          icon: <FaPen />,
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "更新失败，请重试";
        toast.error(errorMessage, {
          duration: 3000,
          icon: <IoWarning />,
        });
        console.error("Error updating record:", error);
      } finally {
        setIsUpdating(false);
      }
    };

    const cancelEdit = () => {
      if (editingIndex !== null && originalRecord) {
        // Restore the original record data
        setSavedRecords((prev) =>
          prev.map((record, index) =>
            index === editingIndex ? { ...originalRecord } : record
          )
        );
      }
      setEditingIndex(null);
      setOriginalRecord(null);

      // Show info toast
      toast("编辑已取消", {
        duration: 2000,
        icon: <FaArrowLeft />,
        style: {
          background: "#f3f4f6",
          color: "#374151",
        },
      });
    };

    const populateFormWithBarcodeData = (data: FormData) => {
      const updatedData = {
        ...data,
        deliveryDate: getToday(),
        inspectionDate: getToday(),
        partscode: data.partscode || "",
        supplier: data.supplier || "",
      };
      setCurrentForm(updatedData);

      // Show success toast
      toast.success("表单已自动填充！", {
        duration: 3000,
        icon: <FaClipboard />,
      });
    };

    useImperativeHandle(ref, () => ({
      populateFormWithBarcodeData,
    }));

    const renderCurrentForm = () => (
      <div className="grid grid-cols-13 border-x border-b">
        {/* PO number */}
        <div className="col-span-1">
          <input
            value={currentForm.poNumber}
            onChange={(e) => handleInputChange("poNumber", e.target.value)}
            onKeyDown={handleKeyDown}
            tabIndex={1}
            required
            placeholder="12345"
            className="w-full h-20 text-center border border-black bg-white px-1
            focus:ring-2 focus:ring-sky-600 focus:ring-offset-0 rounded-none"
          />
        </div>
        {/* dates */}
        <div>
          <input
            value={currentForm.deliveryDate}
            onChange={(e) => handleInputChange("deliveryDate", e.target.value)}
            onKeyDown={handleKeyDown}
            tabIndex={2}
            required
            type="date"
            max={new Date().toISOString().split("T")[0]}
            className="w-full h-10 text-center border border-black bg-white px-1
            focus:ring-2 focus:ring-sky-600 focus:ring-offset-0 rounded-none"
          />
          <input
            value={currentForm.inspectionDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) =>
              handleInputChange("inspectionDate", e.target.value)
            }
            onKeyDown={handleKeyDown}
            tabIndex={3}
            required
            type="date"
            className="w-full h-10 text-center border border-black bg-white px-1
            focus:ring-2 focus:ring-sky-600 focus:ring-offset-0 rounded-none"
          />
        </div>
        {/* quantity */}
        <div>
          <input
            value={currentForm.deliveryQuantity}
            onChange={(e) =>
              handleInputChange("deliveryQuantity", e.target.value)
            }
            onKeyDown={handleKeyDown}
            tabIndex={4}
            required
            type="number"
            className="w-full h-10 text-center border border-black bg-white px-1
            focus:ring-2 focus:ring-sky-600 focus:ring-offset-0 rounded-none"
          />
          <input
            value={currentForm.returnQuantity}
            onChange={(e) =>
              handleInputChange("returnQuantity", e.target.value)
            }
            onKeyDown={handleKeyDown}
            tabIndex={5}
            required
            type="number"
            className="w-full h-10 text-center border border-black bg-white px-1
            focus:ring-2 focus:ring-sky-600 focus:ring-offset-0 rounded-none"
          />
        </div>
        {/* lot no & lot count */}
        <div>
          <input
            value={currentForm.lotNumber}
            onChange={(e) => handleInputChange("lotNumber", e.target.value)}
            onKeyDown={handleKeyDown}
            tabIndex={6}
            className="w-full h-10 text-center border border-black bg-white px-1
            focus:ring-2 focus:ring-sky-600 focus:ring-offset-0 rounded-none"
          />
          <input
            value={currentForm.lotQuantity}
            onChange={(e) => handleInputChange("lotQuantity", e.target.value)}
            onKeyDown={handleKeyDown}
            tabIndex={7}
            type="number"
            className="w-full h-10 text-center border border-black bg-white px-1
            focus:ring-2 focus:ring-sky-600 focus:ring-offset-0 rounded-none"
          />
        </div>
        {/* inspector name */}
        <div>
          <input
            value={currentForm.inspector}
            onChange={(e) => handleInputChange("inspector", e.target.value)}
            onKeyDown={handleKeyDown}
            tabIndex={8}
            required
            className="w-full h-20 text-center border border-black bg-white px-1
            focus:ring-2 focus:ring-sky-600 focus:ring-offset-0 rounded-none"
          />
        </div>
        {/* sample size & defective count */}
        <div>
          <input
            value={currentForm.sampleSize}
            onChange={(e) => handleInputChange("sampleSize", e.target.value)}
            onKeyDown={handleKeyDown}
            tabIndex={9}
            required
            type="number"
            className="w-full h-10 text-center border border-black bg-white px-1
            focus:ring-2 focus:ring-sky-600 focus:ring-offset-0 rounded-none"
          />
          <input
            value={currentForm.defectiveCount}
            onChange={(e) =>
              handleInputChange("defectiveCount", e.target.value)
            }
            onKeyDown={handleKeyDown}
            tabIndex={10}
            required
            type="number"
            className="w-full h-10 text-center border border-black bg-white px-1
            focus:ring-2 focus:ring-sky-600 focus:ring-offset-0 rounded-none"
          />
        </div>
        {/* judgement */}
        <div>
          <select
            value={currentForm.judgement}
            onChange={(e) => handleInputChange("judgement", e.target.value)}
            onKeyDown={handleKeyDown}
            tabIndex={11}
            required
            className="w-full h-20 text-center border border-black bg-white px-1
            focus:ring-2 focus:ring-sky-600 focus:ring-offset-0 rounded-none"
          >
            <option value="">Select an option</option>
            <option value="合格">合格</option>
            <option value="不合格">不合格</option>
            <option value="条件合格">条件合格</option>
          </select>
        </div>
        {/* strictness */}
        <div>
          <select
            value={currentForm.strictnessAdjustment}
            onChange={(e) =>
              handleInputChange("strictnessAdjustment", e.target.value)
            }
            onKeyDown={handleKeyDown}
            tabIndex={12}
            required
            className="w-full h-20 text-center border border-black bg-white px-1
            focus:ring-2 focus:ring-sky-600 focus:ring-offset-0 rounded-none"
          >
            <option value="">Select an option</option>
            <option value="正常">正常</option>
            <option value="加严">加严</option>
            <option value="放宽">放宽</option>
          </select>
        </div>
        {/* selection */}
        <div className="w-full h-20 text-center bg-white border-black border grid grid-cols-2 gap-1 px-1 items-center justify-evenly">
          <div>
            <input
              type="checkbox"
              checked={currentForm.selections.A}
              onChange={(e) => handleSelectionChange("A", e.target.checked)}
              onKeyDown={handleCheckboxKeyDown}
              tabIndex={17}
            />
            <span className="text-sm font-medium ">A</span>
          </div>
          <div>
            <input
              type="checkbox"
              checked={currentForm.selections.B}
              onChange={(e) => handleSelectionChange("B", e.target.checked)}
              onKeyDown={handleCheckboxKeyDown}
              tabIndex={18}
            />
            <span className="text-sm font-medium ">B</span>
          </div>
          <div>
            <input
              type="checkbox"
              checked={currentForm.selections.C}
              onChange={(e) => handleSelectionChange("C", e.target.checked)}
              onKeyDown={handleCheckboxKeyDown}
              tabIndex={19}
            />
            <span className="text-sm font-medium ">C</span>
          </div>
          <div>
            <input
              type="checkbox"
              checked={currentForm.selections.D}
              onChange={(e) => handleSelectionChange("D", e.target.checked)}
              onKeyDown={handleCheckboxKeyDown}
              tabIndex={20}
            />
            <span className="text-sm font-medium ">D</span>
          </div>
        </div>
        {/* destination */}
        <div>
          <input
            value={currentForm.destination}
            onChange={(e) => handleInputChange("destination", e.target.value)}
            onKeyDown={handleKeyDown}
            tabIndex={13}
            className="w-full h-20 text-center border border-black bg-white px-1
            focus:ring-2 focus:ring-sky-600 focus:ring-offset-0 rounded-none"
          />
        </div>
        {/* group leader confirm */}
        <div>
          <input
            value={currentForm.groupLeaderConfirmation}
            onChange={(e) =>
              handleInputChange("groupLeaderConfirmation", e.target.value)
            }
            onKeyDown={handleKeyDown}
            tabIndex={14}
            className="w-full h-20 text-center border border-black bg-white px-1
            focus:ring-2 focus:ring-sky-600 focus:ring-offset-0 rounded-none"
          />
        </div>
        {/* quality summary */}
        <div>
          <input
            value={currentForm.qualitySummary}
            onChange={(e) =>
              handleInputChange("qualitySummary", e.target.value)
            }
            onKeyDown={handleKeyDown}
            tabIndex={15}
            className="w-full h-20 text-center border border-black bg-white px-1
            focus:ring-2 focus:ring-sky-600 focus:ring-offset-0 rounded-none"
          />
        </div>
        {/* remarks */}
        <div>
          <input
            value={currentForm.remarks}
            onChange={(e) => handleInputChange("remarks", e.target.value)}
            onKeyDown={handleKeyDown}
            tabIndex={16}
            className="w-full h-20 text-center border border-black bg-white px-1
            focus:ring-2 focus:ring-sky-600 focus:ring-offset-0 rounded-none"
          />
        </div>
      </div>
    );

    return (
      <div className="flex pl-2  text-zinc-600 border-2 border-zinc-700 py-10 text-sm flex-col p-4 rounded-xl gap-0 bg-gray-100">
        <div className="flex    justify-between items-center">
          <h1 className="text-4xl font-semibold pb-4 underline underline-offset-6 text-center">
            受入检查经历
          </h1>
          <div className="flex gap-3">
            <button
              onClick={loadHistory}
              disabled={isLoadingHistory}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-lg">
                {isLoadingHistory ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaHistory />
                )}
              </span>
              {isLoadingHistory ? "加载中..." : "历史记录"}
            </button>
            <button
              onClick={saveCurrentRecord}
              disabled={isSaving}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-lg">
                {isSaving ? <FaSpinner className="animate-spin" /> : <FaPlus />}
              </span>
              {isSaving ? "正在保存..." : "添加新的检查记录"}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-13 h-15 border-x border-t ">
          <div className="flex pl-2 col-span-2 border text-zinc-600 text-xl">
            <h1>部品番号</h1>
            <p className="text-red-500">*</p>
          </div>
          <div className="flex  col-span-5 border text-zinc-600 text-xl">
            <input
              type="text"
              className="w-full h-full pl-2 text-xl"
              placeholder="test"
              value={currentForm.partscode}
              onChange={(e) => handleInputChange("partscode", e.target.value)}
              onKeyDown={handleKeyDown}
              tabIndex={0}
              required
            />
          </div>
          <div className="flex pl-2 col-span-2 border text-zinc-600 text-xl">
            <h1>供方</h1>
            <p className="text-red-500">*</p>
          </div>
          <div className="flex col-span-4 border text-zinc-600 text-xl">
            <input
              type="text"
              className="w-full h-full pl-2 text-xl"
              placeholder="title"
              value={currentForm.supplier}
              onChange={(e) => handleInputChange("supplier", e.target.value)}
              onKeyDown={handleKeyDown}
              tabIndex={0}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-13 border-x ">
          <div className="w-full h-20 text-center border border-black bg-white px-1 flex items-center justify-center">
            <h2 className="text-base font-semibold">P/O</h2>
          </div>
          <div>
            <div className="w-full h-10 text-center border border-black bg-white items-center justify-center flex">
              <h2 className="text-base font-semibold">纳入日</h2>
            </div>
            <div className="w-full h-10 text-center border border-black bg-white items-center justify-center flex">
              <h2 className="text-base font-semibold">检完日</h2>
            </div>
          </div>
          <div>
            <div className="w-full h-10 text-center border border-black bg-white items-center justify-center flex">
              <h2 className="text-base font-semibold">纳入数</h2>
            </div>
            <div className="w-full h-10 text-center border border-black bg-white items-center justify-center flex">
              <h2 className="text-base font-semibold">返品数</h2>
            </div>
          </div>
          <div>
            <div className="w-full h-10 text-center border border-black bg-white items-center justify-center flex">
              <h2 className="text-base font-semibold">Lot No.</h2>
            </div>
            <div className="w-full h-10 text-center border border-black bg-white items-center justify-center flex">
              <h2 className="text-base font-semibold">Lot数量</h2>
            </div>
          </div>
          <div className="w-full h-20 text-center border border-black bg-white items-center justify-center flex">
            <h2 className="text-base font-semibold">检查员</h2>
          </div>
          <div>
            <div className="w-full h-10 text-center border border-black bg-white items-center justify-center flex">
              <h2 className="text-base font-semibold">抽样数</h2>
            </div>
            <div className="w-full h-10 text-center border border-black bg-white items-center justify-center flex">
              <h2 className="text-base font-semibold">不合格数</h2>
            </div>
          </div>
          <div className="w-full h-20 text-center border border-black bg-white items-center justify-center flex">
            <h2 className="text-base font-semibold">判定</h2>
          </div>
          <div className="w-full h-20 text-center border border-black bg-white items-center justify-center flex">
            <h2 className="text-base font-semibold">
              严格度
              <br />
              调整
            </h2>
          </div>
          <div className="w-full h-20 text-center border border-black bg-white items-center justify-center flex">
            <h2 className="text-xs font-semibold">
              A, 数据入箱
              <br />
              B, 样品确认、归位
              <br />
              C, 盖合格章 <br />
              D, 封绿胶带
            </h2>
          </div>
          <div className="w-full h-20 text-center border border-black bg-white items-center justify-center flex">
            <h2 className="text-base font-semibold">出货目的地</h2>
          </div>
          <div className="w-full h-20 text-center border border-black bg-white items-center justify-center flex">
            <h2 className="text-base font-semibold">组长确认</h2>
          </div>
          <div className="w-full h-20 text-center border border-black bg-white items-center justify-center flex">
            <h2 className="text-base font-semibold">品质 摘要</h2>
          </div>{" "}
          <div className="w-full h-20 text-center border border-black bg-white items-center justify-center flex">
            <h2 className="text-base font-semibold">备注</h2>
          </div>
        </div>
        {/* Current form */}
        {renderCurrentForm()}
        {savedRecords.map((record, index) => (
          <div key={index} className="relative">
            {/* Action buttons */}
            <div className="absolute -top-2 -right-2 flex gap-2 z-10">
              {editingIndex === index ? (
                <>
                  <button
                    onClick={saveEdit}
                    disabled={isUpdating}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isUpdating ? "Saving..." : "Save changes"}
                  >
                    {isUpdating ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaCheck />
                    )}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-500 hover:bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors duration-200"
                    title="Cancel edit"
                  >
                    <FaX />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => editRecord(index)}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors duration-200"
                    title="Edit record"
                  >
                    <FaPen />
                  </button>
                  <button
                    onClick={() => deleteRecord(index)}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors duration-200"
                    title="Delete record"
                  >
                    <FaX />
                  </button>
                </>
              )}
            </div>
            <div className="grid grid-cols-13 border-x border-t bg-gray-50">
              <div className="flex pl-2 col-span-2 border text-zinc-600 text-lg items-center">
                <span>部品番号</span>
                <p className="text-red-500">*</p>
              </div>
              <div className="flex col-span-5 border text-zinc-600 text-lg items-center">
                {editingIndex === index ? (
                  <input
                    value={record.partscode}
                    onChange={(e) => {
                      const updatedRecord = {
                        ...record,
                        partscode: e.target.value,
                      };
                      setSavedRecords((prev) =>
                        prev.map((r, i) => (i === index ? updatedRecord : r))
                      );
                    }}
                    className="w-full h-full border-none bg-transparent px-2 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                  />
                ) : (
                  <span className="text-sm px-2">
                    {record.partscode || "-"}
                  </span>
                )}
              </div>
              <div className="flex pl-2 col-span-2 border text-zinc-600 text-lg items-center">
                <span>供方</span>
                <p className="text-red-500">*</p>
              </div>
              <div className="flex col-span-4 border text-zinc-600 text-lg items-center">
                {editingIndex === index ? (
                  <input
                    value={record.supplier}
                    onChange={(e) => {
                      const updatedRecord = {
                        ...record,
                        supplier: e.target.value,
                      };
                      setSavedRecords((prev) =>
                        prev.map((r, i) => (i === index ? updatedRecord : r))
                      );
                    }}
                    className="w-full h-full border-none bg-transparent px-2 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                  />
                ) : (
                  <span className="text-sm px-2">{record.supplier || "-"}</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-13 border-x border-b">
              {/* PO number */}
              <div className="col-span-1">
                <div className="w-full h-20 text-center border border-black bg-gray-50 px-1 flex items-center justify-center">
                  {editingIndex === index ? (
                    <input
                      value={record.poNumber}
                      onChange={(e) => {
                        const updatedRecord = {
                          ...record,
                          poNumber: e.target.value,
                        };
                        setSavedRecords((prev) =>
                          prev.map((r, i) => (i === index ? updatedRecord : r))
                        );
                      }}
                      placeholder="12345"
                      className="w-full h-full text-center border-none bg-transparent px-1 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                    />
                  ) : (
                    <span className="text-sm">{record.poNumber || "-"}</span>
                  )}
                </div>
              </div>
              {/* dates */}
              <div>
                <div className="w-full h-10 text-center border border-black bg-gray-50 px-1 flex items-center justify-center">
                  {editingIndex === index ? (
                    <input
                      value={record.deliveryDate}
                      onChange={(e) => {
                        const updatedRecord = {
                          ...record,
                          deliveryDate: e.target.value,
                        };
                        setSavedRecords((prev) =>
                          prev.map((r, i) => (i === index ? updatedRecord : r))
                        );
                      }}
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full h-full text-center border-none bg-transparent px-1 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                    />
                  ) : (
                    <span className="text-sm">
                      {record.deliveryDate || "-"}
                    </span>
                  )}
                </div>
                <div className="w-full h-10 text-center border border-black bg-gray-50 px-1 flex items-center justify-center">
                  {editingIndex === index ? (
                    <input
                      value={record.inspectionDate}
                      onChange={(e) => {
                        const updatedRecord = {
                          ...record,
                          inspectionDate: e.target.value,
                        };
                        setSavedRecords((prev) =>
                          prev.map((r, i) => (i === index ? updatedRecord : r))
                        );
                      }}
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full h-full text-center border-none bg-transparent px-1 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                    />
                  ) : (
                    <span className="text-sm">
                      {record.inspectionDate || "-"}
                    </span>
                  )}
                </div>
              </div>
              {/* quantity */}
              <div>
                <div className="w-full h-10 text-center border border-black bg-gray-50 px-1 flex items-center justify-center">
                  {editingIndex === index ? (
                    <input
                      value={record.deliveryQuantity}
                      onChange={(e) => {
                        const updatedRecord = {
                          ...record,
                          deliveryQuantity: e.target.value,
                        };
                        setSavedRecords((prev) =>
                          prev.map((r, i) => (i === index ? updatedRecord : r))
                        );
                      }}
                      type="number"
                      className="w-full h-full text-center border-none bg-transparent px-1 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                    />
                  ) : (
                    <span className="text-sm">
                      {record.deliveryQuantity || "-"}
                    </span>
                  )}
                </div>
                <div className="w-full h-10 text-center border border-black bg-gray-50 px-1 flex items-center justify-center">
                  {editingIndex === index ? (
                    <input
                      value={record.returnQuantity}
                      onChange={(e) => {
                        const updatedRecord = {
                          ...record,
                          returnQuantity: e.target.value,
                        };
                        setSavedRecords((prev) =>
                          prev.map((r, i) => (i === index ? updatedRecord : r))
                        );
                      }}
                      type="number"
                      className="w-full h-full text-center border-none bg-transparent px-1 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                    />
                  ) : (
                    <span className="text-sm">
                      {record.returnQuantity || "-"}
                    </span>
                  )}
                </div>
              </div>
              {/* lot no & lot count */}
              <div>
                <div className="w-full h-10 text-center border border-black bg-gray-50 px-1 flex items-center justify-center">
                  {editingIndex === index ? (
                    <input
                      value={record.lotNumber}
                      onChange={(e) => {
                        const updatedRecord = {
                          ...record,
                          lotNumber: e.target.value,
                        };
                        setSavedRecords((prev) =>
                          prev.map((r, i) => (i === index ? updatedRecord : r))
                        );
                      }}
                      className="w-full h-full text-center border-none bg-transparent px-1 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                    />
                  ) : (
                    <span className="text-sm">{record.lotNumber || "-"}</span>
                  )}
                </div>
                <div className="w-full h-10 text-center border border-black bg-gray-50 px-1 flex items-center justify-center">
                  {editingIndex === index ? (
                    <input
                      value={record.lotQuantity}
                      onChange={(e) => {
                        const updatedRecord = {
                          ...record,
                          lotQuantity: e.target.value,
                        };
                        setSavedRecords((prev) =>
                          prev.map((r, i) => (i === index ? updatedRecord : r))
                        );
                      }}
                      type="number"
                      className="w-full h-full text-center border-none bg-transparent px-1 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                    />
                  ) : (
                    <span className="text-sm">{record.lotQuantity || "-"}</span>
                  )}
                </div>
              </div>
              {/* inspector name */}
              <div>
                <div className="w-full h-20 text-center border border-black bg-gray-50 px-1 flex items-center justify-center">
                  {editingIndex === index ? (
                    <input
                      value={record.inspector}
                      onChange={(e) => {
                        const updatedRecord = {
                          ...record,
                          inspector: e.target.value,
                        };
                        setSavedRecords((prev) =>
                          prev.map((r, i) => (i === index ? updatedRecord : r))
                        );
                      }}
                      className="w-full h-full text-center border-none bg-transparent px-1 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                    />
                  ) : (
                    <span className="text-sm">{record.inspector || "-"}</span>
                  )}
                </div>
              </div>
              {/* sample size & defective count */}
              <div>
                <div className="w-full h-10 text-center border border-black bg-gray-50 px-1 flex items-center justify-center">
                  {editingIndex === index ? (
                    <input
                      value={record.sampleSize}
                      onChange={(e) => {
                        const updatedRecord = {
                          ...record,
                          sampleSize: e.target.value,
                        };
                        setSavedRecords((prev) =>
                          prev.map((r, i) => (i === index ? updatedRecord : r))
                        );
                      }}
                      type="number"
                      className="w-full h-full text-center border-none bg-transparent px-1 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                    />
                  ) : (
                    <span className="text-sm">{record.sampleSize || "-"}</span>
                  )}
                </div>
                <div className="w-full h-10 text-center border border-black bg-gray-50 px-1 flex items-center justify-center">
                  {editingIndex === index ? (
                    <input
                      value={record.defectiveCount}
                      onChange={(e) => {
                        const updatedRecord = {
                          ...record,
                          defectiveCount: e.target.value,
                        };
                        setSavedRecords((prev) =>
                          prev.map((r, i) => (i === index ? updatedRecord : r))
                        );
                      }}
                      type="number"
                      className="w-full h-full text-center border-none bg-transparent px-1 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                    />
                  ) : (
                    <span className="text-sm">
                      {record.defectiveCount || "-"}
                    </span>
                  )}
                </div>
              </div>
              {/* judgement */}
              <div>
                <div className="w-full h-20 text-center border border-black bg-gray-50 px-1 flex items-center justify-center">
                  {editingIndex === index ? (
                    <select
                      value={record.judgement}
                      onChange={(e) => {
                        const updatedRecord = {
                          ...record,
                          judgement: e.target.value,
                        };
                        setSavedRecords((prev) =>
                          prev.map((r, i) => (i === index ? updatedRecord : r))
                        );
                      }}
                      className="w-full h-full text-center border-none bg-transparent px-1 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                    >
                      <option value="">Select an option</option>
                      <option value="合格">合格</option>
                      <option value="不合格">不合格</option>
                      <option value="条件合格">条件合格</option>
                    </select>
                  ) : (
                    <span className="text-sm">{record.judgement || "-"}</span>
                  )}
                </div>
              </div>
              {/* strictness */}
              <div>
                <div className="w-full h-20 text-center border border-black bg-gray-50 px-1 flex items-center justify-center">
                  {editingIndex === index ? (
                    <select
                      value={record.strictnessAdjustment}
                      onChange={(e) => {
                        const updatedRecord = {
                          ...record,
                          strictnessAdjustment: e.target.value,
                        };
                        setSavedRecords((prev) =>
                          prev.map((r, i) => (i === index ? updatedRecord : r))
                        );
                      }}
                      className="w-full h-full text-center border-none bg-transparent px-1 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                    >
                      <option value="">Select an option</option>
                      <option value="正常">正常</option>
                      <option value="加严">加严</option>
                      <option value="放宽">放宽</option>
                    </select>
                  ) : (
                    <span className="text-sm">
                      {record.strictnessAdjustment || "-"}
                    </span>
                  )}
                </div>
              </div>
              {/* selection */}
              <div className="w-full h-20 text-center bg-gray-50 border-black border grid grid-cols-2 gap-1 px-1 items-center justify-evenly">
                {editingIndex === index ? (
                  <>
                    <div>
                      <input
                        type="checkbox"
                        checked={record.selections.A}
                        onChange={(e) => {
                          const updatedRecord = {
                            ...record,
                            selections: {
                              ...record.selections,
                              A: e.target.checked,
                            },
                          };
                          setSavedRecords((prev) =>
                            prev.map((r, i) =>
                              i === index ? updatedRecord : r
                            )
                          );
                        }}
                      />
                      <span className="text-sm font-medium">A</span>
                    </div>
                    <div>
                      <input
                        type="checkbox"
                        checked={record.selections.B}
                        onChange={(e) => {
                          const updatedRecord = {
                            ...record,
                            selections: {
                              ...record.selections,
                              B: e.target.checked,
                            },
                          };
                          setSavedRecords((prev) =>
                            prev.map((r, i) =>
                              i === index ? updatedRecord : r
                            )
                          );
                        }}
                      />
                      <span className="text-sm font-medium">B</span>
                    </div>
                    <div>
                      <input
                        type="checkbox"
                        checked={record.selections.C}
                        onChange={(e) => {
                          const updatedRecord = {
                            ...record,
                            selections: {
                              ...record.selections,
                              C: e.target.checked,
                            },
                          };
                          setSavedRecords((prev) =>
                            prev.map((r, i) =>
                              i === index ? updatedRecord : r
                            )
                          );
                        }}
                      />
                      <span className="text-sm font-medium">C</span>
                    </div>
                    <div>
                      <input
                        type="checkbox"
                        checked={record.selections.D}
                        onChange={(e) => {
                          const updatedRecord = {
                            ...record,
                            selections: {
                              ...record.selections,
                              D: e.target.checked,
                            },
                          };
                          setSavedRecords((prev) =>
                            prev.map((r, i) =>
                              i === index ? updatedRecord : r
                            )
                          );
                        }}
                      />
                      <span className="text-sm font-medium">D</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-sm ${
                          record.selections.A
                            ? "text-green-600 font-bold"
                            : "text-gray-400"
                        }`}
                      >
                        A
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-sm ${
                          record.selections.B
                            ? "text-green-600 font-bold"
                            : "text-gray-400"
                        }`}
                      >
                        B
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-sm ${
                          record.selections.C
                            ? "text-green-600 font-bold"
                            : "text-gray-400"
                        }`}
                      >
                        C
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-sm ${
                          record.selections.D
                            ? "text-green-600 font-bold"
                            : "text-gray-400"
                        }`}
                      >
                        D
                      </span>
                    </div>
                  </>
                )}
              </div>
              {/* destination */}
              <div>
                <div className="w-full h-20 text-center border border-black bg-gray-50 px-1 flex items-center justify-center">
                  {editingIndex === index ? (
                    <input
                      value={record.destination}
                      onChange={(e) => {
                        const updatedRecord = {
                          ...record,
                          destination: e.target.value,
                        };
                        setSavedRecords((prev) =>
                          prev.map((r, i) => (i === index ? updatedRecord : r))
                        );
                      }}
                      className="w-full h-full text-center border-none bg-transparent px-1 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                    />
                  ) : (
                    <span className="text-sm">{record.destination || "-"}</span>
                  )}
                </div>
              </div>
              {/* group leader confirm */}
              <div>
                <div className="w-full h-20 text-center border border-black bg-gray-50 px-1 flex items-center justify-center">
                  {editingIndex === index ? (
                    <input
                      value={record.groupLeaderConfirmation}
                      onChange={(e) => {
                        const updatedRecord = {
                          ...record,
                          groupLeaderConfirmation: e.target.value,
                        };
                        setSavedRecords((prev) =>
                          prev.map((r, i) => (i === index ? updatedRecord : r))
                        );
                      }}
                      className="w-full h-full text-center border-none bg-transparent px-1 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                    />
                  ) : (
                    <span className="text-sm">
                      {record.groupLeaderConfirmation || "-"}
                    </span>
                  )}
                </div>
              </div>
              {/* quality summary */}
              <div>
                <div className="w-full h-20 text-center border border-black bg-gray-50 px-1 flex items-center justify-center">
                  {editingIndex === index ? (
                    <input
                      value={record.qualitySummary}
                      onChange={(e) => {
                        const updatedRecord = {
                          ...record,
                          qualitySummary: e.target.value,
                        };
                        setSavedRecords((prev) =>
                          prev.map((r, i) => (i === index ? updatedRecord : r))
                        );
                      }}
                      className="w-full h-full text-center border-none bg-transparent px-1 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                    />
                  ) : (
                    <span className="text-sm">
                      {record.qualitySummary || "-"}
                    </span>
                  )}
                </div>
              </div>
              {/* remarks */}
              <div>
                <div className="w-full h-20 text-center border border-black bg-gray-50 px-1 flex items-center justify-center">
                  {editingIndex === index ? (
                    <input
                      value={record.remarks}
                      onChange={(e) => {
                        const updatedRecord = {
                          ...record,
                          remarks: e.target.value,
                        };
                        setSavedRecords((prev) =>
                          prev.map((r, i) => (i === index ? updatedRecord : r))
                        );
                      }}
                      className="w-full h-full text-center border-none bg-transparent px-1 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                    />
                  ) : (
                    <span className="text-sm">{record.remarks || "-"}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add new section button */}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <IoWarning className="h-7 w-7 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  确认删除
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                您确定要删除这条检查记录吗？此操作无法撤销。
              </p>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  取消
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      删除中...
                    </>
                  ) : (
                    "删除"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

FormFieldsTwo.displayName = "FormFieldsTwo";

export default FormFieldsTwo;
