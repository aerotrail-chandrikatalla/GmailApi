// background.js

// Keep service worker alive
let keepAlive = () => {
  console.log("Background service worker keeping alive");
};

// Set up periodic keep-alive
setInterval(keepAlive, 20000);

chrome.runtime.onInstalled.addListener(() => {
  console.log("Gmail Extension installed and background worker active");
});

// Get OAuth2 token using Chrome Identity API
function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (!token) {
        reject(new Error('No token found - user needs to authorize'));
      } else {
        resolve(token);
      }
    });
  });
}

// Get OAuth2 token with interactive auth (popup)
function getAuthTokenInteractive() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (!token) {
        reject(new Error('Failed to get authentication token'));
      } else {
        resolve(token);
      }
    });
  });
}

// Remove cached token (logout)
function removeCachedAuthToken(token) {
  return new Promise((resolve) => {
    if (token) {
      chrome.identity.removeCachedAuthToken({ token }, () => {
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Send email using Gmail API
async function sendEmail(emailData, token) {
  const { to, subject, messageBody } = emailData;
  
  // Format email according to RFC 5322
  const emailContent = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    messageBody
  ].join('\r\n');
  
  // Base64 encode the email
  const base64EncodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64EncodedEmail
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gmail API error: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

// Get emails using Gmail API
async function getEmails(token) {
  // First, get the list of messages
  const listResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  
  if (!listResponse.ok) {
    const errorText = await listResponse.text();
    throw new Error(`Gmail API error: ${listResponse.status} - ${errorText}`);
  }
  
  const data = await listResponse.json();
  
  // If no messages, return empty array
  if (!data.messages || data.messages.length === 0) {
    return [];
  }
  
  // Get details for each message
  const emails = [];
  for (const message of data.messages) {
    try {
      const messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (messageResponse.ok) {
        const messageData = await messageResponse.json();
        const headers = messageData.payload.headers || [];
        
        emails.push({
          from: headers.find(h => h.name === 'From')?.value || 'Unknown',
          subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
          snippet: messageData.snippet || '',
          date: headers.find(h => h.name === 'Date')?.value || ''
        });
      }
    } catch (error) {
      console.error('Error fetching message details:', error);
      // Continue with other messages even if one fails
    }
  }
  
  return emails;
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.action);
  
  if (request.action === "checkAuth") {
    // Just check if we have a token without prompting
    getAuthToken()
      .then(token => {
        console.log('Token found');
        sendResponse({ success: true, token });
      })
      .catch(error => {
        console.log('No token found:', error.message);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (request.action === "getAuthToken") {
    // Get token with interactive auth
    getAuthTokenInteractive()
      .then(token => {
        console.log('Token received successfully');
        sendResponse({ success: true, token });
      })
      .catch(error => {
        console.error('Token error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (request.action === "sendEmail") {
    if (!request.token) {
      sendResponse({ success: false, error: 'No authentication token provided' });
      return true;
    }
    
    sendEmail(request.emailData, request.token)
      .then(result => {
        console.log('Email sent successfully');
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Send email error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (request.action === "getEmails") {
    if (!request.token) {
      sendResponse({ success: false, error: 'No authentication token provided' });
      return true;
    }
    
    getEmails(request.token)
      .then(emails => {
        console.log('Emails fetched successfully:', emails.length);
        sendResponse({ success: true, emails });
      })
      .catch(error => {
        console.error('Get emails error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (request.action === "signOut") {
    removeCachedAuthToken(request.token)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});


console.log("Gmail Extension background worker started");