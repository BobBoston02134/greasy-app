import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendReminderEmail } from '@/lib/email';
import { ENABLE_REMINDER_EMAILS } from '@/lib/flags';

export async function GET(request: Request) {
  if (!ENABLE_REMINDER_EMAILS) {
    return NextResponse.json({ message: 'Reminder emails are disabled' }, { status: 200 });
  }

  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    // Window: donations whose capture_at is between 7 days and 8 days from now
    // (catches donations in the 7-day window without duplicate sends)
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const in8Days = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString();

    const { data: donations, error: fetchError } = await supabase
      .from('donations')
      .select(`
        id, donor_email, donor_name, amount_cents, capture_at, commitment_description,
        charity:charities!charity_id(name),
        anti_charity:charities!anti_charity_id(name)
      `)
      .eq('status', 'authorized')
      .is('commitment_verified', null)
      .gte('capture_at', in7Days)
      .lte('capture_at', in8Days)
      .not('donor_email', 'is', null);

    if (fetchError) {
      console.error('[Cron:send-reminders] Fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 });
    }

    if (!donations || donations.length === 0) {
      return NextResponse.json({ message: 'No reminders to send', sent: 0 });
    }

    let sent = 0;
    let failed = 0;

    for (const donation of donations) {
      const charityData = donation.charity as unknown as { name: string } | null;
      const antiCharityData = donation.anti_charity as unknown as { name: string } | null;

      const ok = await sendReminderEmail({
        to: donation.donor_email!,
        donorName: donation.donor_name,
        amountCents: donation.amount_cents,
        recipientName: charityData?.name || 'your recipient',
        antiCharityName: antiCharityData?.name || null,
        commitmentDescription: donation.commitment_description,
        captureAt: donation.capture_at!,
      });

      if (ok) {
        sent++;
      } else {
        failed++;
      }
    }

    console.log(`[Cron:send-reminders] Sent: ${sent}, Failed: ${failed}`);
    return NextResponse.json({ message: 'Reminder job complete', sent, failed });
  } catch (error) {
    console.error('[Cron:send-reminders] Error:', error);
    return NextResponse.json({ error: 'Reminder job failed' }, { status: 500 });
  }
}
