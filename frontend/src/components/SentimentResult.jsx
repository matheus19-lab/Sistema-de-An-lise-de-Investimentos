/**
 * components/SentimentResult.jsx
 * Card principal com score de sentimento, gauge visual e tendência
 */

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import './SentimentResult.css';

const TREND_CONFIG = {
  ALTA:       { label: 'ALTA',       icon: TrendingUp,   color: 'up',      emoji: '📈', desc: 'Predominância de notícias positivas.' },
  LEVE_ALTA:  { label: 'LEVE ALTA',  icon: TrendingUp,   color: 'up',      emoji: '📈', desc: 'Leve viés positivo nas notícias.' },
  NEUTRA:     { label: 'NEUTRA',     icon: Minus,        color: 'neutral', emoji: '➡️', desc: 'Equilíbrio entre notícias positivas e negativas.' },
  LEVE_BAIXA: { label: 'LEVE BAIXA', icon: TrendingDown, color: 'down',    emoji: '📉', desc: 'Leve viés negativo nas notícias.' },
  BAIXA:      { label: 'BAIXA',      icon: TrendingDown, color: 'down',    emoji: '📉', desc: 'Predominância de notícias negativas.' },
};

const LABEL_CONFIG = {
  POSITIVO: { label: 'POSITIVO', color: 'up' },
  NEGATIVO: { label: 'NEGATIVO', color: 'down' },
  NEUTRO:   { label: 'NEUTRO',  color: 'neutral' },
};

export default function SentimentResult({ result }) {
  const [animScore, setAnimScore] = useState(0);

  const trend = TREND_CONFIG[result.trend] || TREND_CONFIG.NEUTRA;
  const label = LABEL_CONFIG[result.label] || LABEL_CONFIG.NEUTRO;
  const TrendIcon = trend.icon;

  // Anima o score de 0 → valor real ao montar
  useEffect(() => {
    const target = result.score;
    const steps  = 40;
    const delta  = target / steps;
    let current  = 0;
    const timer = setInterval(() => {
      current += delta;
      if ((delta > 0 && current >= target) || (delta < 0 && current <= target)) {
        setAnimScore(target);
        clearInterval(timer);
      } else {
        setAnimScore(current);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [result.score]);

  // Posição do ponteiro do gauge: score −1→+1 mapeado para 0→180 graus
  const gaugeDeg = ((animScore + 1) / 2) * 180;
  const gaugeColor = result.score > 0.05
    ? 'var(--color-up)'
    : result.score < -0.05
    ? 'var(--color-down)'
    : 'var(--color-neutral)';

  return (
    <div className={`sentiment-card card-${label.color}`}>
      {/* Cabeçalho */}
      <div className="sentiment-header">
        <div className="sentiment-ticker-info">
          <Activity size={14} />
          <span className="mono">Análise de Sentimento</span>
        </div>
        <div className={`sentiment-badge badge-${label.color}`}>
          {label.label}
        </div>
      </div>

      {/* Ticker */}
      <div className="sentiment-ticker">
        <span className="mono ticker-display">{result.ticker}</span>
        <span className="sentiment-id mono">#{result.analysis_id}</span>
      </div>

      {/* Gauge visual */}
      <div className="gauge-container">
        <div className="gauge">
          {/* Background semi-círculo */}
          <svg viewBox="0 0 200 110" className="gauge-svg">
            {/* Trilha de fundo */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="var(--bg-elevated)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Segmento negativo */}
            <path
              d="M 20 100 A 80 80 0 0 1 100 20"
              fill="none"
              stroke="rgba(255,77,109,0.35)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Segmento positivo */}
            <path
              d="M 100 20 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="rgba(0,255,136,0.35)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Labels NEG / NEU / POS */}
            <text x="14"  y="115" className="gauge-label-text" fill="var(--color-down)">−1</text>
            <text x="94"  y="18"  className="gauge-label-text" fill="var(--color-neutral)">0</text>
            <text x="175" y="115" className="gauge-label-text" fill="var(--color-up)">+1</text>

            {/* Ponteiro */}
            <g transform={`rotate(${gaugeDeg - 90}, 100, 100)`}>
              <line
                x1="100" y1="100"
                x2="100" y2="28"
                stroke={gaugeColor}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="100" cy="100" r="6" fill={gaugeColor} />
            </g>
          </svg>

          {/* Score central */}
          <div className="gauge-score">
            <span className={`score-value mono color-${label.color}`}>
              {animScore >= 0 ? '+' : ''}{animScore.toFixed(3)}
            </span>
            <span className="score-label">Compound Score</span>
          </div>
        </div>
      </div>

      {/* Tendência de mercado */}
      <div className={`trend-badge trend-${trend.color}`}>
        <TrendIcon size={18} />
        <div className="trend-info">
          <span className="trend-emoji">{trend.emoji}</span>
          <span className="trend-label">Tendência: <strong>{trend.label}</strong></span>
        </div>
      </div>
      <p className="trend-desc">{trend.desc}</p>

      {/* Confiança */}
      <div className="confidence-row">
        <span className="conf-label">Confiança da IA</span>
        <div className="conf-bar-wrap">
          <div
            className="conf-bar"
            style={{ width: `${(result.confidence * 100).toFixed(0)}%` }}
          />
        </div>
        <span className="conf-value mono">{(result.confidence * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
