import React, { useState } from 'react';

// Email service functions
const EmailService = {
  async sendInvitation(invitationData) {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/email/send-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invitationData)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to send invitation:', error);
      return { success: false, message: 'Failed to send invitation' };
    }
  },

  async sendNotification(notificationData) {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/email/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to send notification:', error);
      return { success: false, message: 'Failed to send notification' };
    }
  }
};

// Email notification component
function EmailNotification({ projectName, onClose }) {
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    setStatus('sending');

    const emailList = recipients.split(',').map(email => email.trim()).filter(email => email);
    
    const results = await Promise.all(
      emailList.map(email => 
        EmailService.sendNotification({
          to_email: email,
          subject: `${subject} - ${projectName}`,
          message: message
        })
      )
    );

    const successCount = results.filter(r => r.success).length;
    
    if (successCount === emailList.length) {
      setStatus('success');
      setTimeout(onClose, 2000);
    } else {
      setStatus('partial');
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Send Email Notification</h3>
        
        {status === 'success' && (
          <div className="success-message">
            Emails sent successfully!
          </div>
        )}
        
        {status === 'partial' && (
          <div className="warning-message">
            Some emails failed to send.
          </div>
        )}
        
        {status !== 'success' && (
          <form onSubmit={handleSend}>
            <div>
              <label>Recipients (comma-separated):</label>
              <textarea
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                required
              />
            </div>
            
            <div>
              <label>Subject:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                required
              />
            </div>
            
            <div>
              <label>Message:</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your message here..."
                rows="5"
                required
              />
            </div>
            
            <div className="modal-buttons">
              <button type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending...' : 'Send Email'}
              </button>
              <button type="button" onClick={onClose}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export { EmailService, EmailNotification };
export default EmailNotification;