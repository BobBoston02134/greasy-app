import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { isValidEmail } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();

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

    const existing = await stripe.customers.list({
      email: email.toLowerCase().trim(),
      limit: 1,
    });

    if (existing.data.length > 0) {
      return NextResponse.json(
        { error: "Customer with this email already exists" },
        { status: 400 }
      );
    }

    const customer = await stripe.customers.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      metadata: {
        source: "greasy",
        created_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({ customerId: customer.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
