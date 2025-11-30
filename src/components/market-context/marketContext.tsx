import { useEffect, useState } from 'react'
import { getDailyMetrics, type DailyMetricsSnapshot } from '../../api/marketContextApi'
import './marketContext.css'

function formatPercent(value: number | null, withSign = false) {
  if (value == null || Number.isNaN(value)) return '–'
  const sign = withSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)} %`
}

function formatUsd(value: number | null, decimals = 0) {
  if (value == null || Number.isNaN(value)) return '–'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

function formatNumber(value: number | null, decimals = 2) {
  if (value == null || Number.isNaN(value)) return '–'
  return value.toFixed(decimals)
}

function formatMultiple(value: number | null) {
  if (value == null || Number.isNaN(value)) return '–'
  return `${value.toFixed(2)}x`
}

function formatDateTime(value: string | undefined) {
  if (!value) return 'Sin dato'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-ES', { hour12: false })
}

function toneFrom(value: number | null) {
  if (value == null || Number.isNaN(value) || value === 0) return ''
  return value > 0 ? 'up' : 'down'
}

type Metric = {
  key: keyof DailyMetricsSnapshot
  label: string
  hint: string
  formatter: (v: number | null) => string
  tone?: (v: number | null) => '' | 'up' | 'down'
  description: string
}

export default function MarketContextCard() {
  const [data, setData] = useState<DailyMetricsSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeMetric, setActiveMetric] = useState<Metric | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const ctx = await getDailyMetrics()
        if (active) {
          setData(ctx)
        }
      } catch (err) {
        console.error(err)
        if (active) {
          const msg =
            err instanceof Error && err.message
              ? err.message
              : 'No se pudo cargar el contexto de mercado.'
          setError(msg)
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

  const perfMetrics: Metric[] = [
    {
      key: 'return1d',
      label: 'Ret 1d',
      hint: 'Diario',
      formatter: (v) => formatPercent(v, true),
      tone: toneFrom,
      description:
        'Variación porcentual del precio en las últimas 24h. +1-3% es un día alcista normal; >5% indica impulso fuerte; <-3% puede señalar giro o presión vendedora. Movimientos grandes con volumen alto suelen ser más fiables.',
    },
    {
      key: 'return3d',
      label: 'Ret 3d',
      hint: 'Últimos 3d',
      formatter: (v) => formatPercent(v, true),
      tone: toneFrom,
      description:
        'Rendimiento acumulado de los últimos 3 días. Sirve para saber si el día actual sigue una mini-tendencia. +3-6% es tendencia suave; >8% es rally corto; negativo prolongado sugiere corrección en curso.',
    },
    {
      key: 'volumeRelative24h',
      label: 'Vol rel.',
      hint: '24h vs media',
      formatter: (v) => formatMultiple(v),
      tone: toneFrom,
      description:
        'Volumen de las últimas 24h comparado con su media. 1x es normal; 1.5-2x confirma participación; >2.5x suele acompañar rupturas o liquidaciones. Vol bajo (<0.8x) resta fiabilidad a la señal de precio.',
    },
  ]

  const volMetrics: Metric[] = [
    {
      key: 'realizedVol7d',
      label: 'Vol 7d',
      hint: 'Realizada',
      formatter: (v) => formatPercent(v, false),
      description:
        'Volatilidad realizada 7d. 20-40% es vol moderada; >60% es entorno nervioso; >80% es muy alta y exige stops/posiciones más pequeños. Vol baja comprime rangos pero prepara rupturas futuras.',
    },
    {
      key: 'atr14',
      label: 'ATR 14',
      hint: 'USD',
      formatter: (v) => formatUsd(v, 0),
      description:
        'Rango medio verdadero 14d en USD. Representa el movimiento típico diario. Usar 0.5-1x ATR para stops ajustados y 1-2x ATR para objetivos razonables; ATR alto implica ruido mayor y stops más amplios.',
    },
  ]

  const derivMetrics: Metric[] = [
    {
      key: 'deltaOpenInterest24h',
      label: 'OI 24h',
      hint: 'Cambio',
      formatter: (v) => formatPercent(v, true),
      tone: toneFrom,
      description:
        'Cambio porcentual del open interest en 24h. +2-5% indica entrada de posiciones; >8% puede ser apalancamiento agresivo. Caídas grandes (>5%) suelen ser cierres o liquidaciones. Contexto: mira también funding y dirección de precio.',
    },
    {
      key: 'fundingRateZScore30d',
      label: 'Funding z',
      hint: '30d',
      formatter: (v) => formatNumber(v, 2),
      tone: toneFrom,
      description:
        'Z-score del funding vs media 30d. Entre -1 y 1 es neutro; >1.5 sugiere sesgo long (riesgo de squeeze bajista); <-1.5 sesgo short (riesgo de short squeeze). Extremos a menudo preceden reversión.',
    },
    {
      key: 'takerBuySellRatio24h',
      label: 'Taker B/S',
      hint: '>1 compras',
      formatter: (v) => formatMultiple(v),
      tone: toneFrom,
      description:
        'Ratio de compras vs ventas agresivas en 24h. 1 es equilibrio; 1.1-1.3 refleja ligera presión compradora; >1.5 fuerte sesgo long. Por debajo de 0.9 domina la venta; <0.8 es presión vendedora intensa.',
    },
  ]

  const liqMetrics: Metric[] = [
    {
      key: 'liquidationLongVolumeUsd24h',
      label: 'Liq longs',
      hint: 'USD 24h',
      formatter: formatUsd,
      description:
        'Volumen liquidado de posiciones largas en 24h. Picos suelen limpiar exceso de apalancamiento long y pueden facilitar rebotes si el precio aguanta el soporte tras la barrida.',
    },
    {
      key: 'liquidationShortVolumeUsd24h',
      label: 'Liq shorts',
      hint: 'USD 24h',
      formatter: formatUsd,
      description:
        'Volumen liquidado de cortos en 24h. Picos de liquidaciones short suelen acompañar velas fuertes al alza; si continúan, pueden alimentar un short squeeze adicional.',
    },
  ]

  const renderGroup = (title: string, metrics: Metric[], values: DailyMetricsSnapshot) => {
    return (
      <div className="context-group">
        <p className="context-title">{title}</p>
        <div className="metric-list">
          {metrics.map((metric) => {
            const rawValue = values[metric.key] as number | null
            const value = metric.formatter(rawValue)
            const tone = metric.tone ? metric.tone(rawValue) : ''
            return (
              <button
                type="button"
                className="metric-row"
                key={metric.key as string}
                onClick={() => setActiveMetric(metric)}
              >
                <div>
                  <p className="metric-label">{metric.label}</p>
                  <p className="metric-hint">{metric.hint}</p>
                </div>
                <p
                  className={`metric-value${
                    tone ? ` metric-value--${tone}` : ''
                  }`}
                >
                  {value}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <section className="card card--tight">
      <div className="card-head">
        <h2 className="card-title">Métricas BTC diarias</h2>
        <span className="pill">BTC</span>
      </div>

      {(loading || error) && (
        <div className="status-row">
          {loading && <p className="status">Cargando...</p>}
          {error && <p className="status status--error">{error}</p>}
        </div>
      )}

      {data && !error && (
        <>
          <p className="as-of">Actualizado: {formatDateTime(data.asOf)}</p>
          <div className="context-grid">
            {renderGroup('Rendimiento', perfMetrics, data)}
            {renderGroup('Volatilidad', volMetrics, data)}
            {renderGroup('Derivados', derivMetrics, data)}
            {renderGroup('Liquidaciones', liqMetrics, data)}
          </div>
        </>
      )}

      {activeMetric && (
        <div className="metric-modal">
          <div className="metric-modal__backdrop" onClick={() => setActiveMetric(null)} />
          <div className="metric-modal__card">
            <div className="metric-modal__header">
              <div>
                <p className="metric-label">{activeMetric.label}</p>
                <p className="metric-hint">{activeMetric.hint}</p>
              </div>
              <button
                type="button"
                className="metric-modal__close"
                onClick={() => setActiveMetric(null)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <p className="metric-modal__text">{activeMetric.description}</p>
          </div>
        </div>
      )}
    </section>
  )
}
