"use client";

import React from "react";
import toast from "react-hot-toast";
import { ProductData } from "@/types/product-data";

interface BarcodeScannerProps {
  barcode: string;
  setBarcode: (value: string) => void;
  isLoadingData: boolean;
  fetchedData: ProductData | undefined;
  onBarcodeSubmit: (e: React.FormEvent) => void;
  onSimulateScan: () => void;
  isScanning: boolean;
  onPopulateForm?: (data: ProductData) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  barcode,
  setBarcode,
  isLoadingData,
  fetchedData,
  onBarcodeSubmit,
  onSimulateScan,
  isScanning,
  onPopulateForm,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Barcode Scanner
          </h3>
          <p className="text-sm text-gray-600">
            Scan or enter barcode to auto-populate form data
          </p>
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="flex-1">
          <form onSubmit={onBarcodeSubmit} className="flex space-x-2">
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Enter barcode or scan..."
              className="flex-1 px-4 py-2 border focus:bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!barcode.trim() || isLoadingData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoadingData ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>Fetch Data</span>
                </>
              )}
            </button>
          </form>
        </div>
        <button
          type="button"
          onClick={onSimulateScan}
          disabled={isScanning}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isScanning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Simulate Scan</span>
            </>
          )}
        </button>
      </div>

      {/* Fetched Data Display */}
      {fetchedData && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h4 className="font-semibold text-green-800">
                Product Data Found
              </h4>
            </div>
            {onPopulateForm && (
              <button
                onClick={() => {
                  onPopulateForm(fetchedData);
                  toast.success("正在填充表单...", {
                    duration: 2000,
                    icon: "📋",
                  });
                }}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <span>Populate Form</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {fetchedData.supplier && (
              <div>
                <span className="font-medium text-gray-700">Supplier:</span>
                <span className="ml-2 text-gray-900">
                  {fetchedData.supplier}
                </span>
              </div>
            )}
            {fetchedData.poNumber && (
              <div>
                <span className="font-medium text-gray-700">PO Number:</span>
                <span className="ml-2 text-gray-900">
                  {fetchedData.poNumber}
                </span>
              </div>
            )}
            {fetchedData.partscode && (
              <div>
                <span className="font-medium text-gray-700">Parts Code:</span>
                <span className="ml-2 text-gray-900">
                  {fetchedData.partscode}
                </span>
              </div>
            )}
            {fetchedData.deliveryDate && (
              <div>
                <span className="font-medium text-gray-700">Delivery Date:</span>
                <span className="ml-2 text-gray-900">
                  {fetchedData.deliveryDate}
                </span>
              </div>
            )}
            {fetchedData.deliveryQuantity && (
              <div>
                <span className="font-medium text-gray-700">
                  Delivery Quantity:
                </span>
                <span className="ml-2 text-gray-900">
                  {fetchedData.deliveryQuantity}
                </span>
              </div>
            )}
            {fetchedData.lotNumber && (
              <div>
                <span className="font-medium text-gray-700">Lot Number:</span>
                <span className="ml-2 text-gray-900">
                  {fetchedData.lotNumber}
                </span>
              </div>
            )}
            {fetchedData.inspector && (
              <div>
                <span className="font-medium text-gray-700">Inspector:</span>
                <span className="ml-2 text-gray-900">
                  {fetchedData.inspector}
                </span>
              </div>
            )}
            {fetchedData.destination && (
              <div>
                <span className="font-medium text-gray-700">Destination:</span>
                <span className="ml-2 text-gray-900">
                  {fetchedData.destination}
                </span>
              </div>
            )}
            {fetchedData.judgement && (
              <div>
                <span className="font-medium text-gray-700">Judgement:</span>
                <span className="ml-2 text-gray-900">
                  {fetchedData.judgement}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
