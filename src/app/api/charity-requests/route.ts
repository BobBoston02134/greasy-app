import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/ratelimit";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  // Rate limit: 5 requests per minute (strict)
  const rateLimitResponse = await checkRateLimit(request, 'strict');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { charityName, website, reason, email } = body;

    // Validate required fields
    if (!charityName || typeof charityName !== "string" || !charityName.trim()) {
      return NextResponse.json(
        { error: "Charity name is required" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate website URL if provided
    if (website && !isValidUrl(website)) {
      return NextResponse.json(
        { error: "Invalid website URL" },
        { status: 400 }
      );
    }

    const { data: charityRequest, error } = await supabase
      .from("charity_requests")
      .insert({
        charity_name: charityName.trim(),
        website: website?.trim() || null,
        reason: reason?.trim() || null,
        email: email?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[Charity Request API]", error);
      return NextResponse.json(
        { error: "Failed to create charity request" },
        { status: 500 }
      );
    }

    return NextResponse.json(charityRequest, { status: 201 });
  } catch (error) {
    console.error("[Charity Request API]", error);
    return NextResponse.json(
      { error: "Failed to create charity request" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data: charityRequests, error } = await supabase
      .from("charity_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch charity requests" },
        { status: 500 }
      );
    }

    return NextResponse.json(charityRequests);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch charity requests" },
      { status: 500 }
    );
  }
}
