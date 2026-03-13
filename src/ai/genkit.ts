
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Genkit will automatically look for GOOGLE_GENAI_API_KEY in the environment
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    })
  ],
  model: 'googleai/gemini-2.5-flash',
});
