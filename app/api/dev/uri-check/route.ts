import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildCryptoPaymentURI } from '@/lib/crypto-uri-builder'
import { buildBestURI } from '@/lib/wallet-uri-helper'
import { validateURI } from '@/lib/uri-validation'
import { requiresExtraId, getExtraIdLabel } from '@/lib/extra-id-validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AddressBook = Record<string, string>

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchant_id')
    const amountStr = searchParams.get('amount') || '1.23456789'
    const codes = (searchParams.get('codes') || '').split(',').filter(Boolean)

    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'merchant_id is required' }, { status: 400 })
    }

    const amount = Number(amountStr)
    if (!isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'amount must be a positive number' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: merchant, error } = await supabase
      .from('merchants')
      .select('wallets')
      .eq('id', merchantId)
      .single()

    if (error || !merchant) {
      return NextResponse.json({ success: false, error: 'Merchant not found' }, { status: 404 })
    }

    const wallets: AddressBook = merchant.wallets || {}
    const currencies = (codes.length > 0 ? codes : Object.keys(wallets)).sort()

    const results = await Promise.all(currencies.map(async (code) => {
      const address = wallets[code] || ''
      const upper = code.toUpperCase()

      const extraIdNeeded = requiresExtraId(upper)
      const extra = extraIdNeeded ? '123456' : undefined

      // Build best candidate first
      const best = buildBestURI({
        currency: upper,
        address: address || 'ADDRESS',
        amount,
        extraId: extra,
      })

      // Validate and fall back to standard if invalid
      let chosen = best.uri
      let chosenSource = best.source
      let chosenQuality = best.quality
      const validation = await validateURI(chosen, {
        currency: upper,
        address: address || 'ADDRESS',
        amount,
        extraId: extra,
      })
      if (!validation.isValid || !validation.addressDetected || !validation.amountDetected) {
        const std = buildCryptoPaymentURI({
          currency: upper,
          address: address || 'ADDRESS',
          amount,
          extraId: extra,
          label: 'Cryptrac Payment',
          message: 'URI Check',
        })
        chosen = std.uri
        chosenSource = 'standard'
        chosenQuality = std.includesAmount ? 70 : 40
      }

      const includesAmountFlag = !/^(?:[^:]+:)?$/.test(chosen) && !/^\w+$/.test(chosen)
        ? true
        : chosen.includes('amount') || chosen.includes('value=') || false
      const includesExtraIdFlag = extraIdNeeded ? chosen.includes(String(extra)) : false

      const issues: string[] = []
      if (!address) issues.push('No wallet configured; using placeholder')
      if (!includesAmountFlag) issues.push('Amount not embedded in URI')
      if (extraIdNeeded && !includesExtraIdFlag) issues.push(`${getExtraIdLabel(upper)} not embedded in URI`)
      if (/^phantom:\/\//i.test(chosen)) issues.push('Deprecated Phantom scheme found; should use Solana Pay (solana:)')

      return {
        code: upper,
        source: chosenSource,
        quality: chosenQuality,
        uri: chosen,
        includesAmount: includesAmountFlag,
        includesExtraId: includesExtraIdFlag,
        needsExtraId: extraIdNeeded,
        issues,
      }
    }))

    return NextResponse.json({
      success: true,
      merchant_id: merchantId,
      amount_used: amount,
      count: results.length,
      results,
    })

  } catch (err) {
    console.error('URI check error:', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
