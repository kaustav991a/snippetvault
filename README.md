# HTML SnippetVault

A searchable repository for frequently used HTML code snippets, featuring AI-powered title suggestions.

## AI Setup & Troubleshooting

To use the AI features, you need a Google Gemini API key.

### 1. Get a Gemini API Key
- Go to [Google AI Studio](https://aistudio.google.com/).
- Click on **"Get API key"**.
- Create a new API key in a new project.

### 2. Common Errors in AI Studio
If you see an error like "Error creating project" or "API key not available":
- **Region Availability**: Ensure you are in a [supported region](https://ai.google.dev/gemini-api/docs/available-regions) for the Gemini API.
- **Account Type**: Use a personal Google account. Workspace accounts (school/work) often have AI features disabled by administrators.
- **Project Limits**: If you have many old Google Cloud projects, try using an existing project instead of creating a new one in AI Studio.
- **Terms of Service**: Ensure you've accepted the latest Google Cloud and AI Studio Terms of Service.

### 3. Configure Environment Variables
- Open the `.env` file in the root directory.
- Add your key:
  ```
  GOOGLE_GENAI_API_KEY=your_actual_api_key_here
  ```

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **AI**: Genkit with Google Gemini
- **Storage**: LocalStorage (MVP version)
