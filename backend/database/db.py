"""
database/db.py - Camada de acesso ao banco de dados SQLite

SQLite foi escolhido por:
  - Zero configuração (arquivo único)
  - Ideal para protótipos e TCCs
  - Suporte nativo no Python (sem instalação extra)
  - Fácil migração para PostgreSQL em produção
"""

import sqlite3
import os
import logging
from flask import g, current_app

logger = logging.getLogger(__name__)


def get_db():
    """Retorna conexão com o banco, reaproveitando dentro do contexto Flask."""
    if "db" not in g:
        db_path = current_app.config["DATABASE_PATH"]
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        g.db = sqlite3.connect(
            db_path,
            detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES
        )
        g.db.row_factory = sqlite3.Row  # Permite acesso por nome da coluna
    return g.db


def close_db(e=None):
    """Fecha conexão ao fim de cada requisição."""
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Cria as tabelas se não existirem."""
    db_path = current_app.config["DATABASE_PATH"]
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Tabela de análises realizadas
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker      TEXT    NOT NULL,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            sentiment   TEXT    NOT NULL,
            score       REAL    NOT NULL,
            news_count  INTEGER NOT NULL,
            positive    INTEGER NOT NULL DEFAULT 0,
            negative    INTEGER NOT NULL DEFAULT 0,
            neutral     INTEGER NOT NULL DEFAULT 0,
            trend       TEXT    NOT NULL
        )
    """)

    # Tabela de notícias analisadas
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS news_items (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis_id INTEGER NOT NULL,
            title       TEXT    NOT NULL,
            source      TEXT,
            url         TEXT,
            score       REAL    NOT NULL,
            sentiment   TEXT    NOT NULL,
            published   TEXT,
            FOREIGN KEY (analysis_id) REFERENCES analyses(id)
        )
    """)

    conn.commit()
    conn.close()
    logger.info("Tabelas criadas/verificadas com sucesso.")


def query_db(query, args=(), one=False):
    """Helper para queries SELECT."""
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv


def execute_db(query, args=()):
    """Helper para INSERT/UPDATE/DELETE. Retorna lastrowid."""
    db = get_db()
    cur = db.execute(query, args)
    db.commit()
    last_id = cur.lastrowid
    cur.close()
    return last_id
