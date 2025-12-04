import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/supabase-server";

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

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { 
          error: "Unauthorized", 
          message: "You must be logged in to save records" 
        },
        { status: 401 }
      );
    }

    const body: FormData = await req.json();

    // Validate required fields
    if (!body.partscode || !body.supplier) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          message: "partscode and supplier are required fields" 
        },
        { status: 400 }
      );
    }

    // Use authenticated user's ID
    const userId = user.id;

    // Create Supabase client with user session
    const supabase = await createClient();

    // Prepare data for Supabase insert
    const recordData = {
      user_id: userId,
      partscode: body.partscode,
      supplier: body.supplier,
      po_number: body.poNumber || null,
      delivery_date: body.deliveryDate || null,
      inspection_date: body.inspectionDate || null,
      delivery_quantity: body.deliveryQuantity ? parseInt(body.deliveryQuantity) : null,
      return_quantity: body.returnQuantity ? parseInt(body.returnQuantity) : null,
      lot_number: body.lotNumber || null,
      lot_quantity: body.lotQuantity ? parseInt(body.lotQuantity) : null,
      inspector: body.inspector || null,
      sample_size: body.sampleSize ? parseInt(body.sampleSize) : null,
      defective_count: body.defectiveCount ? parseInt(body.defectiveCount) : null,
      judgement: body.judgement || null,
      strictness_adjustment: body.strictnessAdjustment || null,
      selection_a: body.selections.A || false,
      selection_b: body.selections.B || false,
      selection_c: body.selections.C || false,
      selection_d: body.selections.D || false,
      destination: body.destination || null,
      group_leader_confirmation: body.groupLeaderConfirmation || null,
      quality_summary: body.qualitySummary || null,
      remarks: body.remarks || null,
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('qc_records')
      .insert([recordData])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        {
          error: "Failed to save QC form data to database",
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log("Successfully saved QC form data to Supabase:", data);

    return NextResponse.json(
      {
        success: true,
        message: "检查记录已成功保存！",
        data: data,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const normalizedError =
      error instanceof Error ? error : new Error("Unknown error");
    console.error("Error saving QC form data:", normalizedError);

    return NextResponse.json(
      {
        error: "Failed to save QC form data",
        details: normalizedError.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
