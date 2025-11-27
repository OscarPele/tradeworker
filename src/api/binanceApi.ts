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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

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
