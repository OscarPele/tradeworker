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
  const [highlightListId, setHighlightListId] = useState<string | null>(null)
  const [highlightListClientOrderId, setHighlightListClientOrderId] = useState<string | null>(null)

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
    setHighlightListId(localStorage.getItem('lastOcoOrderListId'))
    setHighlightListClientOrderId(localStorage.getItem('lastOcoListClientOrderId'))
    load()
  }, [])

  const grouped = data?.orders.reduce<Record<string, typeof data.orders>>((acc, order) => {
    const key =
      order.orderListId != null && order.orderListId !== -1
        ? String(order.orderListId)
        : 'single'
    if (!acc[key]) acc[key] = []
    acc[key].push(order)
    return acc
  }, {}) ?? {}

  const sortedGroups = Object.entries(grouped)

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
          {sortedGroups.map(([groupKey, orders]) => {
            const isOco = groupKey !== 'single'
            const isHighlight =
              (highlightListId && groupKey === highlightListId) ||
              (highlightListClientOrderId &&
                orders.some(
                  (o) =>
                    o.listClientOrderId === highlightListClientOrderId ||
                    o.clientOrderId === highlightListClientOrderId,
                ))

            return (
              <div
                className={`open-order-group${isHighlight ? ' open-order-group--highlight' : ''}`}
                key={groupKey}
              >
                <div className="open-order-group__head">
                  <p className="open-order-id">
                    {isOco ? `OCO #${groupKey}` : 'Single order'}
                  </p>
                  {isHighlight && <span className="pill pill--status">New</span>}
                  {isOco && orders[0]?.listClientOrderId && (
                    <span className="open-order-meta">
                      listClientId: {orders[0].listClientOrderId}
                    </span>
                  )}
                </div>
                <div className="open-order-group__body">
                  {orders.map((order, idx) => (
                    <div className="open-order-row" key={order.orderId ?? order.clientOrderId ?? `row-${groupKey}-${idx}`}>
                      <div>
                        <p className="open-order-id">
                          ID {order.orderId ?? '—'} / {order.clientOrderId ?? '—'}
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
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
