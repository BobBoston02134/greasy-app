import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { feedback, email, page, userAgent } = body;

    const submissionEmail =
      email && email.trim() ? email.trim() : "noreply@greasy.ai";
    const message = `Page: ${page || "unknown"}\n\n${feedback || ""}`;

    try {
      await supabase.from("contact_submissions").insert({
        name: "Feedback Widget",
        email: submissionEmail,
        message: message.trim(),
      });
    } catch (dbErr) {
      console.error("[Feedback API] DB insert error:", dbErr);
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const html = `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
          <h1 style="font-size:22px;font-weight:700;margin-bottom:8px">New Greasy Feedback</h1>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:14px;width:80px">Page</td>
              <td style="padding:6px 0;font-size:14px">${page || "unknown"}</td>
            </tr>
            ${email && email.trim() ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px">User email</td><td style="padding:6px 0;font-size:14px">${email.trim()}</td></tr>` : ""}
            ${userAgent ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;vertical-align:top">User agent</td><td style="padding:6px 0;font-size:12px;color:#6b7280">${userAgent}</td></tr>` : ""}
          </table>
          <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px">
            <p style="margin:0;font-size:15px;line-height:1.6;white-space:pre-wrap">${feedback || ""}</p>
          </div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#9ca3af;font-size:12px">Greasy — financial accountability for real commitments.</p>
        </div>
      `;

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "no-reply@greasy.ai",
          to: "admin@getgreasy.ai",
          subject: "New Greasy Feedback",
          html,
        }),
      });

      if (!resendRes.ok) {
        const err = await resendRes.text();
        console.error("[Feedback API] Resend error:", err);
      }
    } else {
      console.warn("[Feedback API] RESEND_API_KEY not set — email not sent");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Feedback API] Unexpected error:", err);
    return NextResponse.json({ ok: true });
  }
}
