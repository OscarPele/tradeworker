import { useEffect, useState } from 'react'
import './App.css'
import { getMarginAccount, type MarginAccount } from './api/binanceApi'

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
    const ws = new WebSocket(
      'wss://stream.binance.com:9443/ws/btceur@miniTicker',
    )

    ws.onopen = () => {
      setWsStatus('open')
    }

    ws.onerror = (event) => {
      console.error('Error WebSocket BTCEUR', event)
      setWsStatus('error')
    }

    ws.onclose = () => {
      setWsStatus('closed')
    }

    ws.onmessage = (event) => {
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

    return () => {
      ws.close()
    }
  }, [])

  const netBtc = account ? Number(account.totalNetAssetOfBtc) : null
  const netEur =
    netBtc != null && btcEurPrice != null ? netBtc * btcEurPrice : null

  const showBalance = !loading && !error && account

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">tradeworker</p>
        <h1>Balance de cuenta de margen</h1>
        <p className="lead">
          Se muestra la equidad total de tu cuenta de margen en euros, usando el
          precio BTCEUR en tiempo real de Binance.
        </p>

        <div className="status-row">
          {loading && <p className="status">Cargando balance...</p>}
          {error && <p className="status status--error">{error}</p>}
        </div>

        {showBalance && (
          <div className="balance-panel">
            <div className="balance-main">
              <p className="balance-label">
                Equidad total (valor aproximado en EUR)
              </p>
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

              <div className="price-status">
                <span className={`pill pill--${wsStatus}`}>
                  WS BTCEUR:{' '}
                  {btcEurPrice != null && !Number.isNaN(btcEurPrice)
                    ? formatEur(btcEurPrice)
                    : '–'}
                </span>
              </div>
            </div>

            <div className="assets-list">
              <p className="assets-title">Activos en margen (netos ≠ 0):</p>
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
    </main>
  )
}

export default App
