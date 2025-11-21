export interface ProductData {
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
  supplier: string;
  partscode: string;
}

