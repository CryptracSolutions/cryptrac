import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  // Stub endpoint for A/B exposure tracking; integrate with analytics later.
  return NextResponse.json({ success: true })
}

