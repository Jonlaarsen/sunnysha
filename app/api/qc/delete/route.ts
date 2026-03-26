import { NextRequest, NextResponse } from "next/server";
import { createClient, isAuthenticatedAdmin } from "@/lib/supabase-server";

export async function DELETE(req: NextRequest) {
  try {
    const { user, isAdmin } = await isAuthenticatedAdmin();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in to delete records" },
        { status: 401 }
      );
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden", message: "仅管理员可删除检查记录" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const recordId = Number(body.id);
    if (!recordId || Number.isNaN(recordId)) {
      return NextResponse.json(
        { error: "Validation failed", message: "记录 ID 无效" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from("qc_records").delete().eq("id", recordId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete QC record", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "检查记录已删除" }, { status: 200 });
  } catch (error: unknown) {
    const normalizedError = error instanceof Error ? error : new Error("Unknown error");
    return NextResponse.json(
      { error: "Failed to delete QC record", details: normalizedError.message },
      { status: 500 }
    );
  }
}
