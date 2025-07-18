// app/actions/sessionActions.ts
"use server";

import { cookies } from 'next/headers';

export async function updateSessionCookies(session: any) {
  const cookieStore = await cookies();
  cookieStore.set('sb-access-token', session.access_token, { path: '/', maxAge: 3600 });
  cookieStore.set('sb-refresh-token', session.refresh_token, { path: '/', maxAge: 3600 });
}