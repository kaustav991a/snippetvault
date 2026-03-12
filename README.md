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
  GOOGLE_GENAI_API_KEY=AIzaSyCZJSy_IT0xuLxBA1ohwD18wY8bkkLrQnQ
  ```

### 2. Run in Development
```bash
npm run dev
```

## Production Build & Deployment

To prepare the app for a production environment:

### Build the Application
Run the following command in your terminal to create an optimized production build:
```bash
npm run build
```
This will compile the application and output the results to the `.next` directory.

### Deployment to Firebase
The most efficient way to host this Next.js application is through **Firebase App Hosting**.

1. **Push to GitHub**: Push this source code to a repository on GitHub.
2. **Setup App Hosting**: Go to the [Firebase Console](https://console.firebase.google.com/), select your project (**snippetvault-9a210**), and navigate to **App Hosting**.
3. **Connect Repository**: Connect your GitHub repository. Firebase will use the `apphosting.yaml` configuration to automatically build and deploy your app whenever you push changes.

### Local Production Preview
To test the production build locally before deploying:
```bash
npm run build
npm start
```

## AI Features
- **AI Title Suggestion**: Uses Gemini to summarize code into a clean title.
- **AI Insights**: Generates a natural language breakdown of what the code does.
- **AI Refactor**: Optimizes snippets for accessibility and modern best practices.
