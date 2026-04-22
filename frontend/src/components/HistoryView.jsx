/**
 * components/HistoryView.jsx
 * Tela de histórico: lista paginada de análises anteriores com filtros e stats
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, RefreshCw, TrendingUp, TrendingDown, Minus, Search, BarChart2 } from 'lucide-react';
import { getHistory, deleteAnalysis, getStats } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import './HistoryView.css';

const TREND_ICONS = {
  ALTA:       { icon: TrendingUp,   color: 'up'      },
  LEVE_ALTA:  { icon: TrendingUp,   color: 'up'      },
  NEUTRA:     { icon: Minus,        color: 'neutral' },
  LEVE_BAIXA: { icon: TrendingDown, color: 'down'    },
  BAIXA:      { icon: TrendingDown, color: 'down'    },
};

export default function HistoryView({ onSelectAnalysis }) {
  const [history, setHistory]     = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('');
  const [deleting, setDeleting]   = useState(null);
  const [error, setError]         = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [histRes, statsRes] = await Promise.all([
        getHistory(50),
        getStats(),
      ]);
      setHistory(histRes.history || []);
      setStats(statsRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteAnalysis(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  // Filtra por ticker
  const filtered = filter
    ? history.filter((h) =>
        h.ticker.toUpperCase().includes(filter.toUpperCase())
      )
    : history;

  // Dados para o mini gráfico de distribuição por ticker
  const tickerChartData = stats?.top_tickers?.map((t) => ({
    ticker: t.ticker,
    count:  t.count,
  })) || [];

  return (
    <div className="history-view">
      {/* ── Cabeçalho ── */}
      <div className="history-header">
        <div>
          <h1 className="history-title">Histórico de Análises</h1>
          <p className="history-subtitle">
            {history.length} análise{history.length !== 1 ? 's' : ''} registrada{history.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="refresh-btn" onClick={loadData} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spinning' : ''} />
          Atualizar
        </button>
      </div>

      {/* ── Stats cards ── */}
      {stats && (
        <div className="history-stats">
          <StatCard label="Total de Análises"    value={stats.stats?.total_analyses ?? 0} />
          <StatCard label="Tickers Únicos"       value={stats.stats?.unique_tickers ?? 0} />
          <StatCard label="Score Médio"          value={(stats.stats?.avg_score ?? 0).toFixed(3)} mono />
          <StatCard label="Total Positivas"      value={stats.stats?.total_positive ?? 0} color="up" />
          <StatCard label="Total Negativas"      value={stats.stats?.total_negative ?? 0} color="down" />
        </div>
      )}

      {/* ── Mini gráfico de tickers mais consultados ── */}
      {tickerChartData.length > 0 && (
        <div className="ticker-chart-card">
          <div className="section-label">
            <BarChart2 size={14} />
            Tickers mais consultados
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={tickerChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="ticker"
                tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="count" fill="var(--accent-green)" radius={[4, 4, 0, 0]} name="Consultas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Filtro ── */}
      <div className="history-filter">
        <Search size={16} className="filter-icon" />
        <input
          type="text"
          placeholder="Filtrar por ticker..."
          value={filter}
          onChange={(e) => setFilter(e.target.value.toUpperCase())}
          className="filter-input mono"
        />
        {filter && (
          <button className="filter-clear" onClick={() => setFilter('')}>✕</button>
        )}
      </div>

      {/* ── Erro ── */}
      {error && (
        <div className="history-error">⚠ {error}</div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="history-loading">
          <div className="loading-spinner" style={{ width: 28, height: 28, borderWidth: 2 }} />
          <span>Carregando histórico...</span>
        </div>
      )}

      {/* ── Lista ── */}
      {!loading && filtered.length === 0 && (
        <div className="history-empty">
          <p>Nenhuma análise encontrada{filter ? ` para "${filter}"` : ''}.</p>
          <p className="history-empty-sub">Realize uma análise na tela principal para começar.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="history-list">
          {filtered.map((item, idx) => (
            <HistoryItem
              key={item.id}
              item={item}
              index={idx}
              onDelete={handleDelete}
              deleting={deleting === item.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── HistoryItem ── */
function HistoryItem({ item, index, onDelete, deleting }) {
  const trendCfg = TREND_ICONS[item.trend] || TREND_ICONS.NEUTRA;
  const TIcon = trendCfg.icon;

  let timeAgo = '';
  try {
    timeAgo = formatDistanceToNow(new Date(item.created_at), {
      addSuffix: true, locale: ptBR,
    });
  } catch { timeAgo = item.created_at; }

  return (
    <div
      className="history-item animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Ticker + Trend */}
      <div className="hi-left">
        <div className={`hi-trend-icon icon-${trendCfg.color}`}>
          <TIcon size={16} />
        </div>
        <div className="hi-ticker-info">
          <span className="hi-ticker mono">{item.ticker}</span>
          <span className="hi-trend">{item.trend.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Score */}
      <div className="hi-score">
        <span className={`hi-score-val mono ${item.score > 0.05 ? 'color-up' : item.score < -0.05 ? 'color-down' : 'color-neutral'}`}>
          {item.score >= 0 ? '+' : ''}{item.score.toFixed(3)}
        </span>
        <span className="hi-label">{item.sentiment}</span>
      </div>

      {/* Distribuição */}
      <div className="hi-dist">
        <span className="color-up">{item.positive}↑</span>
        <span className="color-neutral">{item.neutral}→</span>
        <span className="color-down">{item.negative}↓</span>
        <span className="hi-total">/ {item.news_count} notícias</span>
      </div>

      {/* Data */}
      <span className="hi-time mono">{timeAgo}</span>

      {/* Ações */}
      <div className="hi-actions">
        <button
          className="hi-delete-btn"
          onClick={() => onDelete(item.id)}
          disabled={deleting}
          title="Excluir análise"
        >
          {deleting ? '...' : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  );
}

/* ── StatCard ── */
function StatCard({ label, value, mono, color }) {
  return (
    <div className="stat-card">
      <span className="stat-card-label">{label}</span>
      <span className={`stat-card-value ${mono ? 'mono' : ''} ${color ? `color-${color}` : ''}`}>
        {value}
      </span>
    </div>
  );
}
