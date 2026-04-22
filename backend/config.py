"""
config.py - Configurações centralizadas do InvestIA Backend
"""
import os

class Config:
    # Segurança
    SECRET_KEY = os.environ.get("SECRET_KEY", "investia-tcc-2024-secret-key")

    # Banco de dados SQLite (arquivo local, sem instalação extra)
    DATABASE_PATH = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "database",
        "investia.db"
    )

    # Configurações de CORS
    CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # API de notícias (opcional - sistema funciona com dados mock)
    # Para usar NewsAPI real: https://newsapi.org (gratuito até 100 req/dia)
    NEWS_API_KEY = os.environ.get("NEWS_API_KEY", "")
    NEWS_API_URL = "https://newsapi.org/v2/everything"

    # Configurações do analisador de sentimento
    SENTIMENT_THRESHOLD_POSITIVE = 0.05   # Acima disso → POSITIVO
    SENTIMENT_THRESHOLD_NEGATIVE = -0.05  # Abaixo disso → NEGATIVO
    # Entre os dois thresholds → NEUTRO

    # Histórico
    MAX_HISTORY_RECORDS = 100
