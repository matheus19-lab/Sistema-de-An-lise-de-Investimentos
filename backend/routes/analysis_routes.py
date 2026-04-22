"""
routes/analysis_routes.py - Endpoint principal de análise de ações

Fluxo da requisição:
  POST /api/analyze
    → Valida ticker
    → Busca notícias (NewsService)
    → Analisa sentimento (SentimentService)
    → Persiste no SQLite
    → Retorna resultado completo
"""

from flask import Blueprint, request, jsonify
from services.news_service import NewsService
from services.sentiment_service import SentimentService
from database.db import execute_db, query_db
import logging

logger = logging.getLogger(__name__)
analysis_bp = Blueprint("analysis", __name__)

news_svc      = NewsService()
sentiment_svc = SentimentService()


@analysis_bp.route("/analyze", methods=["POST"])
def analyze():
    """
    Analisa sentimento de notícias para uma ação.

    Body JSON:
        { "ticker": "PETR4", "news_limit": 8 }

    Returns:
        Resultado completo com score, tendência e notícias analisadas.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Corpo da requisição inválido ou ausente."}), 400

    ticker = data.get("ticker", "").strip().upper()
    if not ticker:
        return jsonify({"error": "O campo 'ticker' é obrigatório."}), 400

    # Valida formato do ticker (2-6 caracteres alfanuméricos)
    if not ticker.replace("F", "").isalnum() or not 2 <= len(ticker) <= 7:
        return jsonify({
            "error": f"Ticker inválido: '{ticker}'. Use formato como PETR4, VALE3, ITUB4."
        }), 422

    news_limit = min(int(data.get("news_limit", 8)), 15)

    try:
        logger.info(f"Iniciando análise para {ticker}")

        # 1. Coleta notícias
        news = news_svc.fetch_news(ticker, limit=news_limit)
        logger.info(f"  → {len(news)} notícias coletadas")

        # 2. Análise de sentimento com IA
        result = sentiment_svc.analyze_batch(news)
        logger.info(f"  → Score: {result['score']:.4f} | Tendência: {result['trend']}")

        # 3. Persiste análise no banco
        analysis_id = execute_db(
            """INSERT INTO analyses
               (ticker, sentiment, score, news_count, positive, negative, neutral, trend)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                ticker,
                result["label"],
                result["score"],
                result["news_count"],
                result["positive"],
                result["negative"],
                result["neutral"],
                result["trend"],
            )
        )

        # 4. Persiste notícias analisadas
        for n in result["news"]:
            execute_db(
                """INSERT INTO news_items
                   (analysis_id, title, source, url, score, sentiment, published)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    analysis_id,
                    n["title"],
                    n.get("source", ""),
                    n.get("url", ""),
                    n["score"],
                    n["sentiment"],
                    n.get("published", ""),
                )
            )

        logger.info(f"  → Análise {analysis_id} persistida no banco.")

        return jsonify({
            "analysis_id":  analysis_id,
            "ticker":        ticker,
            "score":         result["score"],
            "label":         result["label"],
            "trend":         result["trend"],
            "confidence":    result["confidence"],
            "news_count":    result["news_count"],
            "positive":      result["positive"],
            "negative":      result["negative"],
            "neutral":       result["neutral"],
            "news":          result["news"],
        }), 200

    except Exception as e:
        logger.error(f"Erro ao analisar {ticker}: {e}", exc_info=True)
        return jsonify({"error": f"Erro interno ao processar análise: {str(e)}"}), 500
