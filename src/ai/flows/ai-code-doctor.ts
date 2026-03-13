
'use server';
/**
 * @fileOverview A Genkit flow for diagnosing issues in code snippets.
 *
 * - diagnoseCode - A function that analyzes code for accessibility, performance, and best practices.
 * - DiagnoseCodeInput - The input type for the diagnoseCode function.
 * - DiagnoseCodeOutput - The return type for the diagnoseCode function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DiagnoseCodeInputSchema = z.object({
  files: z.array(z.object({
    name: z.string(),
    content: z.string(),
  })).describe('The files belonging to the code snippet to diagnose.'),
});
export type DiagnoseCodeInput = z.infer<typeof DiagnoseCodeInputSchema>;

const DiagnoseCodeOutputSchema = z.object({
  analysis: z.object({
    accessibility: z.string().describe('Analysis of accessibility issues.'),
    performance: z.string().describe('Analysis of performance considerations.'),
    bestPractices: z.string().describe('Analysis of general coding best practices.'),
    score: z.number().min(0).max(100).describe('An overall health score for the code snippet.'),
  }),
  recommendations: z.array(z.string()).describe('A list of actionable recommendations.'),
});
export type DiagnoseCodeOutput = z.infer<typeof DiagnoseCodeOutputSchema>;

export async function diagnoseCode(
  input: DiagnoseCodeInput
): Promise<DiagnoseCodeOutput> {
  return diagnoseCodeFlow(input);
}

const codeDoctorPrompt = ai.definePrompt({
  name: 'codeDoctorPrompt',
  input: { schema: DiagnoseCodeInputSchema },
  output: { schema: DiagnoseCodeOutputSchema },
  prompt: `You are a specialized "Code Doctor" AI. Your goal is to analyze code snippets for Accessibility (A11y), Performance, and Best Practices.

Analyze the following files:

{{#each files}}
File: {{{this.name}}}
---
{{{this.content}}}
---
{{/each}}

Provide a detailed analysis in the requested JSON format. Be critical but constructive.
Highlight specific ARIA roles, semantic HTML improvements, or potential rendering bottlenecks.`,
});

const diagnoseCodeFlow = ai.defineFlow(
  {
    name: 'diagnoseCodeFlow',
    inputSchema: DiagnoseCodeInputSchema,
    outputSchema: DiagnoseCodeOutputSchema,
  },
  async (input) => {
    const { output } = await codeDoctorPrompt(input);
    return output!;
  }
);
