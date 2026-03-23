import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAuthenticatedAdmin } from "@/lib/supabase-server";

export async function DELETE(req: NextRequest) {
  try {
    // Check if current user is admin
    const { user: currentUser, isAdmin } = await isAuthenticatedAdmin();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const admin = supabaseAdmin;
    if (!admin) {
      return NextResponse.json(
        {
          error: "请在 .env.local 中设置 SUPABASE_SERVICE_ROLE_KEY（Supabase 面板 → Settings → API → service_role key）",
        },
        { status: 503 }
      );
    }

    // Get user ID from query parameter or request body
    const userId = req.nextUrl.searchParams.get("userId");
    const body = await req.json().catch(() => ({}));
    const targetUserId = userId || body.userId;

    if (!targetUserId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Prevent admins from deleting themselves
    if (targetUserId === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete user using admin client
    const { error } = await admin.auth.admin.deleteUser(targetUserId);

    if (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "User deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const normalizedError =
      error instanceof Error ? error : new Error("Unknown error");
    console.error("Error in delete-user endpoint:", normalizedError);
    return NextResponse.json(
      { error: normalizedError.message },
      { status: 500 }
    );
  }
}

