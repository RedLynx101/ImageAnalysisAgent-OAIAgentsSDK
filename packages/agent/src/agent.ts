import { Agent, run, tool } from '@openai/agents';
import { setTracingDisabled } from '@openai/agents';
import { z } from 'zod';
import { analyzeImage } from './tools/analyzeImage';
import { webSearch } from './tools/webSearch';
import { ReportSpec } from '@repo/shared';

// Disable tracing (it requires additional setup)
setTracingDisabled(true);

// Define tools using the SDK's tool() helper
const analyzeImageTool = tool({
  name: 'analyzeImage',
  description: 'Analyzes an image and returns a detailed description of its contents.',
  parameters: z.object({
    imagePath: z.string().describe('The local file path to the image.')
  }),
  execute: async ({ imagePath }) => {
    return await analyzeImage(imagePath);
  }
});

const webSearchTool = tool({
  name: 'webSearch',
  description: 'Searches the web for information using Perplexity AI.',
  parameters: z.object({
    query: z.string().describe('The search query.')
  }),
  execute: async ({ query }) => {
    return await webSearch(query);
  }
});

// Define the agent
const agent = new Agent({
  name: 'Research Agent',
  instructions: `You are a research assistant. Your goal is to generate a comprehensive report based on an uploaded image.

Your workflow:
1. First, call the analyzeImage tool to understand the image content.
2. Based on what you see, call the webSearch tool to find relevant background information.
3. Compile your findings into a structured report.

You MUST output the final report as a valid JSON object with this exact structure:
{
  "title": "Report Title",
  "summary": "Executive summary of findings...",
  "sections": [
    { "heading": "Section Title", "content": "Detailed content..." }
  ],
  "references": [
    { "title": "Reference Title", "url": "http://example.com" }
  ]
}

Only output the JSON object, no other text.`,
  tools: [analyzeImageTool, webSearchTool]
});

export async function runAgent(imagePath: string): Promise<ReportSpec> {
  const result = await run(agent, `Please generate a report for the image located at: ${imagePath}`);
  
  // Parse the output as JSON
  const output = result.finalOutput || "";
  
  try {
    // Find the JSON block
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ReportSpec;
    }
    throw new Error("No JSON found in agent output");
  } catch (e) {
    console.error("Failed to parse agent output:", output);
    throw e;
  }
}
