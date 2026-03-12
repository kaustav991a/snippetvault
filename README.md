# HTML SnippetVault

A searchable repository for frequently used HTML code snippets, featuring AI-powered title suggestions, explanations, and refactoring.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **AI**: Genkit with Google Gemini
- **Database**: Firebase Firestore (Project: snippetvault-9a210)

## Getting Started

### 1. Configure Environment Variables
- Open the `.env` file in the root directory.
- Ensure your Google Gemini API key is set:
  ```
  GOOGLE_GENAI_API_KEY=your_api_key_here
  ```

### 2. Run in Development
```bash
npm run dev
```

## Deployment

### Why Static Export (FTP) is not recommended
This application uses **Next.js Server Actions** for its AI features (Explain, Refactor, Suggest Title). Standard FTP hosting (static files) does not support these server-side features. While the database will work, the AI tools will fail.

### Recommended: Firebase App Hosting
The most efficient way to host this app with all features is through **Firebase App Hosting**, which fully supports Next.js 15 and Server Actions.

1. **Push to GitHub**: Push this source code to a repository on GitHub.
2. **Setup App Hosting**: Go to the [Firebase Console](https://console.firebase.com/), select your project (**snippetvault-9a210**), and navigate to **App Hosting**.
3. **Connect Repository**: Connect your GitHub repository. Firebase will automatically build and deploy your app whenever you push changes.

## AI Features
- **AI Title Suggestion**: Uses Gemini to summarize code into a clean title.
- **AI Insights**: Generates a natural language breakdown of what the code does.
- **AI Refactor**: Optimizes snippets for accessibility and modern best practices.
