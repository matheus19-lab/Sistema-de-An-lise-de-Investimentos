/**
 * components/Header.jsx
 * Cabeçalho com logo, navegação, status do backend e ticker tape animado
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Wifi, WifiOff, Activity } from 'lucide-react';
import './Header.css';

// Ticker tape: dados simulados dos principais índices/ações
const TICKER_TAPE = [
  { symbol: 'IBOV',  value: '127.840',  change: '+1.24%', up: true  },
  { symbol: 'PETR4', value: 'R$36,50',  change: '+2.10%', up: true  },
  { symbol: 'VALE3', value: 'R$65,80',  change: '-0.85%', up: false },
  { symbol: 'ITUB4', value: 'R$31,20',  change: '+0.64%', up: true  },
  { symbol: 'MGLU3', value: 'R$7,80',   change: '-1.92%', up: false },
  { symbol: 'WEGE3', value: 'R$38,50',  change: '+1.55%', up: true  },
  { symbol: 'USD',   value: 'R$5,17',   change: '+0.32%', up: true  },
  { symbol: 'BBDC4', value: 'R$15,40',  change: '-0.45%', up: false },
  { symbol: 'ABEV3', value: 'R$14,20',  change: '+0.21%', up: true  },
  { symbol: 'SELIC', value: '10,50%',   change: 'a.a.',   up: true  },
];

export default function Header({ activeView, onNavigate, backendStatus }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) =>
    date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatDate = (date) =>
    date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  const tapeItems = [...TICKER_TAPE, ...TICKER_TAPE]; // duplica para loop contínuo

  return (
    <header className="header">
      {/* ── Ticker tape ── */}
      <div className="ticker-tape" aria-hidden="true">
        <div className="ticker-track">
          {tapeItems.map((item, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-symbol">{item.symbol}</span>
              <span className="ticker-value">{item.value}</span>
              <span className={`ticker-change ${item.up ? 'up' : 'down'}`}>
                {item.change}
              </span>
              <span className="ticker-sep">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Barra principal ── */}
      <div className="header-main">
        {/* Logo */}
        <div className="header-logo" onClick={() => onNavigate('dashboard')}>
          <div className="logo-icon">
            <Activity size={18} />
          </div>
          <div className="logo-text">
            <span className="logo-brand">Invest</span>
            <span className="logo-ai">IA</span>
          </div>
          <span className="logo-badge">BETA</span>
        </div>

        {/* Navegação */}
        <nav className="header-nav">
          <button
            className={`nav-btn ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            <TrendingUp size={15} />
            Análise
          </button>
          <button
            className={`nav-btn ${activeView === 'history' ? 'active' : ''}`}
            onClick={() => onNavigate('history')}
          >
            <Clock size={15} />
            Histórico
          </button>
        </nav>

        {/* Status + Relógio */}
        <div className="header-meta">
          <div className={`backend-status ${backendStatus}`}>
            {backendStatus === 'ok'       && <><Wifi size={12} /><span>API Online</span></>}
            {backendStatus === 'error'    && <><WifiOff size={12} /><span>API Offline</span></>}
            {backendStatus === 'checking' && <><span className="status-spin" /><span>Verificando</span></>}
          </div>
          <div className="header-clock">
            <span className="clock-date mono">{formatDate(currentTime)}</span>
            <span className="clock-time mono">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
