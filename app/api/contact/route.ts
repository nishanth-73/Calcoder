import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

interface ContactBody {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactBody = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Validate minimum message length
    if (message.length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters." },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters." },
        { status: 400 }
      );
    }

    const toEmail = process.env.TO_EMAIL;
    const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";

    if (!toEmail) {
      return NextResponse.json(
        { error: "Destination email not configured." },
        { status: 500 }
      );
    }

    const resend = getResend();
    if (!resend) {
      return NextResponse.json(
        { success: false, error: "Email service unavailable" },
        { status: 503 }
      );
    }

    const timestamp = new Date().toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    });

    const { data, error } = await resend.emails.send({
      from: `Calcoder Contact <${fromEmail}>`,
      to: [toEmail],
      replyTo: email,
      subject: `New Contact Form Submission - Calcoder`,
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a2e;">
            <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 20px;">New Contact Form Submission</h1>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Name</td>
                  <td style="padding: 8px 0; font-weight: 600;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Email</td>
                  <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #2563eb;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Subject</td>
                  <td style="padding: 8px 0; font-weight: 600;">${subject}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Submitted</td>
                  <td style="padding: 8px 0; color: #64748b;">${timestamp}</td>
                </tr>
              </table>
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Message</p>
                <p style="white-space: pre-wrap; background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; line-height: 1.6;">${message}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      return NextResponse.json(
        { error: "Failed to send email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Message sent successfully!", id: data?.id }
    );
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
