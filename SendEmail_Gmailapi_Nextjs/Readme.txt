##Step 1: Set Up Your Google Cloud Project
First, make sure your Google Cloud Console project is configured correctly.

OAuth Consent Screen:

Go to your Google Cloud project's OAuth consent screen.

Set the Publishing status to "Testing."

In the "Test users" section, click "Add users" and add your own Google email address. This is the account you'll use to authorize the app.

API Credentials:

Go to APIs & Services > Credentials.

Ensure you have a "Web application" OAuth 2.0 Client ID.

The Authorized redirect URI for this client must be https://developers.google.com/oauthplayground.

Copy your Client ID and Client secret.

Generate a New Refresh Token:

Go to the Google OAuth2 Playground.

Click the gear icon (⚙️) and enter your Client ID and Client Secret.

On the left, find and select the https://mail.google.com/ scope.

Click "Authorize APIs", sign in with your email (the one you added as a test user), and grant permission.

Click "Exchange authorization code for tokens" to get your new Refresh Token. Copy this value.

##Step 2: Configure Your Next.js Project
Now, set up your local project files with the correct credentials and code.

Create .env.

In the root of your project, create a file named .env


.env
GMAIL_CLIENT_ID=YOUR_CLIENT_ID
GMAIL_CLIENT_SECRET=YOUR_CLIENT_SECRET
GMAIL_REDIRECT_URI=https://developers.google.com/oauthplayground
GMAIL_REFRESH_TOKEN=YOUR_NEW_REFRESH_TOKEN
GMAIL_EMAIL=your_google_email@gmail.com


Create pages/api/send-email.js:
This is the API route that handles sending the email.


Create pages/index.js:
This is your front-end page with the form.



##Step 3: Run and Test Locally
Finally, run your application to send a test email.

Install Dependencies:

Open your terminal and run npm install to ensure all packages are installed.

Start the Server:

Run npm run dev in your terminal to start the development server.

Test:

Go to http://localhost:3000 in your browser.

Fill out the form and click "Send Email." If all steps were followed correctly, the email should be sent successfully.