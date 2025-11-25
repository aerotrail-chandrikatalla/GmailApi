import { useState, useEffect } from 'react';

const EMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly"
];

// Reusable hook to communicate with the service worker
const useChromeIdentity = () => {
    const [authToken, setAuthToken] = useState(null);
    const [authStatus, setAuthStatus] = useState('Loading...');

    useEffect(() => {
        // Check for existing token silently on load
        chrome.runtime.sendMessage({ action: "checkAuth" }, (response) => {
            if (response && response.success) {
                setAuthToken(response.token);
                setAuthStatus('Authorized');
            } else {
                setAuthStatus('Sign In Required');
            }
        });
    }, []);

    const signIn = () => {
        setAuthStatus('Authorizing...');
     
        chrome.runtime.sendMessage({ action: "getAuthToken" }, (response) => {
            if (response && response.success) {
                setAuthToken(response.token);
                setAuthStatus('Authorized');
            } else {
                setAuthStatus(`Authorization Failed: ${response.error}`);
            }
        });
    };

    const signOut = () => {
        if (authToken) {
            setAuthStatus('Signing Out...');
            chrome.runtime.sendMessage({ action: "signOut", token: authToken }, (response) => {
                if (response && response.success) {
                    setAuthToken(null);
                    setAuthStatus('Signed Out');
                } else {
                    setAuthStatus(`Sign Out Failed: ${response.error}`);
                }
            });
        }
    };

    return { authToken, authStatus, signIn, signOut, setAuthStatus };
};

// Component for sending emails via the background script
const EmailSender = ({ authToken, setAuthStatus }) => {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [messageBody, setMessageBody] = useState('');
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!authToken) {
            setStatus('Error: You must be signed in to send an email.');
            return;
        }
        
        setStatus('Sending...');

        if (!to || !subject || !messageBody) {
            setStatus('Error: All fields are required.');
            return;
        }

        try {
            // Send the email data and the token to the background script
            chrome.runtime.sendMessage({ 
                action: "sendEmail",
                token: authToken,
                emailData: { to, subject, messageBody }
            }, (response) => {
                if (response && response.success) {
                    setStatus('Email sent successfully!');
                    setTo('');
                    setSubject('');
                    setMessageBody('');
                } else {
                    setStatus(`Failed to send email: ${response.error || 'Unknown error.'}`);
                }
            });
        } catch (error) {
            console.error("Messaging error:", error);
            setStatus('Failed to send email. Check browser console.');
        }
    };

    return (
        <div className="email-sender-container">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '15px' }}>Send Email</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                    type="email" 
                    value={to} 
                    onChange={(e) => setTo(e.target.value)} 
                    placeholder="To Email Address" 
                    required 
                    style={inputStyle}
                />
                {/* ... other form fields (subject, messageBody) remain the same ... */}
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" required style={inputStyle} />
                <textarea value={messageBody} onChange={(e) => setMessageBody(e.target.value)} placeholder="Message Body" required rows="5" style={{ ...inputStyle, resize: 'vertical' }}></textarea>
                
                <button type="submit" style={buttonStyle} disabled={!authToken}>
                    {authToken ? 'Send Email' : 'Authorize to Send'}
                </button>
            </form>
            {status && <p style={{ marginTop: '10px', color: status.includes('successfully') ? 'green' : 'red' }}>{status}</p>}
        </div>
    );
};

export default function HomePage() {
    const { authToken, authStatus, signIn, signOut, setAuthStatus } = useChromeIdentity();
    const [content, setContent] = useState('');

    const listMessages = () => {
        if (!authToken) {
            setContent("Authorization required to list messages.");
            return;
        }

        setContent("Loading messages...");
        chrome.runtime.sendMessage({ 
            action: "getEmails", 
            token: authToken 
        }, (response) => {
            if (response && response.success) {
                const emails = response.emails;
                if (!emails || emails.length === 0) {
                    setContent("No messages found in Inbox.");
                    return;
                }

                let output = "Latest Emails:\n\n";
                for (let email of emails) {
                    output += `From: ${email.from}\nSubject: ${email.subject}\nSnippet: ${email.snippet}\n---\n`;
                }
                setContent(output);
            } else {
                setContent(`Error listing messages: ${response.error}`);
            }
        });
    };

    return (
        <div style={pageStyle}>
            {/* Removed Head and Next.js specific elements (Next.js is not typically used for a simple Chrome extension popup) */}
            <div style={containerStyle}>
                <h1 style={headerStyle}>Gmail API Extension</h1>
                
                <div style={buttonContainerStyle}>
                    <p style={{marginBottom: '10px'}}>Status: <b>{authStatus}</b></p>
                    {authToken ? (
                        <>
                            <button onClick={listMessages} style={{...buttonStyle, marginRight: '10px'}}>List Mail</button>
                            <button onClick={signOut} style={buttonStyle}>Sign Out</button>
                        </>
                    ) : (
                        <button onClick={signIn} style={buttonStyle}>Authorize Gmail Access</button>
                    )}
                </div>

                <pre id="content" style={contentStyle}>{content}</pre>

                <EmailSender authToken={authToken} setAuthStatus={setAuthStatus} />
            </div>
        </div>
    );
}


const pageStyle = {
    fontFamily: 'Inter, sans-serif',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
};

const containerStyle = {
    maxWidth: '800px',
    width: '100%',
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
};

const headerStyle = {
    fontSize: '2rem',
    color: '#1a73e8',
    marginBottom: '10px',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '10px'
};

const buttonStyle = {
    padding: '10px 20px',
    fontSize: '16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#4285f4',
    color: 'white',
    transition: 'background-color 0.3s',
};

const buttonContainerStyle = {
    marginBottom: '20px',
};

const inputStyle = {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
};

const contentStyle = {
    whiteSpace: 'pre-wrap', 
    marginTop: '20px', 
    padding: '15px', 
    backgroundColor: '#e9ecef', 
    border: '1px solid #ced4da', 
    borderRadius: '4px',
    maxHeight: '400px',
    overflowY: 'auto',
    color: '#343a40',
};