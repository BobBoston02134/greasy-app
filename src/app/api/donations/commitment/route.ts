import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendConfirmationEmail } from '@/lib/email';

export async function PATCH(request: Request) {
  try {
    const { paymentIntentId, notes } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'paymentIntentId required' }, { status: 400 });
    }

    // Fetch the donation
    const { data: donation, error: fetchError } = await supabase
      .from('donations')
      .select(`
        id, commitment_description, donor_email, donor_name, amount_cents,
        charity:charities!charity_id(name),
        anti_charity:charities!anti_charity_id(name),
        timeframe, capture_at
      `)
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (fetchError || !donation) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }

    // Update commitment description
    const { error: updateError } = await supabase
      .from('donations')
      .update({ commitment_description: notes ?? null })
      .eq('stripe_payment_intent_id', paymentIntentId);

    if (updateError) {
      console.error('[Commitment] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to save commitment' }, { status: 500 });
    }

    // Send confirmation email if we have a donor email
    if (donation.donor_email) {
      const charityData = donation.charity as unknown as { name: string } | null;
      const antiCharityData = donation.anti_charity as unknown as { name: string } | null;

      const timeframeLabels: Record<string, string> = {
        immediate: 'immediately',
        '5pm': 'today at 5 PM',
        '10pm': 'today at 10 PM',
        midnight: 'tonight at midnight',
        end_of_week: 'end of this week',
        end_of_month: 'end of this month',
        end_of_quarter: 'end of this quarter',
        end_of_year: 'end of this year',
      };

      await sendConfirmationEmail({
        to: donation.donor_email,
        donorName: donation.donor_name,
        amountCents: donation.amount_cents,
        recipientName: charityData?.name || 'your recipient',
        timeframeLabel: timeframeLabels[donation.timeframe] || donation.timeframe,
        commitmentDescription: notes ?? null,
        hasAntiCharity: !!antiCharityData,
        antiCharityName: antiCharityData?.name || null,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Commitment] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
