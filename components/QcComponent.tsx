import React, { useState, useRef } from "react";
import FormFieldsTwo, { FormFieldsTwoRef } from "./Qc/FormFieldsTwo";
import BarcodeScanner from "./Qc/BarcodeScanner";
import PhotoGallery from "./Qc/PhotoGallery";
import PhotoModal from "./Qc/PhotoModal";
import toast from "react-hot-toast";

const QcComponent = () => {
  const [photos, setPhotos] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const savedPhotos = sessionStorage.getItem("qc_photos");
      if (savedPhotos) {
        try {
          return JSON.parse(savedPhotos);
        } catch {
          return [];
        }
      }
    }
    return [];
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState("");
  const formRef = useRef<FormFieldsTwoRef>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("qc_photos", JSON.stringify(photos));
    }
  }, [photos]);

  const openPhotoModal = (photo: string) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const closePhotoModal = () => {
    setIsModalOpen(false);
    setSelectedPhoto("");
  };

  const handleFileSelected = (fileUrl: string) => {
    if (!photos.includes(fileUrl)) {
      setPhotos([...photos, fileUrl]);
      toast.success("File added to photo gallery", { duration: 2000 });
    } else {
      toast("File already in gallery", { duration: 2000 });
    }
  };

  return (
    <div>
      <FormFieldsTwo ref={formRef} />
      <BarcodeScanner onFileSelected={handleFileSelected} />
      <PhotoGallery
        photos={photos}
        onPhotoClick={openPhotoModal}
        onClear={() => {
          setPhotos([]);
          toast.success("All photos cleared", { duration: 2000 });
        }}
        onPhotoRemove={(photo) => {
          setPhotos(photos.filter((p) => p !== photo));
          toast.success("Photo removed", { duration: 2000 });
        }}
      />
      <PhotoModal
        isOpen={isModalOpen}
        selectedPhoto={selectedPhoto}
        onClose={closePhotoModal}
      />
    </div>
  );
};

export default QcComponent;
