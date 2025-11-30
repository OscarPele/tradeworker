import { useEffect, useState } from 'react'
import {
  getLiquidityStatus,
  type LiquidityRegime,
  type LiquidityStatus,
} from '../../api/liquidityApi'

const regimeCopy: Record<
  LiquidityRegime | string,
  { label: string; tone: 'expansion' | 'contraction' | 'neutral' }
> = {
  EXPANSION: { label: 'Expansión', tone: 'expansion' },
  CONTRACTION: { label: 'Contracción', tone: 'contraction' },
  NEUTRAL: { label: 'Neutral', tone: 'neutral' },
}

function formatPercent(value: number | null) {
  if (value == null || Number.isNaN(value)) return '–'
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} %`
}

function formatNumber(value: number | null) {
  if (value == null || Number.isNaN(value)) return '–'
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateIso: string | null) {
  if (!dateIso) return '–'
  const parts = dateIso.split('-')
  if (parts.length === 3) {
    const [y, m, d] = parts
    return `${d}/${m}/${y}`
  }
  return dateIso
}

export default function Liquidity() {
  const [data, setData] = useState<LiquidityStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const status = await getLiquidityStatus()
        if (active) {
          setData(status)
        }
      } catch (err) {
        console.error(err)
        if (active) {
          setError('No se pudo cargar el estado de liquidez.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const regimeTone =
    data?.regime && regimeCopy[data.regime]
      ? regimeCopy[data.regime].tone
      : undefined

  const tone =
    regimeTone ??
    ((data?.yoyChangePct ?? 0) < 0 ? 'contraction' : 'neutral')

  const regimeLabel =
    data?.regime && regimeCopy[data.regime]
      ? regimeCopy[data.regime].label
      : data?.regime ?? 'Sin dato'

  return (
    <section className="card card--tight">
      <div className="card-head">
        <h2 className="card-title">Liquidez</h2>
        {data && (
          <span className={`pill pill--regime pill--${tone}`}>
            {regimeLabel}
          </span>
        )}
      </div>

      {(loading || error) && (
        <div className="status-row">
          {loading && <p className="status">Cargando...</p>}
          {error && <p className="status status--error">{error}</p>}
        </div>
      )}

      {data && !error && (
        <div className="liquidity-grid">
          <div className="liquidity-block">
            <p className="liquidity-label">YoY</p>
            <p
              className={`liquidity-value ${
                data.yoyChangePct >= 0
                  ? 'liquidity-value--up'
                  : 'liquidity-value--down'
              }`}
            >
              {formatPercent(data.yoyChangePct)}
            </p>
            <p className="liquidity-sub">12m</p>
          </div>

          <div className="liquidity-block">
            <p className="liquidity-label">M2</p>
            <p className="liquidity-value">{formatNumber(data.m2Value)}</p>
            <p className="liquidity-sub">{formatDate(data.date)}</p>
          </div>

          <div className="liquidity-block liquidity-block--regime">
            <p className="liquidity-label">Régimen</p>
            <span className={`pill pill--regime pill--${tone}`}>
              {regimeLabel}
            </span>
            <p className="liquidity-sub">Estimado</p>
          </div>
        </div>
      )}
    </section>
  )
}
