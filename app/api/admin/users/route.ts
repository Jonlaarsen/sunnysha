import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAuthenticatedAdmin } from "@/lib/supabase-server";

export async function GET() {
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

    // Fetch all users using admin client
    const { data: users, error } = await admin.auth.admin.listUsers();

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Transform user data to include only necessary fields
    const userList = users.users.map((user) => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      user_metadata: user.user_metadata,
      email_confirmed_at: user.email_confirmed_at,
    }));

    return NextResponse.json({
      success: true,
      message: `Fetched ${userList.length} users`,
      data: userList,
      count: userList.length,
    });
  } catch (error: unknown) {
    const normalizedError =
      error instanceof Error ? error : new Error("Unknown error");
    console.error("Error in users endpoint:", normalizedError);
    return NextResponse.json(
      { error: normalizedError.message },
      { status: 500 }
    );
  }
}

