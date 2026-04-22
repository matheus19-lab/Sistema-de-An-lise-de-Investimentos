/**
 * components/NewsCard.jsx
 * Card individual de notícia com score de sentimento e indicador visual
 */

import React from 'react';
import { ExternalLink, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './NewsCard.css';

const SENTIMENT_CONFIG = {
  POSITIVO: { class: 'pos', bar: 'bar-pos', label: '↑ Positivo' },
  NEGATIVO: { class: 'neg', bar: 'bar-neg', label: '↓ Negativo' },
  NEUTRO:   { class: 'neu', bar: 'bar-neu', label: '→ Neutro'   },
};

export default function NewsCard({ news, index }) {
  const cfg = SENTIMENT_CONFIG[news.sentiment] || SENTIMENT_CONFIG.NEUTRO;

  // Calcula largura da barra: compound −1→+1 mapeia para 0→100%
  const barWidth = `${((news.score + 1) / 2) * 100}%`;

  // Formata tempo relativo
  let timeAgo = '';
  try {
    timeAgo = formatDistanceToNow(new Date(news.published), {
      addSuffix: true,
      locale: ptBR,
    });
  } catch {
    timeAgo = 'recentemente';
  }

  return (
    <div
      className={`news-card news-${cfg.class}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Barra de sentimento no topo */}
      <div className="news-score-bar">
        <div className={`news-score-fill ${cfg.bar}`} style={{ width: barWidth }} />
      </div>

      <div className="news-body">
        {/* Cabeçalho: fonte e badge de sentimento */}
        <div className="news-meta">
          <span className="news-source">{news.source || 'Fonte desconhecida'}</span>
          <span className={`news-sentiment-badge badge-${cfg.class}`}>
            {cfg.label}
          </span>
        </div>

        {/* Título */}
        <h3 className="news-title">{news.title}</h3>

        {/* Rodapé: score e data */}
        <div className="news-footer">
          <div className="news-time">
            <Clock size={11} />
            <span className="mono">{timeAgo}</span>
          </div>
          <div className="news-score-value">
            <span className="score-label">Score:</span>
            <span className={`score-num mono badge-${cfg.class}`}>
              {news.score >= 0 ? '+' : ''}{news.score.toFixed(3)}
            </span>
          </div>
          {news.url && !news.url.includes('example.com') && (
            <a
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="news-link"
              title="Abrir notícia"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
