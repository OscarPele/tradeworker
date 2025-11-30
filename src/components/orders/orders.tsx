import { useMemo, useState } from 'react'
import {
  createMarginOco,
  type CreateOcoResponse,
} from '../../api/binanceApi'
import './orders.css'

type Side = 'BUY' | 'SELL'

export default function Orders() {
  const [side, setSide] = useState<Side>('BUY')
  const [targetPct, setTargetPct] = useState<number>(1.2)
  const [stopLossPct, setStopLossPct] = useState<number>(0.6)
  const isolated = false
  const leverage = 20
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CreateOcoResponse | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const summary = useMemo(() => {
    const dir = side === 'BUY' ? 'subida' : 'caída'
    return `${side}: TP ${targetPct || 0}% (${dir}) · SL ${stopLossPct || 0}% · ${isolated ? 'Isolated' : 'Cross'} · x${leverage || 20}`
  }, [side, targetPct, stopLossPct, isolated, leverage])

  const sendOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const data = await createMarginOco({
        side,
        takeProfitPercent: targetPct,
        stopLossPercent: stopLossPct,
        isolated,
        leverage,
        symbol: 'BTCUSDC',
      })

      setResult(data)
      setShowConfirm(false)
    } catch (err) {
      console.error(err)
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo crear la orden.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card card--tight">
      <div className="card-head">
        <h2 className="card-title">Orders</h2>
        <span className={`pill pill--side-${side.toLowerCase()}`}>{side}</span>
      </div>

      <div className="orders-form">
        <div className="side-toggle">
          <button
            type="button"
            className={`side-btn ${side === 'BUY' ? 'side-btn--active' : ''}`}
            onClick={() => setSide('BUY')}
          >
            Buy
          </button>
          <button
            type="button"
            className={`side-btn ${side === 'SELL' ? 'side-btn--active' : ''}`}
            onClick={() => setSide('SELL')}
          >
            Sell
          </button>
        </div>

        <div className="orders-row">
          <label htmlFor="targetPct" className="orders-label">
            TP objetivo (%)
          </label>
          <input
            id="targetPct"
            type="number"
            inputMode="decimal"
            className="orders-input"
            value={Number.isNaN(targetPct) ? '' : targetPct}
            onChange={(e) => setTargetPct(Number(e.target.value))}
            placeholder="ej. 1.2"
          />
          <p className="orders-hint">
            Porcentaje de movimiento esperado hacia el TP (positivo o negativo).
          </p>
        </div>

        <div className="orders-row">
          <label htmlFor="stopLossPct" className="orders-label">
            Stop loss (%)
          </label>
          <input
            id="stopLossPct"
            type="number"
            inputMode="decimal"
            className="orders-input"
            value={Number.isNaN(stopLossPct) ? '' : stopLossPct}
            onChange={(e) => setStopLossPct(Number(e.target.value))}
            placeholder="ej. 0.6"
          />
          <p className="orders-hint">
            Porcentaje máximo a asumir en contra antes de cerrar la orden.
          </p>
        </div>

        <div className="orders-summary">
          <p className="orders-summary-title">Config actual</p>
          <p className="orders-summary-text">{summary}</p>
          {error && <p className="orders-error">{error}</p>}
          {result && (
            <div className="orders-result">
              <p className="orders-result-title">Orden creada</p>
              <p className="orders-result-line">
                Ref: {result.referencePrice.toFixed(2)} · TP{' '}
                {result.takeProfitPrice.toFixed(2)} · SL{' '}
                {result.stopLossPrice.toFixed(2)}
              </p>
              <p className="orders-result-line">
                Qty: {result.quantity} {result.symbol}
              </p>
              <p className="orders-result-line">
                Borrow: {result.borrowAmount ?? '0'} {result.borrowAsset ?? ''}
              </p>
              <p className="orders-result-line">
                IDs: borrow {result.borrowOrder?.orderId ?? '—'} · entry{' '}
                {result.entryOrder?.orderId ?? '—'} · oco{' '}
                {result.ocoOrder?.orderId ?? '—'}
              </p>
            </div>
          )}
        </div>

        <div className="orders-actions">
          <button
            type="button"
            className="orders-btn orders-btn--primary"
            onClick={() => setShowConfirm(true)}
            disabled={loading}
          >
            Revisar y enviar
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="orders-modal">
          <div
            className="orders-modal__backdrop"
            onClick={() => (loading ? null : setShowConfirm(false))}
          />
          <div className="orders-modal__card">
            <div className="orders-modal__header">
              <h3 className="orders-modal__title">Confirm order</h3>
              <button
                type="button"
                className="orders-modal__close"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="orders-modal__body">
              <p className="orders-modal__line">
                Symbol: <strong>BTCUSDC</strong>
              </p>
              <p className="orders-modal__line">
                Side: <strong>{side}</strong>
              </p>
              <p className="orders-modal__line">
                Take profit: <strong>{targetPct || 0}%</strong>
              </p>
              <p className="orders-modal__line">
                Stop loss: <strong>{stopLossPct || 0}%</strong>
              </p>
              <p className="orders-modal__line">
                Isolated: <strong>{String(isolated)}</strong> · Leverage:{' '}
                <strong>x{leverage}</strong>
              </p>
              <p className="orders-modal__note">
                Esta acción enviará la orden OCO a tu cuenta de Binance.
              </p>
            </div>

            <div className="orders-modal__actions">
              <button
                type="button"
                className="orders-btn orders-btn--ghost"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="orders-btn orders-btn--primary"
                onClick={sendOrder}
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Confirmar y enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
