import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { isAdmin: false, authenticated: false },
        { status: 200 }
      );
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
    const isAdmin = adminEmails.includes(user.email || "");

    return NextResponse.json({
      isAdmin,
      authenticated: true,
      email: user.email,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { isAdmin: false, authenticated: false },
      { status: 200 }
    );
  }
}


