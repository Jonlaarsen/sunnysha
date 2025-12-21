import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/supabase-server";

interface SupplierStats {
  supplier: string;
  totalRecords: number;
  passCount: number;
  failCount: number;
  passRate: number;
  averageDefectiveCount: number;
  latestRecordDate: string;
  latestRecordId: number;
}

export async function GET(req: NextRequest) {
  try {
    // Require authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { 
          error: "Unauthorized", 
          message: "You must be logged in to view statistics" 
        },
        { status: 401 }
      );
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    const isAdmin = adminEmails.includes(user.email || '');
    
    if (!isAdmin) {
      return NextResponse.json(
        { 
          error: "Forbidden", 
          message: "Only admins can view statistics" 
        },
        { status: 403 }
      );
    }

    // Get search query parameter
    const searchQuery = req.nextUrl.searchParams.get("search")?.toLowerCase().trim() || "";

    // Create Supabase client
    const supabase = await createClient();

    // Fetch all QC records
    const { data: records, error } = await supabase
      .from('qc_records')
      .select('id, supplier, judgement, defective_count, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        {
          error: "Failed to fetch records for statistics",
          details: error.message,
        },
        { status: 500 }
      );
    }

    if (!records || records.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No records found",
        data: [],
        count: 0,
      });
    }

    // Group records by supplier and calculate statistics
    const supplierMap = new Map<string, {
      records: typeof records;
      latestRecordDate: string;
      latestRecordId: number;
    }>();

    records.forEach((record) => {
      const supplier = record.supplier || "Unknown";
      
      if (!supplierMap.has(supplier)) {
        supplierMap.set(supplier, {
          records: [],
          latestRecordDate: record.created_at || "",
          latestRecordId: record.id,
        });
      }

      const supplierData = supplierMap.get(supplier)!;
      supplierData.records.push(record);

      // Update latest record if this one is more recent
      const recordDate = record.created_at || "";
      if (recordDate > supplierData.latestRecordDate) {
        supplierData.latestRecordDate = recordDate;
        supplierData.latestRecordId = record.id;
      }
    });

    // Calculate statistics for each supplier
    const supplierStats: SupplierStats[] = Array.from(supplierMap.entries())
      .map(([supplier, data]) => {
        const totalRecords = data.records.length;
        
        // Count passes and fails based on judgement
        // Assuming "合格" means pass, and other values or null means fail/unknown
        const passCount = data.records.filter(r => 
          r.judgement && 
          (r.judgement === "合格" || 
           r.judgement.toLowerCase() === "pass" || 
           r.judgement.toLowerCase() === "approved" ||
           r.judgement === "✓")
        ).length;
        
        const failCount = totalRecords - passCount;
        const passRate = totalRecords > 0 ? (passCount / totalRecords) * 100 : 0;

        // Calculate average defective count
        const defectiveCounts = data.records
          .map(r => r.defective_count)
          .filter((count): count is number => typeof count === 'number' && count >= 0);
        
        const averageDefectiveCount = defectiveCounts.length > 0
          ? defectiveCounts.reduce((sum, count) => sum + count, 0) / defectiveCounts.length
          : 0;

        return {
          supplier,
          totalRecords,
          passCount,
          failCount,
          passRate: Math.round(passRate * 100) / 100, // Round to 2 decimal places
          averageDefectiveCount: Math.round(averageDefectiveCount * 100) / 100,
          latestRecordDate: data.latestRecordDate,
          latestRecordId: data.latestRecordId,
        };
      })
      .filter((stats) => {
        // Apply search filter if provided
        if (searchQuery) {
          return stats.supplier.toLowerCase().includes(searchQuery);
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by latest record date (most recent first)
        return new Date(b.latestRecordDate).getTime() - new Date(a.latestRecordDate).getTime();
      })
      .slice(0, searchQuery ? undefined : 5); // Return top 5 if no search, all results if searching

    return NextResponse.json({
      success: true,
      message: `Fetched statistics for ${supplierStats.length} supplier(s)`,
      data: supplierStats,
      count: supplierStats.length,
    });
  } catch (error: unknown) {
    const normalizedError =
      error instanceof Error ? error : new Error("Unknown error");
    console.error("Error fetching supplier statistics:", normalizedError);

    return NextResponse.json(
      {
        error: "Failed to fetch supplier statistics",
        details: normalizedError.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

