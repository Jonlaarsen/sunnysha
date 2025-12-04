import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/supabase-server";

// GET endpoint to fetch QC records from Supabase
// Returns records for the authenticated user, or all records if admin

export async function GET(req: NextRequest) {
  try {
    // Require authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { 
          error: "Unauthorized", 
          message: "You must be logged in to view records" 
        },
        { status: 401 }
      );
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    const isAdmin = adminEmails.includes(user.email || '');

    // Create Supabase client with user session
    const supabase = await createClient();

    // Get limit from query parameter (default: no limit)
    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : null;

    // Build Supabase query
    let query = supabase
      .from('qc_records')
      .select('*')
      .order('created_at', { ascending: false });

    // If not admin, only show user's own records
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    // Apply limit if specified
    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        {
          error: "Failed to fetch QC records from database",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: isAdmin 
        ? `Fetched ${data?.length || 0} records (all users)` 
        : `Fetched ${data?.length || 0} records for your account`,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error: unknown) {
    const normalizedError =
      error instanceof Error ? error : new Error("Unknown error");
    console.error("Error fetching QC records:", normalizedError);

    return NextResponse.json(
      {
        error: "Failed to fetch QC records",
        details: normalizedError.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

