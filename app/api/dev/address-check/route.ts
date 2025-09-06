import { NextRequest, NextResponse } from 'next/server'
import { formatAddressForQR, isValidAddress } from '@/lib/simple-address-formatter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address') || ''
  const currency = searchParams.get('currency') || ''
  const extraId = searchParams.get('extraId') || undefined

  if (!address || !currency) {
    return NextResponse.json({ success: false, error: 'Missing address or currency' }, { status: 400 })
  }

  const result = formatAddressForQR(currency, address, extraId)
  const valid = isValidAddress(address)

  return NextResponse.json({
    success: true,
    currency: currency.toUpperCase(),
    address,
    extraId,
    qrContent: result.qrContent,
    isValidAddress: valid,
    needsExtraId: result.needsExtraId,
    extraIdLabel: result.extraIdLabel,
  })
}

