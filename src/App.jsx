import React, { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('4H'); // '4H' or 'Daily'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let endpoint = '/api/klines';
        if (timeframe === '12H') endpoint = '/api/klines_12h';
        else if (timeframe === 'Daily') endpoint = '/api/klines_daily';
        else if (timeframe === 'Weekly') endpoint = '/api/klines_weekly';
        else if (timeframe === 'Monthly') endpoint = '/api/klines_monthly';
        

        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Network error');
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Auto-refresh data every 5 minutes just in case
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeframe]);

  const formatTime = (ts) => {
    const d = new Date(ts);
    const local = d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    const utc = d.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
    }) + ' UTC';
    
    return { local, utc };
  };

  const formatNumber = (num, minDecimals = 2, maxDecimals = 2) => {
    if (num === null || num === undefined) return '-';
    return Number(num).toLocaleString(undefined, {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals
    });
  };

  return (
    <div className="dashboard-container">
      <div className="header">
        <div className="title-group">
          <h1>
            <Activity className="text-accent" size={28} color="#58a6ff" />
            Bitcoin Futures Tracker
          </h1>
          <p>Bybit {timeframe} Interval Data (BTCUSDT Linear)</p>
        </div>
        
        <div className="header-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="timescale-toggle" style={{ 
            display: 'flex', 
            background: 'rgba(0,0,0,0.3)', 
            padding: '4px', 
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <button 
              className={`toggle-btn ${timeframe === '4H' ? 'active' : ''}`}
              onClick={() => setTimeframe('4H')}
              disabled={loading}
              style={{
                background: timeframe === '4H' ? 'rgba(88, 166, 255, 0.2)' : 'transparent',
                color: timeframe === '4H' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              4 Hours
            </button>
            <button 
              className={`toggle-btn ${timeframe === '12H' ? 'active' : ''}`}
              onClick={() => setTimeframe('12H')}
              disabled={loading}
              style={{
                background: timeframe === '12H' ? 'rgba(88, 166, 255, 0.2)' : 'transparent',
                color: timeframe === '12H' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              12 Hours
            </button>
            <button 
              className={`toggle-btn ${timeframe === 'Daily' ? 'active' : ''}`}
              onClick={() => setTimeframe('Daily')}
              disabled={loading}
              style={{
                background: timeframe === 'Daily' ? 'rgba(88, 166, 255, 0.2)' : 'transparent',
                color: timeframe === 'Daily' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              Daily
            </button>
            <button 
              className={`toggle-btn ${timeframe === 'Weekly' ? 'active' : ''}`}
              onClick={() => setTimeframe('Weekly')}
              disabled={loading}
              style={{
                background: timeframe === 'Weekly' ? 'rgba(88, 166, 255, 0.2)' : 'transparent',
                color: timeframe === 'Weekly' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              Weekly
            </button>
            <button 
              className={`toggle-btn ${timeframe === 'Monthly' ? 'active' : ''}`}
              onClick={() => setTimeframe('Monthly')}
              disabled={loading}
              style={{
                background: timeframe === 'Monthly' ? 'rgba(88, 166, 255, 0.2)' : 'transparent',
                color: timeframe === 'Monthly' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              Monthly
            </button>
          </div>

          <div className="live-badge">
            <div className="pulse"></div>
            Live Data
          </div>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            Loading Market Data...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time / Date</th>
                  <th>Open</th>
                  <th>High</th>
                  <th>Low</th>
                  <th>1-SAR</th>
                  <th>2-SAR</th>
                  <th className="close-group-cell first">Close Value</th>
                  <th className="close-group-cell">Pts</th>
                  <th className="close-group-cell">%</th>
                  <th className="close-group-cell">Vol (k)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.timestamp}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} opacity={0.5} />
                          {formatTime(row.timestamp).local}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.5, marginLeft: '20px' }}>
                          {formatTime(row.timestamp).utc}
                        </div>
                      </div>
                    </td>
                    <td>{formatNumber(row.open)}</td>
                    <td>{formatNumber(row.high)}</td>
                    <td>{formatNumber(row.low)}</td>
                    
                    <td className="col-sar">{formatNumber(row.sar1)}</td>
                    <td className="col-sar">{row.sar2 === 0 ? '-' : formatNumber(row.sar2)}</td>
                    
                    <td className="close-group-cell first" style={{ fontWeight: typeof row.closePts === 'number' && row.closePts > 0 ? 600 : 400 }}>
                      {formatNumber(row.closeValue)}
                    </td>
                    <td className={`close-group-cell ${row.closePts > 0 ? 'val-positive' : row.closePts < 0 ? 'val-negative' : 'val-neutral'}`}>
                      {row.closePts > 0 ? '+' : ''}{formatNumber(row.closePts)}
                    </td>
                    <td className={`close-group-cell ${row.closePct > 0 ? 'val-positive' : row.closePct < 0 ? 'val-negative' : 'val-neutral'}`}>
                      {row.closePct > 0 ? '+' : ''}{formatNumber(row.closePct)}%
                    </td>
                    <td className="close-group-cell text-muted">
                      {formatNumber(row.closeVol)}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No data available right now. Waiting for initial sync...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
