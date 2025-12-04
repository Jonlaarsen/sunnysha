import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function DELETE(req: NextRequest) {
  try {
    // Require authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { 
          error: "Unauthorized", 
          message: "You must be logged in to delete records" 
        },
        { status: 401 }
      );
    }

    // Get record ID from query parameter or request body
    const recordId = req.nextUrl.searchParams.get("id");
    const body = await req.json().catch(() => ({}));
    const id = recordId || body.id;

    if (!id) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          message: "Record ID is required for deletion" 
        },
        { status: 400 }
      );
    }

    // Create Supabase client with user session
    const supabase = await createClient();

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    const isAdmin = adminEmails.includes(user.email || '');

    // Build delete query
    let query = supabase
      .from('qc_records')
      .delete()
      .eq('id', id);

    // If not admin, ensure user can only delete their own records
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    // Execute delete
    const { error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        {
          error: "Failed to delete QC record from database",
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log("Successfully deleted QC record from Supabase:", id);

    return NextResponse.json(
      {
        success: true,
        message: "检查记录已成功删除！",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const normalizedError =
      error instanceof Error ? error : new Error("Unknown error");
    console.error("Error deleting QC record:", normalizedError);

    return NextResponse.json(
      {
        error: "Failed to delete QC record",
        details: normalizedError.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

