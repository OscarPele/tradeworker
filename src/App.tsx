import { useEffect, useState } from 'react'
import './App.css'
import { getMarginAccount, type MarginAccount } from './api/binanceApi'
import Liquidity from './components/liquidity/liquidity'
import MarketContextCard from './components/market-context/marketContext'
import Orders from './components/orders/orders'
import OpenOrders from './components/open-orders/openOrders'

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws/btceur@miniTicker'

function formatEur(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value)
}

function App() {
  const [account, setAccount] = useState<MarginAccount | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [btcEurPrice, setBtcEurPrice] = useState<number | null>(null)
  const [wsStatus, setWsStatus] = useState<
    'connecting' | 'open' | 'closed' | 'error'
  >('connecting')

  // Carga del balance de margen desde tu backend (REST)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getMarginAccount()
        setAccount(data)
      } catch (err) {
        console.error(err)
        setError('No se pudo cargar tu balance de margen.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // WebSocket a Binance para precio BTCEUR en tiempo real
  useEffect(() => {
    let isActive = true
    const ws = new WebSocket(BINANCE_WS_URL)

    const handleOpen = () => {
      if (!isActive) return
      setWsStatus('open')
    }

    const handleError = (event: Event) => {
      if (!isActive) return
      console.error('Error WebSocket BTCEUR', event)
      setWsStatus('error')
    }

    const handleClose = () => {
      if (!isActive) return
      setWsStatus('closed')
    }

    const handleMessage = (event: MessageEvent) => {
      if (!isActive) return
      try {
        const data = JSON.parse(event.data)
        // miniTicker: campo c = último precio
        const lastPrice = parseFloat(data.c)
        if (!Number.isNaN(lastPrice)) {
          setBtcEurPrice(lastPrice)
        }
      } catch (e) {
        console.error('Error parseando BTCEUR miniTicker', e)
      }
    }

    ws.addEventListener('open', handleOpen)
    ws.addEventListener('error', handleError)
    ws.addEventListener('close', handleClose)
    ws.addEventListener('message', handleMessage)

    return () => {
      isActive = false
      ws.removeEventListener('open', handleOpen)
      ws.removeEventListener('error', handleError)
      ws.removeEventListener('close', handleClose)
      ws.removeEventListener('message', handleMessage)

      // Evita el cierre prematuro en modo Strict (efectos dobles)
      if (ws.readyState === WebSocket.CONNECTING) {
        const shutdown = () => ws.close(1000, 'cleanup')
        ws.addEventListener('open', shutdown, { once: true })
        ws.addEventListener('error', shutdown, { once: true })
        return
      }

      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'cleanup')
      }
    }
  }, [])

  const netBtc = account ? Number(account.totalNetAssetOfBtc) : null
  const netEur =
    netBtc != null && btcEurPrice != null ? netBtc * btcEurPrice : null

  const showBalance = !loading && !error && account

  return (
    <main className="page">
      <section className="card card--tight balance-card">
        <div className="card-head">
          <h2 className="card-title">Balance</h2>
          <span className={`pill pill--${wsStatus}`}>
            BTCEUR{' '}
            {btcEurPrice != null && !Number.isNaN(btcEurPrice)
              ? formatEur(btcEurPrice)
              : '–'}
          </span>
        </div>

        {(loading || error) && (
          <div className="status-row">
            {loading && <p className="status">Cargando...</p>}
            {error && <p className="status status--error">{error}</p>}
          </div>
        )}

        {showBalance && (
          <div className="balance-panel">
            <div className="stat-block">
              <p className="balance-label">Equity</p>
              <p className="balance-value">
                {netEur != null && btcEurPrice != null
                  ? formatEur(netEur)
                  : '–'}
              </p>
              <p className="balance-sub">
                {netBtc != null && !Number.isNaN(netBtc)
                  ? `${netBtc.toFixed(6)} BTC`
                  : ''}
                {btcEurPrice != null && !Number.isNaN(btcEurPrice)
                  ? ` · ${btcEurPrice.toFixed(2)} €/BTC`
                  : ''}
              </p>
            </div>

            <div className="assets-list">
              <p className="assets-title">Activos netos</p>
              <ul>
                {account!.userAssets
                  .filter((a) => Number(a.netAsset) !== 0)
                  .map((asset) => (
                    <li key={asset.asset}>
                      <span className="asset-symbol">{asset.asset}</span>
                      <span className="asset-amount">
                        {Number(asset.netAsset).toFixed(6)}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}
      </section>
      <div className="liquidity-card">
        <Liquidity />
      </div>
      <div className="orders-card">
        <Orders />
      </div>
      <div className="open-orders-card">
        <OpenOrders />
      </div>
      <div className="market-context-card">
        <MarketContextCard />
      </div>
    </main>
  )
}

export default App
