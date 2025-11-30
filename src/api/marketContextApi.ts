const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export interface DailyMetricsSnapshot {
  id: number
  asOf: string
  return1d: number | null
  return3d: number | null
  realizedVol7d: number | null
  atr14: number | null
  deltaOpenInterest24h: number | null
  fundingRateZScore30d: number | null
  takerBuySellRatio24h: number | null
  liquidationLongVolumeUsd24h: number | null
  liquidationShortVolumeUsd24h: number | null
  volumeRelative24h: number | null
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const num = Number(value)
  return Number.isNaN(num) ? null : num
}

type HttpError = Error & { status?: number }

export async function getDailyMetrics(): Promise<DailyMetricsSnapshot> {
  const endpoint = '/metrics/btc/daily/latest'
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
  })

  if (!res.ok) {
    const err: HttpError = new Error(
      res.status === 404
        ? 'No hay métricas almacenadas todavía (404)'
        : `Error HTTP ${res.status}`,
    )
    err.status = res.status
    throw err
  }

  const raw = (await res.json()) as DailyMetricsSnapshot

  return {
    id: raw.id,
    asOf: raw.asOf,
    return1d: toNumber(raw.return1d),
    return3d: toNumber(raw.return3d),
    realizedVol7d: toNumber(raw.realizedVol7d),
    atr14: toNumber(raw.atr14),
    deltaOpenInterest24h: toNumber(raw.deltaOpenInterest24h),
    fundingRateZScore30d: toNumber(raw.fundingRateZScore30d),
    takerBuySellRatio24h: toNumber(raw.takerBuySellRatio24h),
    liquidationLongVolumeUsd24h: toNumber(raw.liquidationLongVolumeUsd24h),
    liquidationShortVolumeUsd24h: toNumber(raw.liquidationShortVolumeUsd24h),
    volumeRelative24h: toNumber(raw.volumeRelative24h),
  }
}
