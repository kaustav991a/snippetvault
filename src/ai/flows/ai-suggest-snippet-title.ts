'use server';
/**
 * @fileOverview A Genkit flow for suggesting a concise and descriptive title for an HTML code snippet.
 *
 * - suggestSnippetTitle - A function that suggests a title for an HTML snippet.
 * - SuggestSnippetTitleInput - The input type for the suggestSnippetTitle function.
 * - SuggestSnippetTitleOutput - The return type for the suggestSnippetTitle function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestSnippetTitleInputSchema = z.object({
  htmlCode: z.string().describe('The HTML code snippet for which to suggest a title.'),
});
export type SuggestSnippetTitleInput = z.infer<typeof SuggestSnippetTitleInputSchema>;

const SuggestSnippetTitleOutputSchema = z.object({
  title: z
    .string()
    .describe('A concise and descriptive title suggested for the HTML code snippet.'),
});
export type SuggestSnippetTitleOutput = z.infer<typeof SuggestSnippetTitleOutputSchema>;

export async function suggestSnippetTitle(
  input: SuggestSnippetTitleInput
): Promise<SuggestSnippetTitleOutput> {
  return suggestSnippetTitleFlow(input);
}

const suggestSnippetTitlePrompt = ai.definePrompt({
  name: 'suggestSnippetTitlePrompt',
  input: { schema: SuggestSnippetTitleInputSchema },
  output: { schema: SuggestSnippetTitleOutputSchema },
  prompt: `You are an expert at summarizing HTML code snippets into concise and descriptive titles.

Analyze the following HTML code snippet and provide a short, descriptive title (maximum 10 words) that accurately reflects its content and purpose.

HTML Code:
---
{{{htmlCode}}}
---

Suggested Title: `,
});

const suggestSnippetTitleFlow = ai.defineFlow(
  {
    name: 'suggestSnippetTitleFlow',
    inputSchema: SuggestSnippetTitleInputSchema,
    outputSchema: SuggestSnippetTitleOutputSchema,
  },
  async (input) => {
    const { output } = await suggestSnippetTitlePrompt(input);
    return output!;
  }
);
