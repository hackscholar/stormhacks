from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import uuid
import json

app = Flask(__name__)

# CORS setup
from flask_cors import CORS, cross_origin
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///stormhacks.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

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
        
        if User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'message': 'User already exists'})
        
        new_user = User(email=email, password=password)
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
        
        if user and user.password == password:
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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print('Database tables created')
    print('Starting Flask server on port 5000...')
    app.run(debug=True, port=5000, host='127.0.0.1')