import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendConfirmationEmail } from '@/lib/email';

export async function PATCH(request: Request) {
  try {
    // isFinal: true means this is the last step in the commit flow — send confirmation email.
    // When user picks "No motivation", isFinal=true is sent with notes.
    // When user picks anti-charity, isFinal=true is sent with antiCharitySlug.
    // Intermediate "describe commitment" step sends isFinal=false.
    const { paymentIntentId, notes, antiCharitySlug, isFinal = false } = await request.json();

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

    // Resolve anti-charity slug to ID if provided
    let antiCharityId: string | null = null;
    if (antiCharitySlug) {
      const { data: antiCharityData } = await supabase
        .from('charities')
        .select('id')
        .eq('slug', antiCharitySlug)
        .single();
      antiCharityId = antiCharityData?.id ?? null;
    }

    // Build update payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: Record<string, any> = { commitment_description: notes ?? null };
    if (antiCharityId !== null) {
      updatePayload.anti_charity_id = antiCharityId;
    }

    // Update commitment description (and anti-charity if provided)
    const { error: updateError } = await supabase
      .from('donations')
      .update(updatePayload)
      .eq('stripe_payment_intent_id', paymentIntentId);

    if (updateError) {
      console.error('[Commitment] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to save commitment' }, { status: 500 });
    }

    // Send confirmation email only on the final step of the flow
    if (isFinal && donation.donor_email) {
      const charityData = donation.charity as unknown as { name: string } | null;
      // Use the newly resolved anti-charity name if this call set it,
      // otherwise fall back to what was already in the DB.
      const existingAntiCharityData = donation.anti_charity as unknown as { name: string } | null;
      let resolvedAntiCharityName: string | null = existingAntiCharityData?.name || null;
      if (antiCharitySlug && antiCharityId) {
        // Fetch the name for the newly set anti-charity
        const { data: acNameData } = await supabase
          .from('charities')
          .select('name')
          .eq('id', antiCharityId)
          .single();
        resolvedAntiCharityName = acNameData?.name || null;
      }

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
        commitmentDescription: notes ?? (donation.commitment_description as string | null),
        hasAntiCharity: !!resolvedAntiCharityName,
        antiCharityName: resolvedAntiCharityName,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Commitment] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
