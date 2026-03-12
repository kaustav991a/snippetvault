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

## How to Generate and Download Build Files

If you need the compiled "production" version of the app to host elsewhere or inspect:

### 1. Generate the Build
Run this command in your terminal:
```bash
npm run build
```
This creates a `.next` directory containing the optimized production application.

### 2. Download Files
1. Look at the **File Explorer** on the left side of your screen.
2. Locate the folder or file you want (e.g., the `.next` folder or the `public` folder).
3. **Right-click** on the file/folder.
4. Select **Download** from the context menu. 

*Note: If you are looking for a static HTML export, you would need to add `output: 'export'` to your `next.config.ts` and run the build again, which would create an `out` folder.*

## Production Deployment to Firebase

The most efficient way to host this app is through **Firebase App Hosting**.

1. **Push to GitHub**: Push this source code to a repository on GitHub.
2. **Setup App Hosting**: Go to the [Firebase Console](https://console.firebase.com/), select your project (**snippetvault-9a210**), and navigate to **App Hosting**.
3. **Connect Repository**: Connect your GitHub repository. Firebase will automatically build and deploy your app whenever you push changes.

## AI Features
- **AI Title Suggestion**: Uses Gemini to summarize code into a clean title.
- **AI Insights**: Generates a natural language breakdown of what the code does.
- **AI Refactor**: Optimizes snippets for accessibility and modern best practices.
