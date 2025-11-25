// popup.js (Place inside extensions/popup/)

document.addEventListener('DOMContentLoaded', () => {
    // Get all necessary DOM elements
    const authButton = document.getElementById('authorize_button');
    const mainAppSection = document.getElementById('main-app-section');
    const authSection = document.getElementById('auth-section');
    const statusMessage = document.getElementById('status-message');
    const emailListDiv = document.getElementById('email-list');
    const viewEmailsButton = document.getElementById('viewEmailsButton');
    const signOutButton = document.getElementById('signOutButton');
    const emailForm = document.getElementById('emailForm');

    let authToken = null;

    // Function to update UI visibility
    function updateUI(isSignedIn) {
        if (isSignedIn) {
            authSection.classList.add('hidden');
            mainAppSection.classList.remove('hidden');
            emailListDiv.innerHTML = ''; // Clear email list on sign in/out
            statusMessage.style.color = 'green';
        } else {
            authSection.classList.remove('hidden');
            mainAppSection.classList.add('hidden');
            emailListDiv.innerHTML = '';
            statusMessage.style.color = '#dc3545';
        }
    }

    // Helper to send message to background with a timeout (Robustness for MV3)
    async function sendMessageToBackground(message, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Timeout: Background service worker not responding'));
            }, timeout);

            chrome.runtime.sendMessage(message, (response) => {
                clearTimeout(timer);
                
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    }

    // Check initial auth status on load
    checkAuthStatus();

    async function checkAuthStatus() {
        try {
            statusMessage.textContent = 'Checking authorization...';
            const response = await sendMessageToBackground({ action: "checkAuth" });
            
            if (response.success && response.token) {
                authToken = response.token;
                updateUI(true);
                statusMessage.textContent = 'Already authorized!';
            } else {
                updateUI(false);
                statusMessage.textContent = 'Please click Authorize to continue.';
            }
        } catch (error) {
            console.error('Auth check error:', error);
            updateUI(false);
            statusMessage.textContent = 'Extension loading... Please click Authorize.';
        }
    }

    // --- Event Handlers ---

    // Handle authorization button
    authButton.addEventListener('click', async () => {
        try {
            statusMessage.textContent = 'Requesting authorization... (Check the popup window)';
            statusMessage.style.color = 'black';
            
            const response = await sendMessageToBackground({ action: "getAuthToken" });
            
            if (response.success && response.token) {
                authToken = response.token;
                updateUI(true);
                statusMessage.textContent = 'Authorization successful!';
                statusMessage.style.color = 'green';
            } else {
                // This handles failure if the user closes the popup or denies access
                statusMessage.textContent = 'Authorization failed: ' + (response.error || 'User denied access.');
                statusMessage.style.color = '#dc3545';
            }
        } catch (error) {
            console.error('Authorization error:', error);
            statusMessage.textContent = 'Authorization error: ' + error.message;
            statusMessage.style.color = '#dc3545';
        }
    });

    // Send email form
    emailForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        if (!authToken) {
            statusMessage.textContent = 'Please authorize first!';
            statusMessage.style.color = '#dc3545';
            return;
        }

        statusMessage.textContent = 'Sending email...';
        statusMessage.style.color = 'black';

        const to = document.getElementById('emailTo').value;
        const subject = document.getElementById('subject').value;
        const messageBody = document.getElementById('messageBody').value;

        try {
            const response = await sendMessageToBackground({
                action: "sendEmail",
                emailData: { to, subject, messageBody },
                token: authToken
            });

            if (response.success) {
                statusMessage.textContent = '✅ Email sent successfully!';
                statusMessage.style.color = 'green';
                emailForm.reset();
            } else {
                statusMessage.textContent = '❌ Failed to send email: ' + response.error;
                statusMessage.style.color = '#dc3545';
                
                if (response.error.includes('401') || response.error.includes('authentication')) {
                    authToken = null;
                    updateUI(false);
                }
            }
        } catch (error) {
            console.error('Send email error:', error);
            statusMessage.textContent = '❌ Error sending email: ' + error.message;
            statusMessage.style.color = '#dc3545';
        }
    });

    // View emails button
    viewEmailsButton.addEventListener('click', async () => {
        if (!authToken) {
            statusMessage.textContent = 'Please authorize first!';
            statusMessage.style.color = '#dc3545';
            return;
        }

        statusMessage.textContent = 'Fetching emails...';
        statusMessage.style.color = 'black';
        emailListDiv.innerHTML = 'Fetching...';

        try {
            const response = await sendMessageToBackground({
                action: "getEmails",
                token: authToken
            });

            if (response.success) {
                const emails = response.emails;
                
                if (emails.length === 0) {
                    emailListDiv.innerHTML = '<p>No emails found in inbox.</p>';
                } else {
                    emailListDiv.innerHTML = ''; // Clear 'Fetching...'
                    emails.forEach((email) => {
                        const emailItem = document.createElement('div');
                        emailItem.classList.add('email-item');
                        emailItem.innerHTML = `
                            <h4>From: ${email.from}</h4>
                            <p><strong>Subject:</strong> ${email.subject}</p>
                            <p>${email.snippet}</p>
                            ${email.date ? `<small>Date: ${email.date}</small>` : ''}
                        `;
                        emailListDiv.appendChild(emailItem);
                    });
                }
                
                statusMessage.textContent = `✅ ${emails.length} emails fetched successfully!`;
                statusMessage.style.color = 'green';
            } else {
                statusMessage.textContent = '❌ Failed to fetch emails: ' + response.error;
                statusMessage.style.color = '#dc3545';
                
                if (response.error.includes('401') || response.error.includes('authentication')) {
                    authToken = null;
                    updateUI(false);
                }
            }
        } catch (error) {
            console.error('Get emails error:', error);
            statusMessage.textContent = '❌ Error fetching emails: ' + error.message;
            statusMessage.style.color = '#dc3545';
        }
    });

    // Sign out button
    if (signOutButton) {
        signOutButton.addEventListener('click', async () => {
            statusMessage.textContent = 'Signing out...';
            statusMessage.style.color = 'black';
            try {
                if (authToken) {
                    await sendMessageToBackground({
                        action: "signOut",
                        token: authToken
                    });
                }
            } catch (error) {
                console.error('Sign out error:', error);
            } finally {
                authToken = null;
                updateUI(false);
                statusMessage.textContent = 'Signed out successfully.';
                statusMessage.style.color = 'green';
            }
        });
    }
});