import { useState } from 'react';

export default function HomePage() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        html: `<p>${message}</p>`,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      setStatus('Email sent successfully!');
      console.log('Success:', data);
    } else {
      setStatus(`Failed to send email: ${data.message}`);
      console.error('Error:', data);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Send Email with Gmail API</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
        <label>
          To:
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>
        <label>
          Subject:
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>
        <label>
          Message:
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows="5"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>
        <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>
          Send Email
        </button>
      </form>
      {status && <p style={{ marginTop: '20px' }}>{status}</p>}
    </div>
  );
}