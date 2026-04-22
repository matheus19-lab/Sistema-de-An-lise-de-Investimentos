"""
routes/stock_routes.py - Endpoints de dados históricos de preços
"""

from flask import Blueprint, jsonify, request
from services.stock_service import StockService
import logging

logger = logging.getLogger(__name__)
stock_bp = Blueprint("stock", __name__)
stock_svc = StockService()


@stock_bp.route("/stock/<ticker>", methods=["GET"])
def get_stock_data(ticker: str):
    """
    Retorna dados históricos de preços para um ticker.

    Params:
        ticker (path): código da ação (ex: PETR4)
        days   (query): dias de histórico (default 90, max 365)
    """
    days = min(int(request.args.get("days", 90)), 365)
    ticker = ticker.strip().upper()

    try:
        data = stock_svc.get_historical_prices(ticker, days)
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Erro ao buscar dados de {ticker}: {e}")
        return jsonify({"error": str(e)}), 500


@stock_bp.route("/stock/<ticker>/summary", methods=["GET"])
def get_stock_summary(ticker: str):
    """Retorna apenas o resumo sem os dados OHLCV completos."""
    ticker = ticker.strip().upper()
    try:
        data = stock_svc.get_historical_prices(ticker, days=90)
        return jsonify({
            "ticker":  data["ticker"],
            "sector":  data["sector"],
            "summary": data["summary"],
            "is_mock": data["is_mock"],
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
