# 📊 InvestIA — Sistema de Análise de Investimentos com IA

> **Trabalho de Conclusão de Curso (TCC)**  
> Análise automatizada de ações da B3 usando NLP e Processamento de Linguagem Natural

---

## 🎯 Visão Geral

O **InvestIA** é uma aplicação web full stack que:

1. Recebe o código de uma ação (ex: `PETR4`, `VALE3`)
2. Coleta notícias relacionadas (mock realista ou API real)
3. Analisa o sentimento de cada notícia usando o algoritmo **VADER NLP**
4. Calcula um score composto e classifica a tendência (**ALTA / NEUTRA / BAIXA**)
5. Exibe gráficos interativos de preços históricos simulados via modelo GBM
6. Mantém um histórico completo de todas as análises no banco SQLite

---

## 🏗️ Arquitetura do Sistema

```
InvestIA/
├── backend/                    # Python + Flask (API REST)
│   ├── app.py                  # Entrypoint Flask
│   ├── config.py               # Configurações centralizadas
│   ├── requirements.txt        # Dependências Python
│   ├── database/
│   │   └── db.py               # SQLite (init + helpers)
│   ├── services/
│   │   ├── sentiment_service.py # Motor IA: VADER + léxico BR
│   │   ├── news_service.py      # Coleta de notícias (mock/real)
│   │   └── stock_service.py     # Preços históricos (GBM)
│   └── routes/
│       ├── analysis_routes.py   # POST /api/analyze
│       ├── history_routes.py    # GET/DELETE /api/history
│       └── stock_routes.py      # GET /api/stock/<ticker>
│
└── frontend/                   # React 18
    ├── package.json
    ├── public/index.html
    └── src/
        ├── App.jsx              # Componente raiz
        ├── index.js             # Entrypoint React
        ├── services/api.js      # Cliente HTTP (axios)
        ├── styles/              # CSS global
        └── components/
            ├── Header.jsx       # Cabeçalho + ticker tape
            ├── Dashboard.jsx    # Tela principal
            ├── SearchBar.jsx    # Campo de busca
            ├── SentimentResult.jsx  # Gauge + resultado
            ├── StatsPanel.jsx   # Métricas da análise
            ├── PriceChart.jsx   # Gráfico Recharts
            ├── NewsCard.jsx     # Card de notícia
            └── HistoryView.jsx  # Tela de histórico
```

---

## ⚙️ Pré-requisitos

| Ferramenta | Versão Mínima | Download |
|------------|---------------|---------|
| Python     | 3.9+          | https://python.org |
| Node.js    | 18+           | https://nodejs.org |
| npm        | 9+            | (vem com Node.js) |

---

## ▶️ Instalação e Execução

### 1. Clone ou baixe o projeto

```bash
# Se tiver Git:
git clone <url-do-repositorio>
cd tcc-investimentos

# Ou extraia o ZIP baixado
```

---

### 2. Backend (Python + Flask)

```bash
# Entre na pasta do backend
cd backend

# Crie o ambiente virtual (recomendado)
python -m venv venv

# Ative o ambiente virtual:
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Inicie o servidor
python app.py
```

O backend estará rodando em: **http://localhost:5000**

Teste rápido no navegador: http://localhost:5000/api/health
Resposta esperada: `{"status": "ok", "version": "1.0.0", "service": "InvestIA"}`

---

### 3. Frontend (React)

```bash
# Em outro terminal, entre na pasta do frontend
cd frontend

# Instale as dependências Node
npm install

# Inicie o servidor de desenvolvimento
npm start
```

O frontend abrirá automaticamente em: **http://localhost:3000**

---

### 4. Usando o Sistema

1. Acesse **http://localhost:3000**
2. No campo de busca, digite um ticker: `PETR4`, `VALE3`, `ITUB4` etc.
3. Clique em **Analisar →** ou pressione **Enter**
4. Aguarde ~2 segundos (coleta + análise de IA)
5. Visualize:
   - Gauge de sentimento com score VADER
   - Tendência: ALTA 📈 / NEUTRA → / BAIXA 📉
   - Gráfico de preços históricos (últimos 3 meses)
   - Cards de notícias com score individual
6. Acesse **Histórico** para ver análises anteriores

---

## 🔌 API REST — Referência

### POST /api/analyze
Realiza análise de sentimento para uma ação.

**Request:**
```json
{ "ticker": "PETR4", "news_limit": 8 }
```

**Response:**
```json
{
  "analysis_id": 1,
  "ticker": "PETR4",
  "score": 0.3214,
  "label": "POSITIVO",
  "trend": "ALTA",
  "confidence": 0.72,
  "news_count": 8,
  "positive": 5,
  "negative": 2,
  "neutral": 1,
  "news": [
    {
      "title": "Petrobras anuncia lucro recorde...",
      "source": "Valor Econômico",
      "score": 0.6124,
      "sentiment": "POSITIVO",
      "published": "2024-10-01T14:30:00"
    }
  ]
}
```

### GET /api/stock/PETR4?days=90
Retorna dados históricos de preços.

### GET /api/history?limit=20
Lista análises realizadas.

### GET /api/history/stats
Estatísticas gerais do sistema.

### DELETE /api/history/{id}
Remove uma análise específica.

---

## 🧠 Como a IA Funciona (para o TCC)

### Algoritmo: VADER (Valence Aware Dictionary and sEntiment Reasoner)

O VADER é um modelo híbrido de NLP criado por **Hutto & Gilbert (2014)** que combina:

#### 1. Léxico com Valência
Um dicionário de ~7.500 palavras, cada uma com score de polaridade:
```
"lucro"    → +2.5  (muito positivo)
"falência" → -3.8  (muito negativo)
"estável"  →  0.2  (levemente positivo)
```

#### 2. Regras Gramaticais
- **Negação**: "NÃO houve lucro" inverte o sentimento
- **Intensificadores**: "GRANDE lucro" amplifica o score
- **Pontuação**: "Lucro RECORDE!!!" é mais positivo que "Lucro recorde."
- **Maiúsculas**: "CRISE" é mais intenso que "crise"

#### 3. Score Compound
Combina todos os tokens em um único valor normalizado:
```
compound ∈ [-1.0, +1.0]

compound ≥  0.05 → POSITIVO
compound ≤ -0.05 → NEGATIVO
|compound| < 0.05 → NEUTRO
```

#### 4. Léxico Financeiro BR (Customização)
O sistema estende o VADER com termos do mercado brasileiro:
```python
"valorização" → +2.8
"pregão"      →  0.0
"derramamento"→ -2.5
"dividendo"   → +2.0
```

#### 5. Agregação Temporal
Para múltiplas notícias, usa **média ponderada com decaimento**:
- Notícias mais recentes têm peso maior
- Score final reflete melhor o momento atual do mercado

### Modelo de Preços: Geometric Brownian Motion (GBM)

```
P(t) = P(t-1) × e^(μ + σ × Z)

μ = drift diário (ex: 0.0002 para PETR4)
σ = volatilidade (ex: 0.022)
Z ~ N(0,1) = ruído gaussiano
```

Este é o modelo de **Black-Scholes**, base do apreçamento de opções.

---

## 🛠️ Justificativa Técnica das Escolhas

| Decisão | Escolha | Por quê |
|---------|---------|---------|
| Backend | **Python/Flask** | Ecossistema NLP/ML nativo; VADER, pandas, scikit-learn sem bridges |
| Frontend | **React 18** | Componentização; hooks; mercado de trabalho |
| Banco | **SQLite** | Zero configuração; arquivo único; ideal para protótipos |
| Gráficos | **Recharts** | Baseado em D3; API declarativa; responsivo |
| NLP | **VADER** | Interpretável; offline; léxico financeiro customizável |
| HTTP | **Axios** | Interceptors; tratamento de erro centralizado |
| Preços | **GBM simulado** | Modelo acadêmico validado; sem dependência de API externa |

---

## 🚀 Melhorias Futuras (Seção TCC)

### Curto Prazo
- [ ] Integração com **yfinance** para preços reais da B3 (`.SA`)
- [ ] Integração com **NewsAPI.org** para notícias reais (100 req/dia grátis)
- [ ] **Cache Redis** para evitar reprocessamento do mesmo ticker

### Médio Prazo
- [ ] Modelo **FinBERT** (BERT fine-tuned para finanças) para maior acurácia
- [ ] **WebSocket** para análise em tempo real durante o pregão
- [ ] Dashboard com comparação entre múltiplos tickers simultaneamente

### Longo Prazo
- [ ] **ML preditivo**: LSTM para previsão de preços a 5 dias
- [ ] **Backtesting**: validar se sentimento positivo precedeu altas históricas
- [ ] **Alertas por email/WhatsApp** quando sentimento muda bruscamente
- [ ] **Autenticação**: portfólios personalizados por usuário

---

## 📦 Dependências Principais

### Backend
| Pacote | Versão | Função |
|--------|--------|--------|
| flask | 3.0.3 | Framework web |
| flask-cors | 4.0.1 | CORS para React |
| vaderSentiment | 3.3.2 | Motor NLP |
| requests | 2.31.0 | HTTP client |

### Frontend
| Pacote | Versão | Função |
|--------|--------|--------|
| react | 18.3.1 | UI framework |
| recharts | 2.12.7 | Gráficos |
| axios | 1.7.2 | HTTP client |
| lucide-react | 0.383.0 | Ícones |
| date-fns | 3.6.0 | Datas em PT-BR |

---

## 🧪 Testando a API com curl

```bash
# Health check
curl http://localhost:5000/api/health

# Analisar PETR4
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"ticker": "PETR4", "news_limit": 6}'

# Histórico
curl http://localhost:5000/api/history

# Preços históricos
curl http://localhost:5000/api/stock/VALE3?days=30

# Estatísticas
curl http://localhost:5000/api/history/stats
```

---

## 🔧 Configuração com API Real (Opcional)

Para usar notícias reais do NewsAPI.org:

1. Crie conta gratuita em https://newsapi.org
2. Copie sua API Key
3. Crie arquivo `backend/.env`:
```env
NEWS_API_KEY=sua_chave_aqui
SECRET_KEY=seu_segredo_aqui
```
4. O sistema detecta automaticamente e usa a API real

---

## 📝 Licença

Projeto desenvolvido para fins acadêmicos — TCC.  
Dados de preços são simulados e não constituem recomendação de investimento.

---

*InvestIA · Python + Flask + React + VADER NLP · 2024*
