import React, { useState, forwardRef, useImperativeHandle } from "react";
import {
  FaArrowLeft,
  FaCheck,
  FaCheckCircle,
  FaClipboard,
  FaPen,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import { IoWarning } from "react-icons/io5";
import toast from "react-hot-toast";

interface FormData {
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
  onPopulateForm?: (data: FormData) => void;
}

export interface FormFieldsTwoRef {
  populateFormWithBarcodeData: (data: FormData) => void;
}

const FormFieldsTwo = forwardRef<FormFieldsTwoRef, FormFieldsTwoProps>(
  ({ fetchedData, onPopulateForm }, ref) => {
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

    const saveCurrentRecord = () => {
      // Save current form data to saved records (latest record at the top)
      setSavedRecords((prev) => [{ ...currentForm }, ...prev]);

      // Show success toast
      toast.success("检查记录已成功保存！", {
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
    };

    const deleteRecord = (index: number) => {
      setRecordToDelete(index);
      setShowDeleteModal(true);
    };

    const confirmDelete = () => {
      if (recordToDelete !== null) {
        setSavedRecords((prev) => prev.filter((_, i) => i !== recordToDelete));
        setShowDeleteModal(false);
        setRecordToDelete(null);

        // Show success toast
        toast.success("检查记录已成功删除！", {
          duration: 3000,
          icon: <FaTrash />,
        });
      }
    };

    const cancelDelete = () => {
      setShowDeleteModal(false);
      setRecordToDelete(null);
    };

    const editRecord = (index: number) => {
      const recordToEdit = savedRecords[index];
      setOriginalRecord({ ...recordToEdit }); // Store original data
      setEditingIndex(index);
    };

    const saveEdit = () => {
      setEditingIndex(null);
      setOriginalRecord(null);

      // Show success toast
      toast.success("检查记录已成功更新！", {
        duration: 3000,
        icon: <FaPen />,
      });
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
      setCurrentForm({
        ...data,
        deliveryDate: getToday(),
        inspectionDate: getToday(),
        partscode: data.partscode || "",
        supplier: data.supplier || "",
      });

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
          <button
            onClick={saveCurrentRecord}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <span className="text-lg">
              <FaPlus />
            </span>
            添加新的检查记录
          </button>
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
                    className="bg-green-500 hover:bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors duration-200"
                    title="Save changes"
                  >
                    <FaCheck />
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
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  取消
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

// FormFieldsTwo.displayName = 'FormFieldsTwo';

export default FormFieldsTwo;
