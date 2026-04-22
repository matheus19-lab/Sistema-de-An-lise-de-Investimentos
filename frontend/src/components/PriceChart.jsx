/**
 * components/PriceChart.jsx
 * Gráfico interativo de preços históricos usando Recharts
 * Exibe: Preço de fechamento, Volume, Máximas e Mínimas
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  ReferenceLine,
} from 'recharts';
import './PriceChart.css';

const PERIODS = [
  { label: '1M',  days: 21  },
  { label: '2M',  days: 42  },
  { label: '3M',  days: 63  },
];

// Tooltip customizado com estilo dark
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="chart-tooltip">
      <div className="tooltip-date">{label}</div>
      <div className="tooltip-row">
        <span>Fechamento</span>
        <span className="mono tooltip-close">R$ {d.close?.toFixed(2)}</span>
      </div>
      <div className="tooltip-row">
        <span>Abertura</span>
        <span className="mono">R$ {d.open?.toFixed(2)}</span>
      </div>
      <div className="tooltip-row">
        <span>Máxima</span>
        <span className="mono tooltip-high">R$ {d.high?.toFixed(2)}</span>
      </div>
      <div className="tooltip-row">
        <span>Mínima</span>
        <span className="mono tooltip-low">R$ {d.low?.toFixed(2)}</span>
      </div>
      <div className="tooltip-row">
        <span>Volume</span>
        <span className="mono">{(d.volume / 1_000_000).toFixed(1)}M</span>
      </div>
    </div>
  );
}

export default function PriceChart({ data }) {
  const [period, setPeriod] = useState(1); // índice em PERIODS

  const selectedDays = PERIODS[period].days;

  // Fatia os dados para o período selecionado
  const chartData = useMemo(() => {
    const slice = data.prices.slice(-selectedDays);
    return slice.map((p) => ({
      ...p,
      // Formata data para exibição
      dateLabel: new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short',
      }),
      // Volume em milhões para escala legível
      volumeM: +(p.volume / 1_000_000).toFixed(2),
    }));
  }, [data.prices, selectedDays]);

  // Cor da linha: verde se preço final > inicial, vermelho se não
  const startPrice = chartData[0]?.close || 0;
  const endPrice   = chartData[chartData.length - 1]?.close || 0;
  const lineColor  = endPrice >= startPrice ? 'var(--color-up)' : 'var(--color-down)';

  const { summary } = data;

  return (
    <div className="price-chart-card">
      {/* ── Métricas de resumo ── */}
      <div className="chart-metrics">
        <MetricItem
          label="Preço Atual"
          value={`R$ ${summary.current_price?.toFixed(2)}`}
          sub={`${summary.change_1d >= 0 ? '+' : ''}${summary.change_1d?.toFixed(2)}% hoje`}
          color={summary.change_1d >= 0 ? 'up' : 'down'}
        />
        <MetricItem
          label="Var. 30 dias"
          value={`${summary.change_30d >= 0 ? '+' : ''}${summary.change_30d?.toFixed(2)}%`}
          color={summary.change_30d >= 0 ? 'up' : 'down'}
        />
        <MetricItem
          label="Máx. 52 sem."
          value={`R$ ${summary.max_52w?.toFixed(2)}`}
          color="up"
        />
        <MetricItem
          label="Mín. 52 sem."
          value={`R$ ${summary.min_52w?.toFixed(2)}`}
          color="down"
        />
        <MetricItem
          label="Volatilidade Anual"
          value={`${summary.volatility_yr?.toFixed(1)}%`}
          color="neutral"
        />
      </div>

      {/* ── Seletor de período ── */}
      <div className="chart-controls">
        <span className="chart-controls-label">Período:</span>
        {PERIODS.map((p, i) => (
          <button
            key={i}
            className={`period-btn ${period === i ? 'active' : ''}`}
            onClick={() => setPeriod(i)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Gráfico principal ── */}
      <div className="chart-area">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={lineColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0}   />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />

            <XAxis
              dataKey="dateLabel"
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />

            <YAxis
              yAxisId="price"
              orientation="right"
              domain={['auto', 'auto']}
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `R$${v.toFixed(0)}`}
            />

            <YAxis
              yAxisId="volume"
              orientation="left"
              domain={[0, 'auto']}
              tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'IBM Plex Mono' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}M`}
              width={36}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            />

            {/* Barras de volume (eixo secundário) */}
            <Bar
              yAxisId="volume"
              dataKey="volumeM"
              fill="rgba(255,255,255,0.06)"
              radius={[2, 2, 0, 0]}
              name="Volume (M)"
            />

            {/* Área de preço */}
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="close"
              stroke={lineColor}
              strokeWidth={2}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
              name="Fechamento"
            />

            {/* Linha de preço inicial (referência) */}
            <ReferenceLine
              yAxisId="price"
              y={startPrice}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="4 4"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MetricItem({ label, value, sub, color }) {
  return (
    <div className="metric-item">
      <span className="metric-label">{label}</span>
      <span className={`metric-value mono color-${color}`}>{value}</span>
      {sub && <span className={`metric-sub color-${color}`}>{sub}</span>}
    </div>
  );
}
