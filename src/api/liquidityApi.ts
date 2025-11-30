const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export type LiquidityRegime = 'EXPANSION' | 'CONTRACTION' | 'NEUTRAL'

export interface LiquidityStatus {
  date: string
  m2Value: number
  yoyChangePct: number
  regime: LiquidityRegime | string
}

export async function getLiquidityStatus(): Promise<LiquidityStatus> {
  const res = await fetch(`${API_BASE_URL}/api/liquidity/status`, {
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Error HTTP ${res.status}`)
  }

  const data = (await res.json()) as {
    date: string
    m2Value: number
    yoyChangePct: number
    regime: string
  }

  return {
    date: data.date,
    m2Value: Number(data.m2Value),
    yoyChangePct: Number(data.yoyChangePct),
    regime: data.regime,
  }
}
