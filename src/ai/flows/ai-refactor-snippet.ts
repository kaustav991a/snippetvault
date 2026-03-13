'use server';
/**
 * @fileOverview A Genkit flow for refactoring and optimizing HTML code snippets.
 *
 * - refactorSnippet - A function that suggests optimizations for an HTML snippet.
 * - RefactorSnippetInput - The input type for the refactorSnippet function.
 * - RefactorSnippetOutput - The return type for the refactorSnippet function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RefactorSnippetInputSchema = z.object({
  htmlCode: z.string().describe('The HTML code snippet to refactor.'),
});
export type RefactorSnippetInput = z.infer<typeof RefactorSnippetInputSchema>;

const RefactorSnippetOutputSchema = z.object({
  refactoredCode: z
    .string()
    .describe('The optimized and refactored version of the HTML code.'),
  changesMade: z
    .array(z.string())
    .describe('A list of specific improvements made to the code.'),
});
export type RefactorSnippetOutput = z.infer<typeof RefactorSnippetOutputSchema>;

export async function refactorSnippet(
  input: RefactorSnippetInput
): Promise<RefactorSnippetOutput> {
  return refactorSnippetFlow(input);
}

const refactorSnippetPrompt = ai.definePrompt({
  name: 'refactorSnippetPrompt',
  input: { schema: RefactorSnippetInputSchema },
  output: { schema: RefactorSnippetOutputSchema },
  prompt: `You are a senior frontend engineer specialized in clean, accessible, and performant HTML.

Refactor the following code block. It may contain a mix of HTML, CSS, and JavaScript.

CRITICAL INSTRUCTIONS:
1. If CSS is present without <style> tags, wrap it in <style> tags.
2. If JavaScript is present without <script> tags, wrap it in <script> tags.
3. Ensure the result is a valid, self-contained HTML component.
4. Improve accessibility (semantic tags, ARIA roles).
5. Clean up indentation and formatting.
6. Use modern best practices.

Input Code:
---
{{{htmlCode}}}
---

Provide the refactored code and a short list of changes made.`,
});

const refactorSnippetFlow = ai.defineFlow(
  {
    name: 'refactorSnippetFlow',
    inputSchema: RefactorSnippetInputSchema,
    outputSchema: RefactorSnippetOutputSchema,
  },
  async (input) => {
    const { output } = await refactorSnippetPrompt(input);
    return output!;
  }
);
