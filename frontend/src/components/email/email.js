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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '500px',
        width: '90%',
        backdropFilter: 'blur(10px)'
      }}>
        <h3 style={{ color: '#470F59', marginBottom: '20px' }}>Send Email Notification</h3>
        
        {status === 'success' && (
          <div style={{ color: '#28a745', marginBottom: '15px', padding: '10px', background: 'rgba(40, 167, 69, 0.1)', borderRadius: '8px' }}>
            Emails sent successfully!
          </div>
        )}
        
        {status === 'partial' && (
          <div style={{ color: '#ffc107', marginBottom: '15px', padding: '10px', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px' }}>
            Some emails failed to send.
          </div>
        )}
        
        {status !== 'success' && (
          <form onSubmit={handleSend}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#470F59', fontWeight: '600', marginBottom: '5px', display: 'block' }}>Recipients (comma-separated):</label>
              <textarea
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '10px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  minHeight: '80px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#470F59', fontWeight: '600', marginBottom: '5px', display: 'block' }}>Subject:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '10px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#470F59', fontWeight: '600', marginBottom: '5px', display: 'block' }}>Message:</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your message here..."
                rows="5"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '10px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  minHeight: '120px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                type="submit" 
                disabled={status === 'sending'}
                style={{
                  background: '#470F59',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: status === 'sending' ? 0.7 : 1
                }}
              >
                {status === 'sending' ? 'Sending...' : 'Send Email'}
              </button>
              <button 
                type="button" 
                onClick={onClose}
                style={{
                  background: '#8178A1',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export { EmailService, EmailNotification };
export default EmailNotification;