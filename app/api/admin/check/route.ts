import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { user, isAdmin } = await isAuthenticatedAdmin();
    
    if (!user) {
      return NextResponse.json(
        { isAdmin: false, authenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      isAdmin,
      authenticated: true,
      email: user.email,
    });
  } catch {
    return NextResponse.json(
      { isAdmin: false, authenticated: false },
      { status: 200 }
    );
  }
}


