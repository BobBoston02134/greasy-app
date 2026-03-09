import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendCheckinEmail } from '@/lib/email';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    // Find authorized donations due within 24 hours that haven't been sent a check-in yet
    const { data: donations, error: fetchError } = await supabase
      .from('donations')
      .select(`
        id, donor_email, donor_name, amount_cents, timeframe, capture_at, notes,
        charity:charities!charity_id(name),
        anti_charity:charities!anti_charity_id(name)
      `)
      .eq('status', 'authorized')
      .eq('checkin_email_sent', false)
      .is('commitment_verified', null)
      .lte('capture_at', in24Hours)
      .not('donor_email', 'is', null);

    if (fetchError) {
      console.error('[Cron:send-checkins] Fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 });
    }

    if (!donations || donations.length === 0) {
      return NextResponse.json({ message: 'No check-ins to send', sent: 0 });
    }

    let sent = 0;
    let failed = 0;

    for (const donation of donations) {
      const charityData = donation.charity as { name: string } | null;
      const antiCharityData = donation.anti_charity as { name: string } | null;

      const ok = await sendCheckinEmail({
        to: donation.donor_email!,
        donorName: donation.donor_name,
        donationId: donation.id,
        amountCents: donation.amount_cents,
        recipientName: charityData?.name || 'your recipient',
        antiCharityName: antiCharityData?.name || null,
        commitmentDescription: donation.notes,
        captureAt: donation.capture_at!,
      });

      if (ok) {
        await supabase
          .from('donations')
          .update({ checkin_email_sent: true })
          .eq('id', donation.id);
        sent++;
      } else {
        failed++;
      }
    }

    console.log(`[Cron:send-checkins] Sent: ${sent}, Failed: ${failed}`);
    return NextResponse.json({ message: 'Check-in job complete', sent, failed });
  } catch (error) {
    console.error('[Cron:send-checkins] Error:', error);
    return NextResponse.json({ error: 'Check-in job failed' }, { status: 500 });
  }
}
