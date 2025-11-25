// background.js

// Keep service worker alive (Necessary for older versions of Manifest V3, good practice)
let keepAlive = () => {
  console.log("Background service worker keeping alive");
};
setInterval(keepAlive, 20000);

chrome.runtime.onInstalled.addListener(() => {
  console.log("Gmail Extension installed and background worker active");
});

// Get OAuth2 token non-interactively (for checkAuth)
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

// Get OAuth2 token interactively (for getAuthToken)
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
  const listResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&labelIds=INBOX', {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  
  if (!listResponse.ok) {
    const errorText = await listResponse.text();
    throw new Error(`Gmail API error: ${listResponse.status} - ${errorText}`);
  }
  
  const data = await listResponse.json();
  
  if (!data.messages || data.messages.length === 0) {
    return [];
  }
  
  const emails = [];
  for (const message of data.messages) {
    try {
      const messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, {
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
    }
  }
  
  return emails;
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.action);
  
  if (request.action === "checkAuth") {
    getAuthToken()
      .then(token => sendResponse({ success: true, token }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === "getAuthToken") {
    getAuthTokenInteractive()
      .then(token => sendResponse({ success: true, token }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === "sendEmail") {
    if (!request.token) {
      sendResponse({ success: false, error: 'No authentication token provided' });
      return true;
    }
    
    sendEmail(request.emailData, request.token)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === "getEmails") {
    if (!request.token) {
      sendResponse({ success: false, error: 'No authentication token provided' });
      return true;
    }
    
    getEmails(request.token)
      .then(emails => sendResponse({ success: true, emails }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === "signOut") {
    removeCachedAuthToken(request.token)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

console.log("Gmail Extension background worker started");