"""
routes/history_routes.py - Endpoints de histórico de análises
"""

from flask import Blueprint, jsonify, request
from database.db import query_db, execute_db
import logging

logger = logging.getLogger(__name__)
history_bp = Blueprint("history", __name__)


@history_bp.route("/history", methods=["GET"])
def get_history():
    """
    Retorna histórico de análises realizadas.

    Query params:
        limit  (int, default 20): número máximo de registros
        ticker (str, optional):   filtra por ticker
    """
    limit  = min(int(request.args.get("limit", 20)), 100)
    ticker = request.args.get("ticker", "").strip().upper()

    if ticker:
        rows = query_db(
            """SELECT id, ticker, created_at, sentiment, score,
                      news_count, positive, negative, neutral, trend
               FROM analyses
               WHERE UPPER(ticker) = ?
               ORDER BY created_at DESC
               LIMIT ?""",
            (ticker, limit)
        )
    else:
        rows = query_db(
            """SELECT id, ticker, created_at, sentiment, score,
                      news_count, positive, negative, neutral, trend
               FROM analyses
               ORDER BY created_at DESC
               LIMIT ?""",
            (limit,)
        )

    history = [dict(row) for row in rows]
    return jsonify({"history": history, "count": len(history)}), 200


@history_bp.route("/history/<int:analysis_id>", methods=["GET"])
def get_analysis_detail(analysis_id: int):
    """Retorna detalhes de uma análise específica com suas notícias."""

    analysis = query_db(
        "SELECT * FROM analyses WHERE id = ?",
        (analysis_id,),
        one=True
    )
    if not analysis:
        return jsonify({"error": f"Análise {analysis_id} não encontrada."}), 404

    news_items = query_db(
        "SELECT * FROM news_items WHERE analysis_id = ? ORDER BY score DESC",
        (analysis_id,)
    )

    return jsonify({
        "analysis": dict(analysis),
        "news":     [dict(n) for n in news_items],
    }), 200


@history_bp.route("/history/<int:analysis_id>", methods=["DELETE"])
def delete_analysis(analysis_id: int):
    """Remove uma análise e suas notícias do banco."""
    execute_db("DELETE FROM news_items WHERE analysis_id = ?", (analysis_id,))
    execute_db("DELETE FROM analyses WHERE id = ?", (analysis_id,))
    return jsonify({"message": f"Análise {analysis_id} removida com sucesso."}), 200


@history_bp.route("/history/stats", methods=["GET"])
def get_stats():
    """Retorna estatísticas gerais do sistema."""
    stats = query_db("""
        SELECT
            COUNT(*) as total_analyses,
            COUNT(DISTINCT ticker) as unique_tickers,
            AVG(score) as avg_score,
            SUM(positive) as total_positive,
            SUM(negative) as total_negative,
            SUM(neutral) as total_neutral
        FROM analyses
    """, one=True)

    top_tickers = query_db("""
        SELECT ticker, COUNT(*) as count
        FROM analyses
        GROUP BY ticker
        ORDER BY count DESC
        LIMIT 5
    """)

    return jsonify({
        "stats":       dict(stats) if stats else {},
        "top_tickers": [dict(t) for t in top_tickers],
    }), 200
