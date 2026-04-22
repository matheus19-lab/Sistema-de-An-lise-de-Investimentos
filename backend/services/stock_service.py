"""
services/stock_service.py - Dados Históricos de Preços

DADOS SIMULADOS com modelo de passeio aleatório (Random Walk):
══════════════════════════════════════════════════════════════

O preço de uma ação é modelado como:
  P(t) = P(t-1) × e^(μ + σ × Z)

Onde:
  μ  = drift (tendência média)
  σ  = volatilidade (desvio padrão dos retornos)
  Z  ~ N(0,1) = número aleatório com distribuição normal padrão

Este é o modelo de Black-Scholes simplificado, usado em:
  - Apreçamento de opções
  - Simulação de Monte Carlo
  - Análise de risco (VaR)

Integração com API real (yfinance):
  - pip install yfinance
  - yf.download("PETR4.SA", period="3mo")
  - Adicionar ".SA" ao ticker para B3
"""

import random
import math
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Parâmetros por setor (baseados em dados históricos reais)
SECTOR_PARAMS = {
    "PETR4": {"base_price": 36.50, "drift": 0.0002, "volatility": 0.022, "sector": "Petróleo"},
    "VALE3": {"base_price": 65.80, "drift": 0.0001, "volatility": 0.025, "sector": "Mineração"},
    "ITUB4": {"base_price": 31.20, "drift": 0.0003, "volatility": 0.015, "sector": "Financeiro"},
    "BBDC4": {"base_price": 15.40, "drift": 0.0001, "volatility": 0.018, "sector": "Financeiro"},
    "MGLU3": {"base_price":  7.80, "drift":-0.0002, "volatility": 0.045, "sector": "Varejo"},
    "WEGE3": {"base_price": 38.50, "drift": 0.0004, "volatility": 0.016, "sector": "Indústria"},
    "ABEV3": {"base_price": 14.20, "drift": 0.0001, "volatility": 0.012, "sector": "Consumo"},
    "BBAS3": {"base_price": 56.80, "drift": 0.0003, "volatility": 0.016, "sector": "Financeiro"},
    "RENT3": {"base_price": 48.90, "drift": 0.0002, "volatility": 0.020, "sector": "Serviços"},
    "RAIL3": {"base_price": 24.30, "drift": 0.0001, "volatility": 0.018, "sector": "Logística"},
    "SUZB3": {"base_price": 54.70, "drift": 0.0003, "volatility": 0.022, "sector": "Papel"},
    "RDOR3": {"base_price": 23.50, "drift": 0.0004, "volatility": 0.019, "sector": "Saúde"},
    "PRIO3": {"base_price": 47.60, "drift": 0.0003, "volatility": 0.028, "sector": "Petróleo"},
    "CPLE6": {"base_price": 10.80, "drift": 0.0002, "volatility": 0.015, "sector": "Energia"},
    "ENEV3": {"base_price": 14.60, "drift": 0.0001, "volatility": 0.020, "sector": "Energia"},
}

DEFAULT_PARAMS = {"base_price": 20.00, "drift": 0.0001, "volatility": 0.020, "sector": "Geral"}


class StockService:
    """Serviço de dados históricos de preços de ações."""

    def get_historical_prices(self, ticker: str, days: int = 90) -> dict:
        """
        Retorna preços históricos simulados para o ticker.

        Args:
            ticker: Código da ação (ex: PETR4)
            days:   Número de dias de histórico

        Returns:
            {
              "ticker": str,
              "prices": [{date, open, high, low, close, volume}],
              "summary": {current_price, change_30d, volatility, ...}
            }
        """
        ticker = ticker.upper()
        params = SECTOR_PARAMS.get(ticker, DEFAULT_PARAMS)

        # Usa seed baseada no ticker para dados determinísticos
        seed = sum(ord(c) for c in ticker)
        rng = random.Random(seed)

        prices = self._generate_ohlcv(params, days, rng)
        summary = self._compute_summary(prices, params)

        return {
            "ticker":  ticker,
            "sector":  params["sector"],
            "prices":  prices,
            "summary": summary,
            "is_mock": True,
        }

    def _generate_ohlcv(self, params: dict, days: int, rng: random.Random) -> list:
        """Gera série OHLCV via modelo de passeio aleatório geométrico."""
        prices = []
        close = params["base_price"]
        mu    = params["drift"]
        sigma = params["volatility"]

        # Calcula datas úteis retroativamente
        today = datetime.now()
        business_days = self._get_business_days(today, days)

        for date in business_days:
            # Modelo GBM (Geometric Brownian Motion)
            z = rng.gauss(0, 1)
            ret = math.exp(mu + sigma * z)
            close = close * ret

            # Spread intraday realista
            spread = rng.uniform(0.005, 0.025) * close
            open_p = close * rng.uniform(0.99, 1.01)
            high   = max(open_p, close) + rng.uniform(0, spread)
            low    = min(open_p, close) - rng.uniform(0, spread)
            volume = int(rng.uniform(5_000_000, 50_000_000))

            prices.append({
                "date":   date.strftime("%Y-%m-%d"),
                "open":   round(open_p, 2),
                "high":   round(high, 2),
                "low":    round(max(low, 0.01), 2),
                "close":  round(close, 2),
                "volume": volume,
            })

        return prices

    def _get_business_days(self, end_date: datetime, days: int) -> list:
        """Retorna lista de dias úteis (seg-sex) retroativos."""
        dates = []
        current = end_date
        total_days = days * 2  # busca dias extras para compensar fins de semana

        for _ in range(total_days):
            current -= timedelta(days=1)
            if current.weekday() < 5:  # 0=seg, 4=sex
                dates.append(current)
                if len(dates) >= days:
                    break

        return list(reversed(dates))

    def _compute_summary(self, prices: list, params: dict) -> dict:
        """Calcula métricas resumidas a partir da série histórica."""
        if not prices:
            return {}

        closes = [p["close"] for p in prices]
        current = closes[-1]
        prev_30d = closes[-30] if len(closes) >= 30 else closes[0]
        prev_1d  = closes[-2]  if len(closes) >= 2  else closes[0]

        change_1d  = ((current - prev_1d)  / prev_1d)  * 100
        change_30d = ((current - prev_30d) / prev_30d) * 100

        # Volatilidade histórica anualizada
        if len(closes) > 1:
            returns = [(closes[i] - closes[i-1]) / closes[i-1]
                       for i in range(1, len(closes))]
            import statistics
            vol_daily = statistics.stdev(returns) if len(returns) > 1 else 0
            vol_annual = vol_daily * math.sqrt(252)
        else:
            vol_annual = params["volatility"] * math.sqrt(252)

        return {
            "current_price": round(current, 2),
            "change_1d":     round(change_1d, 2),
            "change_30d":    round(change_30d, 2),
            "max_52w":       round(max(closes), 2),
            "min_52w":       round(min(closes), 2),
            "avg_volume":    int(sum(p["volume"] for p in prices) / len(prices)),
            "volatility_yr": round(vol_annual * 100, 2),
        }
