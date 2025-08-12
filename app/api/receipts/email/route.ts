import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function getServiceAndMerchant(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return { error: 'Unauthorized' };
  const token = auth.substring(7);
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user } } = await anon.auth.getUser(token);
  if (!user) return { error: 'Unauthorized' };
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: merchant } = await service.from('merchants').select('id').eq('user_id', user.id).single();
  if (!merchant) return { error: 'Merchant not found' };
  return { service, merchant };
}

export async function POST(request: NextRequest) {
  const auth = await getServiceAndMerchant(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const { service, merchant } = auth;
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const appOrigin = process.env.APP_ORIGIN;
  const { email, payment_link_id } = await request.json();
  if (!email || !payment_link_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const { data: link } = await service
    .from('payment_links')
    .select('link_id')
    .eq('id', payment_link_id)
    .eq('merchant_id', merchant.id)
    .single();
  if (!link) {
    return NextResponse.json({ error: 'Payment link not found' }, { status: 404 });
  }

  let status = 'queued';
  if (sendgridKey && fromEmail && appOrigin) {
    try {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }], subject: 'Your receipt' }],
          from: { email: fromEmail },
          content: [{ type: 'text/plain', value: `View receipt: ${appOrigin}/pay/${link.link_id}` }]
        })
      });
      status = 'sent';
    } catch (err) {
      console.error('receipt email error', err);
    }
  }
  await service.from('email_logs').insert({ email, type: 'receipt', status });
  return NextResponse.json({ success: true, queued: status !== 'sent' });
}
