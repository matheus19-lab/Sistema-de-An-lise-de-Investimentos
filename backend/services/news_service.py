"""
services/news_service.py - Serviço de Coleta de Notícias

ESTRATÉGIA DE DADOS:
════════════════════
O sistema usa dados SIMULADOS (mock) por padrão. Isso é justificável no TCC
porque:
  1. APIs gratuitas têm limite de requisições (NewsAPI: 100/dia)
  2. O foco do TCC é o pipeline de IA, não a coleta
  3. Os dados mock seguem estrutura idêntica à API real
  4. Em produção, basta trocar USE_MOCK=False e inserir a API key

Para usar API real (NewsAPI.org):
  - Criar conta em https://newsapi.org
  - Inserir NEWS_API_KEY no .env
  - Descomentar o método _fetch_real()
"""

import random
import logging
import requests
from datetime import datetime, timedelta
from flask import current_app

logger = logging.getLogger(__name__)

# ── Base de notícias simuladas por setor ────────────────────────────────────
NEWS_TEMPLATES = {
    "PETR4": {
        "company": "Petrobras",
        "sector": "Petróleo",
        "news": [
            {
                "title": "Petrobras anuncia descoberta de novo campo de petróleo na Bacia de Santos",
                "source": "Valor Econômico",
                "sentiment_hint": "positive",
            },
            {
                "title": "Petrobras eleva previsão de produção de petróleo para 2025",
                "source": "InfoMoney",
                "sentiment_hint": "positive",
            },
            {
                "title": "Petrobras pagará dividendos extraordinários no próximo trimestre",
                "source": "Exame",
                "sentiment_hint": "positive",
            },
            {
                "title": "Alta do petróleo Brent impulsiona ações da Petrobras na bolsa",
                "source": "Bloomberg Brasil",
                "sentiment_hint": "positive",
            },
            {
                "title": "Petrobras registra lucro líquido recorde no terceiro trimestre",
                "source": "Folha de S.Paulo",
                "sentiment_hint": "positive",
            },
            {
                "title": "Queda do petróleo no mercado internacional pressiona Petrobras",
                "source": "Reuters Brasil",
                "sentiment_hint": "negative",
            },
            {
                "title": "Governo avalia mudança na política de preços de combustíveis da Petrobras",
                "source": "O Globo",
                "sentiment_hint": "negative",
            },
            {
                "title": "Incidente em plataforma da Petrobras paralisa produção no Rio",
                "source": "UOL Economia",
                "sentiment_hint": "negative",
            },
            {
                "title": "Petrobras mantém guidance de produção apesar de cenário externo volátil",
                "source": "Valor Econômico",
                "sentiment_hint": "neutral",
            },
            {
                "title": "Analistas divergem sobre perspectivas das ações da Petrobras para 2025",
                "source": "Suno Research",
                "sentiment_hint": "neutral",
            },
        ]
    },
    "VALE3": {
        "company": "Vale",
        "sector": "Mineração",
        "news": [
            {
                "title": "Vale supera expectativas e anuncia maior dividendo da história",
                "source": "InfoMoney",
                "sentiment_hint": "positive",
            },
            {
                "title": "Preço do minério de ferro dispara em Shanghai e favorece Vale",
                "source": "Bloomberg Brasil",
                "sentiment_hint": "positive",
            },
            {
                "title": "Vale anuncia expansão das operações em Carajás com investimento bilionário",
                "source": "Valor Econômico",
                "sentiment_hint": "positive",
            },
            {
                "title": "China aumenta importações de minério de ferro, beneficiando Vale",
                "source": "Reuters Brasil",
                "sentiment_hint": "positive",
            },
            {
                "title": "Vale acerta acordo bilionário para reparação de danos de Mariana",
                "source": "Folha de S.Paulo",
                "sentiment_hint": "negative",
            },
            {
                "title": "Queda do minério de ferro derruba ações da Vale na B3",
                "source": "Exame",
                "sentiment_hint": "negative",
            },
            {
                "title": "Desaceleração da economia chinesa reduz demanda por minério",
                "source": "O Globo",
                "sentiment_hint": "negative",
            },
            {
                "title": "Vale reporta produção em linha com projeções no trimestre",
                "source": "Suno Research",
                "sentiment_hint": "neutral",
            },
            {
                "title": "Vale aguarda aprovação regulatória para novo projeto no Pará",
                "source": "UOL Economia",
                "sentiment_hint": "neutral",
            },
            {
                "title": "Analistas mantêm recomendação neutra para Vale diante de incertezas",
                "source": "XP Investimentos",
                "sentiment_hint": "neutral",
            },
        ]
    },
    "ITUB4": {
        "company": "Itaú Unibanco",
        "sector": "Financeiro",
        "news": [
            {
                "title": "Itaú Unibanco reporta lucro recorde de R$ 9,8 bilhões no trimestre",
                "source": "Valor Econômico",
                "sentiment_hint": "positive",
            },
            {
                "title": "Itaú anuncia programa de recompra de ações no valor de R$ 2 bilhões",
                "source": "InfoMoney",
                "sentiment_hint": "positive",
            },
            {
                "title": "Itaú conquista posição de banco mais valioso da América Latina",
                "source": "Exame",
                "sentiment_hint": "positive",
            },
            {
                "title": "Queda dos juros Selic impacta margem financeira do Itaú",
                "source": "Bloomberg Brasil",
                "sentiment_hint": "negative",
            },
            {
                "title": "Inadimplência cresce e pressiona resultado do Itaú no semestre",
                "source": "Folha de S.Paulo",
                "sentiment_hint": "negative",
            },
            {
                "title": "Itaú expande carteira de crédito com foco em pequenas empresas",
                "source": "Suno Research",
                "sentiment_hint": "positive",
            },
            {
                "title": "Banco Central mantém Selic, setor bancário aguarda próximos passos",
                "source": "Reuters Brasil",
                "sentiment_hint": "neutral",
            },
            {
                "title": "Itaú lança plataforma digital e busca competir com fintechs",
                "source": "UOL Economia",
                "sentiment_hint": "neutral",
            },
        ]
    },
    "BBDC4": {
        "company": "Bradesco",
        "sector": "Financeiro",
        "news": [
            {
                "title": "Bradesco supera projeções com lucro de R$ 5,2 bilhões no trimestre",
                "source": "InfoMoney",
                "sentiment_hint": "positive",
            },
            {
                "title": "Bradesco anuncia reestruturação e corte de custos operacionais",
                "source": "Valor Econômico",
                "sentiment_hint": "positive",
            },
            {
                "title": "Provisionamento elevado pesa no resultado trimestral do Bradesco",
                "source": "Reuters Brasil",
                "sentiment_hint": "negative",
            },
            {
                "title": "Bradesco perde market share para bancos digitais nos últimos meses",
                "source": "O Globo",
                "sentiment_hint": "negative",
            },
            {
                "title": "Bradesco anuncia novo CEO e mercado aguarda perspectivas estratégicas",
                "source": "Folha de S.Paulo",
                "sentiment_hint": "neutral",
            },
        ]
    },
    "MGLU3": {
        "company": "Magazine Luiza",
        "sector": "Varejo",
        "news": [
            {
                "title": "Magazine Luiza registra crescimento de 35% nas vendas digitais",
                "source": "Exame",
                "sentiment_hint": "positive",
            },
            {
                "title": "Magalu anuncia parceria estratégica com marketplace asiático",
                "source": "InfoMoney",
                "sentiment_hint": "positive",
            },
            {
                "title": "Magazine Luiza reporta prejuízo pelo quinto trimestre consecutivo",
                "source": "Bloomberg Brasil",
                "sentiment_hint": "negative",
            },
            {
                "title": "Dívida elevada e juros altos pressionam ações do Magalu",
                "source": "Valor Econômico",
                "sentiment_hint": "negative",
            },
            {
                "title": "Analistas rebaixam recomendação de MGLU3 após resultado abaixo do esperado",
                "source": "XP Investimentos",
                "sentiment_hint": "negative",
            },
            {
                "title": "Magazine Luiza reestrutura operação logística para reduzir custos",
                "source": "Suno Research",
                "sentiment_hint": "neutral",
            },
        ]
    },
}

# Notícias genéricas para tickers não mapeados
GENERIC_NEWS_TEMPLATES = [
    {"title": "Ação registra alta após divulgação de resultados acima das expectativas", "sentiment_hint": "positive"},
    {"title": "Empresa anuncia expansão e novos investimentos para o próximo ano", "sentiment_hint": "positive"},
    {"title": "Analistas elevam preço-alvo após desempenho operacional robusto", "sentiment_hint": "positive"},
    {"title": "Empresa distribui dividendos e proventos atraem investidores", "sentiment_hint": "positive"},
    {"title": "Resultado trimestral supera estimativas do mercado financeiro", "sentiment_hint": "positive"},
    {"title": "Ação recua após resultado abaixo das expectativas dos analistas", "sentiment_hint": "negative"},
    {"title": "Empresa registra queda nas receitas em meio a cenário macroeconômico adverso", "sentiment_hint": "negative"},
    {"title": "Ação sofre rebaixamento de recomendação por corretoras especializadas", "sentiment_hint": "negative"},
    {"title": "Incerteza regulatória pesa sobre perspectivas da empresa no curto prazo", "sentiment_hint": "negative"},
    {"title": "Resultado operacional fica em linha com projeções do mercado", "sentiment_hint": "neutral"},
    {"title": "Empresa mantém guidance de crescimento para o ano fiscal corrente", "sentiment_hint": "neutral"},
    {"title": "Volatilidade do mercado afeta preço das ações no pregão desta semana", "sentiment_hint": "neutral"},
]


class NewsService:
    """Serviço responsável por coletar/simular notícias de ações."""

    def fetch_news(self, ticker: str, limit: int = 8) -> list:
        """
        Busca notícias para um ticker. Usa mock por padrão,
        API real se NEWS_API_KEY estiver configurada.
        """
        api_key = current_app.config.get("NEWS_API_KEY", "")

        if api_key and api_key != "":
            logger.info(f"Buscando notícias reais para {ticker}")
            try:
                return self._fetch_real(ticker, api_key, limit)
            except Exception as e:
                logger.warning(f"API real falhou ({e}), usando mock.")

        logger.info(f"Usando notícias simuladas para {ticker}")
        return self._fetch_mock(ticker, limit)

    def _fetch_mock(self, ticker: str, limit: int) -> list:
        """Gera notícias simuladas realistas."""
        ticker_upper = ticker.upper()

        if ticker_upper in NEWS_TEMPLATES:
            data = NEWS_TEMPLATES[ticker_upper]
            company = data["company"]
            candidates = data["news"]
        else:
            company = ticker_upper
            candidates = GENERIC_NEWS_TEMPLATES

        # Seleciona aleatoriamente (sem repetição)
        selected = random.sample(candidates, min(limit, len(candidates)))

        # Constrói lista de notícias com timestamps simulados
        news_list = []
        base_time = datetime.now()

        for i, item in enumerate(selected):
            hours_ago = random.randint(i * 2, i * 2 + 6)
            pub_time = base_time - timedelta(hours=hours_ago)

            news_list.append({
                "title":       self._personalize_title(item["title"], company, ticker_upper),
                "description": self._generate_description(item["sentiment_hint"], company),
                "source":      item.get("source", "InfoMoney"),
                "url":         f"https://example.com/noticias/{ticker_upper.lower()}-{i+1}",
                "published":   pub_time.isoformat(),
                "is_mock":     True,
            })

        return news_list

    def _fetch_real(self, ticker: str, api_key: str, limit: int) -> list:
        """
        Busca notícias reais via NewsAPI.org.
        Requer chave de API válida.
        """
        # Para B3, busca nome da empresa além do ticker
        company_name = NEWS_TEMPLATES.get(ticker.upper(), {}).get("company", ticker)

        params = {
            "q":        f'"{company_name}" OR "{ticker}" ação bolsa B3',
            "language": "pt",
            "sortBy":   "publishedAt",
            "pageSize": limit,
            "apiKey":   api_key,
        }
        resp = requests.get(
            current_app.config["NEWS_API_URL"],
            params=params,
            timeout=10
        )
        resp.raise_for_status()
        data = resp.json()

        news_list = []
        for article in data.get("articles", [])[:limit]:
            news_list.append({
                "title":       article.get("title", ""),
                "description": article.get("description", ""),
                "source":      article.get("source", {}).get("name", ""),
                "url":         article.get("url", ""),
                "published":   article.get("publishedAt", ""),
                "is_mock":     False,
            })
        return news_list

    def _personalize_title(self, title: str, company: str, ticker: str) -> str:
        """Substitui placeholder de empresa pelo nome real."""
        title = title.replace("Empresa", company)
        title = title.replace("Ação", f"{company} ({ticker})")
        return title

    def _generate_description(self, hint: str, company: str) -> str:
        """Gera descrição contextual baseada no sentimento esperado."""
        descriptions = {
            "positive": [
                f"{company} apresentou resultados acima das expectativas de mercado, com analistas revisando projeções para cima.",
                f"O desempenho operacional de {company} surpreendeu positivamente os investidores nesta semana.",
                f"Com fundamentos sólidos, {company} segue atraindo interesse de investidores institucionais.",
            ],
            "negative": [
                f"{company} enfrenta desafios no ambiente macroeconômico, com pressão sobre suas margens operacionais.",
                f"Incertezas no setor afetam as perspectivas de curto prazo de {company} na visão dos analistas.",
                f"O resultado abaixo das estimativas gerou revisões negativas nas projeções para {company}.",
            ],
            "neutral": [
                f"{company} mantém sua trajetória operacional dentro das estimativas de consenso do mercado.",
                f"Analistas aguardam mais dados antes de revisar recomendações para {company}.",
                f"O mercado observa os próximos movimentos de {company} diante do cenário macroeconômico.",
            ],
        }
        options = descriptions.get(hint, descriptions["neutral"])
        return random.choice(options)
