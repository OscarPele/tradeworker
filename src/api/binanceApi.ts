// src/binanceApi.ts

export interface MarginAsset {
  asset: string
  free: string
  locked: string
  borrowed: string
  interest: string
  netAsset: string
}

export interface MarginAccount {
  borrowEnabled: boolean
  marginLevel: string
  totalAssetOfBtc: string
  totalLiabilityOfBtc: string
  totalNetAssetOfBtc: string
  tradeEnabled: boolean
  transferEnabled: boolean
  userAssets: MarginAsset[]
}

export interface CreateOcoRequest {
  symbol?: string
  side: 'BUY' | 'SELL'
  takeProfitPercent: number
  stopLossPercent: number
  isolated?: boolean
  leverage?: number
}

export interface OrderRef {
  orderId: number
  clientOrderId?: string
  status?: string
  price?: string
  stopPrice?: string
  type?: string
  side?: string
}

export interface CreateOcoResponse {
  symbol: string
  entrySide: 'BUY' | 'SELL'
  quantity: string
  borrowAsset?: string
  borrowAmount?: string
  referencePrice: number
  takeProfitPrice: number
  stopLossPrice: number
  borrowOrder?: OrderRef
  entryOrder?: OrderRef
  ocoOrder?: OrderRef
}

export interface OpenOrdersResponse {
  hasOpenOrders: boolean
  orders: OrderRef[]
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function getMarginAccount(): Promise<MarginAccount> {
  const res = await fetch(`${API_BASE_URL}/api/binance/margin-account`, {
    method: 'GET',
    // no necesitamos credenciales/cookies por ahora
    // credentials: 'include',
  })

  if (!res.ok) {
    throw new Error(`Error HTTP ${res.status}`)
  }

  const data = (await res.json()) as MarginAccount
  return data
}

export async function createMarginOco(
  params: CreateOcoRequest,
): Promise<CreateOcoResponse> {
  const body = {
    symbol: params.symbol ?? 'BTCUSDC',
    side: params.side,
    takeProfitPercent: params.takeProfitPercent,
    stopLossPercent: params.stopLossPercent,
    isolated: params.isolated ?? false,
    leverage: params.leverage ?? 20,
  }

  const res = await fetch(`${API_BASE_URL}/api/binance/margin/order/oco`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Error HTTP ${res.status}`)
  }

  return (await res.json()) as CreateOcoResponse
}

export async function getOpenMarginOrders(
  symbol = 'BTCUSDC',
  isolated = false,
): Promise<OpenOrdersResponse> {
  const url = `${API_BASE_URL}/api/binance/margin/open-orders?symbol=${encodeURIComponent(
    symbol,
  )}&isolated=${isolated}`
  const res = await fetch(url, { method: 'GET' })

  if (!res.ok) {
    throw new Error(`Error HTTP ${res.status}`)
  }

  return (await res.json()) as OpenOrdersResponse
}
