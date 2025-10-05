from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import uuid
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# Import and register blueprints
from routes.email import email_bp
app.register_blueprint(email_bp, url_prefix='/api/email')

# CORS setup
from flask_cors import CORS, cross_origin
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///stormhacks.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Email configuration (using Gmail SMTP)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'your-email@gmail.com'  # Replace with your email
app.config['MAIL_PASSWORD'] = 'your-app-password'     # Replace with app password

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(200), nullable=True)
    profile_photo = db.Column(db.String(500), nullable=True)

class Project(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    creator = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(10), unique=True, nullable=False)

class Collaborator(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.String(50), db.ForeignKey('project.id'), nullable=False)
    email = db.Column(db.String(120), nullable=False)

class Responsibility(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    collaborator_id = db.Column(db.Integer, db.ForeignKey('collaborator.id'), nullable=False)
    description = db.Column(db.String(500), nullable=False)

class Milestone(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.String(50), db.ForeignKey('project.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    start_date = db.Column(db.String(20), nullable=False)
    end_date = db.Column(db.String(20), nullable=False)
    assigned_members = db.Column(db.Text, nullable=False)
    progress = db.Column(db.Float, default=0.0)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    milestone_id = db.Column(db.Integer, db.ForeignKey('milestone.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    due_date = db.Column(db.String(20), nullable=False)
    assignee = db.Column(db.String(120), nullable=False)
    responsibility = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), default='To Do')
@app.route('/api/create-project', methods=['POST'])
@cross_origin()
def create_project():
    data = request.json
    project_id = str(uuid.uuid4())[:8]
    project_code = str(uuid.uuid4())[:6].upper()
    
    # Create project
    new_project = Project(
        id=project_id,
        name=data.get('name'),
        creator=data.get('creator'),
        code=project_code
    )
    db.session.add(new_project)
    
    # Create collaborators and responsibilities
    for collab_data in data.get('collaborators', []):
        if collab_data['email']:
            collaborator = Collaborator(
                project_id=project_id,
                email=collab_data['email']
            )
            db.session.add(collaborator)
            db.session.flush()  # Get collaborator ID
            
            # Add responsibilities
            for resp in collab_data['responsibilities']:
                if resp.strip():
                    responsibility = Responsibility(
                        collaborator_id=collaborator.id,
                        description=resp.strip()
                    )
                    db.session.add(responsibility)
    
    db.session.commit()
    
    project_dict = {
        'id': project_id,
        'name': new_project.name,
        'creator': new_project.creator,
        'code': project_code,
        'collaborators': data.get('collaborators', [])
    }
    
    return jsonify({'success': True, 'project': project_dict})

@app.route('/api/signup', methods=['POST'])
@cross_origin()
def signup():
    print('Signup endpoint called')
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        
        if User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'message': 'User already exists'})
        
        new_user = User(
            email=email, 
            password=generate_password_hash(password, method='pbkdf2:sha256'),
            name=name
        )
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'User created successfully'})
    except Exception as e:
        print(f'Signup error: {e}')
        return jsonify({'success': False, 'message': 'Server error'})

@app.route('/api/login', methods=['POST'])
@cross_origin()
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        if user and check_password_hash(user.password, password):
            return jsonify({'success': True, 'message': 'Login successful'})
        
        return jsonify({'success': False, 'message': 'Invalid credentials'})
    except Exception as e:
        print(f'Login error: {e}')
        return jsonify({'success': False, 'message': 'Server error'})

@app.route('/api/join-project', methods=['POST'])
@cross_origin()
def join_project():
    data = request.json
    code = data.get('code')
    
    project = Project.query.filter_by(code=code).first()
    
    if project:
        # Get collaborators and their responsibilities
        collaborators = Collaborator.query.filter_by(project_id=project.id).all()
        collab_list = []
        
        for collab in collaborators:
            responsibilities = Responsibility.query.filter_by(collaborator_id=collab.id).all()
            collab_list.append({
                'email': collab.email,
                'responsibilities': [r.description for r in responsibilities]
            })
        
        project_dict = {
            'id': project.id,
            'name': project.name,
            'creator': project.creator,
            'code': project.code,
            'collaborators': collab_list
        }
        
        return jsonify({'success': True, 'project': project_dict})
    
    return jsonify({'success': False, 'message': 'Invalid code'})

@app.route('/', methods=['GET'])
def home():
    return jsonify({'message': 'StormHacks Backend API is running'})

@app.route('/test', methods=['GET'])
def test():
    return jsonify({'message': 'Backend is running'})

@app.route('/test-email/<email>', methods=['GET'])
@cross_origin()
def test_email(email):
    try:
        from routes.email import send_email
        print(f'Testing email to: {email}')
        print(f'Using credentials: synchronusdevteam@gmail.com')
        success = send_email(email, 'Test Email', 'This is a test email from Synchronus!')
        print(f'Email result: {success}')
        return jsonify({'success': success, 'message': f'Test email sent to {email}'})
    except Exception as e:
        print(f'Test email exception: {e}')
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/check-user/<email>', methods=['GET'])
@cross_origin()
def check_user(email):
    user = User.query.filter_by(email=email).first()
    if user:
        return jsonify({
            'found': True, 
            'user': {
                'id': user.id,
                'email': user.email,
                'password': user.password
            }
        })
    else:
        return jsonify({'found': False, 'message': 'User not found'})

@app.route('/api/all-users', methods=['GET'])
@cross_origin()
def all_users():
    users = User.query.all()
    user_list = [{'id': u.id, 'email': u.email, 'password': u.password} for u in users]
    return jsonify({'users': user_list, 'count': len(user_list)})

@app.route('/api/user-projects/<email>', methods=['GET'])
@cross_origin()
def get_user_projects(email):
    # Get projects where user is creator
    created_projects = Project.query.filter_by(creator=email).all()
    
    # Get projects where user is collaborator
    collaborator_projects = db.session.query(Project).join(Collaborator).filter(Collaborator.email == email).all()
    
    # Combine and deduplicate
    all_projects = list({p.id: p for p in created_projects + collaborator_projects}.values())
    
    project_list = []
    for project in all_projects:
        # Get collaborators for this project
        collaborators = Collaborator.query.filter_by(project_id=project.id).all()
        collab_list = []
        
        for collab in collaborators:
            responsibilities = Responsibility.query.filter_by(collaborator_id=collab.id).all()
            collab_list.append({
                'email': collab.email,
                'responsibilities': [r.description for r in responsibilities]
            })
        
        project_list.append({
            'id': project.id,
            'name': project.name,
            'creator': project.creator,
            'code': project.code,
            'collaborators': collab_list
        })
    
    return jsonify({'projects': project_list})

@app.route('/api/project/<project_id>', methods=['GET'])
@cross_origin()
def get_project(project_id):
    project = Project.query.filter_by(id=project_id).first()
    
    if not project:
        return jsonify({'success': False, 'message': 'Project not found'})
    
    # Get collaborators for this project
    collaborators = Collaborator.query.filter_by(project_id=project.id).all()
    collab_list = []
    
    for collab in collaborators:
        responsibilities = Responsibility.query.filter_by(collaborator_id=collab.id).all()
        collab_list.append({
            'email': collab.email,
            'responsibilities': [r.description for r in responsibilities]
        })
    
    project_dict = {
        'id': project.id,
        'name': project.name,
        'creator': project.creator,
        'code': project.code,
        'collaborators': collab_list
    }
    
    return jsonify({'success': True, 'project': project_dict})

def send_invitation_email(to_email, project_name, role, project_code, creator_email):
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = app.config['MAIL_USERNAME']
        msg['To'] = to_email
        msg['Subject'] = f'Project Invitation: {project_name}'
        
        # Email body
        body = f"""
        Hello!
        
        You have been invited to join the project "{project_name}" as {role}.
        
        Project Code: {project_code}
        Invited by: {creator_email}
        
        To join the project, use the code above in the StormHacks application.
        
        Best regards,
        StormHacks Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(app.config['MAIL_SERVER'], app.config['MAIL_PORT'])
        server.starttls()
        server.login(app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
        text = msg.as_string()
        server.sendmail(app.config['MAIL_USERNAME'], to_email, text)
        server.quit()
        
        return True
    except Exception as e:
        print(f'Email error: {e}')
        return False

@app.route('/api/send-invitations', methods=['POST'])
@cross_origin()
def send_invitations():
    try:
        data = request.json
        project_name = data.get('project_name')
        project_code = data.get('project_code')
        creator_email = data.get('creator_email')
        collaborators = data.get('collaborators', [])
        
        sent_count = 0
        failed_emails = []
        
        for collab in collaborators:
            email = collab.get('email')
            responsibilities = collab.get('responsibilities', [])
            
            if email and responsibilities:
                # Use the new email system
                from routes.email import send_email
                
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
                
                success = send_email(email, subject, body)
                print(f'Email attempt to {email}: {"Success" if success else "Failed"}')
                
                if success:
                    sent_count += 1
                else:
                    failed_emails.append(email)
        
        return jsonify({
            'success': True,
            'sent_count': sent_count,
            'failed_emails': failed_emails,
            'message': f'Sent {sent_count} invitations successfully'
        })
        
    except Exception as e:
        print(f'Send invitations error: {e}')
        return jsonify({'success': False, 'message': 'Failed to send invitations'})

@app.route('/api/project/<project_id>/milestones', methods=['GET'])
@cross_origin()
def get_milestones(project_id):
    milestones = Milestone.query.filter_by(project_id=project_id).all()
    result = []
    for milestone in milestones:
        tasks = Task.query.filter_by(milestone_id=milestone.id).all()
        result.append({
            'id': milestone.id,
            'title': milestone.title,
            'startDate': milestone.start_date,
            'endDate': milestone.end_date,
            'assignedMembers': milestone.assigned_members.split(',') if milestone.assigned_members else [],
            'progress': milestone.progress,
            'tasks': [{
                'id': task.id,
                'title': task.title,
                'dueDate': task.due_date,
                'assignee': task.assignee,
                'responsibility': task.responsibility,
                'status': task.status
            } for task in tasks]
        })
    return jsonify({'milestones': result})

@app.route('/api/project/<project_id>/milestones', methods=['POST'])
@cross_origin()
def add_milestone(project_id):
    data = request.json
    milestone = Milestone(
        project_id=project_id,
        title=data['title'],
        start_date=data['startDate'],
        end_date=data['endDate'],
        assigned_members=','.join(data['assignedMembers']) if isinstance(data['assignedMembers'], list) else data['assignedMembers']
    )
    db.session.add(milestone)
    db.session.commit()
    return jsonify({'success': True, 'milestone_id': milestone.id})

@app.route('/api/milestone/<milestone_id>/tasks', methods=['POST'])
@cross_origin()
def add_task(milestone_id):
    data = request.json
    task = Task(
        milestone_id=milestone_id,
        title=data['title'],
        due_date=data['dueDate'],
        assignee=data['assignee'],
        responsibility=data['responsibility'],
        status=data.get('status', 'To Do')
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({'success': True, 'task_id': task.id})

@app.route('/api/task/<task_id>/status', methods=['PUT'])
@cross_origin()
def update_task_status(task_id):
    data = request.json
    task = Task.query.get(task_id)
    if task:
        task.status = data['status']
        db.session.commit()
        
        # Update milestone progress
        milestone = Milestone.query.get(task.milestone_id)
        if milestone:
            tasks = Task.query.filter_by(milestone_id=milestone.id).all()
            completed = len([t for t in tasks if t.status == 'Done'])
            milestone.progress = (completed / len(tasks)) * 100 if tasks else 0
            db.session.commit()
        
        return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'Task not found'})

# Profile management endpoints
@app.route('/api/user-profile/<email>', methods=['GET'])
@cross_origin()
def get_user_profile(email):
    user = User.query.filter_by(email=email).first()
    if user:
        return jsonify({
            'success': True,
            'profile': {
                'name': user.name or email.split('@')[0],
                'email': user.email,
                'profilePhoto': user.profile_photo
            }
        })
    return jsonify({'success': False, 'message': 'User not found'})

@app.route('/api/upload-profile-photo', methods=['POST'])
@cross_origin()
def upload_profile_photo():
    try:
        print('Upload request received')
        print('Files:', request.files.keys())
        print('Form data:', request.form.to_dict())
        
        if 'photo' not in request.files:
            print('No photo in request')
            return jsonify({'success': False, 'message': 'No photo uploaded'})
        
        file = request.files['photo']
        email = request.form.get('email')
        
        print(f'File: {file.filename}, Email: {email}')
        
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No file selected'})
        
        # Save file
        import os
        from werkzeug.utils import secure_filename
        
        filename = secure_filename(f"{email.replace('@', '_')}_{file.filename}")
        upload_path = os.path.join('uploads', 'profiles')
        os.makedirs(upload_path, exist_ok=True)
        file_path = os.path.join(upload_path, filename)
        
        print(f'Saving to: {file_path}')
        file.save(file_path)
        
        # Update user profile
        user = User.query.filter_by(email=email).first()
        if user:
            user.profile_photo = f'/uploads/profiles/{filename}'
            db.session.commit()
            print(f'Updated user profile photo: {user.profile_photo}')
            return jsonify({'success': True, 'photoUrl': user.profile_photo})
        
        print('User not found')
        return jsonify({'success': False, 'message': 'User not found'})
    except Exception as e:
        print(f'Upload error: {str(e)}')
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/update-profile', methods=['POST'])
@cross_origin()
def update_profile():
    try:
        data = request.json
        email = data.get('email')
        name = data.get('name')
        new_password = data.get('newPassword')
        
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'success': False, 'message': 'User not found'})
        
        # Update name
        if name:
            user.name = name
        
        # Update password if provided
        if new_password:
            user.password = generate_password_hash(new_password, method='pbkdf2:sha256')
        
        db.session.commit()
        return jsonify({'success': True, 'message': 'Profile updated successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/uploads/profiles/<filename>', methods=['GET'])
@cross_origin()
def serve_profile_photo(filename):
    from flask import send_from_directory
    import os
    return send_from_directory(os.path.join(os.getcwd(), 'uploads/profiles'), filename)

# Register blueprints
from routes.uploads import uploads_bp
app.register_blueprint(uploads_bp)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print('Database tables created')
    print('Starting Flask server on port 5000...')
    app.run(debug=True, port=5001, host='127.0.0.1')