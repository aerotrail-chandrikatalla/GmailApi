# Gmail API Quickstart – Latest 10 Emails

This project demonstrates how to connect to the Gmail API using **HTML + JavaScript** and retrieve the **latest 10 messages** from the authenticated user’s inbox.

---

## 🚀 Features
- Google OAuth2 authentication (using Google Identity Services).
- Reads Gmail inbox with **readonly** access.
- Displays **From, Subject, and Snippet** of the latest 10 messages.
- Works with `localhost` or deployed on GitHub Pages (with proper OAuth redirect URIs).

---

## 📋 Prerequisites
Before running the project, make sure you have:

1. **Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project (or use an existing one).
   - Enable **Gmail API**.
   - Create **OAuth 2.0 Client ID (Web application)**.
   - Add your local URL (`http://localhost:5500`) as an **Authorized Redirect URI**.
   - Create an **API Key**.

2. **Replace placeholders** in `index.html`:
   ```js
   const CLIENT_ID = "YOUR_CLIENT_ID_HERE";
   const API_KEY = "YOUR_API_KEY_HERE";

##Commands that should be executed in terminal
npm init -y
npm install googleapis
npm install http-server
npx http-server -p 8000


#project folder
gmail-api-app/
├── credentials.json
├── index.js
└── package.json
