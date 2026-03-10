import axios from 'axios';
import { FINNHUB_API_KEY } from '@config/env';

const BASE_URL = 'https://finnhub.io/api/v1';

const finnhubClient = axios.create({
  baseURL: BASE_URL,
  params: { token: FINNHUB_API_KEY },
  timeout: 10000,
});

export interface StockQuote {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
}

export interface StockProfile {
  name: string;
  ticker: string;
  exchange: string;
  logo: string;
}

export interface SymbolSearchResult {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

interface SymbolSearchResponse {
  count: number;
  result: SymbolSearchResult[];
}

export const finnhubApi = {
  getQuote: async (symbol: string): Promise<StockQuote> => {
    const { data } = await finnhubClient.get<StockQuote>('/quote', {
      params: { symbol },
    });
    return data;
  },

  getProfile: async (symbol: string): Promise<StockProfile> => {
    const { data } = await finnhubClient.get<StockProfile>('/stock/profile2', {
      params: { symbol },
    });
    return data;
  },

  searchSymbol: async (query: string): Promise<SymbolSearchResult[]> => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return [];

    const { data } = await finnhubClient.get<SymbolSearchResponse>('/search', {
      params: { q: normalizedQuery },
    });
    console.log()

    if (!Array.isArray(data.result)) return [];

    return data.result;
  },
};
