# How to Host Your Application on Firebase

Since you are already using Firebase for your database, **Firebase Hosting** is the best and easiest way to make your app public.

## Prerequisites
You need the Firebase CLI tool.
1. Run this command to install it globally:
   ```powershell
   npm install -g firebase-tools
   ```

## Step 1: Login to Firebase
1. Open your terminal in the project folder.
2. Run:
   ```powershell
   firebase login
   ```
   - This will open your browser. Log in with the same Google account you used for your Firestore database.

## Step 2: Initialize Hosting
1. Run:
   ```powershell
   firebase init hosting
   ```
2. **Select these options** when asked:
   - **Project**: Choose "Use an existing project" -> Select your `antigravity` (or similar name) project.
   - **Public directory**: Type `dist` (this is important! Vite builds to `dist`, not `public`).
   - **Configure as a single-page app**: Type `y` (Yes).
   - **Set up automatic builds and deploys with GitHub?**: Type `n` (No, for now).
   - **File dist/index.html already exists. Overwrite?**: Type `n` (No).

## Step 3: Build & Deploy
1. Build your application for production:
   ```powershell
   npm run build
   ```
2. Deploy it to the internet:
   ```powershell
   firebase deploy
   ```

## Result
Firebase will give you a **Hosting URL** (e.g., `https://your-project-id.web.app`). You can share this link with anyone to access your app!

---
> **Note**: Since you have authentication (Login), ensure your "Authorized Domains" in the Firebase Console (Authentication -> Settings -> Authorized Domains) includes this new `.web.app` domain. it usually adds it automatically, but good to check if login fails.
