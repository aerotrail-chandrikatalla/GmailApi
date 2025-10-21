import { useState, useEffect } from 'react';
import Head from 'next/head';

// ✨ This is a separate component for sending emails via your backend
const EmailSender = () => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html: `<p>${messageBody}</p>` }),
      });

      const data = await response.json();
      if (response.ok) {
        setStatus('Email sent successfully!');
      } else {
        setStatus(`Failed to send email: ${data.message}`);
      }
    } catch (error) {
      setStatus('Failed to send email. Check console.');
    }
  };

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
      <h2>Send Email via Extension</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="To" required style={{ width: '100%', marginBottom: '10px' }} />
        <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" required style={{ width: '100%', marginBottom: '10px' }} />
        <textarea value={messageBody} onChange={(e) => setMessageBody(e.target.value)} placeholder="Message Body" required rows="5" style={{ width: '100%', marginBottom: '10px' }}></textarea>
        <button type="submit">Send Email</button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
};

// --------------------------------------------------------------------------
// ✨ Main Page Component for viewing emails
// --------------------------------------------------------------------------

export default function HomePage() {
  const [content, setContent] = useState('');
  const [authButtonVisible, setAuthButtonVisible] = useState(false);
  const [signOutButtonVisible, setSignOutButtonVisible] = useState(false);

  // ✨ Replace with your own credentials
  const CLIENT_ID = "75917002237-m87tjgt4ske5r2k06raba8u7vucm5ljg.apps.googleusercontent.com"; // Use your Web application Client ID
  const API_KEY = "AIzaSyA9QFYzEiVLIV4uYCicuqfX-szJDWnHfwk"; // Use your API Key

  const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest";
  const SCOPES = "https://mail.google.com/"; // Use the broader scope for sending and viewing

  let tokenClient;
  let gapiInited = false;
  let gisInited = false;

  const gapiLoaded = () => {
    window.gapi.load("client", initializeGapiClient);
  };

  const initializeGapiClient = async () => {
    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
  };

  const gisLoaded = () => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: "",
    });
    gisInited = true;
    maybeEnableButtons();
  };

  const maybeEnableButtons = () => {
    if (gapiInited && gisInited) {
      setAuthButtonVisible(true);
    }
  };

  const handleAuthClick = () => {
    tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        throw resp;
      }
      setSignOutButtonVisible(true);
      setAuthButtonVisible(false);
      await listMessages();
    };

    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      tokenClient.requestAccessToken({ prompt: "" });
    }
  };

  const handleSignoutClick = () => {
    const token = window.gapi.client.getToken();
    if (token !== null) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken("");
      setContent("");
      setAuthButtonVisible(true);
      setSignOutButtonVisible(false);
    }
  };

  const listMessages = async () => {
    try {
      let response = await window.gapi.client.gmail.users.messages.list({
        userId: "me",
        maxResults: 10,
      });

      const messages = response.result.messages;
      if (!messages || messages.length === 0) {
        setContent("No messages found.");
        return;
      }

      let output = "Latest 10 Emails:\n\n";
      for (let msg of messages) {
        let message = await window.gapi.client.gmail.users.messages.get({
          userId: "me",
          id: msg.id,
        });

        let headers = message.result.payload.headers;
        let from = headers.find((h) => h.name === "From")?.value || "Unknown";
        let subject = headers.find((h) => h.name === "Subject")?.value || "No subject";
        let snippet = message.result.snippet;

        output += `From: ${from}\nSubject: ${subject}\nSnippet: ${snippet}\n\n`;
      }
      setContent(output);
    } catch (err) {
      setContent("Error: " + err.message);
    }
  };

  useEffect(() => {
    // These script tags are a common way to load the Google APIs in a React component
    const gapiScript = document.createElement("script");
    gapiScript.src = "https://apis.google.com/js/api.js";
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = gapiLoaded;
    document.head.appendChild(gapiScript);

    const gisScript = document.createElement("script");
    gisScript.src = "https://accounts.google.com/gsi/client";
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = gisLoaded;
    document.head.appendChild(gisScript);

    return () => {
      document.head.removeChild(gapiScript);
      document.head.removeChild(gisScript);
    };
  }, []);

  return (
    <div>
      <Head>
        <title>Gmail API Quickstart</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ padding: '20px' }}>
        <h1>Gmail API Quickstart</h1>
        <p>This app can both send and view emails.</p>

        {authButtonVisible && <button onClick={handleAuthClick}>Authorize</button>}
        {signOutButtonVisible && <button onClick={handleSignoutClick}>Sign Out</button>}

        <pre id="content" style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>{content}</pre>

        <EmailSender />
      </div>
    </div>
  );
}