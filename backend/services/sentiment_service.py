"""
services/sentiment_service.py - Motor de IA para Análise de Sentimento

COMO A IA FUNCIONA (explicação para o TCC):
═══════════════════════════════════════════

O algoritmo VADER (Valence Aware Dictionary and sEntiment Reasoner) é um
modelo de NLP baseado em léxico e regras, criado por Hutto & Gilbert (2014)
especificamente para mídias sociais e textos financeiros.

Diferente de modelos de deep learning, o VADER:
  1. Usa um dicionário de ~7.500 palavras com polaridade pré-calculada
  2. Aplica regras gramaticais (negação, intensificadores, pontuação)
  3. É interpretável (podemos explicar cada decisão)
  4. Funciona offline sem GPU

Métricas retornadas:
  - pos  : proporção de tokens positivos (0.0 a 1.0)
  - neu  : proporção de tokens neutros   (0.0 a 1.0)
  - neg  : proporção de tokens negativos (0.0 a 1.0)
  - compound: score normalizado de -1.0 (muito negativo) a +1.0 (muito positivo)

Para textos em português, aplicamos:
  - Mapeamento de termos financeiros BR ↔ EN
  - Dicionário customizado com jargão do mercado brasileiro
"""

import logging
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

logger = logging.getLogger(__name__)

# ── Dicionário de termos financeiros BR → sentimento ────────────────────────
# Palavras específicas do mercado brasileiro com scores manuais.
# Valores: -4.0 (muito negativo) a +4.0 (muito positivo)
FINANCIAL_LEXICON_BR = {
    # Positivos - mercado
    "alta":           2.5,
    "valorização":    2.8,
    "lucro":          2.5,
    "crescimento":    2.2,
    "expansão":       2.0,
    "recorde":        2.8,
    "superávit":      2.5,
    "dividendo":      2.0,
    "proventos":      1.8,
    "positivo":       1.5,
    "recuperação":    2.0,
    "aprovação":      1.8,
    "contrato":       1.5,
    "parceria":       1.5,
    "investimento":   1.2,
    "compra":         1.0,
    "aumento":        1.5,
    "forte":          1.8,
    "bom":            1.5,
    "ótimo":          2.5,
    "excelente":      3.0,
    "premiado":       2.0,
    "inovação":       1.8,
    "sustentável":    1.5,
    "rentável":       2.2,
    "upside":         2.0,

    # Negativos - mercado
    "queda":         -2.5,
    "desvalorização":-2.8,
    "prejuízo":      -2.5,
    "perda":         -2.0,
    "crise":         -2.8,
    "déficit":       -2.5,
    "negativo":      -1.5,
    "risco":         -1.8,
    "multa":         -2.0,
    "investigação":  -2.2,
    "fraude":        -3.5,
    "falência":      -3.8,
    "rebaixamento":  -2.8,
    "downgrade":     -2.5,
    "venda":         -1.0,
    "baixa":         -2.5,
    "declínio":      -2.0,
    "redução":       -1.5,
    "corte":         -1.8,
    "problema":      -1.5,
    "preocupação":   -1.5,
    "incerteza":     -1.8,
    "pressão":       -1.5,
    "suspensão":     -2.0,
    "processo":      -1.5,
    "ação judicial": -2.2,
    "downside":      -2.0,
    "embargo":       -2.5,
    "acidente":      -2.5,
    "derramamento":  -2.5,
    "explosão":      -3.0,
    "paralização":   -2.0,
    "greve":         -1.8,
    "default":       -3.5,

    # Neutros com contexto
    "volátil":       -0.5,
    "oscilação":     -0.3,
    "estável":        0.2,
    "manutenção":     0.0,
    "neutro":         0.0,
}

# Mapeamento PT → EN para palavras comuns (tradução inline)
TRANSLATION_MAP = {
    "petróleo":   "oil",
    "gás":        "gas",
    "energia":    "energy",
    "banco":      "bank",
    "ação":       "stock",
    "mercado":    "market",
    "economia":   "economy",
    "governo":    "government",
    "resultado":  "result",
    "receita":    "revenue",
    "preço":      "price",
    "imposto":    "tax",
}


class SentimentService:
    """
    Serviço de análise de sentimento financeiro.

    Pipeline:
      texto → pré-processamento → VADER + léxico BR → score composto → classificação
    """

    def __init__(self):
        self.analyzer = SentimentIntensityAnalyzer()
        # Injeta léxico financeiro brasileiro no dicionário VADER
        self.analyzer.lexicon.update(FINANCIAL_LEXICON_BR)
        logger.info("SentimentService inicializado com léxico financeiro BR.")

    def analyze_text(self, text: str) -> dict:
        """
        Analisa um único texto e retorna métricas de sentimento.

        Args:
            text: Título ou corpo de notícia

        Returns:
            {
              "compound": float,  # Score -1.0 a +1.0
              "pos": float,
              "neg": float,
              "neu": float,
              "label": str        # "POSITIVO" | "NEGATIVO" | "NEUTRO"
            }
        """
        if not text or not text.strip():
            return {"compound": 0.0, "pos": 0.0, "neg": 0.0, "neu": 1.0, "label": "NEUTRO"}

        # Aplica tradução parcial para melhorar acurácia do VADER
        processed = self._preprocess(text)
        scores = self.analyzer.polarity_scores(processed)

        compound = scores["compound"]
        label = self._classify(compound)

        return {
            "compound": round(compound, 4),
            "pos":      round(scores["pos"], 4),
            "neg":      round(scores["neg"], 4),
            "neu":      round(scores["neu"], 4),
            "label":    label,
        }

    def analyze_batch(self, news_list: list) -> dict:
        """
        Analisa uma lista de notícias e retorna análise agregada.

        Args:
            news_list: Lista de dicts com campos 'title' e opcionalmente 'description'

        Returns:
            Resultado agregado com score médio, contagens e tendência
        """
        if not news_list:
            return self._empty_result()

        analyzed_news = []
        scores = []

        for item in news_list:
            # Combina título + descrição para análise mais rica
            text = item.get("title", "")
            if item.get("description"):
                text += " " + item["description"]

            result = self.analyze_text(text)
            scores.append(result["compound"])

            analyzed_news.append({
                "title":     item.get("title", ""),
                "source":    item.get("source", ""),
                "url":       item.get("url", ""),
                "published": item.get("published", ""),
                "score":     result["compound"],
                "sentiment": result["label"],
                "pos":       result["pos"],
                "neg":       result["neg"],
                "neu":       result["neu"],
            })

        # Score médio ponderado (notícias mais recentes têm mais peso)
        avg_score = self._weighted_average(scores)

        # Contagem por categoria
        pos_count = sum(1 for s in scores if s >  0.05)
        neg_count = sum(1 for s in scores if s < -0.05)
        neu_count = len(scores) - pos_count - neg_count

        trend = self._determine_trend(avg_score, pos_count, neg_count, len(scores))

        return {
            "score":       round(avg_score, 4),
            "label":       self._classify(avg_score),
            "trend":       trend,
            "news_count":  len(news_list),
            "positive":    pos_count,
            "negative":    neg_count,
            "neutral":     neu_count,
            "confidence":  self._confidence(scores),
            "news":        analyzed_news,
        }

    # ── Helpers privados ──────────────────────────────────────────────────

    def _preprocess(self, text: str) -> str:
        """Pré-processamento: tradução parcial, limpeza."""
        text = text.lower()
        for pt, en in TRANSLATION_MAP.items():
            text = text.replace(pt, en)
        return text

    def _classify(self, compound: float) -> str:
        """Classifica compound score em rótulo."""
        if compound >= 0.05:
            return "POSITIVO"
        elif compound <= -0.05:
            return "NEGATIVO"
        return "NEUTRO"

    def _weighted_average(self, scores: list) -> float:
        """
        Média ponderada: notícias mais recentes (fim da lista) têm peso maior.
        Isso simula o decaimento temporal de notícias.
        """
        if not scores:
            return 0.0
        n = len(scores)
        weights = [1 + (i / n) for i in range(n)]  # pesos crescentes
        total_weight = sum(weights)
        return sum(s * w for s, w in zip(scores, weights)) / total_weight

    def _determine_trend(self, avg_score: float, pos: int, neg: int, total: int) -> str:
        """
        Determina a tendência de mercado combinando score e proporções.
        """
        if total == 0:
            return "NEUTRO"

        pos_ratio = pos / total
        neg_ratio = neg / total

        if avg_score > 0.15 and pos_ratio > 0.5:
            return "ALTA"
        elif avg_score < -0.15 and neg_ratio > 0.5:
            return "BAIXA"
        elif avg_score > 0.05:
            return "LEVE_ALTA"
        elif avg_score < -0.05:
            return "LEVE_BAIXA"
        return "NEUTRA"

    def _confidence(self, scores: list) -> float:
        """
        Calcula confiança baseada na consistência dos scores.
        Alta dispersão → baixa confiança. Scores convergentes → alta confiança.
        """
        if len(scores) < 2:
            return 0.5
        import statistics
        std = statistics.stdev(scores)
        # Normaliza: desvio padrão 0 → confiança 1.0; desvio padrão 1 → confiança 0.0
        confidence = max(0.0, 1.0 - std)
        return round(confidence, 4)

    def _empty_result(self) -> dict:
        return {
            "score": 0.0,
            "label": "NEUTRO",
            "trend": "NEUTRA",
            "news_count": 0,
            "positive": 0,
            "negative": 0,
            "neutral": 0,
            "confidence": 0.0,
            "news": [],
        }
