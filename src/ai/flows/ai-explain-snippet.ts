'use server';
/**
 * @fileOverview A Genkit flow for explaining what an HTML code snippet does.
 *
 * - explainSnippet - A function that provides a natural language explanation of HTML code.
 * - ExplainSnippetInput - The input type for the explainSnippet function.
 * - ExplainSnippetOutput - The return type for the explainSnippet function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExplainSnippetInputSchema = z.object({
  htmlCode: z.string().describe('The HTML code snippet to explain.'),
});
export type ExplainSnippetInput = z.infer<typeof ExplainSnippetInputSchema>;

const ExplainSnippetOutputSchema = z.object({
  explanation: z
    .string()
    .describe('A clear, step-by-step explanation of the HTML snippet and its purpose.'),
});
export type ExplainSnippetOutput = z.infer<typeof ExplainSnippetOutputSchema>;

export async function explainSnippet(
  input: ExplainSnippetInput
): Promise<ExplainSnippetOutput> {
  return explainSnippetFlow(input);
}

const explainSnippetPrompt = ai.definePrompt({
  name: 'explainSnippetPrompt',
  input: { schema: ExplainSnippetInputSchema },
  output: { schema: ExplainSnippetOutputSchema },
  prompt: `You are an expert web developer and educator.

Analyze the following HTML code snippet and explain what it does in a clear, educational manner. Breakdown its main components, structural purpose, and any notable attributes.

HTML Code:
---
{{{htmlCode}}}
---

Explanation: `,
});

const explainSnippetFlow = ai.defineFlow(
  {
    name: 'explainSnippetFlow',
    inputSchema: ExplainSnippetInputSchema,
    outputSchema: ExplainSnippetOutputSchema,
  },
  async (input) => {
    const { output } = await explainSnippetPrompt(input);
    return output!;
  }
);
