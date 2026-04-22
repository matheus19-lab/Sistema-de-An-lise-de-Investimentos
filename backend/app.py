"""
============================================================
 InvestIA - Sistema de Análise de Investimentos com IA
 Backend: Python + Flask
 Autor: Matheus de Sousa Moura
============================================================

Por que Python/Flask e não Node.js/Express?
  - Python é a linguagem de facto para NLP e ML
  - Ecossistema rico: VADER, TextBlob, scikit-learn, pandas
  - VADER foi desenvolvido especificamente para análise de
    sentimento em textos financeiros e mídias sociais
  - Integração direta com bibliotecas de ML sem bridges
"""

from flask import Flask
from flask_cors import CORS
from database.db import init_db
from routes.analysis_routes import analysis_bp
from routes.history_routes import history_bp
from routes.stock_routes import stock_bp
import logging

# ── Configuração de log ──────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ── Factory da aplicação ─────────────────────────────────
def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")

    # CORS para permitir requisições do React (localhost:3000)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Inicializa banco de dados SQLite
    with app.app_context():
        init_db()
        logger.info("Banco de dados inicializado com sucesso.")

    # Registra Blueprints (rotas modulares)
    app.register_blueprint(analysis_bp, url_prefix="/api")
    app.register_blueprint(history_bp,  url_prefix="/api")
    app.register_blueprint(stock_bp,    url_prefix="/api")

    @app.route("/api/health")
    def health():
        return {"status": "ok", "version": "1.0.0", "service": "InvestIA"}

    return app


if __name__ == "__main__":
    app = create_app()
    logger.info("🚀 InvestIA Backend rodando em http://localhost:5000")
    app.run(debug=True, host="0.0.0.0", port=5000)
