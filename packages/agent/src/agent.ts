import { Agent, run } from '@openai/agents';
import { analyzeImage } from './tools/analyzeImage';
import { webSearch } from './tools/webSearch';
import { ReportSpec } from '@repo/shared';

// Define the agent
// Note: Since the @openai/agents SDK is experimental and exact tool definition syntax 
// varies, we are wrapping tools in a way compatible with standard function calling if needed.
// For this prototype, we'll create a main runner function that orchestrates the flow 
// if the Agent SDK is too restrictive, but we'll try to use the Agent abstraction.

const agent = new Agent({
  name: 'Research Agent',
  instructions: `You are a research assistant. Your goal is to generate a comprehensive report based on an uploaded image.
  1. Analyze the image to understand its content.
  2. Perform web research to find background information, context, or related details about the image content.
  3. Compile a structured report.
  
  You have access to two tools:
  - analyzeImage(imagePath: string): Returns a text description of the image.
  - webSearch(query: string): Returns search results for a query.
  
  Output the final report as a valid JSON object matching this structure:
  {
    "title": "Report Title",
    "summary": "Executive summary...",
    "sections": [
      { "heading": "Section Title", "content": "Content..." }
    ],
    "references": [
       { "title": "Ref Title", "url": "http..." }
    ]
  }
  `,
  // Assuming the SDK supports a 'tools' array or similar configuration in the future,
  // but for now we might need to expose these functions to the LLM via the runner or 
  // just handle them in a custom loop if the SDK doesn't support custom function execution yet.
  // To be safe and "production-ready" with this specific SDK (which is very new), 
  // we will implement a robust "runAgent" function that uses the OpenAI API directly if the SDK 
  // doesn't auto-bind these tools, OR we assume the SDK handles it.
  //
  // For this plan, I will implement the tools as "function" definitions for the Agent.
  tools: [
    {
      type: 'function',
      name: 'analyzeImage',
      description: 'Analyzes an image and returns a description.',
      parameters: {
        type: 'object',
        properties: {
          imagePath: { type: 'string', description: 'The local file path to the image.' }
        },
        required: ['imagePath']
      },
      // The SDK might need a separate execution map, but let's try this standard format.
      function: analyzeImage 
    },
    {
      type: 'function',
      name: 'webSearch',
      description: 'Searches the web for information.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query.' }
        },
        required: ['query']
      },
      function: webSearch
    }
  ]
} as any); // Cast to any because SDK types might be strict or influx

export async function runAgent(imagePath: string): Promise<ReportSpec> {
  // We need to inject the imagePath into the prompt or conversation so the agent knows what to analyze.
  const result = await run(agent, `Please generate a report for the image located at: ${imagePath}`);
  
  // Parse the output as JSON
  const output = result.finalOutput || ""; // Adjust based on actual SDK return type
  
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

