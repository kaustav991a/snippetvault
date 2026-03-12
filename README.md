# HTML SnippetVault

A searchable repository for frequently used HTML code snippets, featuring AI-powered title suggestions, explanations, and refactoring.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **AI**: Genkit with Google Gemini
- **Database**: Firebase Firestore (Project: snippetvault-9a210)

## Deployment Guide: Firebase App Hosting (Recommended)

Since this app uses **Next.js Server Actions** for AI features, it requires a server-side environment. **Firebase App Hosting** is the easiest way to deploy it.

### Step 1: Push to GitHub
1. Create a new repository on [GitHub](https://github.com/new).
2. Initialize git in your local project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
3. Link your local repo to GitHub and push:
   ```bash
   git remote add origin <your-github-repo-url>
   git branch -M main
   git push -u origin main
   ```

### Step 2: Connect to Firebase
1. Go to the [Firebase Console](https://console.firebase.com/).
2. Select your project: **snippetvault-9a210**.
3. In the left sidebar, click on **App Hosting**.
4. Click **Get Started** and connect your GitHub account.
5. Select the repository you just pushed.
6. Follow the prompts to create the backend. Firebase will automatically detect Next.js and start the build.

### Step 3: Configure Environment Variables
1. Once the App Hosting backend is created, go to the **Settings** tab of your App Hosting backend in the Firebase console.
2. Add a new Environment Variable:
   - **Key**: `GOOGLE_GENAI_API_KEY`
   - **Value**: `AIzaSyBL3o4sajWXPSI82lEN-rkZF69zfrRJGGs` (or your preferred Gemini API key).
3. Trigger a new rollout to apply the changes.

---

## Why FTP/Static Hosting won't work for AI
This app uses "Server Actions" to communicate with the Gemini AI models. Traditional FTP hosting only serves static HTML/JS files and cannot run the server-side code needed for AI. If you deploy via FTP, the database will work, but the **Explain**, **Refactor**, and **Suggest Title** buttons will fail.

## Development
To run the app locally:
```bash
npm run dev
```
