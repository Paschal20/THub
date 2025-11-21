import NodeCache from "node-cache";
import dotenv from "dotenv";
import {
  googleSearch,
  duckduckgoSearch,
  serpApiSearch,
} from "./searchProviders";

dotenv.config();

const cache = new NodeCache({ stdTTL: 60, checkperiod: 30 });

export interface SearchResult {
  title: string;
  snippet?: string;
  url?: string;
  displayUrl?: string;
  provider?: string;
}

export async function webSearch(query: string, count = 5): Promise<SearchResult[]> {
  const key = `search:${query}:${count}`;
  const cached = cache.get<SearchResult[]>(key);
  if (cached) return cached;

  const providers = [googleSearch, duckduckgoSearch, serpApiSearch];

  for (const provider of providers) {
    try {
      const results = await provider(query, count);
      if (results.length > 0) {
        cache.set(key, results);
        return results;
      }
    } catch (error) {
      console.error(`${provider.name} search failed:`, error);
    }
  }

  // Final fallback
  const currentDate = new Date().toISOString().split('T')[0];
  const fallbackResults: SearchResult[] = [
    {
      title: `Search results for "${query}"`,
      snippet: `Current search for "${query}" as of ${currentDate}. For the most accurate and up-to-date information, please configure Google Custom Search API or SerpApi.`,
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      displayUrl: "google.com",
      provider: "fallback",
    },
  ];

  cache.set(key, fallbackResults);
  return fallbackResults;
}