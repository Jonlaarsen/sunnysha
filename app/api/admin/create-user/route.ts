import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
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

    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Generate a random temporary password (user will set their own via link)
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + "A1!";

    // Create user using admin client (bypasses email confirmation)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword, // Temporary password, user will set their own
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: name || email.split('@')[0],
        first_login: true, // Mark as first login
      },
    });

    if (error) {
      console.error("Error creating user:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Generate password reset link for the user to set their password
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    
    // Generate password reset token
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${appUrl}/setup-password`,
      },
    });

    if (resetError || !resetData) {
      console.error("Error generating password reset link:", resetError);
      return NextResponse.json(
        { error: "Failed to generate account setup link" },
        { status: 500 }
      );
    }

    // Send email with setup link
    try {
      const emailResponse = await fetch(
        `${req.nextUrl.origin}/api/admin/send-credentials`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            email, 
            setupLink: resetData.properties.action_link,
            name 
          }),
        }
      );

      if (!emailResponse.ok) {
        const emailError = await emailResponse.json();
        console.error("Failed to send setup email:", emailError);
        // Don't fail the user creation if email fails, but log it
      }
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Continue even if email fails
    }

    return NextResponse.json({
      success: true,
      message: "User created successfully. Account setup link sent to email.",
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
      },
    });
  } catch (error: unknown) {
    const normalizedError =
      error instanceof Error ? error : new Error("Unknown error");
    console.error("Error in create-user:", normalizedError);
    return NextResponse.json(
      { error: normalizedError.message },
      { status: 500 }
    );
  }
}


