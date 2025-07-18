import { NextRequest, NextResponse } from 'next/server';
import { updateSessionCookies } from '@/actions/sessionActions'; // Alias
import { createSupabaseServer } from '../../../lib/supabase-server'; // Correct relative path

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const sessionStr = formData.get('session') as string;
  const session = JSON.parse(sessionStr);
  await updateSessionCookies(session);

  // Debug: Verify cookies are set
  const supabase = await createSupabaseServer();
  const { data: { session: refreshedSession } } = await supabase.auth.getSession();
  console.log('Session after cookie update in API:', refreshedSession);

  // Redirect to admin with absolute URL
  return NextResponse.redirect('http://localhost:3000/admin');
}