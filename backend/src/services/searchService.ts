import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export class SearchService {
  static async searchInternet(query: string): Promise<string> {
    try {
      // Using DuckDuckGo Instant Answer API (free, no API key required)
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

      const response = await axios.get(searchUrl, {
        timeout: 5000, // 5 second timeout
      });

      const data = response.data;

      let searchResults = "";

      // Extract Instant Answer if available
      if (data.Answer) {
        searchResults += `Instant Answer: ${data.Answer}\n\n`;
      }

      // Extract Abstract if available
      if (data.Abstract) {
        searchResults += `Summary: ${data.Abstract}\n\n`;
      }

      // Extract Related Topics
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        searchResults += "Related Information:\n";
        data.RelatedTopics.slice(0, 3).forEach((topic: any, index: number) => {
          if (topic.Text) {
            searchResults += `${index + 1}. ${topic.Text}\n`;
          }
        });
        searchResults += "\n";
      }

      // Extract Results
      if (data.Results && data.Results.length > 0) {
        searchResults += "Search Results:\n";
        data.Results.slice(0, 3).forEach((result: any, index: number) => {
          if (result.Text && result.FirstURL) {
            searchResults += `${index + 1}. ${result.Text}\n   Source: ${result.FirstURL}\n`;
          }
        });
      }

      return searchResults || "No relevant information found from internet search.";
    } catch (error: any) {
      console.error("Internet search error:", error);
      return "Unable to fetch recent information from the internet.";
    }
  }

  static shouldSearch(message: string): boolean {
    const searchKeywords = [
      "latest", "recent", "news", "update", "current", "now", "today",
      "what's new", "breaking", "happening", "trend", "viral",
      "price of", "cost of", "value of", "rate of", "how much",
      "weather", "forecast", "temperature", "climate",
      "election", "politics", "government", "policy",
      "stock", "market", "economy", "finance", "business",
      "sports", "game", "match", "score", "result",
      "celebrity", "movie", "film", "music", "song", "album",
      "technology", "tech", "innovation", "AI", "artificial intelligence",
      "science", "research", "discovery", "study"
    ];

    const lowerMessage = message.toLowerCase();
    return searchKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}
