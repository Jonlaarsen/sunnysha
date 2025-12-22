import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function PUT(req: NextRequest) {
  try {
    // Check if current user is admin
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    if (!adminEmails.includes(currentUser.email || '')) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { userId, email, name } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: {
      email?: string;
      user_metadata?: Record<string, unknown>;
    } = {};

    if (email) {
      updateData.email = email;
    }

    if (name !== undefined) {
      updateData.user_metadata = {
        name: name || email?.split('@')[0] || '',
      };
    }

    // Update user using admin client
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      updateData
    );

    if (error) {
      console.error("Error updating user:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "User updated successfully",
        data: {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const normalizedError =
      error instanceof Error ? error : new Error("Unknown error");
    console.error("Error in update-user endpoint:", normalizedError);
    return NextResponse.json(
      { error: normalizedError.message },
      { status: 500 }
    );
  }
}

