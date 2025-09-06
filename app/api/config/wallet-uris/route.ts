import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { getDefaultConfig } from '@/lib/wallet-uri-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Public GET: attempt to fetch from DB; fallback to defaults
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceKey) {
      const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
      const { data, error } = await service
        .from('platform_configs')
        .select('value')
        .eq('key', 'wallet_uris')
        .single()
      if (!error && data?.value) return NextResponse.json(data.value)
    }
    return NextResponse.json(getDefaultConfig())
  } catch {
    return NextResponse.json(getDefaultConfig())
  }
}

export async function PATCH(req: Request) {
  try {
    // Admin-only update
    const cookieStore = await cookies()
    const anon = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {}
        }
      }
    )
    const { data: { user } } = await anon.auth.getUser()
    if (!user || (user.user_metadata?.role !== 'admin' && user.email !== 'admin@cryptrac.com')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const { error } = await service
      .from('platform_configs')
      .upsert({ key: 'wallet_uris', value: body }, { onConflict: 'key' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 })
  }
}
