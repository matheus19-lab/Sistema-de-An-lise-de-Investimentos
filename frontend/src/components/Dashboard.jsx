/**
 * components/Dashboard.jsx
 * View principal: formulário de busca, resultado da análise e gráficos
 */

import React, { useState, useCallback } from 'react';
import SearchBar from './SearchBar';
import SentimentResult from './SentimentResult';
import PriceChart from './PriceChart';
import NewsCard from './NewsCard';
import StatsPanel from './StatsPanel';
import { analyzeStock, getStockData } from '../services/api';
import { TrendingUp, BarChart2, Newspaper } from 'lucide-react';
import './Dashboard.css';

// Sugestões rápidas de tickers populares
const QUICK_TICKERS = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'MGLU3', 'WEGE3', 'ABEV3'];

export default function Dashboard({ latestResult, onAnalysisComplete }) {
  const [result, setResult]         = useState(latestResult || null);
  const [stockData, setStockData]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError]           = useState('');
  const [currentTicker, setCurrentTicker] = useState('');

  const handleAnalyze = useCallback(async (ticker) => {
    if (!ticker.trim()) return;
    const upperTicker = ticker.trim().toUpperCase();

    setLoading(true);
    setError('');
    setResult(null);
    setStockData(null);
    setCurrentTicker(upperTicker);

    try {
      // Executa análise de sentimento e dados de preço em paralelo
      const [analysisRes, stockRes] = await Promise.allSettled([
        analyzeStock(upperTicker),
        getStockData(upperTicker, 90),
      ]);

      if (analysisRes.status === 'fulfilled') {
        setResult(analysisRes.value);
        onAnalysisComplete(analysisRes.value);
      } else {
        throw new Error(analysisRes.reason?.message || 'Erro na análise de sentimento.');
      }

      if (stockRes.status === 'fulfilled') {
        setStockData(stockRes.value);
      }
      // Erro no preço não bloqueia: mostramos análise sem gráfico

    } catch (err) {
      setError(err.message || 'Erro ao processar análise. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
    }
  }, [onAnalysisComplete]);

  const handleQuickTicker = (ticker) => {
    handleAnalyze(ticker);
  };

  return (
    <div className="dashboard">
      {/* ── Seção Hero + Busca ── */}
      <section className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Análise por Inteligência Artificial
          </div>
          <h1 className="hero-title">
            Analise qualquer ação<br />
            <span className="hero-title-accent">em segundos</span>
          </h1>
          <p className="hero-subtitle">
            Coleta notícias automaticamente · Analisa sentimento com NLP ·
            Gera tendência de mercado
          </p>
        </div>

        <SearchBar onSearch={handleAnalyze} loading={loading} />

        {/* Sugestões rápidas */}
        <div className="quick-tickers">
          <span className="quick-label">Populares:</span>
          {QUICK_TICKERS.map((t) => (
            <button
              key={t}
              className="quick-btn mono"
              onClick={() => handleQuickTicker(t)}
              disabled={loading}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* ── Erro ── */}
      {error && (
        <div className="dashboard-error animate-fade-in">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && <LoadingSkeleton ticker={currentTicker} />}

      {/* ── Resultado ── */}
      {!loading && result && (
        <div className="dashboard-results animate-fade-in">
          {/* Linha 1: Resultado sentimento + Estatísticas */}
          <div className="results-row-top">
            <SentimentResult result={result} />
            <StatsPanel result={result} />
          </div>

          {/* Linha 2: Gráfico de preços */}
          {stockData && (
            <section className="results-section">
              <div className="section-header">
                <BarChart2 size={16} className="section-icon" />
                <h2>Histórico de Preços · {result.ticker}</h2>
                <span className="section-badge mock-badge">Dados Simulados</span>
              </div>
              <PriceChart data={stockData} />
            </section>
          )}

          {/* Linha 3: Notícias analisadas */}
          {result.news && result.news.length > 0 && (
            <section className="results-section">
              <div className="section-header">
                <Newspaper size={16} className="section-icon" />
                <h2>Notícias Analisadas · {result.news.length} fontes</h2>
                <span className="section-badge mock-badge">Dados Simulados</span>
              </div>
              <div className="news-grid">
                {result.news.map((item, idx) => (
                  <NewsCard key={idx} news={item} index={idx} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Estado vazio ── */}
      {!loading && !result && !error && (
        <EmptyState />
      )}
    </div>
  );
}

/* ── Loading Skeleton ── */
function LoadingSkeleton({ ticker }) {
  return (
    <div className="loading-skeleton animate-fade-in">
      <div className="loading-header">
        <div className="loading-spinner" />
        <div className="loading-text">
          <span>Analisando <strong className="mono">{ticker}</strong></span>
          <span className="loading-sub">Coletando notícias e processando com IA...</span>
        </div>
      </div>
      <div className="skeleton-grid">
        <div className="skeleton" style={{ height: 180, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 180, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 260, borderRadius: 12, gridColumn: '1/-1' }} />
      </div>
    </div>
  );
}

/* ── Estado Vazio ── */
function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <TrendingUp size={40} />
      </div>
      <h2 className="empty-title">Pronto para analisar</h2>
      <p className="empty-desc">
        Digite o código de uma ação brasileira (ex: PETR4, VALE3, ITUB4)<br />
        e o sistema coletará notícias e analisará o sentimento com IA.
      </p>
      <div className="empty-steps">
        {[
          { n: '01', label: 'Insira o ticker da ação' },
          { n: '02', label: 'IA coleta e analisa notícias' },
          { n: '03', label: 'Visualize tendência e gráficos' },
        ].map((s) => (
          <div key={s.n} className="empty-step">
            <span className="step-number mono">{s.n}</span>
            <span className="step-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
