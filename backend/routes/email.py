from flask import Blueprint, request, jsonify
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

email_bp = Blueprint('email', __name__)

# Email configuration
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587
EMAIL_USERNAME = 'synchronusdevteam@gmail.com'  # Replace with your Gmail
EMAIL_PASSWORD = 'ehmnofarhueptrwc'     # App Password without spaces

def send_email(to_email, subject, body):
    """Send email using Gmail SMTP"""
    try:
        print(f'Attempting to send email to: {to_email}')
        
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USERNAME
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain'))
        
        print(f'Connecting to Gmail SMTP...')
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        
        print(f'Logging in with: {EMAIL_USERNAME}')
        server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
        
        print(f'Sending email...')
        server.sendmail(EMAIL_USERNAME, to_email, msg.as_string())
        server.quit()
        
        print(f'Email sent successfully to {to_email}')
        return True
        
    except Exception as e:
        print(f'Email error: {e}')
        return False

@email_bp.route('/send-invitation', methods=['POST'])
def send_invitation():
    """Send project invitation email"""
    try:
        data = request.json
        to_email = data.get('to_email')
        project_name = data.get('project_name')
        responsibilities = data.get('responsibilities', [])
        project_code = data.get('project_code')
        creator_email = data.get('creator_email')
        
        # Create email body
        responsibilities_text = '\n'.join([f'• {resp}' for resp in responsibilities])
        
        subject = f'Project Invitation: {project_name}'
        body = f"""
Hello!

You have been invited to join the project "{project_name}".

Your responsibilities:
{responsibilities_text}

Project Code: {project_code}
Invited by: {creator_email}

To join the project, use the code above in the Synchronus application.

Best regards,
Synchronus Team
        """
        
        success = send_email(to_email, subject, body)
        
        if success:
            return jsonify({'success': True, 'message': 'Invitation sent successfully'})
        else:
            return jsonify({'success': False, 'message': 'Failed to send invitation'})
            
    except Exception as e:
        print(f'Send invitation error: {e}')
        return jsonify({'success': False, 'message': 'Server error'})

@email_bp.route('/send-notification', methods=['POST'])
def send_notification():
    """Send general notification email"""
    try:
        data = request.json
        to_email = data.get('to_email')
        subject = data.get('subject')
        message = data.get('message')
        
        success = send_email(to_email, subject, message)
        
        if success:
            return jsonify({'success': True, 'message': 'Notification sent successfully'})
        else:
            return jsonify({'success': False, 'message': 'Failed to send notification'})
            
    except Exception as e:
        print(f'Send notification error: {e}')
        return jsonify({'success': False, 'message': 'Server error'})