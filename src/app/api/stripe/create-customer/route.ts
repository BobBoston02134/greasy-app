import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { isValidEmail } from "@/lib/utils";
import { checkRateLimit } from "@/lib/ratelimit";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  // Rate limit: 5 requests per minute (strict)
  const rateLimitResponse = await checkRateLimit(request, 'strict');
  if (rateLimitResponse) return rateLimitResponse;
  try {
    const { name, email, password } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists in Supabase
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Check Stripe as fallback
    const existingStripe = await stripe.customers.list({
      email: normalizedEmail,
      limit: 1,
    });

    if (existingStripe.data.length > 0) {
      return NextResponse.json(
        { error: "Customer with this email already exists" },
        { status: 400 }
      );
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      name: name.trim(),
      email: normalizedEmail,
      metadata: {
        source: "greasy",
        created_at: new Date().toISOString(),
      },
    });

    // Hash password if provided
    const passwordHash = password ? await bcrypt.hash(password, 12) : null;

    // Create user in Supabase
    const { error: insertError } = await supabase.from("users").insert({
      email: normalizedEmail,
      name: name.trim(),
      password_hash: passwordHash,
      stripe_customer_id: customer.id,
    });

    if (insertError) {
      // Rollback: delete Stripe customer if DB insert fails
      await stripe.customers.del(customer.id);
      console.error("[Create Customer] DB insert failed:", insertError);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ customerId: customer.id }, { status: 201 });
  } catch (error) {
    console.error("[Create Customer] Error:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
