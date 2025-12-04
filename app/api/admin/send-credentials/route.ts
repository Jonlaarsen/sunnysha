import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, setupLink, name } = await req.json();

    if (!email || !setupLink) {
      return NextResponse.json(
        { error: "Email and setup link are required" },
        { status: 400 }
      );
    }

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "QC System <noreply@yourdomain.com>",
      to: email,
      subject: "Set Up Your QC System Account",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">QC Report System</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">SUSU Warehouse</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
              <h2 style="color: #333; margin-top: 0;">Welcome, ${name || email.split('@')[0]}!</h2>
              
              <p>Your account has been created. Click the button below to set up your password and get started:</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 10px 0; font-size: 14px; color: #666;">You'll set your password in the next step.</p>
              </div>
              
              <p style="margin-top: 30px;">
                <a href="${setupLink}" 
                   style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Set Up Your Account
                </a>
              </p>
              
              <p style="margin-top: 15px; font-size: 12px; color: #666;">
                Or copy and paste this link into your browser:<br>
                <span style="word-break: break-all; color: #667eea;">${setupLink}</span>
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
                <p><strong>Security Notice:</strong></p>
                <p>This link will expire in 24 hours for security purposes.</p>
                <p>If you did not request this account, please contact your administrator immediately.</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </body>
        </html>
      `,
      text: `
Welcome to QC Report System!

Your account has been created. Set up your password using the link below:

Email: ${email}

Set up your account: ${setupLink}

This link will expire in 24 hours for security purposes.

If you did not request this account, please contact your administrator immediately.

This is an automated message. Please do not reply to this email.
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Credentials email sent successfully",
    });
  } catch (error: unknown) {
    const normalizedError =
      error instanceof Error ? error : new Error("Unknown error");
    console.error("Error sending email:", normalizedError);
    return NextResponse.json(
      { error: normalizedError.message },
      { status: 500 }
    );
  }
}


