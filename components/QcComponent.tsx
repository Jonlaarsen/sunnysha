import React, { useState, useRef } from "react";
import FormFieldsTwo, { FormFieldsTwoRef } from "./Qc/FormFieldsTwo";
import BarcodeScanner from "./Qc/BarcodeScanner";
import PhotoGallery from "./Qc/PhotoGallery";
import PhotoModal from "./Qc/PhotoModal";
import toast from "react-hot-toast";

interface ProductData {
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
  supplier?: string;
  partscode?: string;
}

type SqlProductRecord = {
  supplier?: string;
  Supplier?: string;
  po?: string;
  PO?: string;
  partscode?: string;
  Partscode?: string;
  Date?: string;
  date?: string;
  ShouHuo_Date?: string;
  shouHuo_Date?: string;
  qty?: number | string;
  Qty?: number | string;
  [key: string]: unknown;
};

type PhotoRecord = {
  PhotoUrl?: string;
  photoUrl?: string;
};

type SqlServerResponse = {
  recordsets?: SqlProductRecord[][];
  recordset?: SqlProductRecord[];
};

type PhotosApiResponse = {
  recordsets?: unknown[];
  photos?: unknown;
};

const QcComponent = () => {
  const [barcode, setBarcode] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fetchedData, setFetchedData] = useState<ProductData | undefined>(
    undefined
  );
  const [isScanning, setIsScanning] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState("");
  const formRef = useRef<FormFieldsTwoRef>(null);

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    setIsLoadingData(true);
    
    // Show loading toast
    const loadingToast = toast.loading("正在获取产品数据...", {
      icon: "🔍",
    });

    try {
      // Dummy fetch from Microsoft SQL Server
      // Simulating SQL Server API endpoint response
      const productUrl = `/api/sql-server/product?barcode=${encodeURIComponent(
        barcode.trim()
      )}&mock=true`;
      const response = await fetch(productUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`SQL Server error: ${response.status}`);
      }

      // SQL Server response format (returns recordset)
      const sqlServerResponse: SqlServerResponse = await response.json();
      
      // Transform SQL Server recordset format to ProductData
      // The query returns: supplier, po, partscode, Date (ShouHuo_Date), qty (sum)
      const record: SqlProductRecord =
        sqlServerResponse.recordsets?.[0]?.[0] ||
        sqlServerResponse.recordset?.[0] ||
        sqlServerResponse;
      
      // Format date if it exists
      const formatDate = (dateValue: unknown): string => {
        if (!dateValue) return "";
        if (dateValue instanceof Date) {
          return dateValue.toISOString().split('T')[0];
        }
        if (typeof dateValue === 'string') {
          return dateValue.split('T')[0];
        }
        return "";
      };
      
      const productData: ProductData = {
        poNumber: record.po || record.PO || "",
        deliveryDate: formatDate(record.Date || record.date || record.ShouHuo_Date || record.shouHuo_Date),
        inspectionDate: "",
        deliveryQuantity: record.qty?.toString() || record.Qty?.toString() || "",
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
        supplier: record.supplier || record.Supplier || "",
        partscode: record.partscode || record.Partscode || "",
      };

      setFetchedData(productData);
      
      // Fetch photos from SQL Server (if available)
      const photosResponse = await fetch("/api/sql-server/photos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          barcode: barcode.trim(),
        }),
      });

      if (photosResponse.ok) {
        const photosData: PhotosApiResponse = await photosResponse.json();
        const firstRecordset = Array.isArray(photosData.recordsets)
          ? photosData.recordsets[0]
          : undefined;
        const recordsetPhotos = Array.isArray(firstRecordset)
          ? (firstRecordset as PhotoRecord[])
          : [];
        const extractedUrls = recordsetPhotos
          .map((p) => p.PhotoUrl ?? p.photoUrl)
          .filter((url): url is string => typeof url === "string" && url.length > 0);
        const fallbackPhotos = Array.isArray(photosData.photos)
          ? (photosData.photos as unknown[])
              .filter((url): url is string => typeof url === "string")
          : [];
        const photoUrls =
          extractedUrls.length > 0 ? extractedUrls : fallbackPhotos;
        setPhotos(photoUrls);
      } else {
        // Fallback to mock photos if SQL Server doesn't return photos
        const mockPhotos = [
          "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop"
        ];
        setPhotos(mockPhotos);
      }
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("产品数据获取成功！", {
        duration: 3000,
        icon: "✅",
      });
    } catch (error) {
      console.error("Error fetching data from SQL Server:", error);
      
      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);
      toast.error("获取产品数据失败，请重试", {
        duration: 4000,
        icon: "❌",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

    const handleSimulateScan = async () => {
      setIsScanning(true);
      
      // Show loading toast
      const loadingToast = toast.loading("正在模拟扫描...", {
        icon: "📷",
      });
      
      try {
        // Simulate scanning process
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setBarcode("1234567890");
        
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success("扫描完成！", {
          duration: 2000,
          icon: "📷",
        });
      } catch (error) {
        console.error("Error simulating scan:", error);
        
        // Dismiss loading toast and show error
        toast.dismiss(loadingToast);
        toast.error("扫描失败，请重试", {
          duration: 3000,
          icon: "❌",
        });
      } finally {
        setIsScanning(false);
      }
    };

    const openPhotoModal = (photo: string) => {
      setSelectedPhoto(photo);
      setIsModalOpen(true);
    };

    const closePhotoModal = () => {
      setIsModalOpen(false);
      setSelectedPhoto("");
    };

    const handlePopulateForm = (data: ProductData) => {
      if (formRef.current) {
        formRef.current.populateFormWithBarcodeData(data);
      }
    };

  return (
    <div>
      <BarcodeScanner
        barcode={barcode}
        setBarcode={setBarcode}
        isLoadingData={isLoadingData}
        fetchedData={fetchedData}
        onBarcodeSubmit={handleBarcodeSubmit}
        onSimulateScan={handleSimulateScan}
        isScanning={isScanning}
        onPopulateForm={handlePopulateForm}
      />
      <FormFieldsTwo 
        ref={formRef}
        fetchedData={fetchedData}
        onPopulateForm={handlePopulateForm}
      />
      {/* Photo Gallery Section */}
      <PhotoGallery photos={photos} onPhotoClick={openPhotoModal} />

      {/* Photo Modal */}
      <PhotoModal
        isOpen={isModalOpen}
        selectedPhoto={selectedPhoto}
        onClose={closePhotoModal}
      />
    </div>
  );
};

export default QcComponent;
