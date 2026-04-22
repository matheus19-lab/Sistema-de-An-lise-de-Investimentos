/**
 * components/StatsPanel.jsx
 * Painel lateral com estatísticas da análise: contagem de notícias,
 * distribuição de sentimentos e barra de progresso visual
 */

import React from 'react';
import { Newspaper, ThumbsUp, ThumbsDown, Minus, Hash } from 'lucide-react';
import './StatsPanel.css';

export default function StatsPanel({ result }) {
  const total    = result.news_count || 1;
  const posRatio = ((result.positive / total) * 100).toFixed(0);
  const negRatio = ((result.negative / total) * 100).toFixed(0);
  const neuRatio = ((result.neutral  / total) * 100).toFixed(0);

  const stats = [
    {
      icon: Newspaper,
      label: 'Notícias analisadas',
      value: result.news_count,
      color: 'default',
    },
    {
      icon: ThumbsUp,
      label: 'Positivas',
      value: result.positive,
      pct: posRatio,
      color: 'up',
    },
    {
      icon: ThumbsDown,
      label: 'Negativas',
      value: result.negative,
      pct: negRatio,
      color: 'down',
    },
    {
      icon: Minus,
      label: 'Neutras',
      value: result.neutral,
      pct: neuRatio,
      color: 'neutral',
    },
  ];

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <Hash size={14} />
        <span>Métricas da Análise</span>
      </div>

      <div className="stats-list">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`stat-item stat-${s.color}`}>
              <div className="stat-left">
                <div className={`stat-icon-wrap icon-${s.color}`}>
                  <Icon size={14} />
                </div>
                <span className="stat-label">{s.label}</span>
              </div>
              <div className="stat-right">
                <span className={`stat-value mono color-${s.color}`}>{s.value}</span>
                {s.pct !== undefined && (
                  <span className="stat-pct mono">{s.pct}%</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de distribuição */}
      <div className="distribution-section">
        <span className="dist-label">Distribuição de sentimentos</span>
        <div className="dist-bar">
          <div
            className="dist-segment dist-pos"
            style={{ width: `${posRatio}%` }}
            title={`Positivo: ${posRatio}%`}
          />
          <div
            className="dist-segment dist-neu"
            style={{ width: `${neuRatio}%` }}
            title={`Neutro: ${neuRatio}%`}
          />
          <div
            className="dist-segment dist-neg"
            style={{ width: `${negRatio}%` }}
            title={`Negativo: ${negRatio}%`}
          />
        </div>
        <div className="dist-legend">
          <span className="legend-item up">■ Pos {posRatio}%</span>
          <span className="legend-item neutral">■ Neu {neuRatio}%</span>
          <span className="legend-item down">■ Neg {negRatio}%</span>
        </div>
      </div>

      {/* Score resumido */}
      <div className="score-summary">
        <div className="score-sum-row">
          <span className="score-sum-label">Score VADER</span>
          <span className={`score-sum-value mono ${result.score > 0.05 ? 'color-up' : result.score < -0.05 ? 'color-down' : 'color-neutral'}`}>
            {result.score >= 0 ? '+' : ''}{result.score.toFixed(4)}
          </span>
        </div>
        <div className="score-sum-row">
          <span className="score-sum-label">ID da Análise</span>
          <span className="score-sum-value mono">#{result.analysis_id}</span>
        </div>
        <div className="score-sum-row">
          <span className="score-sum-label">Algoritmo</span>
          <span className="score-sum-value mono">VADER NLP</span>
        </div>
      </div>
    </div>
  );
}
