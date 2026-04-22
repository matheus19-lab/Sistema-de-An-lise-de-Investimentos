/**
 * App.jsx - Componente raiz do InvestIA
 * Gerencia estado global e navegação entre views
 */

import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import HistoryView from './components/HistoryView';
import { checkHealth } from './services/api';
import './styles/App.css';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'history'
  const [backendStatus, setBackendStatus] = useState('checking'); // 'ok' | 'error' | 'checking'
  const [latestResult, setLatestResult] = useState(null);

  // Verifica conexão com backend ao iniciar
  useEffect(() => {
    const ping = async () => {
      try {
        await checkHealth();
        setBackendStatus('ok');
      } catch {
        setBackendStatus('error');
      }
    };
    ping();
  }, []);

  const handleAnalysisComplete = useCallback((result) => {
    setLatestResult(result);
    setActiveView('dashboard');
  }, []);

  return (
    <div className="app-root">
      <Header
        activeView={activeView}
        onNavigate={setActiveView}
        backendStatus={backendStatus}
      />

      {/* Banner de erro de conexão */}
      {backendStatus === 'error' && (
        <div className="connection-banner">
          <span className="connection-dot error" />
          <span>
            Backend offline — inicie o Flask com <code>python app.py</code>
          </span>
        </div>
      )}

      <main className="app-main">
        {activeView === 'dashboard' && (
          <Dashboard
            latestResult={latestResult}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}
        {activeView === 'history' && (
          <HistoryView onSelectAnalysis={handleAnalysisComplete} />
        )}
      </main>

      <footer className="app-footer">
        <span className="mono">InvestIA v1.0</span>
        <span>·</span>
        <span>TCC — Análise de Investimentos com IA</span>
        <span>·</span>
        <span className="mono">Python + Flask + React</span>
      </footer>
    </div>
  );
}
