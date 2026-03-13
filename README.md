
# HTML SnippetVault

A searchable repository for frequently used HTML code snippets, featuring AI-powered title suggestions, explanations, and refactoring.

## Security Note: API Keys
This project uses environment variables (`.env`) to store sensitive API keys. **Never** commit your real `.env` file to GitHub. A template is provided in the root directory.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **AI**: Genkit with Google Gemini
- **Database**: Firebase Firestore (Project: snippetvault-9a210)

## Deployment Guide: Firebase App Hosting (Recommended)

Since this app uses **Next.js Server Actions** for AI features, it requires a server-side environment. 

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

### Step 3: Configure Environment Variables (CRITICAL)
1. In the Firebase console, go to the **Settings** tab of your App Hosting backend.
2. Add a new Environment Variable:
   - **Key**: `GOOGLE_GENAI_API_KEY`
   - **Value**: [Your New Gemini API Key from Google AI Studio]
3. Trigger a new rollout to apply the changes.

## Development
To run the app locally, ensure your `.env` file contains a valid `GOOGLE_GENAI_API_KEY`:
```bash
npm run dev
```
