import { NextRequest, NextResponse } from 'next/server'

async function fetchJSON(input: RequestInfo, init?: RequestInit, timeoutMs = 6000) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(input, { ...(init || {}), signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

function safeNumber(n: unknown): number | null {
  const x = typeof n === 'string' ? parseFloat(n) : typeof n === 'number' ? n : NaN
  return isFinite(x) ? x : null
}

function isHexResult(v: unknown): v is string {
  return typeof v === 'string' && /^0x[0-9a-fA-F]+$/.test(v)
}

async function jsonRpcHex(url: string, payload: any): Promise<string | null> {
  const res = await fetchJSON(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => null)
  const hex = (res as any)?.result
  return isHexResult(hex) ? hex : null
}

async function ethFeeHistoryWei(url: string): Promise<number> {
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_feeHistory',
    params: [5, 'latest', [50]] // 5 blocks, 50th percentile tip
  }
  const res: any = await fetchJSON(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const baseFees: string[] | undefined = res?.result?.baseFeePerGas
  const rewards: string[][] | undefined = res?.result?.reward
  if (!Array.isArray(baseFees) || !Array.isArray(rewards) || rewards.length === 0) {
    throw new Error('bad feeHistory')
  }
  // baseFeePerGas length = blockCount + 1; the last element is the next block base fee
  const nextBaseHex = baseFees[baseFees.length - 1]
  const tipHex = rewards[rewards.length - 1]?.[0] // 50th percentile (only one percentile requested)
  if (!isHexResult(nextBaseHex) || !isHexResult(tipHex)) throw new Error('bad hex')
  const nextBase = parseInt(nextBaseHex, 16)
  const tip = parseInt(tipHex, 16)
  // Add a small safety margin (10%) to tip to reflect volatility
  return nextBase + Math.ceil(tip * 1.1)
}

export async function GET() {
  try {
    // 1) Prices (USD)
    const priceIds = ['bitcoin','ethereum','solana','ripple','tron','binancecoin','sui']
    const priceUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${priceIds.join(',')}&vs_currencies=usd`
    const prices = await fetchJSON(priceUrl)

    const usdPrice = {
      BTC: safeNumber(prices?.bitcoin?.usd) || 0,
      ETH: safeNumber(prices?.ethereum?.usd) || 0,
      SOL: safeNumber(prices?.solana?.usd) || 0,
      XRP: safeNumber(prices?.ripple?.usd) || 0,
      TRX: safeNumber(prices?.tron?.usd) || 0,
      BNB: safeNumber(prices?.binancecoin?.usd) || 0,
      BASE: safeNumber(prices?.ethereum?.usd) || 0, // Base uses ETH for gas
      SUI: safeNumber(prices?.sui?.usd) || 0
    }

    // 2) BTC: mempool.space sat/vB → assume 225 vB tx (more typical)
    const btcFees = await fetchJSON('https://mempool.space/api/v1/fees/recommended').catch(() => null)
    const btcSatPerVb = safeNumber(btcFees?.halfHourFee) || safeNumber(btcFees?.hourFee) || safeNumber(btcFees?.fastestFee) || null
    const btcFeeUsd = btcSatPerVb != null
      ? ((btcSatPerVb * 225 /* vB */) / 1e8) * usdPrice.BTC
      : null

    // 3) ETH gas price (wei) — race multiple RPCs using feeHistory; fallback to gasPrice
    const ethRpcUrls = [
      'https://cloudflare-eth.com',
      'https://rpc.ankr.com/eth',
      'https://rpc.ethermine.org',
      'https://rpc.builder0x69.io',
      'https://ethereum.publicnode.com',
    ]
    let ethGasWei: number | null = null
    try {
      ethGasWei = await Promise.any(
        ethRpcUrls.map((u) => ethFeeHistoryWei(u))
      )
    } catch {
      // fallback to eth_gasPrice race
      const payload = { jsonrpc: '2.0', id: 1, method: 'eth_gasPrice', params: [] }
      const hex = await Promise.any(
        ethRpcUrls.map((u) =>
          jsonRpcHex(u, payload).then((h) => (h ? Promise.resolve(h) : Promise.reject(new Error('invalid'))))
        )
      ).catch(() => null) as string | null
      ethGasWei = hex ? parseInt(hex, 16) : null
    }
    const ethFeeEth = ethGasWei != null ? (ethGasWei * 21000) / 1e18 : null
    const ethFeeUsd = ethFeeEth != null ? ethFeeEth * usdPrice.ETH : null

    // 4) BASE gas price — try feeHistory then fallback to gasPrice; validate hex
    let baseGasWei: number | null = null
    try {
      baseGasWei = await ethFeeHistoryWei('https://mainnet.base.org')
    } catch {
      const hex = await jsonRpcHex('https://mainnet.base.org', { jsonrpc: '2.0', id: 1, method: 'eth_gasPrice', params: [] })
      baseGasWei = hex ? parseInt(hex, 16) : null
    }
    const baseFeeEth = baseGasWei != null ? (baseGasWei * 21000) / 1e18 : null
    const baseFeeUsd = baseFeeEth != null ? baseFeeEth * usdPrice.ETH : null

    // 5) BNB Chain gas price — try feeHistory then fallback to gasPrice; validate hex
    let bnbGasWei: number | null = null
    try {
      bnbGasWei = await ethFeeHistoryWei('https://bsc-dataseed.binance.org')
    } catch {
      const hex = await jsonRpcHex('https://bsc-dataseed.binance.org', { jsonrpc: '2.0', id: 1, method: 'eth_gasPrice', params: [] })
      bnbGasWei = hex ? parseInt(hex, 16) : null
    }
    const bnbFeeBnb = bnbGasWei != null ? (bnbGasWei * 21000) / 1e18 : null
    const bnbFeeUsd = bnbFeeBnb != null ? bnbFeeBnb * usdPrice.BNB : null

    // 6) XRP fee via public HTTPS JSON-RPC (xrplcluster)
    const xrpFeeRes = await fetchJSON('https://xrplcluster.com/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'fee', params: [{}] })
    }).catch(() => null)
    const xrpMedianDrops = safeNumber(xrpFeeRes?.result?.drops?.median_fee) || safeNumber(xrpFeeRes?.result?.drops?.open_ledger_fee) || null
    const xrpFeeXrp = xrpMedianDrops != null ? xrpMedianDrops / 1_000_000 : null
    const xrpFeeUsd = xrpFeeXrp != null ? xrpFeeXrp * usdPrice.XRP : null

    // 7) Solana fee via getRecentBlockhash (lamports per signature)
    const solRes = await fetchJSON('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getRecentBlockhash', params: [] })
    }).catch(() => null)
    // Fallback to typical base signature fee if not provided
    const lamportsPerSig = safeNumber(solRes?.result?.value?.feeCalculator?.lamportsPerSignature) ?? 5000
    const solFeeSol = lamportsPerSig != null ? (lamportsPerSig as number) / 1e9 : null
    const solFeeUsd = solFeeSol != null ? solFeeSol * usdPrice.SOL : null

    // 8) SUI (approx): use RPC to fetch reference gas price, assume 2e4 gas units for simple transfer
    const suiGasRes = await fetchJSON('https://fullnode.mainnet.sui.io', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'suix_getReferenceGasPrice', params: [] })
    }).catch(() => null)
    const suiGasPrice = safeNumber(suiGasRes?.result) // in MIST per gas unit (1 SUI = 1e9 MIST)
    const suiGasUnits = 20000 // compact heuristic for a transfer
    const suiFeeSui = suiGasPrice != null ? (suiGasPrice * suiGasUnits) / 1e9 : null
    const suiFeeUsd = suiFeeSui != null ? suiFeeSui * usdPrice.SUI : null

    // 9) Tron (approx): use chain parameter transaction fee per KB (sun)
    const tronParams = await fetchJSON('https://api.trongrid.io/wallet/getchainparameters', { method: 'GET' }).catch(() => null)
    const txFeeParam = (tronParams?.chainParameter || []).find((p: any) => p.key === 'getTransactionFee')
    const tronSunPerKb = safeNumber(txFeeParam?.value) || 1000 // default 1000 sun
    const tronFeeTrx = (tronSunPerKb / 1_000_000) * 0.2 // assume ~0.2 KB simple transfer
    const tronFeeUsd = tronFeeTrx * usdPrice.TRX

    const data = {
      btc: btcFeeUsd,
      eth: ethFeeUsd,
      sol: solFeeUsd,
      xrp: xrpFeeUsd,
      base: baseFeeUsd,
      trx: tronFeeUsd,
      sui: suiFeeUsd,
      bnb: bnbFeeUsd
    }

    return NextResponse.json(data, { status: 200 })
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
