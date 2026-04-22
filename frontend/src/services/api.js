/**
 * services/api.js - Cliente HTTP para comunicação com o backend InvestIA
 * Usa axios com interceptors para tratamento centralizado de erros
 */

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ── Instância axios configurada ───────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30s timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor de resposta: normaliza erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Erro desconhecido na comunicação com o servidor.';
    return Promise.reject(new Error(message));
  }
);

// ── Endpoints ─────────────────────────────────────────────────────────────

/**
 * Analisa sentimento de notícias para um ticker.
 * @param {string} ticker  - Código da ação (ex: PETR4)
 * @param {number} newsLimit - Número de notícias (padrão: 8)
 */
export const analyzeStock = async (ticker, newsLimit = 8) => {
  const { data } = await api.post('/analyze', {
    ticker: ticker.toUpperCase(),
    news_limit: newsLimit,
  });
  return data;
};

/**
 * Busca dados históricos de preços.
 * @param {string} ticker
 * @param {number} days - Dias de histórico
 */
export const getStockData = async (ticker, days = 90) => {
  const { data } = await api.get(`/stock/${ticker}`, { params: { days } });
  return data;
};

/**
 * Retorna histórico de análises realizadas.
 * @param {number} limit
 * @param {string} ticker - Filtro opcional por ticker
 */
export const getHistory = async (limit = 20, ticker = '') => {
  const params = { limit };
  if (ticker) params.ticker = ticker;
  const { data } = await api.get('/history', { params });
  return data;
};

/**
 * Retorna detalhes de uma análise específica.
 * @param {number} analysisId
 */
export const getAnalysisDetail = async (analysisId) => {
  const { data } = await api.get(`/history/${analysisId}`);
  return data;
};

/**
 * Remove uma análise do histórico.
 * @param {number} analysisId
 */
export const deleteAnalysis = async (analysisId) => {
  const { data } = await api.delete(`/history/${analysisId}`);
  return data;
};

/**
 * Retorna estatísticas gerais do sistema.
 */
export const getStats = async () => {
  const { data } = await api.get('/history/stats');
  return data;
};

/**
 * Verifica se o backend está online.
 */
export const checkHealth = async () => {
  const { data } = await api.get('/health');
  return data;
};

export default api;
