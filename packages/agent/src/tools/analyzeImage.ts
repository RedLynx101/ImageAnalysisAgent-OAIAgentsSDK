import fs from 'fs/promises';
import OpenAI from 'openai';
import { logger } from '@repo/shared';

const openai = new OpenAI();

export const analyzeImage = async (imagePath: string) => {
  logger.info(`Analyzing image: ${imagePath}`);
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this image in detail. Identify key objects, text, and context." },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });

    return response.choices[0].message.content || "No analysis produced.";
  } catch (error) {
    logger.error("Error analyzing image:", error);
    throw error;
  }
};

