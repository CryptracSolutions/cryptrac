import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    if (process.env.NODE_ENV !== 'production') {
      console.info('[mobile-metrics]', payload?.metric?.name, payload?.metric?.value)
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[mobile-metrics] failed to parse payload', error)
    }
  }

  return NextResponse.json({ success: true })
}
