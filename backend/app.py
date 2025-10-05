from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import json

app = Flask(__name__)
CORS(app)

# In-memory storage (use database in production)
projects = {}
collaborators = {}

@app.route('/api/create-project', methods=['POST'])
def create_project():
    data = request.json
    project_id = str(uuid.uuid4())[:8]
    
    project = {
        'id': project_id,
        'name': data.get('name'),
        'creator': data.get('creator'),
        'collaborators': data.get('collaborators', []),
        'code': str(uuid.uuid4())[:6].upper()
    }
    
    projects[project_id] = project
    
    # Store collaborator responsibilities
    for collab in data.get('collaborators', []):
        collaborators[collab['email']] = {
            'project_id': project_id,
            'responsibilities': collab['responsibilities']
        }
    
    return jsonify({'success': True, 'project': project})

@app.route('/api/join-project', methods=['POST'])
def join_project():
    data = request.json
    code = data.get('code')
    
    for project in projects.values():
        if project['code'] == code:
            return jsonify({'success': True, 'project': project})
    
    return jsonify({'success': False, 'message': 'Invalid code'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)