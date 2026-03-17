import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { ENABLE_LEAD_CAPTURE_FROM_FORGOT_PASSWORD } from "@/lib/flags";

const APP_URL = process.env.NEXTAUTH_URL || "https://greasy.ai";
const RESET_SECRET = process.env.EMAIL_VERIFY_SECRET || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "no-reply@greasy.ai";

if (!RESEND_API_KEY) {
  console.warn("[reset-password] WARNING: RESEND_API_KEY is not set — password reset emails will not be sent.");
}

if (!RESET_SECRET) {
  console.warn("[reset-password] WARNING: EMAIL_VERIFY_SECRET is not set — reset tokens are insecure.");
}

// Token expires in 1 hour
const TOKEN_TTL_MS = 60 * 60 * 1000;

function generateResetToken(email: string): string {
  const payload = `${email}:${Date.now()}`;
  const hmac = crypto.createHmac("sha256", RESET_SECRET);
  hmac.update(payload);
  const signature = hmac.digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

function verifyResetToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    const signature = decoded.slice(lastColon + 1);
    const payload = decoded.slice(0, lastColon);

    const hmac = crypto.createHmac("sha256", RESET_SECRET);
    hmac.update(payload);
    const expectedSig = hmac.digest("hex");

    if (
      signature.length !== expectedSig.length ||
      !crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSig, "hex")
      )
    ) {
      return null;
    }

    // payload is "email:timestamp"
    const secondColon = payload.lastIndexOf(":");
    const email = payload.slice(0, secondColon);
    const timestamp = parseInt(payload.slice(secondColon + 1), 10);

    if (Date.now() - timestamp > TOKEN_TTL_MS) {
      return null;
    }

    return email;
  } catch {
    return null;
  }
}

// POST /api/auth/reset-password
// Body: { email } — sends a reset email
// Body: { token, password } — resets the password
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Step 1: Request a reset link
  if (body.email && !body.token) {
    const email = String(body.email).toLowerCase().trim();

    // Check if user exists — but always respond 200 to prevent enumeration
    const { data: user } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("email", email)
      .single();

    if (user && RESEND_API_KEY) {
      const token = generateResetToken(email);
      const resetUrl = `${APP_URL}/forgot-password?token=${token}`;

      const html = `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
          <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">Reset your password</h1>
          <p style="color:#6b7280;margin-bottom:24px">Click the button below to set a new password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
            Reset Password
          </a>
          <p style="margin-top:24px;color:#6b7280;font-size:14px">If you didn't request this, you can ignore this email.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#9ca3af;font-size:12px">Greasy — financial accountability for real commitments.</p>
        </div>
      `;

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: email,
          subject: "Reset your Greasy password",
          html,
        }),
      });

      if (!resendRes.ok) {
        const resendError = await resendRes.text();
        console.error(`[reset-password] Resend API error (${resendRes.status}):`, resendError);
      }

      if (ENABLE_LEAD_CAPTURE_FROM_FORGOT_PASSWORD) {
        return NextResponse.json({
          ok: true,
          userExists: true,
          message: "If that email is registered, a reset link is on its way.",
        });
      }
    } else if (!user && ENABLE_LEAD_CAPTURE_FROM_FORGOT_PASSWORD) {
      try {
        await supabase
          .from("leads")
          .upsert({ email, source: "forgot_password" }, { onConflict: "email,source", ignoreDuplicates: true });
      } catch (err) {
        console.error("[reset-password] Lead capture insert failed:", err);
      }
      return NextResponse.json({
        ok: true,
        userExists: false,
        message: "If that email is registered, a reset link is on its way.",
      });
    }

    return NextResponse.json({
      ok: true,
      message: "If that email is registered, a reset link is on its way.",
    });
  }

  // Step 2: Set new password using the token
  if (body.token && body.password) {
    const email = verifyResetToken(String(body.token));

    if (!email) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    if (String(body.password).length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(String(body.password), 12);

    const { error } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("email", email);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update password. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid request." }, { status: 400 });
}
