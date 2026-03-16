import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/email';
import { ENABLE_SUCCESS_FAILURE_FLOWS } from '@/lib/flags';

function htmlPage(title: string, message: string, color: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title} — Greasy</title>
  <style>
    body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb}
    .card{background:white;border-radius:12px;padding:48px;max-width:480px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
    h1{font-size:28px;font-weight:700;color:${color};margin-bottom:12px}
    p{color:#6b7280;line-height:1.6}
    a{color:#16a34a;text-decoration:none;font-weight:600}
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <p style="margin-top:24px"><a href="/">Back to Greasy</a></p>
  </div>
</body>
</html>`;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return htmlPage('Invalid Link', 'This link is missing a verification token.', '#dc2626');
  }

  const parsed = verifyToken(token);
  if (!parsed) {
    return htmlPage('Link Expired', 'This verification link has expired or is invalid. Links are valid for 72 hours.', '#dc2626');
  }

  const { donationId, action } = parsed;

  // Fetch donation
  const { data: donation, error: fetchError } = await supabase
    .from('donations')
    .select('id, stripe_payment_intent_id, status, commitment_verified, amount_cents')
    .eq('id', donationId)
    .single();

  if (fetchError || !donation) {
    return htmlPage('Not Found', 'We could not find your donation record.', '#dc2626');
  }

  if (donation.commitment_verified !== null) {
    const alreadyMsg = donation.commitment_verified
      ? 'Your commitment was already confirmed. Your donation went to your chosen charity.'
      : 'You already reported that you didn\'t follow through. Your payment was processed.';
    return htmlPage('Already Responded', alreadyMsg, '#6b7280');
  }

  if (donation.status !== 'authorized') {
    return htmlPage('Already Processed', 'This payment has already been processed.', '#6b7280');
  }

  try {
    if (action === 'yes') {
      // Cancel the payment hold — commitment honored
      await stripe.paymentIntents.cancel(donation.stripe_payment_intent_id!);

      await supabase
        .from('donations')
        .update({
          commitment_verified: true,
          commitment_verified_at: new Date().toISOString(),
          status: 'refunded',
        })
        .eq('id', donationId);

      if (ENABLE_SUCCESS_FAILURE_FLOWS) {
        return NextResponse.redirect(new URL('/commitment/success', request.url));
      }
      return htmlPage(
        '🎉 Commitment Honored!',
        'Amazing work! Your payment hold has been released. No money was charged — you earned it.',
        '#16a34a'
      );
    } else {
      // Capture the payment — commitment failed
      const paymentIntent = await stripe.paymentIntents.capture(donation.stripe_payment_intent_id!);

      await supabase
        .from('donations')
        .update({
          commitment_verified: false,
          commitment_verified_at: new Date().toISOString(),
          status: 'captured',
          stripe_charge_id: paymentIntent.latest_charge as string,
        })
        .eq('id', donationId);

      if (ENABLE_SUCCESS_FAILURE_FLOWS) {
        return NextResponse.redirect(new URL('/commitment/failure', request.url));
      }
      return htmlPage(
        'Thanks for being honest',
        'Your payment has been processed and will go to your designated charity. Use this as motivation for next time.',
        '#f59e0b'
      );
    }
  } catch (error) {
    console.error('[Verify] Stripe error:', error);
    return htmlPage('Something Went Wrong', 'We had trouble processing your response. Please contact support.', '#dc2626');
  }
}
