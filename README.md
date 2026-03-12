# HTML SnippetVault

A searchable repository for frequently used HTML code snippets, featuring AI-powered title suggestions.

## Setup Instructions

1. **Get a Gemini API Key**:
   - Go to [Google AI Studio](https://aistudio.google.com/).
   - Click on "Get API key".
   - Create a new API key in a new project or an existing one.

2. **Configure Environment Variables**:
   - Open the `.env` file in the root directory.
   - Replace `your_api_key_here` with your actual API key:
     ```
     GOOGLE_GENAI_API_KEY=AIzaSy...
     ```

3. **Run the App**:
   - The app will automatically pick up the key from the `.env` file.
   - You can now use the "AI Suggest" button when adding new snippets!

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **AI**: Genkit with Google Gemini
- **Storage**: LocalStorage (MVP version)
