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

## How to Generate and Download Static Files (for FTP)

If you need to host this app on a traditional web server using FTP:

### 1. Generate the Static Build
Run this command in your terminal:
```bash
npm run build
```
This creates a folder named `out` in the root directory. This folder contains all the static HTML, CSS, and JS files needed for your site.

### 2. Download the Files
1. Look at the **File Explorer** on the left side of your screen.
2. Locate the `out` folder (it will appear after the build finishes).
3. **Right-click** on the `out` folder.
4. Select **Download** from the context menu. This will download a zip file of your static site.

### 3. Upload to FTP
Upload the **contents** of the `out` folder to the root of your FTP server.

*Note: Since static exports do not have a server-side runtime, AI features (Explain, Refactor, Suggest Title) will only work when hosted on a platform that supports Next.js Server Actions (like Firebase App Hosting). The Firestore database features will work everywhere.*

## Production Deployment to Firebase (Recommended)

The most efficient way to host this app with all features (including AI) is through **Firebase App Hosting**.

1. **Push to GitHub**: Push this source code to a repository on GitHub.
2. **Setup App Hosting**: Go to the [Firebase Console](https://console.firebase.com/), select your project (**snippetvault-9a210**), and navigate to **App Hosting**.
3. **Connect Repository**: Connect your GitHub repository. Firebase will automatically build and deploy your app whenever you push changes.

## AI Features
- **AI Title Suggestion**: Uses Gemini to summarize code into a clean title.
- **AI Insights**: Generates a natural language breakdown of what the code does.
- **AI Refactor**: Optimizes snippets for accessibility and modern best practices.
