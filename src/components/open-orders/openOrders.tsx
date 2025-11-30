import { useEffect, useState } from 'react'
import {
  getOpenMarginOrders,
  type OpenOrdersResponse,
} from '../../api/binanceApi'
import './openOrders.css'

export default function OpenOrders() {
  const [data, setData] = useState<OpenOrdersResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const resp = await getOpenMarginOrders('BTCUSDC', false)
      setData(resp)
    } catch (err) {
      console.error(err)
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'No se pudieron cargar las órdenes.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <section className="card card--tight">
      <div className="card-head">
        <h2 className="card-title">Open Orders</h2>
        <div className="open-orders-actions">
          <button type="button" className="pill pill--status" onClick={load} disabled={loading}>
            {loading ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      {(loading || error) && (
        <div className="status-row">
          {loading && <p className="status">Cargando...</p>}
          {error && <p className="status status--error">{error}</p>}
        </div>
      )}

      {data && !data.hasOpenOrders && !loading && !error && (
        <div className="open-orders-empty">
          <p className="open-order-meta">No open orders for BTCUSDC.</p>
        </div>
      )}

      {data && data.hasOpenOrders && !loading && !error && (
        <div className="open-orders-list">
          {data.orders.map((order, idx) => (
            <div
              className="open-order-row"
              key={order.orderId ?? order.clientOrderId ?? `row-${idx}`}
            >
              <div>
                <p className="open-order-id">
                  ID {order.orderId ?? order.clientOrderId ?? '—'}
                </p>
                <p className="open-order-meta">
                  {order.type ?? '—'} · {order.side ?? '—'}
                </p>
                <p className="open-order-meta">
                  Price {order.price ?? '—'} · Stop {order.stopPrice ?? '—'}
                </p>
                <p className="open-order-meta">Status {order.status ?? '—'}</p>
              </div>
              <div className="open-order-tags">
                {order.side && (
                  <span className={`pill pill--side-${order.side.toLowerCase()}`}>
                    {order.side}
                  </span>
                )}
                {order.status && <span className="pill pill--status">{order.status}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
