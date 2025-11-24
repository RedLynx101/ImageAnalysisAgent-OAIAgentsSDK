import axios from 'axios';
import { env, logger } from '@repo/shared';

export const webSearch = async (query: string) => {
  logger.info(`Searching web for: ${query}`);
  try {
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          { role: 'system', content: 'Be precise and concise.' },
          { role: 'user', content: query }
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    logger.error("Error in web search:", error);
    return "Search failed or returned no results.";
  }
};

