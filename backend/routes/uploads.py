from flask import Blueprint, request, jsonify, current_app
from flask_cors import cross_origin
import os
import uuid
import sqlite3
from werkzeug.utils import secure_filename
from datetime import datetime

uploads_bp = Blueprint('uploads', __name__)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize simple database for uploads
def init_upload_db():
    conn = sqlite3.connect('uploads.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            project_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(path, project_id)
        )
    ''')
     
    # Add project_id column if it doesn't exist (migration)
    try:
        cursor.execute('ALTER TABLE folders ADD COLUMN project_id TEXT')
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS uploaded_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            folder_path TEXT,
            file_size INTEGER,
            project_id TEXT NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Add project_id column if it doesn't exist (migration)
    try:
        cursor.execute('ALTER TABLE uploaded_files ADD COLUMN project_id TEXT')
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            item TEXT NOT NULL,
            type TEXT NOT NULL,
            project_id TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Add project_id column if it doesn't exist (migration)
    try:
        cursor.execute('ALTER TABLE history ADD COLUMN project_id TEXT')
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            snapshot_data TEXT NOT NULL,
            project_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Add project_id column if it doesn't exist (migration)
    try:
        cursor.execute('ALTER TABLE snapshots ADD COLUMN project_id TEXT')
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    conn.commit()
    conn.close()

init_upload_db()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@uploads_bp.route('/api/upload', methods=['POST'])
@cross_origin()
def upload_file():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file selected'})
    
    file = request.files['file']
    folder_name = request.form.get('folder', '')
    project_id = request.form.get('project_id')
    
    if not project_id:
        return jsonify({'success': False, 'message': 'Project ID required'})
    
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'})
    
    if file and allowed_file(file.filename):
        original_filename = file.filename
        filename = str(uuid.uuid4()) + '_' + secure_filename(original_filename)
        
        # Create project-specific folder structure
        project_folder = os.path.join(UPLOAD_FOLDER, project_id)
        if folder_name:
            folder_path = os.path.join(project_folder, *folder_name.split('/'))
            os.makedirs(folder_path, exist_ok=True)
            file_path = os.path.join(folder_path, filename)
        else:
            os.makedirs(project_folder, exist_ok=True)
            file_path = os.path.join(project_folder, filename)
        
        try:
            file.save(file_path)
            
            # Save to database
            conn = sqlite3.connect('uploads.db')
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO uploaded_files (filename, original_filename, file_path, folder_path, file_size, project_id)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (filename, original_filename, file_path, folder_name or None, os.path.getsize(file_path), project_id))
            
            # Only log to history if requested
            log_history = request.form.get('log_history', 'false').lower() == 'true'
            if log_history:
                cursor.execute('''
                    INSERT INTO history (action, item, type, project_id)
                    VALUES (?, ?, ?, ?)
                ''', ('Added', original_filename, 'File', project_id))
                
                snapshot_data = create_snapshot(project_id)
                cursor.execute('''
                    INSERT INTO snapshots (snapshot_data, project_id)
                    VALUES (?, ?)
                ''', (snapshot_data, project_id))
            
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'File uploaded successfully'})
        except Exception as e:
            return jsonify({'success': False, 'message': 'Upload failed'})
    
    return jsonify({'success': False, 'message': 'Invalid file type'})

@uploads_bp.route('/api/create-folder', methods=['POST'])
@cross_origin()
def create_folder():
    data = request.json
    folder_name = data.get('folder_name')
    parent_path = data.get('parent_path', '')
    project_id = data.get('project_id')
    
    print(f'Create folder request: folder_name={folder_name}, parent_path={parent_path}, project_id={project_id}')
    
    if not folder_name or not project_id:
        return jsonify({'success': False, 'message': 'Folder name and project ID required'})
    
    try:
        # Build full path
        if parent_path and parent_path != 'root':
            full_path = f"{parent_path}/{folder_name}"
        else:
            full_path = folder_name
        
        print(f'Full path: {full_path}')
        
        # Create physical folder in project directory
        physical_path = os.path.join(UPLOAD_FOLDER, project_id, *full_path.split('/'))
        print(f'Physical path: {physical_path}')
        
        if os.path.exists(physical_path):
            return jsonify({'success': False, 'message': 'Folder already exists'})
        
        os.makedirs(physical_path, exist_ok=True)
        print(f'Folder created successfully at: {physical_path}')
        
        # Save to database
        conn = sqlite3.connect('uploads.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR IGNORE INTO folders (name, path, project_id)
            VALUES (?, ?, ?)
        ''', (folder_name, full_path, project_id))
        
        # Only log to history if requested
        log_history = data.get('log_history', False)
        if log_history:
            cursor.execute('''
                INSERT INTO history (action, item, type, project_id)
                VALUES (?, ?, ?, ?)
            ''', ('Added', full_path, 'Folder', project_id))
            
            snapshot_data = create_snapshot(project_id)
            cursor.execute('''
                INSERT INTO snapshots (snapshot_data, project_id)
                VALUES (?, ?)
            ''', (snapshot_data, project_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Folder created successfully', 'path': full_path})
    except Exception as e:
        print(f'Error creating folder: {str(e)}')
        return jsonify({'success': False, 'message': f'Failed to create folder: {str(e)}'})

@uploads_bp.route('/api/folder-tree', methods=['GET'])
@cross_origin()
def get_folder_tree():
    project_id = request.args.get('project_id')
    if not project_id:
        return jsonify({'success': False, 'folders': []})
    
    try:
        folders = []
        project_folder = os.path.join(UPLOAD_FOLDER, project_id)
        
        if not os.path.exists(project_folder):
            return jsonify({'success': True, 'folders': []})
        
        # Walk through project directories only
        for root, dirs, files in os.walk(project_folder):
            for dir_name in dirs:
                full_dir_path = os.path.join(root, dir_name)
                relative_path = os.path.relpath(full_dir_path, project_folder)
                
                # Calculate level based on path depth
                level = len(relative_path.split(os.sep)) - 1 if relative_path != '.' else 0
                
                folders.append({
                    'name': dir_name,
                    'path': relative_path.replace(os.sep, '/'),
                    'type': 'folder',
                    'level': level
                })
        
        # Sort folders by path to maintain hierarchy
        folders.sort(key=lambda x: x['path'])
        
        return jsonify({'success': True, 'folders': folders})
    except Exception as e:
        return jsonify({'success': False, 'folders': []})

@uploads_bp.route('/api/folder-contents/<path:folder_path>', methods=['GET'])
@cross_origin()
def get_folder_contents(folder_path):
    project_id = request.args.get('project_id')
    if not project_id:
        return jsonify({'success': False, 'items': []})
    
    try:
        project_folder = os.path.join(UPLOAD_FOLDER, project_id)
        
        if folder_path == 'root':
            target_path = project_folder
        else:
            target_path = os.path.join(project_folder, folder_path)
        
        if not os.path.exists(target_path):
            return jsonify({'success': False, 'items': []})
        
        items = []
        
        for item in os.listdir(target_path):
            item_path = os.path.join(target_path, item)
            
            if os.path.isdir(item_path):
                relative_path = os.path.join(folder_path, item) if folder_path != 'root' else item
                items.append({
                    'name': item,
                    'path': relative_path.replace(os.sep, '/'),
                    'type': 'folder'
                })
            else:
                stat = os.stat(item_path)
                items.append({
                    'name': item,
                    'size': stat.st_size,
                    'uploaded': 'Unknown',
                    'type': 'file'
                })
        
        return jsonify({'success': True, 'items': items})
    except Exception as e:
        return jsonify({'success': False, 'items': []})

@uploads_bp.route('/api/delete-folder', methods=['DELETE'])
@cross_origin()
def delete_folder():
    import shutil
    
    data = request.json
    folder_path = data.get('folder_path')
    project_id = data.get('project_id')
    
    if not folder_path or folder_path == 'root' or not project_id:
        return jsonify({'success': False, 'message': 'Cannot delete root folder or missing project ID'})
    
    try:
        physical_path = os.path.join(UPLOAD_FOLDER, project_id, folder_path)
        
        if not os.path.exists(physical_path):
            return jsonify({'success': False, 'message': 'Folder not found'})
        
        if not os.path.isdir(physical_path):
            return jsonify({'success': False, 'message': 'Path is not a folder'})
        
        # Delete the folder and all its contents
        shutil.rmtree(physical_path)
        
        # Only log to history if requested
        log_history = data.get('log_history', False)
        if log_history:
            conn = sqlite3.connect('uploads.db')
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO history (action, item, type, project_id)
                VALUES (?, ?, ?, ?)
            ''', ('Deleted', folder_path, 'Folder', project_id))
            
            snapshot_data = create_snapshot(project_id)
            cursor.execute('''
                INSERT INTO snapshots (snapshot_data, project_id)
                VALUES (?, ?)
            ''', (snapshot_data, project_id))
            
            conn.commit()
            conn.close()
        
        return jsonify({'success': True, 'message': 'Folder deleted successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': 'Failed to delete folder'})

@uploads_bp.route('/api/file-preview/<path:file_path>', methods=['GET'])
@cross_origin()
def preview_file(file_path):
    project_id = request.args.get('project_id')
    if not project_id:
        return jsonify({'success': False, 'message': 'Project ID required'})
    
    try:
        physical_path = os.path.join(UPLOAD_FOLDER, project_id, file_path)
        
        if not os.path.exists(physical_path):
            return jsonify({'success': False, 'message': 'File not found'})
        
        if not os.path.isfile(physical_path):
            return jsonify({'success': False, 'message': 'Path is not a file'})
        
        # Get file extension
        file_ext = os.path.splitext(file_path)[1].lower()
        
        # Read file content based on type
        if file_ext in ['.txt', '.md', '.py', '.js', '.html', '.css', '.json']:
            # Text files
            with open(physical_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return jsonify({
                'success': True, 
                'type': 'text', 
                'content': content,
                'filename': os.path.basename(file_path)
            })
        elif file_ext in ['.jpg', '.jpeg', '.png', '.gif']:
            # Images - return base64
            import base64
            with open(physical_path, 'rb') as f:
                content = base64.b64encode(f.read()).decode('utf-8')
            return jsonify({
                'success': True, 
                'type': 'image', 
                'content': content,
                'filename': os.path.basename(file_path),
                'mime_type': f'image/{file_ext[1:]}'
            })
        else:
            # Unsupported file type
            return jsonify({
                'success': True, 
                'type': 'unsupported', 
                'message': 'Preview not available for this file type',
                'filename': os.path.basename(file_path)
            })
            
    except Exception as e:
        return jsonify({'success': False, 'message': 'Failed to preview file'})

def create_snapshot(project_id):
    import json
    import base64
    try:
        snapshot = {'folders': [], 'files': []}
        project_folder = os.path.join(UPLOAD_FOLDER, project_id)
        
        if not os.path.exists(project_folder):
            return json.dumps(snapshot)
        
        # Capture current folder structure and file contents for this project
        for root, dirs, files in os.walk(project_folder):
            for dir_name in dirs:
                full_dir_path = os.path.join(root, dir_name)
                relative_path = os.path.relpath(full_dir_path, project_folder)
                snapshot['folders'].append(relative_path.replace(os.sep, '/'))
            
            for file_name in files:
                full_file_path = os.path.join(root, file_name)
                relative_path = os.path.relpath(full_file_path, project_folder)
                try:
                    with open(full_file_path, 'rb') as f:
                        content = base64.b64encode(f.read()).decode('utf-8')
                    snapshot['files'].append({
                        'path': relative_path.replace(os.sep, '/'),
                        'content': content
                    })
                except:
                    pass
        
        return json.dumps(snapshot)
    except:
        return '{}'

@uploads_bp.route('/api/history', methods=['GET'])
@cross_origin()
def get_history():
    project_id = request.args.get('project_id')
    if not project_id:
        return jsonify({'success': False, 'history': []})
    
    try:
        conn = sqlite3.connect('uploads.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT h.id, h.action, h.item, h.type, h.timestamp
            FROM history h
            WHERE h.project_id = ?
            ORDER BY h.timestamp DESC
            LIMIT 20
        ''', (project_id,))
        
        history = []
        for row in cursor.fetchall():
            history.append({
                'id': row[0],
                'action': row[1],
                'item': row[2],
                'type': row[3],
                'timestamp': row[4]
            })
        
        conn.close()
        return jsonify({'success': True, 'history': history})
    except Exception as e:
        return jsonify({'success': False, 'history': []})

@uploads_bp.route('/api/create-snapshot', methods=['POST'])
@cross_origin()
def create_named_snapshot():
    data = request.json
    snapshot_name = data.get('snapshot_name', 'Unnamed Snapshot')
    project_id = data.get('project_id')
    
    if not project_id:
        return jsonify({'success': False, 'message': 'Project ID required'})
    
    try:
        conn = sqlite3.connect('uploads.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO history (action, item, type, project_id)
            VALUES (?, ?, ?, ?)
        ''', ('Snapshot', snapshot_name, 'System', project_id))
        
        snapshot_data = create_snapshot(project_id)
        cursor.execute('''
            INSERT INTO snapshots (snapshot_data, project_id)
            VALUES (?, ?)
        ''', (snapshot_data, project_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Snapshot created successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': 'Failed to create snapshot'})

@uploads_bp.route('/api/revert/<int:history_id>', methods=['POST'])
@cross_origin()
def revert_to_version(history_id):
    import json
    import shutil
    import base64
    
    data = request.json
    project_id = data.get('project_id')
    
    if not project_id:
        return jsonify({'success': False, 'message': 'Project ID required'})
    
    try:
        conn = sqlite3.connect('uploads.db')
        cursor = conn.cursor()
        
        # Get snapshot from this history entry for this project
        cursor.execute('''
            SELECT s.snapshot_data FROM snapshots s
            JOIN history h ON s.created_at <= h.timestamp AND s.project_id = h.project_id
            WHERE h.id = ? AND h.project_id = ?
            ORDER BY s.created_at DESC
            LIMIT 1
        ''', (history_id, project_id))
        
        result = cursor.fetchone()
        if not result:
            return jsonify({'success': False, 'message': 'No snapshot found'})
        
        snapshot = json.loads(result[0])
        project_folder = os.path.join(UPLOAD_FOLDER, project_id)
        
        # Clear current project folder
        if os.path.exists(project_folder):
            shutil.rmtree(project_folder)
        os.makedirs(project_folder, exist_ok=True)
        
        # Recreate folder structure
        for folder_path in snapshot.get('folders', []):
            physical_path = os.path.join(project_folder, *folder_path.split('/'))
            os.makedirs(physical_path, exist_ok=True)
        
        # Restore files with content
        for file_info in snapshot.get('files', []):
            if isinstance(file_info, dict):
                file_path = file_info['path']
                content = file_info['content']
                physical_path = os.path.join(project_folder, *file_path.split('/'))
                os.makedirs(os.path.dirname(physical_path), exist_ok=True)
                with open(physical_path, 'wb') as f:
                    f.write(base64.b64decode(content))
        
        # Add revert action to history
        cursor.execute('''
            INSERT INTO history (action, item, type, project_id)
            VALUES (?, ?, ?, ?)
        ''', ('Reverted', f'to version {history_id}', 'System', project_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'File structure restored successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': 'Failed to revert'})

# Function to register routes with main app
def register_upload_routes(app):
    app.register_blueprint(uploads_bp)