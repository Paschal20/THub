import axios from "axios";
import { SearchResult } from "./websearch";

export async function googleSearch(query: string, count: number): Promise<SearchResult[]> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!googleApiKey || !searchEngineId) {
    return [];
  }

  const url = `https://www.googleapis.com/customsearch/v1`;
  const response = await axios.get(url, {
    params: {
      key: googleApiKey,
      cx: searchEngineId,
      q: query,
      num: count,
      safe: 'medium',
    },
    timeout: 15000,
  });

  const data = response.data;
  const results: SearchResult[] = [];

  if (data?.items) {
    for (const item of data.items) {
      if (results.length >= count) break;
      results.push({
        title: item.title,
        snippet: item.snippet,
        url: item.link,
        displayUrl: item.displayLink,
        provider: "google",
      });
    }
  }

  return results.slice(0, count);
}

export async function duckduckgoSearch(query: string, count: number): Promise<SearchResult[]> {
  const duckUrl = `https://api.duckduckgo.com/`;
  const duckResponse = await axios.get(duckUrl, {
    params: {
      q: query,
      format: 'json',
      no_html: 1,
      skip_disambig: 1,
    },
    timeout: 10000,
  });

  const duckData = duckResponse.data;
  const results: SearchResult[] = [];

  if (duckData.Answer) {
    results.push({
      title: `Answer: ${query}`,
      snippet: duckData.Answer,
      url: duckData.AnswerURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      displayUrl: "duckduckgo.com",
      provider: "duckduckgo",
    });
  }

  if (duckData.RelatedTopics && duckData.RelatedTopics.length > 0) {
    for (const topic of duckData.RelatedTopics.slice(0, count - results.length)) {
      if (topic.Text) {
        results.push({
          title: topic.FirstURL ? topic.FirstURL.split('/').pop() || topic.Text : topic.Text,
          snippet: topic.Text,
          url: topic.FirstURL || `https://duckduckgo.com/?q=${encodeURIComponent(topic.Text)}`,
          displayUrl: "duckduckgo.com",
          provider: "duckduckgo",
        });
      }
    }
  }

  return results.slice(0, count);
}

export async function serpApiSearch(query: string, count: number): Promise<SearchResult[]> {
  const serpApiKey = process.env.SERPAPI_API_KEY;
  if (!serpApiKey) {
    return [];
  }

  const serpUrl = `https://serpapi.com/search.json`;
  const serpResponse = await axios.get(serpUrl, {
    params: {
      q: query,
      api_key: serpApiKey,
      num: count,
      engine: 'google',
    },
    timeout: 15000,
  });

  const serpData = serpResponse.data;
  const results: SearchResult[] = [];

  if (serpData?.organic_results) {
    for (const item of serpData.organic_results) {
      if (results.length >= count) break;
      results.push({
        title: item.title,
        snippet: item.snippet,
        url: item.link,
        displayUrl: item.displayed_link,
        provider: "serpapi",
      });
    }
  }

  return results.slice(0, count);
}
